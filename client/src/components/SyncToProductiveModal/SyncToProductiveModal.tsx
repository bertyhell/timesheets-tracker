import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import Select from 'react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import Button, { ButtonVariant } from '../Button/Button';
import { TimelineType } from '../Timeline/Timeline.types';
import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import {
  tagNamesControllerFindAllOptions,
  tagNamesControllerUpdateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import { productiveApi } from '../../api/productive';
import { ProductiveTimesheetDropdown } from '../ProductiveTimesheetDropdown/ProductiveTimesheetDropdown';
import { tagSelectStyles } from '../TagSelect/tagSelectStyles';

import './SyncToProductiveModal.css';

interface SyncToProductiveModalProps {
  open: boolean;
  onClose: () => void;
  date: string; // yyyy-MM-dd
  timelineType: TimelineDto['timelineType'];
  events: TimelineEventDto[];
}

interface EventInfoLike {
  tagNameId?: string;
  tagNameName?: string;
  tagNameTitle?: string;
  tagNameCode?: string | null;
  note?: string | null;
}

interface SyncRow {
  tagNameId: string;
  name: string;
  code: string | null;
  totalMinutes: number;
  events: { minutes: number; note: string }[];
}

interface RowSelection {
  companyId: string;
  dealId: string;
  serviceId: string;
}

const EMPTY_SELECTION: RowSelection = { companyId: '', dealId: '', serviceId: '' };

const OUTPUT_LOCATIONS = [{ value: 'productive', label: 'Productive' }];

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
 * `{ companyId, dealId, serviceId }`. Older codes held a raw service id string
 * or `{ serviceId, taskId }`, so fall back to whatever fields are present.
 */
function parseCode(code: string | null): RowSelection {
  if (!code) return { ...EMPTY_SELECTION };
  try {
    const parsed = JSON.parse(code) as Partial<Record<keyof RowSelection, unknown>>;
    if (parsed && typeof parsed === 'object') {
      return {
        companyId: parsed.companyId != null ? String(parsed.companyId) : '',
        dealId: parsed.dealId != null ? String(parsed.dealId) : '',
        serviceId: parsed.serviceId != null ? String(parsed.serviceId) : '',
      };
    }
  } catch {
    // legacy: code was a raw service id string
  }
  return { companyId: '', dealId: '', serviceId: code };
}

function encodeCode(selection: RowSelection): string {
  return JSON.stringify({
    companyId: selection.companyId,
    dealId: selection.dealId,
    serviceId: selection.serviceId,
  });
}

/** Group a timeline's tag/autotag events by tag name into rows for display. */
function buildRows(events: TimelineEventDto[]): SyncRow[] {
  const byTagName = new Map<string, SyncRow>();

  for (const event of events) {
    const info = event.info as EventInfoLike;
    const tagNameId = info.tagNameId;
    if (!tagNameId) continue;

    const name = info.tagNameName ?? info.tagNameTitle ?? 'Unnamed';
    const note = (info.note ?? '').trim();
    const minutes = eventMinutes(event);

    let row = byTagName.get(tagNameId);
    if (!row) {
      row = { tagNameId, name, code: info.tagNameCode ?? null, totalMinutes: 0, events: [] };
      byTagName.set(tagNameId, row);
    }
    row.totalMinutes += minutes;
    row.events.push({ minutes, note });
  }

  return Array.from(byTagName.values());
}

interface SyncRowItemProps {
  row: SyncRow;
  date: string;
  selection: RowSelection;
  onChange: (tagNameId: string, selection: RowSelection) => void;
}

function SyncRowItem({ row, date, selection, onChange }: SyncRowItemProps) {
  return (
    <div className="flex flex-row items-center gap-2 mt-2">
      <div className="flex-1 min-w-0">
        <div className="truncate" title={row.name}>
          {row.name}
        </div>
        <div className="text-sm text-gray-500">{formatMinutes(row.totalMinutes)}</div>
      </div>
      <div style={{ width: '60%', flex: 'none' }}>
        <ProductiveTimesheetDropdown
          date={date}
          value={selection.serviceId}
          onChange={(picked) =>
            onChange(
              row.tagNameId,
              picked
                ? { companyId: picked.companyId, dealId: picked.dealId, serviceId: picked.serviceId }
                : { ...EMPTY_SELECTION }
            )
          }
          placeholder="Do not sync"
        />
      </div>
    </div>
  );
}

export function SyncToProductiveModal({
  open,
  onClose,
  date,
  timelineType,
  events,
}: SyncToProductiveModalProps) {
  const [outputLocation, setOutputLocation] = useState(OUTPUT_LOCATIONS[0]);
  const [selection, setSelection] = useState<Record<string, RowSelection>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const { mutateAsync: updateTagName } = useMutation({ ...tagNamesControllerUpdateMutation() });

  // Fetch tag names fresh so prefill reads the current `code`, not the
  // possibly-stale `tagNameCode` embedded in the (cached) timeline events.
  const { data: tagNames = [], isLoading: tagNamesLoading } = useQuery({
    ...tagNamesControllerFindAllOptions({ query: { term: '' } }),
    enabled: open,
  });

  const rows = useMemo(() => buildRows(events), [events]);

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
    if (prefilledRef.current || tagNamesLoading) return;
    setSelection(() => {
      const next: Record<string, RowSelection> = {};
      for (const row of rows) {
        const code = codeByTagNameId.get(row.tagNameId) ?? row.code ?? null;
        next[row.tagNameId] = parseCode(code);
      }

      return next;
    });
    prefilledRef.current = true;
  }, [open, tagNamesLoading, rows, codeByTagNameId]);

  const handleRowChange = (tagNameId: string, rowSelection: RowSelection) => {
    setSelection((prev) => ({ ...prev, [tagNameId]: rowSelection }));
  };

  // A row is either mapped to a service or left on "Do not sync" and skipped.
  const canSync = rows.some((row) => !!selection[row.tagNameId]?.serviceId);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Group by (service + note): identical notes merge, different notes split.
      const byKey = new Map<string, { serviceId: string; note: string; minutes: number }>();
      for (const row of rows) {
        const serviceId = selection[row.tagNameId]?.serviceId;
        if (!serviceId) continue;
        for (const event of row.events) {
          const key = `${serviceId}||${event.note}`;
          const existing = byKey.get(key);
          if (existing) {
            existing.minutes += event.minutes;
          } else {
            byKey.set(key, { serviceId, note: event.note, minutes: event.minutes });
          }
        }
      }

      const entries = Array.from(byKey.values())
        .map((entry) => ({
          serviceId: entry.serviceId,
          minutes: Math.round(entry.minutes),
          note: entry.note || undefined,
        }))
        .filter((entry) => entry.minutes > 0);

      const result = await productiveApi.sync({ date, entries });

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

      toast(`Synced ${result.created} time ${result.created === 1 ? 'entry' : 'entries'} to Productive`, {
        type: 'success',
      });
      onClose();
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
      classNames={{ modal: 'c-sync-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Sync to output</h3>

      <div className="c-form">
        <h4 className="mt-4">Output location</h4>
        <Select
          options={OUTPUT_LOCATIONS}
          value={outputLocation}
          onChange={(option) => option && setOutputLocation(option)}
          styles={tagSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isSearchable={false}
        />

        <h4 className="mt-4">
          {itemLabel} for {date}
        </h4>

        {rows.length === 0 && <p>No {itemLabel} to sync for this day.</p>}

        {rows.map((row) => (
          <SyncRowItem
            key={row.tagNameId}
            row={row}
            date={date}
            selection={selection[row.tagNameId] ?? EMPTY_SELECTION}
            onChange={handleRowChange}
          />
        ))}
      </div>

      <div className="flex flex-row justify-end gap-2 mt-48">
        <Button onClick={onClose} variant={ButtonVariant.Secondary}>
          Cancel
        </Button>
        <Button disabled={!canSync || isSyncing} onClick={handleSync} variant={ButtonVariant.Primary}>
          {isSyncing ? 'Syncing…' : 'Sync'}
        </Button>
      </div>
    </Modal>
  );
}
