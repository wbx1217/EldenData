"use client";

import { createPortal } from "react-dom";
import type { ArchiveMeta } from "@/lib/types";
import { CloseIcon } from "./icons";
import { useDialog } from "@/lib/useDialog";

interface InfoDialogProps {
  meta: ArchiveMeta;
  onClose: () => void;
}

export default function InfoDialog({ meta, onClose }: InfoDialogProps) {
  const panelRef = useDialog(onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="overlay info-overlay" onMouseDown={onClose}>
      <div
        className="info-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="info-head">
          <div>
            <p className="eyebrow">DATA NOTES · 档案说明</p>
            <h2 id="info-title">数据说明</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭数据说明">
            <CloseIcon />
          </button>
        </header>

        <div className="info-body">
          <section>
            <h3>数据范围</h3>
            <p>
              当前档案共收录 <strong>{meta.counts.total}</strong> 个敌人、<strong>{meta.counts.groups}</strong>{" "}
              个分组；其中本体 {meta.counts.base} 个、DLC {meta.counts.dlc} 个。分组标题在原始数据中只有
              id、没有名称与数值，清洗时已单独转为 groups，不会作为敌人出现。
            </p>
          </section>

          <section>
            <h3>伤害承受倍率</h3>
            <p>
              数值为“受到该类伤害时的倍率”：<strong>1.0</strong> 为基准，高于 1.0
              表示更易受伤，低于 1.0 表示抗性，<strong>0</strong> 表示完全免疫。范围 0–2。表格底色中，
              <strong>绿色越深表示承受越高、越容易被打痛</strong>，
              <strong>红褐色越深表示承受越低、越抗</strong>；免疫单独用斜线底纹标出。
            </p>
          </section>

          <section>
            <h3>异常抵抗</h3>
            <p>
              数值越高越难触发对应异常。原始数据中的 <strong>999</strong> 与字符串
              <strong>“免疫”</strong> 都表示完全免疫，统一显示为“免疫”，页面不会出现 999。
              抗性分级（免疫 / 高 / 中 / 低）是站内展示规则，不是游戏原始字段。
            </p>
          </section>

          <section>
            <h3>韧性与缺失值</h3>
            <p>
              韧性范围 30–300；原始值 <strong>-1</strong> 与空值会显示为“—”，不参与韧性筛选与条状图。
              少数条目存在缺失字段（例如只有名称、没有抗性），会标记为“数据不完整”，雷达图缺失轴按
              1.0 中性值补位，并在详情中提示。
            </p>
          </section>

          <section>
            <h3>派生指标</h3>
            <p>
              “平均承受”是八项伤害倍率的算术平均（0 也计入）；“最弱属性”取八项中的最大值；
              “免疫异常”统计值为“免疫”的异常数量。这些指标仅用于辅助浏览，不替代原始数值。
            </p>
          </section>

          <section>
            <h3>编号说明</h3>
            <p>
              原始数据中有少量 id 被不同敌人复用（共 21 处），例如不同形态的同一敌人。本站用内部
              key 区分记录，详情链接与对比不会串行；表格中仍展示原始编号，便于回查原始数据。
            </p>
          </section>

          <section>
            <h3>来源与声明</h3>
            <p>
              数据整理自本地两份 JSON，生成日期 {meta.generatedAt}。本站是非官方粉丝项目，不包含游戏内图像、
              官方 Logo、字体或音频资源；名称与数值的版权归原作者与 FromSoftware 所有。
            </p>
          </section>
        </div>

        <footer className="info-foot">
          <span>交界地抗性档案 · v1.0</span>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            知道了
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
