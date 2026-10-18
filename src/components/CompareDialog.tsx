"use client";

import { createPortal } from "react-dom";
import type { Enemy, Group, Resistance } from "@/lib/types";
import { COMPARE_COLORS as COLORS, DAMAGE, STATUS } from "@/lib/labels";
import { formatDamageTaken, formatResistance } from "@/lib/derive";
import RadarChart from "./RadarChart";
import { CloseIcon, CopyIcon } from "./icons";
import { useDialog } from "@/lib/useDialog";

interface CompareDialogProps {
  enemies: Enemy[];
  groups: Map<string, Group>;
  onClose: () => void;
  onRemove: (key: string) => void;
  onCopy: (text: string, message: string) => void;
}


function resistanceNumber(value: Resistance): number | null {
  if (value === "immune") return Number.POSITIVE_INFINITY;
  return typeof value === "number" ? value : null;
}

function markClass(
  value: number | null,
  min: number | null,
  max: number | null,
  higherIsBetter: boolean,
): "best" | "worst" | "" {
  if (value === null || min === null || max === null || min === max) return "";
  if (higherIsBetter) {
    if (value === max) return "best";
    if (value === min) return "worst";
  } else {
    if (value === min) return "best";
    if (value === max) return "worst";
  }
  return "";
}

export default function CompareDialog({
  enemies,
  groups,
  onClose,
  onRemove,
  onCopy,
}: CompareDialogProps) {
  const panelRef = useDialog(onClose);

  if (typeof document === "undefined") return null;

  const series = enemies.map((enemy, index) => ({
    label: enemy.name,
    color: COLORS[index],
    values: DAMAGE.map((item) => enemy.damage[item.key]),
  }));

  const copyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("compare", enemies.map((enemy) => enemy.key).join(","));
    url.searchParams.set("cmp", "1");
    url.searchParams.delete("id");
    onCopy(url.toString(), "已复制对比链接");
  };

  return createPortal(
    <div className="overlay compare-overlay" onMouseDown={onClose}>
      <div
        className="compare-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="compare-head">
          <div>
            <p className="eyebrow">COMPARISON · 数据对照</p>
            <h2 id="compare-title">抗性对比</h2>
            <p className="compare-sub">最多同时对照 3 个敌人。数值为承受伤害倍率，越低越抗。</p>
          </div>
          <div className="compare-head-actions">
            <button type="button" className="btn btn-ghost" onClick={copyLink}>
              <CopyIcon />
              复制对比链接
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭对比">
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="compare-body">
          <div className="compare-radar-box">
            <RadarChart
              series={series}
              ariaLabel={`${enemies.map((enemy) => enemy.name).join("、")}的抗性对比雷达图`}
              size={340}
            />
            <div className="compare-legend">
              {enemies.map((enemy, index) => (
                <span className="legend-item" key={enemy.key}>
                  <i style={{ background: COLORS[index] }} />
                  {enemy.name}
                </span>
              ))}
            </div>
            <p className="radar-note">实线为各敌人的八项伤害承受；越靠近中心越抗。</p>
          </div>

          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">指标</th>
                  {enemies.map((enemy, index) => (
                    <th scope="col" key={enemy.key}>
                      <span className="compare-color" style={{ background: COLORS[index] }} />
                      <span className="compare-name">{enemy.name}</span>
                      <span className="compare-group">{groups.get(enemy.groupId)?.name}</span>
                      <button
                        type="button"
                        className="compare-remove"
                        onClick={() => onRemove(enemy.key)}
                        aria-label={`移除 ${enemy.name}`}
                      >
                        <CloseIcon size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="section-row">
                  <td colSpan={enemies.length + 1}>伤害承受</td>
                </tr>
                {DAMAGE.map((item) => {
                  const values = enemies.map((enemy) => enemy.damage[item.key]);
                  const numbers = values.filter((value): value is number => typeof value === "number");
                  const min = numbers.length ? Math.min(...numbers) : null;
                  const max = numbers.length ? Math.max(...numbers) : null;
                  return (
                    <tr key={item.key}>
                      <th scope="row">
                        <span className="row-icon" style={{ color: item.color }}>
                          <span className="row-dot" />
                        </span>
                        {item.label}
                      </th>
                      {enemies.map((enemy, index) => {
                        const value = values[index];
                        const mark = markClass(value, min, max, false);
                        return (
                          <td key={enemy.key} className={mark ? `mark-${mark}` : undefined}>
                            {formatDamageTaken(value)}
                            {mark ? (
                              <span className={`cell-mark ${mark}`} aria-label={mark === "best" ? "更抗" : "更弱"}>
                                {mark === "best" ? "▲" : "▼"}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="section-row">
                  <td colSpan={enemies.length + 1}>异常抵抗</td>
                </tr>
                {STATUS.map((item) => {
                  const values = enemies.map((enemy) => enemy.status[item.key]);
                  const numbers = values
                    .map(resistanceNumber)
                    .filter((value): value is number => typeof value === "number");
                  const min = numbers.length ? Math.min(...numbers) : null;
                  const max = numbers.length ? Math.max(...numbers) : null;
                  return (
                    <tr key={item.key}>
                      <th scope="row">
                        <span className="row-icon" style={{ color: item.color }}>
                          <span className="row-dot" />
                        </span>
                        {item.label}
                      </th>
                      {enemies.map((enemy, index) => {
                        const value = values[index];
                        const mark = markClass(resistanceNumber(value), min, max, true);
                        return (
                          <td key={enemy.key} className={mark ? `mark-${mark}` : undefined}>
                            {formatResistance(value)}
                            {mark ? (
                              <span className={`cell-mark ${mark}`} aria-label={mark === "best" ? "更抗" : "更弱"}>
                                {mark === "best" ? "▲" : "▼"}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="compare-footnote">
              <span className="cell-mark best">▲</span> 更抗
              <span className="cell-mark worst">▼</span> 更弱
              <span className="compare-note">免疫显示为“免疫”；缺失值显示为“—”，不参与标记。</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
