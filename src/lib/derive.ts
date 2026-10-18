import { DAMAGE, STATUS, damageMeta, statusMeta } from "./labels";
import type { DamageKey, Enemy, Resistance, StatusKey } from "./types";

export function effectivePoise(poise: number | null): number | null {
  return typeof poise === "number" && poise >= 0 ? poise : null;
}

export function averageTaken(enemy: Enemy): number | null {
  const values = DAMAGE.map((item) => enemy.damage[item.key]).filter(
    (value): value is number => typeof value === "number",
  );
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

export function extremeDamage(
  enemy: Enemy,
  mode: "max" | "min",
): { key: DamageKey; value: number } | null {
  let result: { key: DamageKey; value: number } | null = null;
  for (const item of DAMAGE) {
    const value = enemy.damage[item.key];
    if (typeof value !== "number") continue;
    if (!result || (mode === "max" ? value > result.value : value < result.value)) {
      result = { key: item.key, value };
    }
  }
  return result;
}

export function immuneStatuses(enemy: Enemy): StatusKey[] {
  return STATUS.filter((item) => enemy.status[item.key] === "immune").map((item) => item.key);
}

export function formatMultiplier(value: number | null | undefined): string {
  if (typeof value !== "number") return "—";
  if (Number.isInteger(value)) return `${value}.0`;
  return Number(value.toFixed(2)).toString();
}

export function formatDamageTaken(value: number | null | undefined): string {
  if (typeof value !== "number") return "—";
  if (value === 0) return "免疫";
  return `× ${formatMultiplier(value)}`;
}

export function formatResistance(value: Resistance): string {
  if (value === "immune") return "免疫";
  if (typeof value === "number") return String(value);
  return "—";
}

export function damageLevel(value: number | null | undefined): {
  label: string;
  tone: "immune" | "resist" | "neutral" | "weak" | "unknown";
} {
  if (typeof value !== "number") return { label: "未知", tone: "unknown" };
  if (value === 0) return { label: "免疫", tone: "immune" };
  if (value < 0.5) return { label: "极抗", tone: "resist" };
  if (value < 0.9) return { label: "抗性", tone: "resist" };
  if (value <= 1.1) return { label: "标准", tone: "neutral" };
  if (value <= 1.5) return { label: "弱点", tone: "weak" };
  return { label: "极弱", tone: "weak" };
}

export function statusLevel(value: Resistance): {
  label: string;
  tone: "immune" | "high" | "mid" | "low" | "unknown";
} {
  if (value === "immune") return { label: "免疫", tone: "immune" };
  if (typeof value !== "number") return { label: "未知", tone: "unknown" };
  if (value >= 300) return { label: "高", tone: "high" };
  if (value >= 150) return { label: "中", tone: "mid" };
  return { label: "低", tone: "low" };
}

export function heatBackground(value: number | null | undefined): string | undefined {
  if (typeof value !== "number" || value === 0) return undefined;
  if (value > 1.05) {
    const alpha = Math.min(0.09 + (value - 1.05) * 0.36, 0.3);
    return `rgba(111, 155, 99, ${alpha.toFixed(3)})`;
  }
  if (value < 0.95) {
    const alpha = Math.min(0.09 + (0.95 - value) * 0.36, 0.3);
    return `rgba(192, 106, 74, ${alpha.toFixed(3)})`;
  }
  return undefined;
}

export function namesOfDamage(keys: DamageKey[]): string {
  return keys.map((key) => damageMeta[key].label).join("、");
}

export function namesOfStatus(keys: StatusKey[]): string {
  return keys.map((key) => statusMeta[key].label).join("、");
}

export function interpretation(enemy: Enemy): string {
  const parts: string[] = [];
  const max = extremeDamage(enemy, "max");
  const min = extremeDamage(enemy, "min");

  const zero = DAMAGE.filter((item) => enemy.damage[item.key] === 0).map((item) => item.key);
  if (zero.length) parts.push(`免疫${namesOfDamage(zero)}伤害`);

  if (max && max.value > 1.05) {
    parts.push(`对${damageMeta[max.key].label}最脆弱（×${formatMultiplier(max.value)}）`);
  }
  if (min && min.value < 0.95 && min.value > 0) {
    parts.push(`对${damageMeta[min.key].label}抗性最高（×${formatMultiplier(min.value)}）`);
  }

  const immune = immuneStatuses(enemy);
  if (immune.length) parts.push(`免疫${namesOfStatus(immune)}`);

  if (!parts.length) {
    if (!max) return "该条目缺少伤害数据。";
    return "八项伤害承受均接近基准值。";
  }
  return `${parts.join(" · ")}。`;
}
