"use client";

import { DAMAGE } from "@/lib/labels";

export interface RadarSeries {
  label: string;
  color: string;
  values: (number | null)[];
}

interface RadarChartProps {
  series: RadarSeries[];
  dotColors?: string[];
  ariaLabel?: string;
  size?: number;
}

const C = 170;
const R = 112;
const TAU = Math.PI * 2;

function point(index: number, value: number, radius = R) {
  const angle = -Math.PI / 2 + (index * TAU) / 8;
  const ratio = Math.max(0, Math.min(value, 2)) / 2;
  return [C + Math.cos(angle) * radius * ratio, C + Math.sin(angle) * radius * ratio] as const;
}

function polygon(values: number[], radius = R) {
  return values
    .map((value, index) => {
      const [x, y] = point(index, value, radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function RadarChart({
  series,
  dotColors,
  ariaLabel = "八项伤害承受倍率雷达图",
  size = 340,
}: RadarChartProps) {
  const ratios = [0.5, 1, 1.5, 2];

  return (
    <svg
      className="radar"
      viewBox="0 0 340 340"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
    >
      {ratios.map((value) => (
        <polygon
          key={value}
          points={polygon(Array(8).fill(value))}
          fill="none"
          stroke="var(--line)"
          strokeWidth={value === 1 ? 1 : 0.7}
          strokeDasharray={value === 1 ? "3 4" : undefined}
          opacity={value === 1 ? 1 : 0.8}
        />
      ))}

      {DAMAGE.map((item, index) => {
        const angle = -Math.PI / 2 + (index * TAU) / 8;
        return (
          <line
            key={item.key}
            x1={C}
            y1={C}
            x2={C + Math.cos(angle) * R}
            y2={C + Math.sin(angle) * R}
            stroke="var(--line)"
            strokeWidth={0.7}
          />
        );
      })}

      {series.map((item, seriesIndex) => (
        <g key={item.label}>
          <polygon
            points={polygon(item.values.map((value) => value ?? 1))}
            fill={item.color}
            fillOpacity={series.length > 1 ? 0.06 : 0.08}
            stroke={item.color}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeDasharray={
              series.length > 1
                ? seriesIndex === 1
                  ? "6 3"
                  : seriesIndex === 2
                    ? "2 3"
                    : undefined
                : undefined
            }
          />
          {item.values.map((value, index) => {
            if (typeof value !== "number") return null;
            const [x, y] = point(index, value);
            return (
              <circle
                key={`${item.label}-${DAMAGE[index].key}`}
                cx={x}
                cy={y}
                r={2.4}
                fill="var(--bg)"
                stroke={dotColors?.[index] ?? item.color}
                strokeWidth={1.4}
              />
            );
          })}
        </g>
      ))}

      {DAMAGE.map((item, index) => {
        const angle = -Math.PI / 2 + (index * TAU) / 8;
        const x = C + Math.cos(angle) * (R + 24);
        const y = C + Math.sin(angle) * (R + 24);
        const anchor =
          Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text
            key={item.key}
            x={x}
            y={y + 3}
            textAnchor={anchor}
            fill="var(--text-2)"
            fontSize="12.5"
            letterSpacing="0.03em"
          >
            {item.label}
          </text>
        );
      })}

      <text x={C} y={C - 4} textAnchor="middle" fill="var(--text-3)" fontSize="9" letterSpacing="0.12em">
        1.0
      </text>
    </svg>
  );
}
