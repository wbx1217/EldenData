import type {
  DamageKey,
  GroupKind,
  Source,
  StatusKey,
  TraitKey,
} from "./types";

export interface MetricMeta<K extends string> {
  key: K;
  label: string;
  short: string;
  color: string;
  hint: string;
}

export const DAMAGE: MetricMeta<DamageKey>[] = [
  { key: "standard", label: "普通", short: "普", color: "#B9B2A6", hint: "标准物理伤害" },
  { key: "slash", label: "斩击", short: "斩", color: "#A7BCC6", hint: "刀剑类斩击伤害" },
  { key: "strike", label: "打击", short: "打", color: "#C0916A", hint: "锤类打击伤害" },
  { key: "pierce", label: "突刺", short: "突", color: "#93ADA4", hint: "枪矛类突刺伤害" },
  { key: "magic", label: "魔法", short: "魔", color: "#8E9BD1", hint: "辉石与魔法伤害" },
  { key: "fire", label: "火焰", short: "火", color: "#C9703F", hint: "火焰与火属性伤害" },
  { key: "lightning", label: "雷电", short: "雷", color: "#D3B24A", hint: "雷电属性伤害" },
  { key: "holy", label: "神圣", short: "圣", color: "#DCC48E", hint: "神圣属性伤害" },
];

export const STATUS: MetricMeta<StatusKey>[] = [
  { key: "poison", label: "中毒", short: "毒", color: "#7F9B58", hint: "中毒异常" },
  { key: "scarletRot", label: "猩红腐败", short: "腐败", color: "#A9573B", hint: "猩红腐败异常" },
  { key: "bleed", label: "出血", short: "出血", color: "#A83E3E", hint: "出血异常" },
  { key: "frost", label: "冻伤", short: "冰冻", color: "#82AECB", hint: "冻伤异常" },
  { key: "sleep", label: "睡眠", short: "睡眠", color: "#9187BC", hint: "睡眠异常" },
];

export const TRAITS: MetricMeta<TraitKey>[] = [
  { key: "void", label: "虚空", short: "虚空", color: "#7C6FA6", hint: "属于虚空系敌人" },
  { key: "death", label: "死诞", short: "死诞", color: "#6F8F86", hint: "属于死诞系敌人" },
  { key: "ancientDragon", label: "古龙", short: "古龙", color: "#B08A5A", hint: "属于古龙系敌人" },
  { key: "dragon", label: "普通龙", short: "龙", color: "#8C9AA3", hint: "属于普通龙系敌人" },
];

export const DAMAGE_KEYS = DAMAGE.map((item) => item.key);
export const STATUS_KEYS = STATUS.map((item) => item.key);
export const TRAIT_KEYS = TRAITS.map((item) => item.key);

export const damageMeta = Object.fromEntries(
  DAMAGE.map((item) => [item.key, item]),
) as Record<DamageKey, MetricMeta<DamageKey>>;

export const statusMeta = Object.fromEntries(
  STATUS.map((item) => [item.key, item]),
) as Record<StatusKey, MetricMeta<StatusKey>>;

export const traitMeta = Object.fromEntries(
  TRAITS.map((item) => [item.key, item]),
) as Record<TraitKey, MetricMeta<TraitKey>>;

export const SOURCE_LABEL: Record<Source, string> = {
  base: "本体",
  dlc: "DLC",
};

export const GROUP_KIND_LABEL: Record<GroupKind, string> = {
  faction: "势力 / 类别",
  region: "区域",
};

export const GROUP_HEADER_LABEL: Record<Source, string> = {
  base: "本体 · 势力 / 类别",
  dlc: "DLC · 区域",
};

export const COMPARE_COLORS = ["#C9A961", "#7E97A6", "#C06A4A"];

export type SortField = "name" | "poise" | "avg" | "immune" | DamageKey | StatusKey;
export type SortDir = "asc" | "desc";
export type SortKey = "default" | `${SortField}${"Asc" | "Desc"}`;

export interface SortOption {
  value: SortKey;
  label: string;
}

export interface SortGroup {
  label: string;
  options: SortOption[];
}

function metricOptions(field: SortField, label: string): SortOption[] {
  return [
    { value: `${field}Desc` as SortKey, label: `${label} 高→低` },
    { value: `${field}Asc` as SortKey, label: `${label} 低→高` },
  ];
}

export const SORT_GROUPS: SortGroup[] = [
  {
    label: "综合",
    options: [
      { value: "default", label: "默认顺序" },
      { value: "nameAsc", label: "名称 A→Z" },
      { value: "nameDesc", label: "名称 Z→A" },
      ...metricOptions("poise", "韧性"),
      ...metricOptions("avg", "平均承受"),
      { value: "immuneDesc", label: "免疫异常 多→少" },
      { value: "immuneAsc", label: "免疫异常 少→多" },
    ],
  },
  {
    label: "按伤害承受",
    options: DAMAGE.flatMap((item) => metricOptions(item.key, item.label)),
  },
  {
    label: "按异常抵抗",
    options: STATUS.flatMap((item) => metricOptions(item.key, item.short)),
  },
];

export const SORT_OPTIONS: SortOption[] = SORT_GROUPS.flatMap((group) => group.options);
export const SORT_VALUES = new Set<SortKey>(SORT_OPTIONS.map((item) => item.value));
