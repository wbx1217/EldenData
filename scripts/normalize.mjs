#!/usr/bin/env node
/**
 * 将两份人工整理数据合并为前端可直接消费的 enemies.json。
 * 用法：node scripts/normalize.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "src", "data");
const REPORT_DIR = path.join(ROOT, "reports");

const SOURCES = [
  { file: "本体敌人数据.json", source: "base", kind: "faction" },
  { file: "DLC敌人数据.json", source: "dlc", kind: "region" },
];

const DAMAGE_MAP = {
  普通倍率: "standard",
  斩击倍率: "slash",
  打击倍率: "strike",
  突刺倍率: "pierce",
  魔法倍率: "magic",
  火焰倍率: "fire",
  雷电倍率: "lightning",
  神圣倍率: "holy",
};

const STATUS_MAP = {
  基础毒抵抗力: "poison",
  基础腐败抵抗力: "scarletRot",
  基础出血抵抗力: "bleed",
  基础冰冻抵抗力: "frost",
  基础睡眠抵抗力: "sleep",
  毒抵抗力: "poison",
  腐败抵抗力: "scarletRot",
  出血抵抗力: "bleed",
  冰冻抵抗力: "frost",
  睡眠抵抗力: "sleep",
};

const TRAIT_MAP = {
  是否虚空: "void",
  是否死诞: "death",
  是否古龙: "ancientDragon",
  是否普通龙: "dragon",
};

const EXPECTED = {
  base: { records: 511, groups: 28, enemies: 483 },
  dlc: { records: 352, groups: 50, enemies: 302 },
};

const readJson = (file) => {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) throw new Error(`找不到数据文件：${file}`);
  return JSON.parse(fs.readFileSync(full, "utf8"));
};

const trim = (v) => (typeof v === "string" ? v.trim() : v);

const toNumber = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
};

const toResistance = (v) => {
  if (v === "免疫" || v === "无效" || v === 999) return "immune";
  return toNumber(v);
};

const isGroupHeader = (row) =>
  trim(row["名称"] ?? "") === "" &&
  trim(row["普通倍率"] ?? "") === "" &&
  trim(row["韧性"] ?? "") === "";

const pad = (n, len = 2) => String(n).padStart(len, "0");

function normalize() {
  const groups = [];
  const enemies = [];
  const quality = {
    missingDamage: 0,
    missingStatus: 0,
    missingPoise: 0,
    immuneCounts: { poison: 0, scarletRot: 0, bleed: 0, frost: 0, sleep: 0 },
    zeroDamage: {},
    values: { min: Infinity, max: -Infinity },
    poise: { min: Infinity, max: -Infinity, missing: 0 },
    ungrouped: 0,
    emptyNames: 0,
  };
  const idSeen = new Map();
  const duplicateIds = [];
  const nameCounts = new Map();

  let globalOrder = 0;
  const sourceCounts = {};

  for (const src of SOURCES) {
    const rows = readJson(src.file);
    if (!Array.isArray(rows)) throw new Error(`${src.file} 不是数组`);
    const fileGroupStart = groups.length;
    const fileEnemyStart = enemies.length;
    let current = null;

    for (const row of rows) {
      if (isGroupHeader(row)) {
        const name = trim(row["id"]);
        current = {
          id: `${src.source}-g${pad(groups.length - fileGroupStart + 1)}`,
          name,
          source: src.source,
          kind: src.kind,
          order: groups.length + 1,
          count: 0,
        };
        groups.push(current);
        continue;
      }

      if (!current) {
        quality.ungrouped += 1;
        current = {
          id: `${src.source}-g00`,
          name: "未分组",
          source: src.source,
          kind: src.kind,
          order: groups.length + 1,
          count: 0,
        };
        groups.push(current);
      }

      const name = trim(row["名称"] ?? "");
      if (!name) quality.emptyNames += 1;

      const damage = {};
      for (const [rawKey, key] of Object.entries(DAMAGE_MAP)) {
        const value = toNumber(row[rawKey]);
        damage[key] = value;
        if (value === null) quality.missingDamage += 1;
        if (value === 0) quality.zeroDamage[key] = (quality.zeroDamage[key] ?? 0) + 1;
        if (typeof value === "number") {
          quality.values.min = Math.min(quality.values.min, value);
          quality.values.max = Math.max(quality.values.max, value);
        }
      }

      const status = {};
      for (const [rawKey, key] of Object.entries(STATUS_MAP)) {
        if (!(rawKey in row)) continue;
        const value = toResistance(row[rawKey]);
        status[key] = value;
        if (value === null) quality.missingStatus += 1;
        if (value === "immune") quality.immuneCounts[key] += 1;
      }
      for (const key of Object.keys(quality.immuneCounts)) {
        if (!(key in status)) status[key] = null;
      }

      const poise = toNumber(row["韧性"]);
      if (poise === null) quality.missingPoise += 1;
      else {
        quality.poise.min = Math.min(quality.poise.min, poise);
        quality.poise.max = Math.max(quality.poise.max, poise);
      }

      const traits = [];
      for (const [rawKey, key] of Object.entries(TRAIT_MAP)) {
        if (row[rawKey] === true) traits.push(key);
      }

      const id = String(row["id"]);
      if (idSeen.has(id)) duplicateIds.push({ id, first: idSeen.get(id), second: name });
      else idSeen.set(id, name);

      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);

      const order = ++globalOrder;
      const key = `${src.source}-${id}-${order}`;
      const incomplete =
        Object.values(damage).some((v) => v === null) ||
        Object.values(status).some((v) => v === null) ||
        poise === null ||
        poise < 0;

      const enemy = {
        key,
        id,
        name: name || `未命名-${id}`,
        source: src.source,
        groupId: current.id,
        order,
        damage,
        poise,
        status,
        traits,
      };
      if (incomplete) enemy.incomplete = true;
      enemies.push(enemy);
      current.count += 1;
    }

    sourceCounts[src.source] = {
      records: rows.length,
      groups: groups.length - fileGroupStart,
      enemies: enemies.length - fileEnemyStart,
    };
  }

  // 只保留有数据的字段
  for (const enemy of enemies) {
    if (!enemy.traits.length) delete enemy.traits;
  }

  const counts = {
    total: enemies.length,
    base: sourceCounts.base.enemies,
    dlc: sourceCounts.dlc.enemies,
    groups: groups.length,
  };

  const meta = {
    generatedAt: new Date().toISOString().slice(0, 10),
    counts,
    sources: [
      { key: "base", label: "本体", file: SOURCES[0].file, ...sourceCounts.base },
      { key: "dlc", label: "DLC", file: SOURCES[1].file, ...sourceCounts.dlc },
    ],
  };

  return {
    data: { meta, groups, enemies },
    quality: {
      ...quality,
      duplicateIds,
      duplicateNames: [...nameCounts.entries()]
        .filter(([, n]) => n > 1)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
    },
    sourceCounts,
    expected: EXPECTED,
  };
}

function validate(result) {
  const errors = [];
  const { data, sourceCounts } = result;
  for (const [key, expected] of Object.entries(EXPECTED)) {
    const actual = sourceCounts[key];
    if (!actual) {
      errors.push(`缺少来源 ${key}`);
      continue;
    }
    if (actual.records !== expected.records) errors.push(`${key} 记录数 ${actual.records}，期望 ${expected.records}`);
    if (actual.groups !== expected.groups) errors.push(`${key} 分组数 ${actual.groups}，期望 ${expected.groups}`);
    if (actual.enemies !== expected.enemies) errors.push(`${key} 敌人数 ${actual.enemies}，期望 ${expected.enemies}`);
  }
  if (data.meta.counts.total !== 785) errors.push(`总敌人数 ${data.meta.counts.total}，期望 785`);
  if (data.meta.counts.groups !== 78) errors.push(`总分组数 ${data.meta.counts.groups}，期望 78`);

  const groupIds = new Set(data.groups.map((g) => g.id));
  for (const enemy of data.enemies) {
    if (!groupIds.has(enemy.groupId)) errors.push(`敌人 ${enemy.id} 的 groupId 无效`);
    if (!enemy.name) errors.push(`敌人 ${enemy.id} 名称为空`);
  }
  return errors;
}

function buildReport(result) {
  const { data, quality } = result;
  const lines = [];
  lines.push("# 数据质量报告", "");
  lines.push(`生成日期：${data.meta.generatedAt}`, "");
  lines.push("## 总量", "");
  lines.push("| 来源 | 记录数 | 分组 | 敌人 |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const s of data.meta.sources) {
    lines.push(`| ${s.label} | ${s.records} | ${s.groups} | ${s.enemies} |`);
  }
  lines.push(`| 合计 | ${data.meta.sources.reduce((n, s) => n + s.records, 0)} | ${data.meta.counts.groups} | ${data.meta.counts.total} |`);
  lines.push("", "## 分组条目数", "", "| 来源 | 分组 | 条目数 |", "| --- | --- | ---: |");
  for (const g of data.groups) {
    lines.push(`| ${g.source === "base" ? "本体" : "DLC"} | ${g.name} | ${g.count} |`);
  }
  lines.push("", "## 缺失与异常", "");
  lines.push(`- 伤害倍率空值：${quality.missingDamage}`);
  lines.push(`- 抗性空值：${quality.missingStatus}`);
  lines.push(`- 韧性空值：${quality.missingPoise}`);
  lines.push(`- 无分组敌人：${quality.ungrouped}`);
  lines.push(`- 空名称敌人：${quality.emptyNames}`);
  lines.push(`- 重复 id：${quality.duplicateIds.length}`);
  lines.push(`- 伤害倍率范围：${quality.values.min} – ${quality.values.max}`);
  lines.push(`- 韧性范围：${quality.poise.min} – ${quality.poise.max}`);
  lines.push("", "## 免疫数量", "", "| 异常 | 免疫条目 |", "| --- | ---: |");
  for (const [key, value] of Object.entries(quality.immuneCounts)) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push("", "## 0 倍率（完全免疫）", "");
  for (const [key, value] of Object.entries(quality.zeroDamage)) {
    lines.push(`- ${key}: ${value}`);
  }
  if (!Object.keys(quality.zeroDamage).length) lines.push("- 无");
  lines.push("", "## 同名条目（前 40）", "", "| 名称 | 出现次数 |", "| --- | ---: |");
  for (const item of quality.duplicateNames) lines.push(`| ${item.name} | ${item.count} |`);
  lines.push("", "## 重复 id", "", quality.duplicateIds.length ? "| id | 第一次出现 | 第二次出现 |" : "无重复 id。");
  if (quality.duplicateIds.length) {
    lines.push("| --- | --- | --- |");
    for (const item of quality.duplicateIds) lines.push(`| ${item.id} | ${item.first} | ${item.second} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const result = normalize();
  const errors = validate(result);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, "enemies.json"), JSON.stringify(result.data), "utf8");
  fs.writeFileSync(path.join(REPORT_DIR, "data-quality.md"), buildReport(result), "utf8");

  console.log(`已生成 ${path.relative(ROOT, path.join(OUT_DIR, "enemies.json"))}`);
  console.log(`敌人 ${result.data.meta.counts.total} / 分组 ${result.data.meta.counts.groups}`);
  if (errors.length) {
    console.error("\n校验失败：");
    for (const error of errors) console.error(` - ${error}`);
    process.exitCode = 1;
  } else {
    console.log("校验通过：785 个敌人、78 个分组。");
  }
}

main();
