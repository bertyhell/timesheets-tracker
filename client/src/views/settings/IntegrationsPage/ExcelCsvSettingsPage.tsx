import React, { useEffect, useState } from 'react';
import './ExcelCsvSettingsPage.css';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { GripHandle } from '../../../components/GripHandle/GripHandle';
import { FormatSelect } from '../../../components/FormatSelect/FormatSelect';
import { integrationsApi } from '../../../api/integrations';
import { csvExportApi, type CsvExportColumnPayload } from '../../../api/csvExport';
import { CsvColumnValue, CsvDelimiter } from '../../../types/types';
import {
  CSV_COLUMN_VALUE_OPTIONS,
  CSV_DELIMITER_OPTIONS,
  defaultFormatForValue,
  formatOptionsForValue,
} from '../../../helpers/csv-column-options';

const INTEGRATION_TYPE = 'excel-csv';

/** A column being edited. `id` is empty until the backend mints one on save. */
type DraftColumn = CsvExportColumnPayload & { key: string };

let draftKeySeed = 0;
const newDraftColumn = (): DraftColumn => ({
  key: 'draft-' + ++draftKeySeed,
  id: '',
  header: '',
  value: CsvColumnValue.TagName,
  format: defaultFormatForValue(CsvColumnValue.TagName),
  staticText: '',
});

/** What a fresh integration starts with, so the first export produces something usable. */
const STARTER_COLUMNS: Omit<DraftColumn, 'key'>[] = [
  { id: '', header: 'Date', value: CsvColumnValue.Date, format: defaultFormatForValue(CsvColumnValue.Date), staticText: '' },
  { id: '', header: 'Task', value: CsvColumnValue.TagName, format: '', staticText: '' },
  { id: '', header: 'Hours', value: CsvColumnValue.Duration, format: defaultFormatForValue(CsvColumnValue.Duration), staticText: '' },
  { id: '', header: 'Notes', value: CsvColumnValue.Notes, format: '', staticText: '' },
];

