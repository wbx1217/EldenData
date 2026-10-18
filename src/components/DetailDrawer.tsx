"use client";

import { createPortal } from "react-dom";
import type { Enemy, Group } from "@/lib/types";
import {
  DAMAGE,
  GROUP_KIND_LABEL,
  SOURCE_LABEL,
  STATUS,
  TRAITS,
  damageMeta,
  statusMeta,
  traitMeta,
} from "@/lib/labels";
import {
  averageTaken,
  damageLevel,
  effectivePoise,
  extremeDamage,
  formatDamageTaken,
  formatMultiplier,
  formatResistance,
  immuneStatuses,
  interpretation,
  statusLevel,
} from "@/lib/derive";
import RadarChart from "./RadarChart";
import {
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  CompareIcon,
  DamageIcon,
  StatusIcon,
  TraitIcon,
} from "./icons";
import { useDialog } from "@/lib/useDialog";

interface DetailDrawerProps {
  enemy: Enemy;
  group?: Group;
  groupEnemies: Enemy[];
  onClose: () => void;
  onNavigate: (key: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleCompare: (key: string) => void;
  isCompared: boolean;
  compareCount: number;
}

function statusStrength(value: ReturnType<typeof statusLevel>): number {
  switch (value.tone) {
    case "immune":
      return 4;
    case "high":
      return 3;
    case "mid":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export default function DetailDrawer({
  enemy,
  group,
  groupEnemies,
  onClose,
  onNavigate,
  onPrev,
  onNext,
  onToggleCompare,
  isCompared,
  compareCount,
}: DetailDrawerProps) {
  const panelRef = useDialog(onClose);

  if (typeof document === "undefined") return null;

  const poise = effectivePoise(enemy.poise);
  const average = averageTaken(enemy);
  const weakest = extremeDamage(enemy, "max");
  const immune = immuneStatuses(enemy);
  const hasStatusData = STATUS.some((item) => enemy.status[item.key] !== null);
  const radarValues = DAMAGE.map((item) => enemy.damage[item.key]);
  const hasRadar = radarValues.some((value) => typeof value === "number");
  const siblings = groupEnemies.filter((item) => item.key !== enemy.key).slice(0, 6);

  return createPortal(
    <div className="overlay drawer-overlay" onMouseDown={onClose}>
      <aside
        className="drawer"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer-head">
          <div className="drawer-title-wrap">
            <p className="crumb">
              <span>{SOURCE_LABEL[enemy.source]}</span>
              <span className="crumb-dot">·</span>
              <span>{group ? GROUP_KIND_LABEL[group.kind] : "分组"}</span>
              {group ? (
                <>
                  <span className="crumb-dot">·</span>
                  <span>{group.name}</span>
                </>
              ) : null}
            </p>
            <h2 id="drawer-title" className="drawer-name">
              {enemy.name}
              {enemy.incomplete ? (
                <span className="gap-badge" title="该条目存在缺失字段">
                  数据不完整
                </span>
              ) : null}
            </h2>
            <p className="mono-id">编号 #{enemy.id}</p>
          </div>
          <div className="drawer-tools">
            <button
              type="button"
              className="icon-btn"
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="上一条"
              title="上一条"
            >
              <ChevronIcon style={{ transform: "rotate(90deg)" }} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onNext}
              disabled={!onNext}
              aria-label="下一条"
              title="下一条"
            >
              <ChevronIcon style={{ transform: "rotate(-90deg)" }} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭详情">
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="drawer-body">
          <div className="tile-grid">
            <div className="tile">
              <span className="tile-label">韧性</span>
              <strong className="tile-value">{poise ?? "—"}</strong>
              <span className="tile-sub">POISE</span>
            </div>
            <div className="tile">
              <span className="tile-label">平均承受</span>
              <strong className="tile-value">
                {average === null ? "—" : formatMultiplier(average)}
              </strong>
              <span className="tile-sub">AVG. TAKEN</span>
            </div>
            <div className="tile">
              <span className="tile-label">最弱属性</span>
              <strong className="tile-value tile-value-sm">
                {weakest ? damageMeta[weakest.key].label : "—"}
              </strong>
              <span className="tile-sub">
                {weakest ? `× ${formatMultiplier(weakest.value)}` : "NO DATA"}
              </span>
            </div>
            <div className="tile">
              <span className="tile-label">免疫异常</span>
              <strong className="tile-value">{hasStatusData ? immune.length : "—"}</strong>
              <span className="tile-sub">IMMUNE</span>
            </div>
          </div>

          <section className="panel">
            <div className="panel-title">
              <h3>伤害承受</h3>
              <span>DAMAGE TAKEN · 0 – 2</span>
            </div>
            {hasRadar ? (
              <div className="radar-box">
                <RadarChart
                  series={[{ label: "承受倍率", color: "#C9A961", values: radarValues }]}
                  dotColors={DAMAGE.map((item) => item.color)}
                  ariaLabel={`${enemy.name}的八项伤害承受倍率雷达图`}
                />
                <p className="radar-note">外环为 2.0；虚线为 1.0 基准。缺失项按 1.0 补位。</p>
              </div>
            ) : (
              <p className="empty-inline">该条目缺少伤害数据，无法绘制雷达图。</p>
            )}

            <div className="metric-list">
              {DAMAGE.map((item) => {
                const value = enemy.damage[item.key];
                const level = damageLevel(value);
                const width =
                  typeof value === "number" ? Math.min(Math.max(value / 2, 0), 1) * 100 : 0;
                return (
                  <div className="metric-row" key={item.key}>
                    <span className="metric-icon" style={{ color: item.color }}>
                      <DamageIcon type={item.key} size={18} />
                    </span>
                    <span className="metric-name">{item.label}</span>
                    <span className={`metric-value ${value === 1 ? "dim" : ""}`}>
                      {formatDamageTaken(value)}
                    </span>
                    <span className="metric-bar" aria-hidden="true">
                      <i
                        style={{
                          width: `${width}%`,
                          background: item.color,
                          opacity: typeof value === "number" ? 0.72 : 0.2,
                        }}
                      />
                    </span>
                    <span className={`level tone-${level.tone}`}>{level.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <h3>异常抵抗</h3>
              <span>STATUS RESISTANCE</span>
            </div>
            <div className="metric-list">
              {STATUS.map((item) => {
                const value = enemy.status[item.key];
                const level = statusLevel(value);
                const strength = statusStrength(level);
                return (
                  <div className="metric-row status-row" key={item.key}>
                    <span className="metric-icon" style={{ color: item.color }}>
                      <StatusIcon
                        type={item.key}
                        size={18}
                        immune={value === "immune"}
                      />
                    </span>
                    <span className="metric-name">{item.label}</span>
                    <span className="metric-value">{formatResistance(value)}</span>
                    <span className={`status-meter tone-${level.tone}`} aria-hidden="true">
                      {[0, 1, 2, 3].map((index) => (
                        <i key={index} className={index < strength ? "on" : ""} />
                      ))}
                    </span>
                    <span className={`level tone-${level.tone}`}>{level.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="panel-footnote">
              抵抗数值越高越难触发；免疫表示完全不受该异常影响。分级为站内展示，非游戏原始字段。
            </p>
          </section>

          <section className="panel">
            <div className="panel-title">
              <h3>特性</h3>
              <span>TRAITS</span>
            </div>
            {enemy.traits?.length ? (
              <div className="trait-row">
                {enemy.traits.map((key) => (
                  <span className="trait-pill" key={key} style={{ color: traitMeta[key].color }}>
                    <TraitIcon type={key} size={15} />
                    {traitMeta[key].label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-inline">未标记特殊特性。</p>
            )}
          </section>

          <section className="insight">
            <span className="insight-mark" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
            <div>
              <h3>数据解读</h3>
              <p>{interpretation(enemy)}</p>
            </div>
          </section>

          {enemy.incomplete ? (
            <p className="data-note">
              该条目在原始数据中存在缺失字段；数值与图表仅作参考，缺失项以“—”展示。
            </p>
          ) : null}

          {siblings.length ? (
            <section className="panel">
              <div className="panel-title">
                <h3>同组敌人</h3>
                <span>{group?.name}</span>
              </div>
              <div className="enemy-links">
                {siblings.map((item) => (
                  <button
                    type="button"
                    className="enemy-chip"
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="drawer-foot">
          <button
            type="button"
            className={`btn btn-ghost ${isCompared ? "is-on" : ""}`}
            onClick={() => onToggleCompare(enemy.key)}
          >
            <CompareIcon />
            {isCompared ? "移出对比" : "加入对比"}
            <span className="btn-count">{compareCount}/3</span>
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
