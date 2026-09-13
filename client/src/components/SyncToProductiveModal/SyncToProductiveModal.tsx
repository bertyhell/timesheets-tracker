import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { TimelineType } from '../Timeline/Timeline.types';
import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import {
  tagNamesControllerFindAllOptions,
  tagNamesControllerUpdateMutation,
  tagsControllerUpdateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import { AlertTriangle, Check, ChevronRight, X } from 'lucide-react';

import { productiveApi } from '../../api/productive';
import type { SyncStatus, SyncStatusEntry, SyncStatusValue } from '../../api/productive';
import { ProductiveTimesheetDropdown } from '../ProductiveTimesheetDropdown/ProductiveTimesheetDropdown';
import { SyncOutputMenu } from '../SyncOutputMenu/SyncOutputMenu';
import { PRODUCTIVE_OUTPUT_ID, useSyncOutputs } from '../SyncOutputMenu/useSyncOutputs';

import './SyncToProductiveModal.css';

interface SyncToProductiveModalProps {
  open: boolean;
  onClose: () => void;
  date: string; // yyyy-MM-dd
  timelineType: TimelineDto['timelineType'];
  events: TimelineEventDto[];
  /** Picked another target in the header menu — the owner swaps in that target's dialog. */
  onSelectOutput: (outputId: string) => void;
}

interface EventInfoLike {
  tagNameId?: string;
  tagNameName?: string;
  tagNameTitle?: string;
  tagNameCode?: string | null;
  tagNameNote?: string | null;
  note?: string | null;
}

interface SyncRow {
  tagNameId: string;
  name: string;
  code: string | null;
  totalMinutes: number;
  events: { id: string; minutes: number; note: string }[];
}

/**
 * One time entry as it will be sent to Productive: a tag's events collapsed by note, so a tag
 * with three same-note events books one entry. The key stays stable across renders and across
 * syncs, which is what lets a planned entry be matched to its previous outcome.
 */
interface PlannedEntry {
  key: string;
  tagNameId: string;
  serviceId: string;
  note: string;
  minutes: number;
  /** The timeline events collapsed into this entry, so an edited note can be written back to them. */
  eventIds: string[];
}

interface RowSelection {
  companyId: string;
  dealId: string;
  serviceId: string;
  /** `Company · Project · Budget · Service`, stored so the remembered link stays
   *  readable even when the service is missing from the current service tree. */
  path: string;
  /** The same labels unjoined, so the dropdown can lay them out on two lines. */
  parts: string[];
}

const EMPTY_SELECTION: RowSelection = {
  companyId: '',
  dealId: '',
  serviceId: '',
  path: '',
  parts: [],
};

/** "Thursday 10 September 2026" — the day being booked, spelled out. */
function formatLongDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Stored in tag name code to persist the "do not sync" choice across sessions.
const DO_NOT_SYNC_CODE = '{"doNotSync":true}';

function isDoNotSyncCode(code: string | null): boolean {
  if (!code) return false;
  try {
    const parsed = JSON.parse(code) as Record<string, unknown>;
    return parsed?.doNotSync === true;
  } catch {
    return false;
  }
}

function eventMinutes(event: TimelineEventDto): number {
  return (new Date(event.endedAt).getTime() - new Date(event.startedAt).getTime()) / 60000;
}

function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * The tag name `code` stores the Productive target as JSON
 * `{ companyId, dealId, serviceId, path, parts }`. Older codes held a raw service id string
 * or `{ serviceId, taskId }`, so fall back to whatever fields are present.
 */
function parseCode(code: string | null): RowSelection {
  if (!code) return { ...EMPTY_SELECTION };
  try {
    const parsed = JSON.parse(code) as Partial<Record<keyof RowSelection, unknown>>;
    if (parsed && typeof parsed === 'object') {
      const path = parsed.path != null ? String(parsed.path) : '';
      // Codes written before `parts` existed only carry the joined path.
      const parts = Array.isArray(parsed.parts)
        ? parsed.parts.map((part) => String(part))
        : path
          ? path.split(' · ')
          : [];
      return {
        companyId: parsed.companyId != null ? String(parsed.companyId) : '',
        dealId: parsed.dealId != null ? String(parsed.dealId) : '',
        serviceId: parsed.serviceId != null ? String(parsed.serviceId) : '',
        path,
        parts,
      };
    }
  } catch {
    // legacy: code was a raw service id string
  }
  return { companyId: '', dealId: '', serviceId: code, path: '', parts: [] };
}

function encodeCode(selection: RowSelection): string {
  return JSON.stringify({
    companyId: selection.companyId,
    dealId: selection.dealId,
    serviceId: selection.serviceId,
    path: selection.path,
    parts: selection.parts,
  });
}

/**
 * The note an event is booked under: its own note (set manually or by an auto-note rule), or,
 * when neither the tag nor the auto tag carries one, the note from the tag name definition.
 */
function eventNote(info: EventInfoLike): string {
  const own = (info.note ?? '').trim();
  if (own) return own;
  return (info.tagNameNote ?? '').trim();
}

/** Group a timeline's tag/autotag events by tag name into rows for display. */
function buildRows(events: TimelineEventDto[]): SyncRow[] {
  const byTagName = new Map<string, SyncRow>();

  for (const event of events) {
    const info = event.info as EventInfoLike;
    const tagNameId = info.tagNameId;
    if (!tagNameId) continue;

    const name = info.tagNameName ?? info.tagNameTitle ?? 'Unnamed';
    const note = eventNote(info);
    const minutes = eventMinutes(event);

    let row = byTagName.get(tagNameId);
    if (!row) {
      row = { tagNameId, name, code: info.tagNameCode ?? null, totalMinutes: 0, events: [] };
      byTagName.set(tagNameId, row);
    }
    row.totalMinutes += minutes;
    row.events.push({ id: event.id, minutes, note });
  }

  return Array.from(byTagName.values());
}

/**
 * Collapse a row's events into the entries that will actually be posted, one per distinct note.
 *
 * The grouping is per tag: two tags pointing at the same service with the same note produce two
 * entries rather than one merged entry, because an entry has to be attributable to a single tag
 * for its outcome to be reported, retried and toggled per tag.
 */
function buildPlannedEntries(row: SyncRow, serviceId: string): PlannedEntry[] {
  if (!serviceId) return [];

  const byNote = new Map<string, PlannedEntry>();
  for (const event of row.events) {
    const existing = byNote.get(event.note);
    if (existing) {
      existing.minutes += event.minutes;
      existing.eventIds.push(event.id);
    } else {
      byNote.set(event.note, {
        key: `${row.tagNameId}||${serviceId}||${event.note}`,
        tagNameId: row.tagNameId,
        serviceId,
        note: event.note,
        minutes: event.minutes,
        eventIds: [event.id],
      });
    }
  }

  return Array.from(byNote.values()).filter((entry) => Math.round(entry.minutes) > 0);
}

/** The stored outcome for a planned entry, matched on the service and note it was booked under. */
function findEntryStatus(status: SyncStatus | undefined, entry: PlannedEntry): SyncStatusEntry | undefined {
  return status?.entries.find((stored) => stored.serviceId === entry.serviceId && stored.note === entry.note);
}

/**
 * Entries that failed (or were never attempted) are included in the next sync; entries Productive
 * already accepted are left out, so a retry does not book them a second time.
 */
function defaultIncluded(status: SyncStatus | undefined, entry: PlannedEntry): boolean {
  return findEntryStatus(status, entry)?.status !== 'created';
}

/** One vocabulary for a tag's state: a labelled pill, never a bare icon. */
const STATUS_PILLS: Record<SyncStatusValue, { label: string; className: string }> = {
  synced: { label: 'Synced', className: 'is-synced' },
  partial: { label: 'Partial', className: 'is-partial' },
  failed: { label: 'Failed', className: 'is-failed' },
};

interface SyncRowItemProps {
  row: SyncRow;
  date: string;
  selection: RowSelection;
  plannedEntries: PlannedEntry[];
  status?: SyncStatus;
  includedKeys: Record<string, boolean>;
  expanded: boolean;
  onToggleExpanded: (tagNameId: string) => void;
  onToggleEntries: (keys: string[], included: boolean) => void;
  onChange: (tagNameId: string, selection: RowSelection) => void;
  onNoteChange: (entryKey: string, note: string) => void;
}

/** A checkbox drawn as a button, so the tick, the dash and the accent fill are ours to style. */
function CheckBox({
  checked,
  indeterminate = false,
  disabled = false,
  size,
  label,
  title,
  onToggle,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  size: 'row' | 'entry';
  label: string;
  title: string;
  onToggle: () => void;
}) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onToggle}
      className={`c-sync-check c-sync-check--${size}${on ? ' is-on' : ''}`}
    >
      {checked && <Check size={size === 'row' ? 12 : 10} strokeWidth={size === 'row' ? 3.5 : 4} />}
      {indeterminate && !checked && <span className="c-sync-check__dash" />}
    </button>
  );
}

