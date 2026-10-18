"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type {
  ArchiveData,
  DamageKey,
  Enemy,
  Source,
  StatusKey,
  TraitKey,
} from "@/lib/types";
import {
  COMPARE_COLORS,
  DAMAGE,
  GROUP_HEADER_LABEL,
  SORT_GROUPS,
  SOURCE_LABEL,
  STATUS,
  TRAITS,
  damageMeta,
  statusMeta,
  traitMeta,
  type SortField,
  type SortKey,
} from "@/lib/labels";
import {
  averageTaken,
  effectivePoise,
  formatMultiplier,
  formatResistance,
  heatBackground,
  immuneStatuses,
} from "@/lib/derive";
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  readLocation,
  serializeState,
  type FilterState,
  type SourceFilter,
} from "@/lib/filters";
import {
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  ColumnsIcon,
  CompareIcon,
  DamageIcon,
  FilterIcon,
  InfoIcon,
  RuneMark,
  RuneRings,
  SearchIcon,
  StatusIcon,
  TraitIcon,
} from "./icons";

const DetailDrawer = dynamic(() => import("./DetailDrawer"));
const CompareDialog = dynamic(() => import("./CompareDialog"));
const InfoDialog = dynamic(() => import("./InfoDialog"));
const FilterSheet = dynamic(() => import("./FilterSheet"));

function toggleFrom<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    if (index === 0) return [page];
    return page - sorted[index - 1] > 1 ? ["ellipsis" as const, page] : [page];
  });
}

