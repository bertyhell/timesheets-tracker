import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, ChevronRight, Folder, Receipt, X } from 'lucide-react';

import { productiveApi } from '../../api/productive';
import type {
  ProductiveServiceSelection,
  ProductiveTimesheetDropdownProps,
  TreeNode,
} from './ProductiveTimesheetDropdown.types';

import './ProductiveTimesheetDropdown.css';

const SEARCH_DEBOUNCE_MS = 250;

interface Row {
  /** Unique per position in the tree — two branches can hold the same id. */
  key: string;
  node: TreeNode;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
}

function formatHours(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return '-';
  const hours = minutes / 60;
  return `${hours.toLocaleString(undefined, { maximumFractionDigits: hours < 10 ? 1 : 0 })} hrs`;
}

/** Small circular progress indicator for a service's worked/budgeted time. */
function ProgressRing({ worked, budgeted }: { worked?: number; budgeted?: number }) {
  if (!budgeted || budgeted <= 0) return null;

  const ratio = (worked ?? 0) / budgeted;
  const clamped = Math.max(0, Math.min(1, ratio));
  const radius = 6;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg className="c-productive-dropdown__ring" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r={radius} className="c-productive-dropdown__ring-track" />
      <circle
        cx="8"
        cy="8"
        r={radius}
        className={`c-productive-dropdown__ring-fill${ratio > 1 ? ' is-over-budget' : ''}`}
        strokeDasharray={`${clamped * circumference} ${circumference}`}
      />
    </svg>
  );
}

function nodeIcon(node: TreeNode) {
  switch (node.kind) {
    case 'company':
      return node.avatarUrl ? (
        <img src={node.avatarUrl} alt="" className="c-productive-dropdown__avatar" />
      ) : (
        <Building2 size={14} />
      );
    case 'project':
      return <Folder size={14} />;
    case 'budget':
      return <Receipt size={14} />;
    default:
      return null;
  }
}

/**
 * Depth-first walk of the tree, emitting only the rows currently visible.
 * `forceExpand` is used while searching, where every returned branch is opened.
 */
function flattenTree(
  nodes: TreeNode[],
  expanded: Set<string>,
  forceExpand: boolean,
  parentKey = '',
  level = 1,
  out: Row[] = []
): Row[] {
  for (const node of nodes) {
    const key = `${parentKey}/${node.kind}:${node.id}`;
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && (forceExpand || expanded.has(key));
    out.push({ key, node, level, hasChildren, expanded: isExpanded });
    if (isExpanded) flattenTree(node.children, expanded, forceExpand, key, level + 1, out);
  }
  return out;
}

/** Index every service leaf by id, with the resolved ancestor ids and path. */
function indexServices(
  nodes: TreeNode[],
  ancestors: TreeNode[] = [],
  out = new Map<string, ProductiveServiceSelection>()
): Map<string, ProductiveServiceSelection> {
  for (const node of nodes) {
    if (node.kind === 'service') {
      const byKind = (kind: TreeNode['kind']) => ancestors.find((a) => a.kind === kind);
      const parts = [...ancestors.filter((a) => a.kind !== 'section'), node].map((n) => n.label);
      out.set(node.id, {
        serviceId: node.id,
        companyId: byKind('company')?.id ?? '',
        projectId: byKind('project')?.id ?? '',
        dealId: byKind('budget')?.id ?? '',
        parts,
        path: parts.join(' · '),
      });
    } else {
      indexServices(node.children, [...ancestors, node], out);
    }
  }
  return out;
}

/** All expandable row keys, used by "Expand all". */
function allExpandableKeys(nodes: TreeNode[], parentKey = '', out: string[] = []): string[] {
  for (const node of nodes) {
    const key = `${parentKey}/${node.kind}:${node.id}`;
    if (node.children.length > 0) {
      out.push(key);
      allExpandableKeys(node.children, key, out);
    }
  }
  return out;
}