function SyncRowItem({
  row,
  date,
  selection,
  plannedEntries,
  status,
  includedKeys,
  expanded,
  onToggleExpanded,
  onToggleEntries,
  onChange,
  onNoteChange,
}: SyncRowItemProps) {
  const includedCount = plannedEntries.filter((entry) => includedKeys[entry.key]).length;
  const allIncluded = plannedEntries.length > 0 && includedCount === plannedEntries.length;
  // A row whose entries disagree shows a dash rather than a tick, so "some of this tag is
  // queued" is not mistaken for "all of it is".
  const someIncluded = includedCount > 0 && !allIncluded;
  const canExpand = plannedEntries.length > 0;
  // A tag that failed is tinted for the whole card, so the eye lands on it before anything else.
  const hasFailure = status?.entries.some((entry) => entry.status === 'failed') ?? false;
  const pill = status ? STATUS_PILLS[status.status] : null;

  return (
    <div className={`c-sync-row${hasFailure ? ' has-failure' : ''}`}>
      <div className="c-sync-row__head">
        <CheckBox
          checked={allIncluded}
          indeterminate={someIncluded}
          disabled={plannedEntries.length === 0}
          size="row"
          label={`Include ${row.name} in the next sync`}
          title="Sync all entries for this tag"
          onToggle={() => onToggleEntries(plannedEntries.map((entry) => entry.key), !allIncluded)}
        />

        <div className="c-sync-row__chevron-cell">
          {canExpand && (
            <button
              type="button"
              className={`c-sync-row__chevron${expanded ? ' is-expanded' : ''}`}
              onClick={() => onToggleExpanded(row.tagNameId)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide entries' : 'Show entries'}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <div className="c-sync-row__identity">
          <div className="c-sync-row__name" title={row.name}>
            {row.name}
          </div>
          <div className="c-sync-row__meta">
            <span className="c-sync-row__duration">{formatMinutes(row.totalMinutes)}</span>
            {canExpand && (
              <>
                <span className="c-sync-row__dot">·</span>
                <span>
                  {plannedEntries.length} {plannedEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="c-sync-row__service">
          <ProductiveTimesheetDropdown
            date={date}
            value={selection.serviceId}
            valuePath={selection.path}
            valueParts={selection.parts}
            onChange={(picked) =>
              onChange(
                row.tagNameId,
                picked
                  ? {
                      companyId: picked.companyId,
                      dealId: picked.dealId,
                      serviceId: picked.serviceId,
                      path: picked.path,
                      parts: picked.parts,
                    }
                  : { ...EMPTY_SELECTION }
              )
            }
            placeholder="Not mapped — pick a service"
          />
        </div>

        <div className="c-sync-row__status">
          {pill && <span className={`c-sync-pill ${pill.className}`}>{pill.label}</span>}
        </div>
      </div>

      {expanded && (
        <ul className="c-sync-row__entries">
          {plannedEntries.map((entry) => {
            const entryStatus = findEntryStatus(status, entry);
            return (
              <li key={entry.key} className="c-sync-row__entry">
                <div className="c-sync-row__entry-line">
                  <CheckBox
                    checked={!!includedKeys[entry.key]}
                    size="entry"
                    label={`Include "${entry.note || 'No note'}" in the next sync`}
                    title="Sync this entry"
                    onToggle={() => onToggleEntries([entry.key], !includedKeys[entry.key])}
                  />
                  <span className="c-sync-row__entry-minutes">{formatMinutes(entry.minutes)}</span>
                  <input
                    type="text"
                    className="c-sync-row__entry-note"
                    value={entry.note}
                    title={entry.note || 'No note'}
                    placeholder="No note"
                    aria-label="Note booked to Productive"
                    onChange={(event) => onNoteChange(entry.key, event.target.value)}
                  />
                  {entryStatus && (
                    <span
                      className={`c-sync-row__entry-status${entryStatus.status === 'created' ? ' is-booked' : ' is-failed'}`}
                    >
                      {entryStatus.status === 'created' ? 'Booked' : 'Failed'}
                    </span>
                  )}
                </div>
                {entryStatus?.status === 'failed' && entryStatus.error && (
                  // Productive's reason is the most useful thing on screen after a failure, so it
                  // wraps in full instead of being truncated into a tooltip.
                  <div className="c-sync-row__entry-error">{entryStatus.error}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SyncToProductiveModal({
  open,
  onClose,
  date,
  timelineType,
  events,
  onSelectOutput,
}: SyncToProductiveModalProps) {
  const { outputs } = useSyncOutputs();
  const [selection, setSelection] = useState<Record<string, RowSelection>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  /** Per planned-entry inclusion in the next sync, keyed by `PlannedEntry.key`. */
  const [includedKeys, setIncludedKeys] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  /** Notes edited by hand in the accordion, keyed by `PlannedEntry.key`; these are what gets booked. */
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});
  /** Summary of the sync that just ran; only shown while something in it failed. */
  const [report, setReport] = useState<{ created: number; failed: number } | null>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: updateTagName } = useMutation({ ...tagNamesControllerUpdateMutation() });
  const { mutateAsync: updateTag } = useMutation({ ...tagsControllerUpdateMutation() });

  // Fetch tag names fresh so prefill reads the current `code`, not the
  // possibly-stale `tagNameCode` embedded in the (cached) timeline events.
  const { data: tagNames = [], isLoading: tagNamesLoading } = useQuery({
    ...tagNamesControllerFindAllOptions({ query: { term: '' } }),
    enabled: open,
  });

  // The outcome of the last sync for this day, so rows can show where they stand and default
  // their already-booked entries off.
  const { data: syncStatuses = [], isLoading: syncStatusesLoading } = useQuery({
    queryKey: ['productive', 'sync-status', date],
    queryFn: () => productiveApi.getSyncStatuses(date),
    enabled: open,
  });

  const statusByTagNameId = useMemo(() => {
    const map = new Map<string, SyncStatus>();
    for (const status of syncStatuses) map.set(status.tagNameId, status);
    return map;
  }, [syncStatuses]);

  const rows = useMemo(() => buildRows(events), [events]);

  const plannedByTagNameId = useMemo(() => {
    const map = new Map<string, PlannedEntry[]>();
    for (const row of rows) {
      const entries = buildPlannedEntries(row, selection[row.tagNameId]?.serviceId ?? '').map((entry) =>
        // The key keeps the note the entry was grouped under, so an edit renames what is booked
        // without splitting the entry or losing its tick.
        entry.key in noteOverrides ? { ...entry, note: noteOverrides[entry.key] } : entry
      );
      map.set(row.tagNameId, entries);
    }
    return map;
  }, [rows, selection, noteOverrides]);

  const codeByTagNameId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const tagName of tagNames) {
      if (tagName.id) map.set(tagName.id, tagName.code ?? null);
    }
    return map;
  }, [tagNames]);

  // Prefill each row's service from its stored code, once per modal opening and
  // only after the fresh tag names have loaded. The dropdown resolves the id to
  // a readable company → project → budget → service path once its tree loads.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!open) {
      prefilledRef.current = false;
      return;
    }
    // Wait for the stored statuses too: the inclusion defaults below depend on them, and
    // prefilling before they land would queue up entries that are already booked.
    if (prefilledRef.current || tagNamesLoading || syncStatusesLoading) return;
    setSelection(() => {
      const next: Record<string, RowSelection> = {};
      for (const row of rows) {
        const code = codeByTagNameId.get(row.tagNameId) ?? row.code ?? null;
        next[row.tagNameId] = parseCode(code);
      }

      return next;
    });
    setExpandedRows({});
    setNoteOverrides({});
    setReport(null);
    prefilledRef.current = true;
  }, [open, tagNamesLoading, syncStatusesLoading, rows, codeByTagNameId]);

  // Seed the inclusion state for entries that do not have one yet — on first prefill, and again
  // whenever picking a different service introduces new entries. Choices already made by hand
  // are left alone.
  useEffect(() => {
    if (!open || !prefilledRef.current) return;
    setIncludedKeys((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [tagNameId, entries] of plannedByTagNameId) {
        const status = statusByTagNameId.get(tagNameId);
        for (const entry of entries) {
          if (entry.key in next) continue;
          next[entry.key] = defaultIncluded(status, entry);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [open, plannedByTagNameId, statusByTagNameId]);

  const handleToggleEntries = (keys: string[], included: boolean) => {
    setIncludedKeys((prev) => {
      const next = { ...prev };
      for (const key of keys) next[key] = included;
      return next;
    });
  };

  const handleToggleExpanded = (tagNameId: string) => {
    setExpandedRows((prev) => ({ ...prev, [tagNameId]: !prev[tagNameId] }));
  };

  const handleNoteChange = (entryKey: string, note: string) => {
    setNoteOverrides((prev) => ({ ...prev, [entryKey]: note }));
  };

  const handleRowChange = (tagNameId: string, rowSelection: RowSelection) => {
    setSelection((prev) => ({ ...prev, [tagNameId]: rowSelection }));
  };

  // Only entries that are both mapped to a service and ticked will be sent.
  const queuedEntries = useMemo(
    () =>
      Array.from(plannedByTagNameId.values())
        .flat()
        .filter((entry) => includedKeys[entry.key]),
    [plannedByTagNameId, includedKeys]
  );

  const canSync = queuedEntries.length > 0;

  const selectedMinutes = useMemo(
    () => queuedEntries.reduce((total, entry) => total + entry.minutes, 0),
    [queuedEntries]
  );

  const allEntries = useMemo(() => Array.from(plannedByTagNameId.values()).flat(), [plannedByTagNameId]);

  // "Select all" flips to "Deselect all" once everything mappable is already ticked.
  const allSelected = allEntries.length > 0 && queuedEntries.length === allEntries.length;
  const anyExpanded = rows.some((row) => expandedRows[row.tagNameId]);

  // Only offered once a sync has actually left failures behind to re-target.
  const failedEntryKeys = useMemo(
    () =>
      allEntries
        .filter((entry) => findEntryStatus(statusByTagNameId.get(entry.tagNameId), entry)?.status === 'failed')
        .map((entry) => entry.key),
    [allEntries, statusByTagNameId]
  );

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    for (const entry of allEntries) next[entry.key] = !allSelected;
    setIncludedKeys((prev) => ({ ...prev, ...next }));
  };

  const handleSelectFailed = () => {
    const failed = new Set(failedEntryKeys);
    const next: Record<string, boolean> = {};
    for (const entry of allEntries) next[entry.key] = failed.has(entry.key);
    setIncludedKeys((prev) => ({ ...prev, ...next }));
  };

  const handleToggleAllExpanded = () => {
    const next: Record<string, boolean> = {};
    for (const row of rows) next[row.tagNameId] = !anyExpanded;
    setExpandedRows(next);
  };

  const selectionSummary =
    queuedEntries.length === 0
      ? 'Nothing selected'
      : `${queuedEntries.length} ${queuedEntries.length === 1 ? 'entry' : 'entries'} selected · ${formatMinutes(selectedMinutes)}`;

  const footerNote = report
    ? 'Fix the mapping on a failed tag and sync again — booked entries are already unticked.'
    : canSync
      ? `Will book ${formatMinutes(selectedMinutes)} to Productive`
      : 'Tick at least one entry to sync';


  const handleSync = async () => {
    setIsSyncing(true);
    setReport(null);
    try {
      const entries = queuedEntries.map((entry) => ({
        id: entry.key,
        serviceId: entry.serviceId,
        minutes: Math.round(entry.minutes),
        note: entry.note || undefined,
        tagNameIds: [entry.tagNameId],
      }));

      const result = await productiveApi.sync({ date, entries });

      // Notes rewritten in the accordion are the user's correction to what they did, not just to
      // what Productive is told, so write them back onto the tag events they were collapsed from.
      // Only manual tags carry a note of their own; auto tag events have nothing to write to.
      if (timelineType === TimelineType.Tag) {
        const edits = rows
          .flatMap((row) => buildPlannedEntries(row, selection[row.tagNameId]?.serviceId ?? ''))
          .filter((entry) => entry.key in noteOverrides && noteOverrides[entry.key] !== entry.note);

        await Promise.all(
          edits.flatMap((entry) =>
            entry.eventIds.map((eventId) =>
              updateTag({ path: { id: eventId }, body: { note: noteOverrides[entry.key] } })
            )
          )
        );

        if (edits.length > 0) {
          await queryClient.invalidateQueries({
            predicate: (query) =>
              (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
          });
        }
      }

      // Persist the chosen company/deal/service back onto the tag name's code so
      // future syncs resolve automatically. Rows left unmapped get the
      // do-not-sync sentinel so they are never re-prefilled.
      await Promise.all(
        rows
          .filter((row) => {
            const sel = selection[row.tagNameId];
            const storedCode = codeByTagNameId.get(row.tagNameId) ?? row.code ?? null;
            if (sel?.serviceId) return encodeCode(sel) !== storedCode;
            return !isDoNotSyncCode(storedCode);
          })
          .map((row) => {
            const sel = selection[row.tagNameId];
            const code = sel?.serviceId ? encodeCode(sel) : DO_NOT_SYNC_CODE;
            return updateTagName({ path: { id: row.tagNameId }, body: { code } });
          })
      );

      // Drop the cached tag names so the next opening prefills from the codes
      // just written instead of the pre-sync snapshot.
      await queryClient.invalidateQueries({ queryKey: tagNamesControllerFindAllOptions({ query: { term: '' } }).queryKey });
      // Pull the statuses this sync just wrote so the icons and the accordions update in place.
      await queryClient.invalidateQueries({ queryKey: ['productive', 'sync-status', date] });

      // What landed is now booked, so untick it; what failed stays ticked for a retry.
      const statusById = new Map(result.results.map((entryResult) => [entryResult.id, entryResult.status]));
      setIncludedKeys((prev) => {
        const next = { ...prev };
        for (const [id, status] of statusById) next[id] = status !== 'created';
        return next;
      });

      if (result.failed === 0) {
        toast(`Synced ${result.created} time ${result.created === 1 ? 'entry' : 'entries'} to Productive`, {
          type: 'success',
        });
        onClose();
        return;
      }

      // Something was rejected: keep the modal open on the report instead of closing over it,
      // and open the tags that failed so the reason is visible without hunting for it.
      setReport({ created: result.created, failed: result.failed });
      const failedTagNameIds = new Set(
        queuedEntries
          .filter((entry) => statusById.get(entry.key) === 'failed')
          .map((entry) => entry.tagNameId)
      );
      setExpandedRows((prev) => {
        const next = { ...prev };
        for (const tagNameId of failedTagNameIds) next[tagNameId] = true;
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync to Productive';
      toast(message, { type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const itemLabel = timelineType === TimelineType.AutoTag ? 'auto tags' : 'tags';

  return (
    <Modal
      open={open}
      onClose={onClose}
      showCloseIcon={false}
      classNames={{
        overlay: 'c-sync-overlay',
        modalContainer: 'c-sync-modal-container',
        modal: 'c-sync-modal',
      }}
    >
      <header className="c-sync-header">
        <div className="c-sync-header__main">
          <div className="c-sync-header__title">
            <h3>Sync to</h3>
            <SyncOutputMenu
              outputs={outputs}
              selectedId={PRODUCTIVE_OUTPUT_ID}
              onSelect={onSelectOutput}
            />
          </div>
          <div className="c-sync-header__subtitle">
            {formatLongDate(date)} · {itemLabel} timeline
          </div>
        </div>
        <button type="button" className="c-sync-header__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </header>

      {report && (
        <div className="c-sync-report" role="status">
          <AlertTriangle size={18} />
          <div>
            <strong>
              {report.created} of {report.created + report.failed} entries booked — {report.failed} failed.
            </strong>{' '}
            <span>
              Failed entries stay ticked so you can fix the mapping and sync again — the ones that landed are
              unticked.
            </span>
          </div>
        </div>
      )}

      <div className="c-sync-toolbar">
        <div className="c-sync-toolbar__summary">{selectionSummary}</div>
        <div className="c-sync-toolbar__actions">
          <button type="button" className="c-sync-chip" onClick={handleSelectAll} disabled={allEntries.length === 0}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          {failedEntryKeys.length > 0 && (
            <button type="button" className="c-sync-chip is-danger" onClick={handleSelectFailed}>
              Only failed
            </button>
          )}
          <button
            type="button"
            className="c-sync-chip"
            onClick={handleToggleAllExpanded}
            disabled={allEntries.length === 0}
          >
            {anyExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="c-sync-rows">
        {rows.length === 0 && <p className="c-sync-empty">No {itemLabel} to sync for this day.</p>}

        {rows.map((row) => (
          <SyncRowItem
            key={row.tagNameId}
            row={row}
            date={date}
            selection={selection[row.tagNameId] ?? EMPTY_SELECTION}
            plannedEntries={plannedByTagNameId.get(row.tagNameId) ?? []}
            status={statusByTagNameId.get(row.tagNameId)}
            includedKeys={includedKeys}
            expanded={!!expandedRows[row.tagNameId]}
            onToggleExpanded={handleToggleExpanded}
            onToggleEntries={handleToggleEntries}
            onChange={handleRowChange}
            onNoteChange={handleNoteChange}
          />
        ))}
      </div>

      <footer className="c-sync-footer">
        <div className="c-sync-footer__note">{footerNote}</div>
        <button type="button" className="c-sync-button" onClick={onClose}>
          {report ? 'Close' : 'Cancel'}
        </button>
        <button
          type="button"
          className="c-sync-button is-primary"
          disabled={!canSync || isSyncing}
          onClick={handleSync}
        >
          {isSyncing && <span className="c-sync-spinner" />}
          {isSyncing ? 'Syncing…' : report ? 'Sync again' : 'Sync'}
        </button>
      </footer>
    </Modal>
  );
}
