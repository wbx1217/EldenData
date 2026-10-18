import {
  DAMAGE_KEYS,
  SORT_VALUES,
  STATUS_KEYS,
  TRAIT_KEYS,
  type SortKey,
} from "./labels";
import type { DamageKey, Source, StatusKey, TraitKey } from "./types";

export type SourceFilter = "all" | Source;
export type DamageMode = "weak" | "resist";

export interface FilterState {
  q: string;
  source: SourceFilter;
  groups: string[];
  damage: DamageKey[];
  mode: DamageMode;
  immune: StatusKey[];
  traits: TraitKey[];
  poiseMin: number;
  poiseMax: number;
  sort: SortKey;
  page: number;
  pageSize: number | "all";
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  source: "all",
  groups: [],
  damage: [],
  mode: "weak",
  immune: [],
  traits: [],
  poiseMin: 0,
  poiseMax: 300,
  sort: "default",
  page: 1,
  pageSize: 50,
};

export interface LocationState {
  filters: FilterState;
  openKey: string | null;
  compareKeys: string[];
  compareOpen: boolean;
}

function csv<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const set = new Set<string>(allowed);
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is T => set.has(item)),
    ),
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function readLocation(search: string): LocationState {
  const params = new URLSearchParams(search);
  const sourceRaw = params.get("source");
  const source: SourceFilter =
    sourceRaw === "base" || sourceRaw === "dlc" ? sourceRaw : "all";

  const sortRaw = params.get("sort");
  const legacySort: Record<string, SortKey> = { name: "nameAsc" };
  const sort: SortKey =
    sortRaw && SORT_VALUES.has(sortRaw as SortKey)
      ? (sortRaw as SortKey)
      : (sortRaw && legacySort[sortRaw]) || "default";

  const sizeRaw = params.get("size");
  const pageSize: number | "all" =
    sizeRaw === "all"
      ? "all"
      : [30, 50, 100].includes(Number(sizeRaw))
        ? Number(sizeRaw)
        : 50;

  const pageRaw = Number(params.get("page"));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  let poiseMin = 0;
  let poiseMax = 300;
  const poiseRaw = params.get("poise");
  if (poiseRaw) {
    const [rawMin, rawMax] = poiseRaw.split("-").map(Number);
    if (Number.isFinite(rawMin)) poiseMin = clamp(rawMin, 0, 300);
    if (Number.isFinite(rawMax)) poiseMax = clamp(rawMax, 0, 300);
    if (poiseMin > poiseMax) [poiseMin, poiseMax] = [poiseMax, poiseMin];
  }

  const compareKeys = Array.from(
    new Set(
      (params.get("compare") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);

  return {
    filters: {
      q: params.get("q") ?? "",
      source,
      groups: unique(
        (params.get("groups") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
      damage: csv(params.get("dmg"), DAMAGE_KEYS),
      mode: params.get("mode") === "resist" ? "resist" : "weak",
      immune: csv(params.get("imm"), STATUS_KEYS),
      traits: csv(params.get("traits"), TRAIT_KEYS),
      poiseMin,
      poiseMax,
      sort,
      page,
      pageSize,
    },
    openKey: params.get("id"),
    compareKeys,
    compareOpen: params.get("cmp") === "1",
  };
}

export function serializeState(
  filters: FilterState,
  openKey: string | null,
  compareKeys: string[],
  compareOpen: boolean,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.source !== "all") params.set("source", filters.source);
  if (filters.groups.length) params.set("groups", filters.groups.join(","));
  if (filters.damage.length) {
    params.set("dmg", filters.damage.join(","));
    if (filters.mode !== "weak") params.set("mode", filters.mode);
  }
  if (filters.immune.length) params.set("imm", filters.immune.join(","));
  if (filters.traits.length) params.set("traits", filters.traits.join(","));
  if (filters.poiseMin !== 0 || filters.poiseMax !== 300) {
    params.set("poise", `${filters.poiseMin}-${filters.poiseMax}`);
  }
  if (filters.sort !== "default") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 50) params.set("size", String(filters.pageSize));
  if (openKey) params.set("id", openKey);
  if (compareKeys.length) params.set("compare", compareKeys.join(","));
  if (compareOpen) params.set("cmp", "1");
  return params.toString();
}

export function activeFilterCount(filters: FilterState): number {
  return (
    (filters.q ? 1 : 0) +
    (filters.source !== "all" ? 1 : 0) +
    filters.groups.length +
    filters.damage.length +
    filters.immune.length +
    filters.traits.length +
    (filters.poiseMin !== 0 || filters.poiseMax !== 300 ? 1 : 0)
  );
}