function SortableColumnRow({
  column,
  columns,
  activeKey,
  overKey,
  onChange,
  onDelete,
}: {
  column: DraftColumn;
  columns: DraftColumn[];
  activeKey: string | null;
  overKey: string | null;
  onChange: (patch: Partial<DraftColumn>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: column.key });
  const formatOptions = formatOptionsForValue(column.value);
  const isStaticText = column.value === CsvColumnValue.StaticText;

  // Same drop indicator as the timelines and auto-tag lists: a purple rule on the edge the row
  // being dragged would land against, so the destination is visible before letting go.
  const activeIndex = columns.findIndex((c) => c.key === activeKey);
  const overIndex = columns.findIndex((c) => c.key === overKey);
  const isOver = overKey === column.key && activeKey !== column.key;
  const showBorderTop = isOver && activeIndex > overIndex;
  const showBorderBottom = isOver && activeIndex < overIndex;

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={[
        'p-excel-csv-settings__row',
        'p-excel-csv-settings__grid',
        showBorderTop ? 'drag-drop-border-top' : '',
        showBorderBottom ? 'drag-drop-border-bottom' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="p-excel-csv-settings__grip" {...attributes} {...listeners}>
        <GripHandle />
      </span>

      <input
        className="c-input"
        placeholder="Column name"
        value={column.header}
        onChange={(e) => onChange({ header: e.target.value })}
      />

      <select
        className="c-input"
        value={column.value}
        onChange={(e) => {
          const value = e.target.value as CsvColumnValue;
          // The old format belongs to another family, so it is reset rather than carried over.
          onChange({ value, format: defaultFormatForValue(value) });
        }}
      >
        {CSV_COLUMN_VALUE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isStaticText ? (
        <input
          className="c-input"
          placeholder="Text for every row"
          value={column.staticText}
          onChange={(e) => onChange({ staticText: e.target.value })}
        />
      ) : (
        <FormatSelect
          options={formatOptions}
          value={column.format}
          onChange={(format) => onChange({ format })}
        />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="p-excel-csv-settings__delete"
          onClick={onDelete}
          title="Remove column"
          aria-label="Remove column"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export function ExcelCsvSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [columns, setColumns] = useState<DraftColumn[]>([]);
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(CsvDelimiter.Comma);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [fileNamePattern, setFileNamePattern] = useState('timesheet-{date}');

  const { data: existing, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['integrations', INTEGRATION_TYPE],
    queryFn: () => integrationsApi.findOne(INTEGRATION_TYPE),
  });

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['csv-export-config'],
    queryFn: () => csvExportApi.getConfig(),
  });

  useEffect(() => {
    if (!config) return;
    setDelimiter(config.delimiter);
    setIncludeHeader(config.includeHeader);
    setFileNamePattern(config.fileNamePattern);
    setColumns(
      config.columns.length
        ? config.columns.map((column) => ({ ...column, key: column.id }))
        : STARTER_COLUMNS.map((column, index) => ({ ...column, key: 'starter-' + index }))
    );
  }, [config]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Tracked only to draw the drop indicator; the reorder itself happens on drag end.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const handleDragStart = ({ active }: DragStartEvent) => setActiveKey(String(active.id));
  const handleDragOver = ({ over }: DragOverEvent) => setOverKey(over ? String(over.id) : null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveKey(null);
    setOverKey(null);
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((column) => column.key === active.id);
    const newIndex = columns.findIndex((column) => column.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setColumns(arrayMove(columns, oldIndex, newIndex));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // The integrations row carries no credentials here — it exists so the Integrations screen
      // can list, edit and remove this the same way as Productive and Jira.
      if (!existing) {
        await integrationsApi.upsert(INTEGRATION_TYPE, {
          baseUrl: '',
          organisationId: '',
          userId: '',
          token: '',
        });
      }
      return csvExportApi.saveConfig({
        delimiter,
        includeHeader,
        fileNamePattern,
        // A column with no name would produce a nameless spreadsheet column, so blanks are dropped
        // rather than saved.
        columns: columns
          .filter((column) => column.header.trim())
          .map(({ key: _key, ...column }) => column),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', INTEGRATION_TYPE] });
      queryClient.invalidateQueries({ queryKey: ['csv-export-config'] });
      toast('Integration saved', { type: 'success' });
      navigate('/settings/integrations');
    },
    onError: () => toast('Failed to save integration', { type: 'error' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoadingIntegration || isLoadingConfig) return null;

  return (
    <div className="p-excel-csv-settings">
      <PageHeader
        title="Excel CSV"
        description="Export your tagged time to a CSV file, with the columns your timesheet expects."
      />

      {/* Wider than the other integration forms: the column table holds four fields per row,
          and the format examples are the point of showing them. */}
      <div className="px-6 mt-4 max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Delimiter</label>
              <select
                className="c-input w-full"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as CsvDelimiter)}
              >
                {CSV_DELIMITER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 mt-1" style={{ fontSize: '0.8em' }}>
                Excel takes its separator from your system settings, not from the file. If every row
                opens in a single column, switch to semicolon.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File name</label>
              <input
                className="c-input w-full"
                value={fileNamePattern}
                placeholder="timesheet-{date}"
                onChange={(e) => setFileNamePattern(e.target.value)}
              />
              <p className="text-gray-500 mt-1" style={{ fontSize: '0.8em' }}>
                {'{date}'} is replaced by the exported day.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
              />
              Write the column names as a first row
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">Columns</label>
              <div className="p-excel-csv-settings__columns">
                <div className="p-excel-csv-settings__header p-excel-csv-settings__grid">
                  <span />
                  <span>Column name</span>
                  <span>Value</span>
                  <span>Format</span>
                  <span />
                </div>

                {columns.length === 0 && (
                  <div className="p-excel-csv-settings__empty">
                    No columns yet — add one to describe your file.
                  </div>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={columns.map((column) => column.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columns.map((column, index) => (
                      <SortableColumnRow
                        key={column.key}
                        column={column}
                        columns={columns}
                        activeKey={activeKey}
                        overKey={overKey}
                        onChange={(patch) =>
                          setColumns((prev) =>
                            prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
                          )
                        }
                        onDelete={() =>
                          setColumns((prev) => prev.filter((_, i) => i !== index))
                        }
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <button
                  type="button"
                  className="p-excel-csv-settings__add"
                  onClick={() => setColumns((prev) => [...prev, newDraftColumn()])}
                >
                  <Plus size={14} />
                  Add column
                </button>
              </div>
              <p className="text-gray-500 mt-1" style={{ fontSize: '0.8em' }}>
                Drag the columns into the order you want them in the file. One row is exported per
                tag per day.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant={ButtonVariant.Primary} type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              type="button"
              onClick={() => navigate('/settings/integrations')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
