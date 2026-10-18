export type Source = "base" | "dlc";
export type GroupKind = "faction" | "region";

export type DamageKey =
  | "standard"
  | "slash"
  | "strike"
  | "pierce"
  | "magic"
  | "fire"
  | "lightning"
  | "holy";

export type StatusKey = "poison" | "scarletRot" | "bleed" | "frost" | "sleep";

export type TraitKey = "void" | "death" | "ancientDragon" | "dragon";

export type Resistance = number | "immune" | null;

export interface DamageMap {
  standard: number | null;
  slash: number | null;
  strike: number | null;
  pierce: number | null;
  magic: number | null;
  fire: number | null;
  lightning: number | null;
  holy: number | null;
}

export interface StatusMap {
  poison: Resistance;
  scarletRot: Resistance;
  bleed: Resistance;
  frost: Resistance;
  sleep: Resistance;
}

export interface Enemy {
  key: string;
  id: string;
  name: string;
  source: Source;
  groupId: string;
  order: number;
  damage: DamageMap;
  poise: number | null;
  status: StatusMap;
  traits?: TraitKey[];
  incomplete?: boolean;
}

export interface Group {
  id: string;
  name: string;
  source: Source;
  kind: GroupKind;
  order: number;
  count: number;
}

export interface SourceMeta {
  key: Source;
  label: string;
  file: string;
  records: number;
  groups: number;
  enemies: number;
}

export interface ArchiveMeta {
  generatedAt: string;
  counts: {
    total: number;
    base: number;
    dlc: number;
    groups: number;
  };
  sources: SourceMeta[];
}

export interface ArchiveData {
  meta: ArchiveMeta;
  groups: Group[];
  enemies: Enemy[];
}
