"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { CloseIcon, SearchIcon } from "./icons";
import { useDialog } from "@/lib/useDialog";

interface FilterSheetProps {
  children: ReactNode;
  count: number;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
}

export default function FilterSheet({
  children,
  count,
  query,
  onQueryChange,
  onClose,
}: FilterSheetProps) {
  const panelRef = useDialog(onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="overlay sheet-overlay" onMouseDown={onClose}>
      <div
        className="filter-sheet"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="筛选条件"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sheet-head">
          <h2>筛选</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭筛选">
            <CloseIcon />
          </button>
        </header>
        <div className="sheet-search">
          <SearchIcon size={15} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索名称 / 编号 / 分组"
            aria-label="搜索敌人"
          />
          {query ? (
            <button type="button" onClick={() => onQueryChange("")} aria-label="清空搜索">
              <CloseIcon size={12} />
            </button>
          ) : null}
        </div>
        <div className="sheet-body">{children}</div>
        <footer className="sheet-foot">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            查看 {count} 条结果
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