function FilterSection({
  numeral,
  title,
  aside,
  children,
}: {
  numeral: string;
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section className="filter-section">
      <div className="filter-head">
        <span className="numeral">{numeral}</span>
        <h2>{title}</h2>
        {aside ? <span className="filter-aside">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FilterChip({
  active,
  color,
  icon,
  label,
  onClick,
  title,
}: {
  active: boolean;
  color: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`metric-chip ${active ? "is-on" : ""}`}
      style={{ "--accent": color } as CSSProperties}
      onClick={onClick}
      aria-pressed={active}
      title={title ?? label}
    >
      <span className="metric-chip-icon">{icon}</span>
      <span>{label}</span>
      {active ? <CheckIcon size={11} className="metric-chip-check" /> : null}
    </button>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export default function ArchiveApp({ data }: { data: ArchiveData }) {
  const { meta, groups, enemies } = data;

  const groupMap = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const enemyMap = useMemo(() => new Map(enemies.map((enemy) => [enemy.key, enemy])), [enemies]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [compareKeys, setCompareKeys] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columns, setColumns] = useState({ group: true, status: true, traits: true });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [groupQuery, setGroupQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<Source, boolean>>({
    base: false,
    dlc: false,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nameWidth, setNameWidth] = useState(180);
  const [stickyHeight, setStickyHeight] = useState(64);
  const [isNarrow, setIsNarrow] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  /* ---------- URL state ---------- */

  const applyLocation = useCallback(
    (search: string) => {
      const parsed = readLocation(search);
      const validGroups = parsed.filters.groups.filter((id) => {
        const group = groupMap.get(id);
        return (
          group &&
          (parsed.filters.source === "all" || group.source === parsed.filters.source)
        );
      });
      const validCompare = parsed.compareKeys.filter((key) => enemyMap.has(key));
      const validOpen = parsed.openKey && enemyMap.has(parsed.openKey) ? parsed.openKey : null;
      const validCompareOpen = parsed.compareOpen && validCompare.length >= 2;
      setFilters({ ...parsed.filters, groups: validGroups });
      setCompareKeys(validCompare);
      setOpenKey(validCompareOpen ? null : validOpen);
      setCompareOpen(validCompareOpen);
    },
    [groupMap, enemyMap],
  );

  useEffect(() => {
    applyLocation(window.location.search);
    setHydrated(true);
  }, [applyLocation]);

  useEffect(() => {
    if (!hydrated) return;
    const query = serializeState(filters, openKey, compareKeys, compareOpen);
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", next);
  }, [filters, openKey, compareKeys, compareOpen, hydrated]);

  useEffect(() => {
    const onPop = () => applyLocation(window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [applyLocation]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;
      if (
        event.key === "/" ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
      ) {
        event.preventDefault();
        if (window.matchMedia("(max-width: 1439px)").matches) {
          mobileSearchRef.current?.focus();
        } else {
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!columnsOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!columnsRef.current?.contains(event.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [columnsOpen]);

  useEffect(() => {
    const element = stickyRef.current;
    if (!element) return;
    const update = () => setStickyHeight(Math.ceil(element.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1159px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (compareOpen && compareKeys.length < 2) setCompareOpen(false);
  }, [compareKeys, compareOpen]);

  /* ---------- derived ---------- */

  const patch = useCallback((partial: Partial<FilterState>) => {
    setFilters((previous) => ({ ...previous, ...partial, page: 1 }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters((previous) => ({ ...DEFAULT_FILTERS, pageSize: previous.pageSize }));
    setOpenKey(null);
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setFilters((previous) => ({
      ...previous,
      groups: toggleFrom(previous.groups, id),
      page: 1,
    }));
  }, []);

  const selectGroups = useCallback((ids: string[]) => {
    setFilters((previous) => ({
      ...previous,
      groups: Array.from(new Set([...previous.groups, ...ids])),
      page: 1,
    }));
  }, []);

  const clearGroups = useCallback((ids: string[]) => {
    setFilters((previous) => ({
      ...previous,
      groups: previous.groups.filter((id) => !ids.includes(id)),
      page: 1,
    }));
  }, []);

  const changeSource = useCallback(
    (source: SourceFilter) => {
      setFilters((previous) => ({
        ...previous,
        source,
        groups:
          source === "all"
            ? previous.groups
            : previous.groups.filter((id) => groupMap.get(id)?.source === source),
        page: 1,
      }));
    },
    [groupMap],
  );

  const filtered = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    const groupSet = new Set(filters.groups);
    const immuneSet = new Set(filters.immune);
    const traitSet = new Set(filters.traits);

    return enemies.filter((enemy) => {
      if (filters.source !== "all" && enemy.source !== filters.source) return false;
      if (groupSet.size && !groupSet.has(enemy.groupId)) return false;

      if (query) {
        const groupName = groupMap.get(enemy.groupId)?.name ?? "";
        const haystack = `${enemy.name} ${enemy.id} ${groupName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (filters.damage.length) {
        const matched = filters.damage.some((key) => {
          const value = enemy.damage[key];
          if (typeof value !== "number") return false;
          return filters.mode === "weak" ? value > 1.1 : value < 0.9;
        });
        if (!matched) return false;
      }

      if (immuneSet.size) {
        const matched = filters.immune.some((key) => enemy.status[key] === "immune");
        if (!matched) return false;
      }

      if (traitSet.size) {
        const own = new Set(enemy.traits ?? []);
        for (const key of filters.traits) {
          if (!own.has(key)) return false;
        }
      }

      const narrowedPoise = filters.poiseMin !== 0 || filters.poiseMax !== 300;
      if (narrowedPoise) {
        const poise = effectivePoise(enemy.poise);
        if (poise === null) return false;
        if (poise < filters.poiseMin || poise > filters.poiseMax) return false;
      }

      return true;
    });
  }, [enemies, filters, groupMap]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (filters.sort === "default") {
      list.sort((a, b) => a.order - b.order);
      return list;
    }

    const ascending = filters.sort.endsWith("Asc");
    const factor = ascending ? 1 : -1;
    const field = filters.sort.replace(/Asc$|Desc$/, "") as SortField;

    if (field === "name") {
      list.sort(
        (a, b) => a.name.localeCompare(b.name, "zh-Hans-CN") * factor,
      );
      return list;
    }

    const valueOf = (enemy: Enemy): number | null => {
      if (field === "poise") return effectivePoise(enemy.poise);
      if (field === "avg") return averageTaken(enemy);
      if (field === "immune") return immuneStatuses(enemy).length;
      if (field in damageMeta) return enemy.damage[field as DamageKey];
      if (field in statusMeta) {
        const value = enemy.status[field as StatusKey];
        return value === "immune" ? Number.POSITIVE_INFINITY : value;
      }
      return null;
    };

    list.sort((a, b) => {
      const aValue = valueOf(a);
      const bValue = valueOf(b);
      if (aValue === null && bValue === null) return a.order - b.order;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (aValue === bValue) return a.order - b.order;
      return (aValue - bValue) * factor;
    });
    return list;
  }, [filtered, filters.sort]);

  const totalPages =
    filters.pageSize === "all" ? 1 : Math.max(1, Math.ceil(sorted.length / filters.pageSize));
  const currentPage =
    filters.pageSize === "all" ? 1 : Math.min(filters.page, totalPages);
  const pageItems =
    filters.pageSize === "all"
      ? sorted
      : sorted.slice(
          (currentPage - 1) * filters.pageSize,
          currentPage * filters.pageSize,
        );

  useEffect(() => {
    if (isNarrow) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font =
      '500 14px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
    let longest = 0;
    for (const enemy of pageItems) {
      longest = Math.max(longest, context.measureText(enemy.name).width);
    }
    setNameWidth(Math.min(Math.max(Math.ceil(longest) + 28, 128), 200));
  }, [pageItems, isNarrow]);

  useEffect(() => {
    if (hydrated && filters.page > totalPages) {
      setFilters((previous) => ({ ...previous, page: totalPages }));
    }
  }, [hydrated, filters.page, totalPages]);

  const openEnemy = openKey ? enemyMap.get(openKey) ?? null : null;
  const openGroup = openEnemy ? groupMap.get(openEnemy.groupId) : undefined;
  const openGroupEnemies = openEnemy
    ? enemies.filter((enemy) => enemy.groupId === openEnemy.groupId)
    : [];
  const openIndex = openEnemy ? sorted.findIndex((enemy) => enemy.key === openEnemy.key) : -1;
  const previousEnemy = openIndex > 0 ? sorted[openIndex - 1] : undefined;
  const nextEnemy =
    openIndex >= 0 && openIndex < sorted.length - 1 ? sorted[openIndex + 1] : undefined;

  const compareEnemies = useMemo(
    () =>
      compareKeys
        .map((key) => enemyMap.get(key))
        .filter((enemy): enemy is Enemy => Boolean(enemy)),
    [compareKeys, enemyMap],
  );

  const activeCount = activeFilterCount(filters);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; color?: string; onRemove: () => void }[] = [];

    if (filters.q) {
      chips.push({
        key: "q",
        label: `搜索：${filters.q}`,
        onRemove: () => setFilters((previous) => ({ ...previous, q: "", page: 1 })),
      });
    }
    if (filters.source !== "all") {
      chips.push({
        key: "source",
        label: SOURCE_LABEL[filters.source],
        onRemove: () => changeSource("all"),
      });
    }
    for (const id of filters.groups) {
      const group = groupMap.get(id);
      if (!group) continue;
      chips.push({
        key: `group-${id}`,
        label: group.name,
        onRemove: () => toggleGroup(id),
      });
    }
    for (const key of filters.damage) {
      chips.push({
        key: `damage-${key}`,
        label: `${filters.mode === "weak" ? "弱点" : "抗性"} · ${damageMeta[key].label}`,
        color: damageMeta[key].color,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            damage: previous.damage.filter((item) => item !== key),
            page: 1,
          })),
      });
    }
    for (const key of filters.immune) {
      chips.push({
        key: `immune-${key}`,
        label: `免疫 · ${statusMeta[key].label}`,
        color: statusMeta[key].color,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            immune: previous.immune.filter((item) => item !== key),
            page: 1,
          })),
      });
    }
    for (const key of filters.traits) {
      chips.push({
        key: `trait-${key}`,
        label: traitMeta[key].label,
        color: traitMeta[key].color,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            traits: previous.traits.filter((item) => item !== key),
            page: 1,
          })),
      });
    }
    if (filters.poiseMin !== 0 || filters.poiseMax !== 300) {
      chips.push({
        key: "poise",
        label: `韧性 ${filters.poiseMin}–${filters.poiseMax}`,
        onRemove: () =>
          setFilters((previous) => ({
            ...previous,
            poiseMin: 0,
            poiseMax: 300,
            page: 1,
          })),
      });
    }
    return chips;
  }, [filters, groupMap, changeSource, toggleGroup]);

  /* ---------- actions ---------- */

  const toggleCompare = (key: string) => {
    if (compareKeys.includes(key)) {
      setCompareKeys((previous) => previous.filter((item) => item !== key));
      return;
    }
    if (compareKeys.length >= 3) {
      setToast("最多同时对比 3 个敌人");
      return;
    }
    setCompareKeys((previous) => [...previous, key]);
  };

  const sortByMetric = (field: DamageKey | StatusKey) => {
    setFilters((previous) => {
      const desc = `${field}Desc` as SortKey;
      const asc = `${field}Asc` as SortKey;
      return {
        ...previous,
        sort: previous.sort === desc ? asc : desc,
        page: 1,
      };
    });
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setToast(message);
    }
  };

  const pageKeys = pageItems.map((enemy) => enemy.key);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((key) => compareKeys.includes(key));
  const someOnPage = pageKeys.some((key) => compareKeys.includes(key));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPage && !allOnPage;
    }
  }, [someOnPage, allOnPage, isNarrow]);

  const toggleAllOnPage = () => {
    if (allOnPage) {
      setCompareKeys((previous) => previous.filter((key) => !pageKeys.includes(key)));
      return;
    }
    const merged = Array.from(new Set([...compareKeys, ...pageKeys]));
    if (merged.length > 3) {
      setToast("最多同时对比 3 个敌人，已选前 3 个");
    }
    setCompareKeys(merged.slice(0, 3));
  };

  const groupSections = (["base", "dlc"] as Source[])
    .map((source) => ({
      source,
      label: GROUP_HEADER_LABEL[source],
      total: groups.filter((group) => group.source === source).length,
      groups: groups.filter(
        (group) =>
          group.source === source &&
          (!groupQuery ||
            group.name.toLowerCase().includes(groupQuery.toLowerCase())),
      ),
    }))
    .filter((section) => filters.source === "all" || filters.source === section.source);

  const renderSidebar = (withSearch: boolean) => (
    <>
      {withSearch ? (
        <div className="search-section">
          <div className="search-field">
            <SearchIcon size={15} />
            <input
              ref={searchRef}
              value={filters.q}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, q: event.target.value, page: 1 }))
              }
              placeholder="搜索名称 / 编号 / 分组"
              aria-label="搜索敌人"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() =>
                  setFilters((previous) => ({ ...previous, q: "", page: 1 }))
                }
                aria-label="清空搜索"
              >
                <CloseIcon size={12} />
              </button>
            ) : null}
          </div>
          <p className="search-hint">
            按 <kbd>/</kbd> 聚焦 · <kbd>Esc</kbd> 关闭详情
          </p>
        </div>
      ) : null}

      <FilterSection numeral="I" title="来源" aside={`${meta.counts.total}`}>
        <div className="segmented">
          {(
            [
              { key: "all", label: "全部", count: meta.counts.total },
              { key: "base", label: "本体", count: meta.counts.base },
              { key: "dlc", label: "DLC", count: meta.counts.dlc },
            ] as { key: SourceFilter; label: string; count: number }[]
          ).map((item) => (
            <button
              type="button"
              key={item.key}
              className={filters.source === item.key ? "is-on" : ""}
              onClick={() => changeSource(item.key)}
            >
              <span>{item.label}</span>
              <em>{item.count}</em>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection numeral="II" title="分组" aside={`${filters.groups.length} 已选`}>
        <div className="group-search">
          <SearchIcon size={13} />
          <input
            value={groupQuery}
            onChange={(event) => setGroupQuery(event.target.value)}
            placeholder="筛选分组"
            aria-label="筛选分组"
          />
        </div>

        {groupSections.map((section) => (
          <div className="group-block" key={section.source}>
            <div className="group-head-row">
              <button
                type="button"
                className="group-head"
                onClick={() =>
                  setOpenGroups((previous) => ({
                    ...previous,
                    [section.source]: !previous[section.source],
                  }))
                }
                aria-expanded={openGroups[section.source]}
              >
                <ChevronIcon
                  size={13}
                  className={`chev ${openGroups[section.source] ? "is-open" : ""}`}
                />
                <span>{section.label}</span>
                <em>{section.total}</em>
              </button>
              <span className="group-mini-actions">
                <button
                  type="button"
                  onClick={() => selectGroups(section.groups.map((group) => group.id))}
                >
                  全选
                </button>
                <button
                  type="button"
                  onClick={() => clearGroups(section.groups.map((group) => group.id))}
                >
                  清空
                </button>
              </span>
            </div>

            {openGroups[section.source] ? (
              <ul className="group-list">
                {section.groups.map((group) => (
                  <li key={group.id}>
                    <label className="group-row" title={group.name}>
                      <input
                        type="checkbox"
                        checked={filters.groups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                      />
                      <span className="check-visual" aria-hidden="true">
                        <CheckIcon size={10} />
                      </span>
                      <span className="group-name">{group.name}</span>
                      <span className="group-count">{group.count}</span>
                    </label>
                  </li>
                ))}
                {!section.groups.length ? <li className="group-empty">没有匹配的分组</li> : null}
              </ul>
            ) : null}
          </div>
        ))}
      </FilterSection>

      <FilterSection
        numeral="III"
        title="伤害倾向"
        aside={filters.damage.length ? `${filters.damage.length} 项` : undefined}
      >
        <div className="segmented segmented-mode">
          <button
            type="button"
            className={filters.mode === "weak" ? "is-on" : ""}
            onClick={() => patch({ mode: "weak" })}
          >
            弱点 &gt; 1.1
          </button>
          <button
            type="button"
            className={filters.mode === "resist" ? "is-on" : ""}
            onClick={() => patch({ mode: "resist" })}
          >
            抗性 &lt; 0.9
          </button>
        </div>
        <div className="chip-grid">
          {DAMAGE.map((item) => (
            <FilterChip
              key={item.key}
              active={filters.damage.includes(item.key)}
              color={item.color}
              icon={<DamageIcon type={item.key} size={16} />}
              label={item.label}
              title={item.hint}
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  damage: toggleFrom(previous.damage, item.key),
                  page: 1,
                }))
              }
            />
          ))}
        </div>
        <p className="filter-note">
          {filters.mode === "weak"
            ? "选出对任一选中属性承受倍率大于 1.1 的敌人。"
            : "选出对任一选中属性承受倍率小于 0.9 的敌人。"}
        </p>
      </FilterSection>

      <FilterSection
        numeral="IV"
        title="异常免疫"
        aside={filters.immune.length ? `${filters.immune.length} 项` : undefined}
      >
        <div className="chip-grid">
          {STATUS.map((item) => (
            <FilterChip
              key={item.key}
              active={filters.immune.includes(item.key)}
              color={item.color}
              icon={<StatusIcon type={item.key} size={16} />}
              label={item.label}
              title={`免疫${item.label}`}
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  immune: toggleFrom(previous.immune, item.key),
                  page: 1,
                }))
              }
            />
          ))}
        </div>
        <p className="filter-note">多选时为“任一免疫”即可命中。</p>
      </FilterSection>

      <FilterSection
        numeral="V"
        title="特性"
        aside={filters.traits.length ? `${filters.traits.length} 项` : undefined}
      >
        <div className="chip-grid">
          {TRAITS.map((item) => (
            <FilterChip
              key={item.key}
              active={filters.traits.includes(item.key)}
              color={item.color}
              icon={<TraitIcon type={item.key} size={16} />}
              label={item.label}
              title={item.hint}
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  traits: toggleFrom(previous.traits, item.key),
                  page: 1,
                }))
              }
            />
          ))}
        </div>
        <p className="filter-note">多选时需同时具备。</p>
      </FilterSection>

      <FilterSection
        numeral="VI"
        title="韧性"
        aside={
          filters.poiseMin !== 0 || filters.poiseMax !== 300
            ? `${filters.poiseMin}–${filters.poiseMax}`
            : "30–300"
        }
      >
        <div className="poise-control">
          <div className="range-labels">
            <span>≥ {filters.poiseMin}</span>
            <span>≤ {filters.poiseMax}</span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={10}
            value={filters.poiseMin}
            aria-label="最低韧性"
            onChange={(event) =>
              patch({
                poiseMin: Math.min(Number(event.target.value), filters.poiseMax),
              })
            }
          />
          <input
            type="range"
            min={0}
            max={300}
            step={10}
            value={filters.poiseMax}
            aria-label="最高韧性"
            onChange={(event) =>
              patch({
                poiseMax: Math.max(Number(event.target.value), filters.poiseMin),
              })
            }
          />
        </div>
      </FilterSection>

      <button
        type="button"
        className="reset-btn"
        onClick={clearAll}
        disabled={!activeCount}
      >
        <CloseIcon size={12} />
        重置全部筛选
      </button>
      <p className="sidebar-note">
        共 {meta.counts.total} 条 · 免疫值统一显示为“免疫”
      </p>
    </>
  );

  const colCount =
    2 + (columns.group ? 1 : 0) + 8 + 1 + (columns.status ? 5 : 0) + (columns.traits ? 1 : 0);
  const tailCount = (columns.traits ? 1 : 0) + (columns.group ? 1 : 0);
  const tailLabel = [columns.traits ? "特性" : null, columns.group ? "分组" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <header className="topbar">
        <a className="brand" href="./" aria-label="交界地抗性档案首页">
          <span className="brand-mark">
            <RuneMark size={24} />
          </span>
          <span className="brand-text">
            <strong>交界地档案</strong>
            <em>THE LANDS BETWEEN ARCHIVE</em>
          </span>
        </a>
        <div className="topbar-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={() => {
              if (window.innerWidth < 1400) mobileSearchRef.current?.focus();
              else searchRef.current?.focus();
            }}
          >
            <SearchIcon size={15} />
            <span>搜索敌人</span>
            <kbd>/</kbd>
          </button>
          <button type="button" className="ghost-btn" onClick={() => setInfoOpen(true)}>
            <InfoIcon size={15} />
            <span>数据说明</span>
          </button>
        </div>
      </header>

      <div className="app-shell">
        <aside className="sidebar" aria-label="筛选条件">
          <div className="sidebar-scroll">{renderSidebar(true)}</div>
        </aside>

        <main className="main">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">ENEMY RESISTANCE CODEX · 档案 01</p>
              <h1>交界地抗性档案</h1>
              <p className="hero-sub">
                {meta.counts.total} 个敌人 · {meta.counts.groups} 个势力与区域 · 13
                个抗性维度。按伤害类型、异常免疫与韧性快速定位。
              </p>
            </div>
            <div className="hero-stats" aria-label="数据概览">
              <div className="stat">
                <span className="stat-value">{meta.counts.total}</span>
                <span className="stat-label">敌人</span>
              </div>
              <div className="stat">
                <span className="stat-value">{meta.counts.groups}</span>
                <span className="stat-label">分组</span>
              </div>
              <div className="stat">
                <span className="stat-value">8</span>
                <span className="stat-label">伤害维度</span>
              </div>
              <div className="stat">
                <span className="stat-value">5</span>
                <span className="stat-label">异常维度</span>
              </div>
            </div>
            <RuneRings className="hero-rune" />
          </section>

          <div className="mobile-search">
            <SearchIcon size={15} />
            <input
              ref={mobileSearchRef}
              value={filters.q}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, q: event.target.value, page: 1 }))
              }
              placeholder="搜索敌人、编号或分组"
              aria-label="搜索敌人"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() =>
                  setFilters((previous) => ({ ...previous, q: "", page: 1 }))
                }
                aria-label="清空搜索"
              >
                <CloseIcon size={12} />
              </button>
            ) : null}
          </div>

          <div className="sticky-bar" ref={stickyRef}>
            <div className="toolbar">
            <p className="result-line" role="status" aria-live="polite">
              <strong>{sorted.length}</strong>
              <span> / {meta.counts.total} 条</span>
              {filters.q ? <em className="result-query">“{filters.q}”</em> : null}
            </p>
            <div className="toolbar-actions">
              <button
                type="button"
                className="tool-btn filter-trigger"
                onClick={() => setFiltersOpen(true)}
              >
                <FilterIcon size={14} />
                筛选
                {activeCount ? <em>{activeCount}</em> : null}
              </button>

              <label className="select-wrap select-sort">
                <span>排序</span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      sort: event.target.value as SortKey,
                      page: 1,
                    }))
                  }
                  aria-label="排序方式"
                  title="综合排序；也可点击表头属性列排序"
                >
                  {SORT_GROUPS.map((group) => (
                    <optgroup label={group.label} key={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronIcon size={12} />
              </label>

              <label className="select-wrap select-size">
                <span>每页</span>
                <select
                  value={filters.pageSize}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilters((previous) => ({
                      ...previous,
                      pageSize: value === "all" ? "all" : Number(value),
                      page: 1,
                    }));
                  }}
                  aria-label="每页条数"
                >
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">全部</option>
                </select>
                <ChevronIcon size={12} />
              </label>

              <div className="columns-wrap" ref={columnsRef}>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setColumnsOpen((previous) => !previous)}
                  aria-expanded={columnsOpen}
                >
                  <ColumnsIcon size={14} />
                  列
                </button>
                {columnsOpen ? (
                  <div className="columns-menu">
                    <p>显示列</p>
                    <label>
                      <input
                        type="checkbox"
                        checked={columns.status}
                        onChange={() =>
                          setColumns((previous) => ({
                            ...previous,
                            status: !previous.status,
                          }))
                        }
                      />
                      异常抵抗
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={columns.traits}
                        onChange={() =>
                          setColumns((previous) => ({
                            ...previous,
                            traits: !previous.traits,
                          }))
                        }
                      />
                      特性
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={columns.group}
                        onChange={() =>
                          setColumns((previous) => ({
                            ...previous,
                            group: !previous.group,
                          }))
                        }
                      />
                      分组
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

            {activeChips.length ? (
              <div className="active-filters" aria-label="已选筛选">
                {activeChips.map((chip) => (
                  <span className="active-chip" key={chip.key}>
                    {chip.color ? (
                      <i style={{ background: chip.color }} aria-hidden="true" />
                    ) : null}
                    {chip.label}
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`移除 ${chip.label}`}
                    >
                      <CloseIcon size={10} />
                    </button>
                  </span>
                ))}
                <button type="button" className="clear-inline" onClick={clearAll}>
                  清除全部
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="table-shell"
            style={
              {
                "--head-top": `calc(var(--header-h) + ${stickyHeight}px - 2px)`,
              } as CSSProperties
            }
          >
            {!isNarrow ? (
              <div className="table-scroll">
              <table className="enemy-table">
                <caption className="sr-only">
                  艾尔登法环敌人抗性数据表，共 {sorted.length} 条结果
                </caption>
                <colgroup>
                  <col style={{ width: 32 }} />
                  <col style={{ width: nameWidth }} />
                  <col style={{ width: 58 }} />
                  {DAMAGE.map((item) => (
                    <col key={item.key} style={{ width: 46 }} />
                  ))}
                  {columns.status
                    ? STATUS.map((item) => <col key={item.key} style={{ width: 46 }} />)
                    : null}
                  {columns.traits ? <col style={{ width: 76 }} /> : null}
                  {columns.group ? <col style={{ width: 120 }} /> : null}
                </colgroup>
                <thead>
                  <tr className="head-top">
                    <th scope="colgroup" colSpan={3} className="col-grouphead">
                      基础
                      <em>名称 · 韧性</em>
                    </th>
                    <th scope="colgroup" colSpan={8} className="col-grouphead">
                      伤害承受
                      <em>绿色易伤 · 红褐抗性</em>
                    </th>
                    {columns.status ? (
                      <th scope="colgroup" colSpan={5} className="col-grouphead">
                        异常抵抗
                        <em>数值越高越抗</em>
                      </th>
                    ) : null}
                    {tailCount ? (
                      <th scope="colgroup" colSpan={tailCount} className="col-grouphead">
                        归档
                        <em>{tailLabel}</em>
                      </th>
                    ) : null}
                  </tr>
                  <tr className="head-sub">
                    <th scope="col" className="col-check">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allOnPage}
                        onChange={toggleAllOnPage}
                        aria-label={
                          filters.pageSize === "all"
                            ? "选择全部用于对比"
                            : "选择本页用于对比"
                        }
                      />
                    </th>
                    <th scope="col" className="col-name sticky-col">
                      名称
                    </th>
                    <th scope="col" className="col-poise">
                      韧性
                    </th>
                    {DAMAGE.map((item) => {
                      const desc = `${item.key}Desc` as SortKey;
                      const asc = `${item.key}Asc` as SortKey;
                      const active = filters.sort === desc || filters.sort === asc;
                      const ascending = filters.sort === asc;
                      return (
                        <th
                          scope="col"
                          key={item.key}
                          aria-sort={
                            active ? (ascending ? "ascending" : "descending") : "none"
                          }
                          className={`damage-head ${
                            filters.damage.includes(item.key) ? "is-active" : ""
                          } ${active ? "is-sorted" : ""}`}
                        >
                          <button
                            type="button"
                            className="th-sort"
                            onClick={() => sortByMetric(item.key)}
                            aria-label={
                              active
                                ? `按${item.label}承受排序，当前${
                                    ascending ? "升序" : "降序"
                                  }`
                                : `按${item.label}承受排序`
                            }
                            title={
                              active
                                ? `按${item.label}承受排序，当前${
                                    ascending ? "升序" : "降序"
                                  }；点击切换`
                                : `按${item.label}承受排序`
                            }
                          >
                            <span style={{ color: item.color }}>
                              <DamageIcon type={item.key} size={15} />
                            </span>
                            <span>{item.short}</span>
                            <i
                              className={`sort-ind ${active ? "is-on" : ""}`}
                              aria-hidden="true"
                            >
                              {active ? (ascending ? "↑" : "↓") : "↕"}
                            </i>
                          </button>
                        </th>
                      );
                    })}
                    {columns.status
                      ? STATUS.map((item) => {
                          const desc = `${item.key}Desc` as SortKey;
                          const asc = `${item.key}Asc` as SortKey;
                          const active = filters.sort === desc || filters.sort === asc;
                          const ascending = filters.sort === asc;
                          return (
                            <th
                              scope="col"
                              key={item.key}
                              aria-sort={
                                active ? (ascending ? "ascending" : "descending") : "none"
                              }
                              className={`status-head ${
                                filters.immune.includes(item.key) ? "is-active" : ""
                              } ${active ? "is-sorted" : ""}`}
                            >
                              <button
                                type="button"
                                className="th-sort"
                                onClick={() => sortByMetric(item.key)}
                                aria-label={
                                  active
                                    ? `按${item.label}抵抗排序，当前${
                                        ascending ? "升序" : "降序"
                                      }`
                                    : `按${item.label}抵抗排序`
                                }
                                title={
                                  active
                                    ? `按${item.label}抵抗排序，当前${
                                        ascending ? "升序" : "降序"
                                      }；点击切换`
                                    : `按${item.label}抵抗排序`
                                }
                              >
                                <span style={{ color: item.color }}>
                                  <StatusIcon type={item.key} size={15} />
                                </span>
                                <span>{item.short}</span>
                                <i
                                  className={`sort-ind ${active ? "is-on" : ""}`}
                                  aria-hidden="true"
                                >
                                  {active ? (ascending ? "↑" : "↓") : "↕"}
                                </i>
                              </button>
                            </th>
                          );
                        })
                      : null}
                    {columns.traits ? (
                      <th scope="col" className="col-traits">
                        特性
                      </th>
                    ) : null}
                    {columns.group ? (
                      <th scope="col" className="col-group">
                        分组
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length ? (
                    pageItems.map((enemy) => {
                      const poise = effectivePoise(enemy.poise);
                      const isCompared = compareKeys.includes(enemy.key);
                      const group = groupMap.get(enemy.groupId);
                      return (
                        <tr
                          key={enemy.key}
                          className={`${openKey === enemy.key ? "is-open" : ""} ${
                            isCompared ? "is-compared" : ""
                          }`}
                          tabIndex={0}
                          onClick={() => setOpenKey(enemy.key)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            const target = event.target as HTMLElement;
                            if (target.closest("input, button, a, select")) return;
                            event.preventDefault();
                            setOpenKey(enemy.key);
                          }}
                        >
                          <td className="col-check" onClick={(event) => event.stopPropagation()}>
                            <label className="row-check">
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleCompare(enemy.key)}
                                aria-label={`选择 ${enemy.name} 用于对比`}
                              />
                              <span className="check-visual" aria-hidden="true">
                                <CheckIcon size={10} />
                              </span>
                            </label>
                          </td>
                          <td className="col-name sticky-col" title={enemy.name}>
                            <span className="name-text">
                              <span className="name-label">
                                <Highlight text={enemy.name} query={filters.q} />
                              </span>
                            </span>
                          </td>
                          <td className="col-poise">
                            {poise === null ? (
                              <span className="dim">—</span>
                            ) : (
                              <span className="poise-cell">
                                <span>{poise}</span>
                                <i
                                  aria-hidden="true"
                                  style={{ width: `${Math.min((poise / 300) * 100, 100)}%` }}
                                />
                              </span>
                            )}
                          </td>
                          {DAMAGE.map((item) => {
                            const value = enemy.damage[item.key];
                            const background = heatBackground(value);
                            return (
                              <td
                                key={item.key}
                                className={`num-cell ${
                                  value === 0 ? "is-immune" : ""
                                } ${
                                  filters.damage.includes(item.key) ? "is-active" : ""
                                }`}
                                style={background ? { backgroundColor: background } : undefined}
                                title={`${item.label}承受 ${
                                  value === 0 ? "免疫" : `×${formatMultiplier(value)}`
                                }`}
                              >
                                {value === 0 ? (
                                  <span className="immune-text">免疫</span>
                                ) : (
                                  <span className={value === 1 ? "dim" : ""}>
                                    {formatMultiplier(value)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          {columns.status
                            ? STATUS.map((item) => {
                                const value = enemy.status[item.key];
                                return (
                                  <td
                                    key={item.key}
                                    className={`status-cell ${
                                      filters.immune.includes(item.key) ? "is-active" : ""
                                    }`}
                                  >
                                    {value === "immune" ? (
                                      <span className="immune-pill">
                                        <StatusIcon type={item.key} size={10} immune />
                                        免疫
                                      </span>
                                    ) : (
                                      <span className={value === null ? "dim" : ""}>
                                        {formatResistance(value)}
                                      </span>
                                    )}
                                  </td>
                                );
                              })
                            : null}
                          {columns.traits ? (
                            <td className="col-traits">
                              <span
                                className={`trait-text ${enemy.traits?.length ? "" : "dim"}`}
                                title={
                                  enemy.traits?.length
                                    ? enemy.traits.map((key) => traitMeta[key].label).join("、")
                                    : undefined
                                }
                              >
                                {enemy.traits?.length
                                  ? enemy.traits.map((key) => traitMeta[key].label).join(" · ")
                                  : "—"}
                              </span>
                            </td>
                          ) : null}
                          {columns.group ? (
                            <td className="col-group">
                              <span className="group-cell">
                                {SOURCE_LABEL[enemy.source]} · {group?.name ?? "未分组"}
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={colCount}>
                        <div className="empty-state">
                          <span className="empty-rune" aria-hidden="true">
                            <RuneMark size={44} />
                          </span>
                          <h2>没有符合条件的敌人</h2>
                          <p>尝试减少筛选条件，或清除全部筛选重新开始。</p>
                          <button type="button" className="btn btn-primary" onClick={clearAll}>
                            清除全部筛选
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            ) : null}

            {isNarrow ? (
              <div className="mobile-cards">
              {pageItems.map((enemy) => {
                const poise = effectivePoise(enemy.poise);
                const isCompared = compareKeys.includes(enemy.key);
                const group = groupMap.get(enemy.groupId);
                const immune = immuneStatuses(enemy);
                return (
                  <article
                    className={`enemy-card ${isCompared ? "is-compared" : ""}`}
                    key={enemy.key}
                    onClick={() => setOpenKey(enemy.key)}
                  >
                    <header>
                      <div>
                        <h3>
                          <Highlight text={enemy.name} query={filters.q} />
                        </h3>
                        <p>
                          {SOURCE_LABEL[enemy.source]} · {group?.name ?? "未分组"}
                        </p>
                      </div>
                      <span className="card-poise">
                        韧性 <strong>{poise ?? "—"}</strong>
                      </span>
                    </header>
                    <div className="card-damage">
                      {DAMAGE.map((item) => {
                        const value = enemy.damage[item.key];
                        return (
                          <span key={item.key} style={{ color: item.color }}>
                            <DamageIcon type={item.key} size={13} />
                            <em className="card-stat-label">{item.short}</em>
                            <b>{value === 0 ? "免疫" : formatMultiplier(value)}</b>
                          </span>
                        );
                      })}
                    </div>
                    <div className="card-status">
                      {immune.length ? (
                        immune.map((key) => (
                          <span key={key} style={{ color: statusMeta[key].color }}>
                            <StatusIcon type={key} size={13} immune />
                            {statusMeta[key].label}
                          </span>
                        ))
                      ) : (
                        <span className="dim">无异常免疫</span>
                      )}
                    </div>
                    <footer>
                      <span className="card-traits">
                        {enemy.traits?.length
                          ? enemy.traits.map((key) => traitMeta[key].label).join(" · ")
                          : "无特性"}
                      </span>
                      <button
                        type="button"
                        className={`card-compare ${isCompared ? "is-on" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleCompare(enemy.key);
                        }}
                      >
                        <CompareIcon size={12} />
                        {isCompared ? "已选" : "对比"}
                      </button>
                    </footer>
                  </article>
                );
              })}
              {!pageItems.length ? (
                <div className="empty-state">
                  <h2>没有符合条件的敌人</h2>
                  <p>尝试减少筛选条件，或清除全部筛选重新开始。</p>
                  <button type="button" className="btn btn-primary" onClick={clearAll}>
                    清除全部筛选
                  </button>
                </div>
              ) : null}
            </div>
            ) : null}
          </div>

          <nav
            className={`pagination ${filters.pageSize === "all" ? "is-all" : ""}`}
            aria-label="分页"
          >
            <p>
              共 <strong>{sorted.length}</strong> 条
              {filters.pageSize === "all"
                ? " · 全部显示"
                : ` · 第 ${currentPage} / ${totalPages} 页`}
            </p>
            {filters.pageSize !== "all" ? (
              <div className="page-buttons">
              <button
                type="button"
                className="page-btn"
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: Math.max(1, currentPage - 1),
                  }))
                }
                disabled={currentPage <= 1}
                aria-label="上一页"
              >
                <ChevronIcon size={13} style={{ transform: "rotate(90deg)" }} />
              </button>
              {pageList(currentPage, totalPages).map((page, index) =>
                page === "ellipsis" ? (
                  <span className="page-ellipsis" key={`ellipsis-${index}`}>
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    className={`page-btn ${page === currentPage ? "is-on" : ""}`}
                    onClick={() =>
                      setFilters((previous) => ({ ...previous, page }))
                    }
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type="button"
                className="page-btn"
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: Math.min(totalPages, currentPage + 1),
                  }))
                }
                disabled={currentPage >= totalPages}
                aria-label="下一页"
              >
                <ChevronIcon size={13} style={{ transform: "rotate(-90deg)" }} />
              </button>
              </div>
            ) : null}
          </nav>

          <footer className="site-foot">
            <span>非官方粉丝项目 · 数据为本地整理 · 不含游戏内图像资源</span>
            <span>
              数据生成于 {meta.generatedAt} · {meta.counts.total} 条 / {meta.counts.groups} 组
            </span>
          </footer>
        </main>
      </div>

      {compareKeys.length ? (
        <div className="compare-tray" role="region" aria-label="对比栏">
          <div className="tray-left">
            <CompareIcon size={15} />
            <span className="tray-label">对比</span>
            {compareEnemies.map((enemy, index) => (
              <span className="tray-chip" key={enemy.key}>
                <i style={{ background: COMPARE_COLORS[index] }} aria-hidden="true" />
                {enemy.name}
                <button
                  type="button"
                  onClick={() => toggleCompare(enemy.key)}
                  aria-label={`移除 ${enemy.name}`}
                >
                  <CloseIcon size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="tray-actions">
            <button type="button" className="ghost-btn" onClick={() => setCompareKeys([])}>
              清空
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={compareKeys.length < 2}
              onClick={() => {
                setOpenKey(null);
                setCompareOpen(true);
              }}
            >
              开始对比
            </button>
          </div>
        </div>
      ) : null}

      {openEnemy ? (
        <DetailDrawer
          enemy={openEnemy}
          group={openGroup}
          groupEnemies={openGroupEnemies}
          onClose={() => setOpenKey(null)}
          onNavigate={(key) => setOpenKey(key)}
          onPrev={previousEnemy ? () => setOpenKey(previousEnemy.key) : undefined}
          onNext={nextEnemy ? () => setOpenKey(nextEnemy.key) : undefined}
          onToggleCompare={toggleCompare}
          isCompared={compareKeys.includes(openEnemy.key)}
          compareCount={compareKeys.length}
          onCopy={copyText}
        />
      ) : null}

      {compareOpen && compareEnemies.length >= 2 ? (
        <CompareDialog
          enemies={compareEnemies}
          groups={groupMap}
          onClose={() => setCompareOpen(false)}
          onRemove={toggleCompare}
          onCopy={copyText}
        />
      ) : null}

      {infoOpen ? <InfoDialog meta={meta} onClose={() => setInfoOpen(false)} /> : null}

      {filtersOpen ? (
        <FilterSheet
          count={sorted.length}
          query={filters.q}
          onQueryChange={(value) =>
            setFilters((previous) => ({ ...previous, q: value, page: 1 }))
          }
          onClose={() => setFiltersOpen(false)}
        >
          {renderSidebar(false)}
        </FilterSheet>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