export function ProductiveTimesheetDropdown({
  date,
  value,
  valuePath = '',
  valueParts,
  onChange,
  disabled = false,
  placeholder = 'Select a service',
}: ProductiveTimesheetDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // The unsearched tree is shared by every row on the same date, so all rows in
  // the sync modal resolve their label from a single request.
  const {
    data: fullTree = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['productive', 'service-tree', date],
    queryFn: () => productiveApi.getServiceTree(date),
    staleTime: 60_000,
  });

  const isSearching = open && debouncedSearch.length > 0;
  const { data: searchTree, isFetching: searchFetching } = useQuery({
    queryKey: ['productive', 'service-tree', date, debouncedSearch],
    queryFn: () => productiveApi.getServiceTree(date, debouncedSearch),
    enabled: isSearching,
    staleTime: 60_000,
  });

  const tree = isSearching ? (searchTree ?? []) : fullTree;

  const fullIndex = useMemo(() => indexServices(fullTree), [fullTree]);
  const treeIndex = useMemo(() => indexServices(tree), [tree]);

  const selected = value ? (fullIndex.get(value) ?? treeIndex.get(value)) : undefined;
  // A remembered service can be absent from this date's tree (or the tree may
  // still be loading); fall back to the stored path so the link stays visible.
  const selectedLabel = selected?.path || (value ? valuePath : '') || '';
  const selectedParts = selected?.parts ?? (value ? valueParts : undefined);
  // `[company, project, budget, service]` reads better split over two lines:
  // the project/budget on top, the company and the service itself below.
  const twoLine =
    selectedParts && selectedParts.length === 4
      ? {
          primary: selectedParts.slice(1, 3).join(' · '),
          secondary: `${selectedParts[0]} · ${selectedParts[3]}`,
        }
      : undefined;

  const rows = useMemo(() => flattenTree(tree, expanded, isSearching), [tree, expanded, isSearching]);

  // Close on outside click / Escape and hand focus back to the trigger.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (evt: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(evt.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    } else {
      setSearch('');
      setDebouncedSearch('');
      setActiveIndex(-1);
    }
  }, [open]);

  // Reveal the selected service when the panel opens.
  useEffect(() => {
    if (!open || !value) return;
    const row = flattenTree(fullTree, new Set(allExpandableKeys(fullTree)), false).find(
      (candidate) => candidate.node.kind === 'service' && candidate.node.id === value
    );
    if (!row) return;
    const ancestorKeys: string[] = [];
    const parts = row.key.split('/').filter(Boolean);
    // Every prefix of the row key is an ancestor that needs to be open.
    for (let i = 1; i < parts.length; i += 1) {
      ancestorKeys.push(`/${parts.slice(0, i).join('/')}`);
    }
    setExpanded((prev) => new Set([...prev, ...ancestorKeys]));
  }, [open, value, fullTree]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const select = (node: TreeNode) => {
    const selection = treeIndex.get(node.id) ?? fullIndex.get(node.id);
    if (!selection) return;
    onChange(selection);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (delta: number) => {
    if (rows.length === 0) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= rows.length) return rows.length - 1;
      return next;
    });
  };

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    const row = rows[activeIndex];
    switch (evt.key) {
      case 'Escape':
        evt.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        evt.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        evt.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        evt.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        evt.preventDefault();
        setActiveIndex(rows.length - 1);
        break;
      case 'ArrowRight':
        if (row?.hasChildren && !row.expanded) {
          evt.preventDefault();
          toggle(row.key);
        }
        break;
      case 'ArrowLeft':
        if (row?.hasChildren && row.expanded) {
          evt.preventDefault();
          toggle(row.key);
        }
        break;
      case 'Enter':
        evt.preventDefault();
        if (!row) break;
        if (row.node.selectable) select(row.node);
        else if (row.hasChildren) toggle(row.key);
        break;
      default:
        break;
    }
  };

  // Keep the keyboard-active row in view.
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const loading = isLoading || (isSearching && searchFetching && !searchTree);

  return (
    <div className="c-productive-dropdown" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        role="combobox"
        aria-label="Select a service"
        aria-expanded={open}
        aria-haspopup="tree"
        disabled={disabled}
        className={`c-productive-dropdown__trigger${selectedLabel ? '' : ' is-placeholder'}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="c-productive-dropdown__trigger-label" title={selectedLabel || undefined}>
          {twoLine ? (
            <>
              <span className="c-productive-dropdown__trigger-line">{twoLine.primary}</span>
              <span className="c-productive-dropdown__trigger-line is-secondary">
                {twoLine.secondary}
              </span>
            </>
          ) : (
            selectedLabel || placeholder
          )}
        </span>
        {value && !disabled && (
          <span
            role="button"
            aria-label="Clear selection"
            className="c-productive-dropdown__clear"
            onClick={(evt) => {
              evt.stopPropagation();
              onChange(null);
            }}
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} className={`c-productive-dropdown__chevron${open ? ' is-open' : ''}`} />
      </button>

      {open && (
        <div className="c-productive-dropdown__panel" onKeyDown={handleKeyDown}>
          <input
            ref={searchRef}
            type="text"
            className="c-productive-dropdown__search"
            placeholder="Type to search"
            autoComplete="off"
            spellCheck={false}
            value={search}
            onChange={(evt) => {
              setSearch(evt.target.value);
              setActiveIndex(-1);
            }}
          />

          <div className="c-productive-dropdown__list" role="tree" ref={listRef}>
            {loading && <div className="c-productive-dropdown__message">Loading services…</div>}

            {!loading && isError && (
              <div className="c-productive-dropdown__message">
                {error instanceof Error ? error.message : 'Failed to load services.'}{' '}
                <button type="button" className="c-productive-dropdown__link" onClick={() => refetch()}>
                  Retry
                </button>
              </div>
            )}

            {!loading && !isError && rows.length === 0 && (
              <div className="c-productive-dropdown__message">No services found</div>
            )}

            {!loading &&
              !isError &&
              rows.map((row, index) => {
                const { node } = row;
                const isSelected = node.kind === 'service' && node.id === value;
                return (
                  <div
                    key={row.key}
                    role="treeitem"
                    aria-level={row.level}
                    aria-expanded={row.hasChildren ? row.expanded : undefined}
                    aria-selected={node.selectable ? isSelected : undefined}
                    data-row-index={index}
                    className={[
                      'c-productive-dropdown__row',
                      `is-${node.kind}`,
                      index === activeIndex ? 'is-active' : '',
                      isSelected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ paddingLeft: `${0.25 + (row.level - 1) * 1.125}rem` }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => (node.selectable ? select(node) : row.hasChildren && toggle(row.key))}
                  >
                    <span className="c-productive-dropdown__caret">
                      {row.hasChildren &&
                        (row.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                    </span>
                    <span className="c-productive-dropdown__icon">{nodeIcon(node)}</span>
                    <span className="c-productive-dropdown__label">{node.label}</span>
                    {node.kind === 'service' && (
                      <span className="c-productive-dropdown__meta">
                        {formatHours(node.workedMinutes)} / {formatHours(node.budgetedMinutes)}
                        <ProgressRing worked={node.workedMinutes} budgeted={node.budgetedMinutes} />
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="c-productive-dropdown__footer">
            <button
              type="button"
              className="c-productive-dropdown__link"
              onClick={() => setExpanded(new Set())}
            >
              Collapse all
            </button>
            <button
              type="button"
              className="c-productive-dropdown__link"
              onClick={() => setExpanded(new Set(allExpandableKeys(tree)))}
            >
              Expand all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
