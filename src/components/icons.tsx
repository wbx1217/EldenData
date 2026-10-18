"use client";

import type { ReactNode, SVGProps } from "react";
import type { DamageKey, StatusKey, TraitKey } from "@/lib/types";

export interface GameIconProps extends Omit<SVGProps<SVGSVGElement>, "type"> {
  size?: number;
  immune?: boolean;
  title?: string;
}

function Svg({
  size = 20,
  title,
  immune,
  children,
  ...rest
}: GameIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
      {immune ? <path d="M4 20 L20 4" /> : null}
    </svg>
  );
}

/* ---------- damage ---------- */

function StandardGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5 L13.6 6.5 V14 H10.4 V6.5 Z" />
      <path d="M8 14 H16" />
      <path d="M12 14 V20.5" />
      <path d="M10.2 20.5 H13.8" />
    </Svg>
  );
}

function SlashGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 4.5 C14 4.5 9 8 6.5 14 L5 19 L10 17.5 C16 15 19.5 10 19.5 4.5 Z" />
      <path d="M5 19 L3 21" />
      <path d="M3.5 15.5 C6 17 9 17 11.5 16" />
    </Svg>
  );
}

function StrikeGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 3.5 L20.5 10.5 L17.5 13.5 L10.5 6.5 Z" />
      <path d="M13 7 L17 11" />
      <path d="M12 10 L4.5 18.5" />
      <path d="M3.5 19.5 L5.5 17.5" />
    </Svg>
  );
}

function PierceGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M21 3 L13.5 10.5 L15.5 12.5 Z" />
      <path d="M15 11 L4 21" />
      <path d="M3 16.5 H7.5" />
      <path d="M3 13.5 H6.5" />
    </Svg>
  );
}

function MagicGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5 L16.5 9 L12 21 L7.5 9 Z" />
      <path d="M7.5 9 H16.5" />
      <path d="M12 2.5 V21" />
      <path d="M18.5 4.2 V7.2 M17 5.7 H20" />
      <path d="M4.5 6.2 V8.2 M3.5 7.2 H5.5" />
    </Svg>
  );
}

function FireGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5 C13.5 6 16.5 8 16 13 C15.7 16.5 13.8 19.5 12 21.5 C10.2 19.5 8.3 16.5 8 13 C7.5 8 10.5 6 12 2.5 Z" />
      <path d="M12 10 C13 12 14 13.5 13.2 16.2 C12.6 17.6 11.4 17.6 10.8 16.2 C10 13.5 11 12 12 10 Z" />
      <path d="M6.8 11.5 C6 13.5 6 15.5 6.8 17.5" />
      <path d="M17.2 11.5 C18 13.5 18 15.5 17.2 17.5" />
    </Svg>
  );
}

function LightningGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2 L5 13 H10.5 L8.5 22 L19 10 H13 Z" />
    </Svg>
  );
}

function HolyGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2 V5" />
      <path d="M12 19 V22" />
      <path d="M2 12 H5" />
      <path d="M19 12 H22" />
    </Svg>
  );
}

/* ---------- status ---------- */

function PoisonGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8 C12 2.8 6.5 9.5 6.5 13.8 A5.5 5.5 0 0 0 17.5 13.8 C17.5 9.5 12 2.8 12 2.8 Z" />
      <circle cx="9.3" cy="15" r="1" />
      <circle cx="13.8" cy="17" r="0.8" />
    </Svg>
  );
}

function RotGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 C16.5 3 20 6.5 20 11 C20 15.5 16.5 19.5 12 21 C7.5 19.5 4 15.5 4 11 C4 6.5 7.5 3 12 3 Z" />
      <path d="M12 2 L10 5.5" />
      <path d="M20.5 10 L17 11" />
      <path d="M12 22 L14 18.5" />
      <path d="M3.5 10 L7 11" />
      <circle cx="12" cy="12" r="2.2" />
    </Svg>
  );
}

function BleedGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M11 2.8 C11 2.8 6 9 6 13.2 A5 5 0 0 0 16 13.2 C16 9 11 2.8 11 2.8 Z" />
      <path d="M18.5 8.5 C18.5 8.5 15.5 12 15.5 14.2 A2.7 2.7 0 0 0 20.9 14.2 C20.9 12 18.5 8.5 18.5 8.5 Z" />
    </Svg>
  );
}

function FrostGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2 V22" />
      <path d="M3.3 7 L20.7 17" />
      <path d="M3.3 17 L20.7 7" />
      <path d="M9.5 4 L12 6.5 L14.5 4" />
      <path d="M9.5 20 L12 17.5 L14.5 20" />
      <path d="M4.5 9.5 L7.8 10.4" />
      <path d="M16.2 13.6 L19.5 14.5" />
      <path d="M4.5 14.5 L7.8 13.6" />
      <path d="M16.2 10.4 L19.5 9.5" />
    </Svg>
  );
}

function SleepGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 2.8 C9.5 3.8 6.5 9 8.5 14 C10 17.5 13.5 19.5 17.5 19 C14 17.5 12 14 12.5 10 C12.8 7.2 13.8 4.8 15.5 2.8 Z" />
      <circle cx="18.6" cy="6.4" r="0.8" />
      <circle cx="20.4" cy="10.4" r="0.6" />
    </Svg>
  );
}

/* ---------- traits ---------- */

function VoidGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="12" rx="9.5" ry="4.5" transform="rotate(-24 12 12)" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2 V5" />
      <path d="M12 19 V22" />
    </Svg>
  );
}

function DeathGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8 C7.2 2.8 4 6.3 4 10.8 C4 13.4 5.2 15 6.2 15.8 V19 H9 V17 H11 V19 H13 V17 H15 V19 H17.8 V15.8 C18.8 15 20 13.4 20 10.8 C20 6.3 16.8 2.8 12 2.8 Z" />
      <circle cx="9" cy="10" r="1.3" />
      <circle cx="15" cy="10" r="1.3" />
      <path d="M10.5 14 H13.5" />
    </Svg>
  );
}

function AncientDragonGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20 C5 13 9 7 20 3 C17 9 15 14 15 20" />
      <path d="M7 20 C8 15 11 10 17 7" />
      <path d="M11 11 C13 11 14 12 15 14" />
      <path d="M9 15 C11 15 12 16 13 18" />
      <circle cx="16.2" cy="8.6" r="0.9" />
    </Svg>
  );
}

function DragonGlyph(props: GameIconProps) {
  return (
    <Svg {...props}>
      <path d="M3 19 C7.5 17.5 10 14 11 6 C13 10.5 14 14.5 14.5 18 C16.5 14 17.5 10 17 5 C21 9.5 22 15 19.5 20 Z" />
      <path d="M11 6 L10 13" />
      <path d="M14.5 18 L15 12" />
    </Svg>
  );
}

const DAMAGE_GLYPHS: Record<DamageKey, (props: GameIconProps) => ReactNode> = {
  standard: StandardGlyph,
  slash: SlashGlyph,
  strike: StrikeGlyph,
  pierce: PierceGlyph,
  magic: MagicGlyph,
  fire: FireGlyph,
  lightning: LightningGlyph,
  holy: HolyGlyph,
};

const STATUS_GLYPHS: Record<StatusKey, (props: GameIconProps) => ReactNode> = {
  poison: PoisonGlyph,
  scarletRot: RotGlyph,
  bleed: BleedGlyph,
  frost: FrostGlyph,
  sleep: SleepGlyph,
};

const TRAIT_GLYPHS: Record<TraitKey, (props: GameIconProps) => ReactNode> = {
  void: VoidGlyph,
  death: DeathGlyph,
  ancientDragon: AncientDragonGlyph,
  dragon: DragonGlyph,
};

export function DamageIcon({ type, ...rest }: GameIconProps & { type: DamageKey }) {
  const Glyph = DAMAGE_GLYPHS[type];
  return <Glyph {...rest} />;
}

export function StatusIcon({ type, ...rest }: GameIconProps & { type: StatusKey }) {
  const Glyph = STATUS_GLYPHS[type];
  return <Glyph {...rest} />;
}

export function TraitIcon({ type, ...rest }: GameIconProps & { type: TraitKey }) {
  const Glyph = TRAIT_GLYPHS[type];
  return <Glyph {...rest} />;
}

/* ---------- brand & UI ---------- */

export function RuneMark({ size = 22, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3 V21" />
      <path d="M5 8 C8 10 16 10 19 8" />
      <path d="M5 16 C8 14 16 14 19 16" />
    </Svg>
  );
}

export function RuneRings({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 420"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="210" cy="210" r="196" strokeWidth="0.6" />
      <circle cx="210" cy="210" r="164" strokeWidth="0.6" />
      <circle cx="210" cy="210" r="128" strokeWidth="0.6" strokeDasharray="2 8" />
      <circle cx="210" cy="210" r="92" strokeWidth="0.8" />
      <path d="M210 14 V406" strokeWidth="0.6" />
      <path d="M14 210 H406" strokeWidth="0.6" />
      <path d="M72 72 L348 348" strokeWidth="0.4" />
      <path d="M348 72 L72 348" strokeWidth="0.4" />
      <path d="M210 118 L292 210 L210 302 L128 210 Z" strokeWidth="0.8" />
      <path d="M210 150 V270" strokeWidth="0.8" />
      <path d="M164 186 H256" strokeWidth="0.8" />
      <path d="M174 234 H246" strokeWidth="0.8" />
    </svg>
  );
}

export function SearchIcon({ size = 16, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 L21 21" />
    </Svg>
  );
}

export function CloseIcon({ size = 16, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M5 5 L19 19" />
      <path d="M19 5 L5 19" />
    </Svg>
  );
}

export function InfoIcon({ size = 15, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11 V17" />
      <path d="M12 7.5 V7.6" />
    </Svg>
  );
}

export function ChevronIcon({ size = 14, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M6 9 L12 15 L18 9" />
    </Svg>
  );
}

export function CheckIcon({ size = 12, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M4 12.5 L9.5 18 L20 5.5" />
    </Svg>
  );
}

export function MinusIcon({ size = 12, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M5 12 H19" />
    </Svg>
  );
}

export function CompareIcon({ size = 15, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M5 20 V9" />
      <path d="M12 20 V4" />
      <path d="M19 20 V13" />
      <path d="M3 20 H21" />
    </Svg>
  );
}

export function FilterIcon({ size = 15, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M4 6 H20" />
      <path d="M7 12 H17" />
      <path d="M10 18 H14" />
    </Svg>
  );
}

export function ArrowIcon({ size = 15, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M5 12 H19" />
      <path d="M13 6 L19 12 L13 18" />
    </Svg>
  );
}

export function ColumnsIcon({ size = 15, ...rest }: GameIconProps) {
  return (
    <Svg size={size} {...rest}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
      <path d="M9.5 4.5 V19.5" />
      <path d="M15 4.5 V19.5" />
    </Svg>
  );
}
