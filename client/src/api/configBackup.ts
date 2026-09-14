/**
 * Exports and imports everything the manage screens edit — timelines, tag names, auto tag rules
 * and auto notes — as a single JSON document.
 *
 * The four resources are exported together because they reference each other: an auto tag points
 * at a tag name, an auto note at a list of them. Ids are machine-local, so on import every
 * reference is re-resolved by tag name title against the target database, which is what makes a
 * backup portable between machines.
 */

import { mapLimit } from 'blend-promise-utils';
import {
  autoNotesControllerCreate,
  autoNotesControllerFindAll,
  autoNotesControllerUpdate,
  autoTagsControllerCreate,
  autoTagsControllerFindAll,
  autoTagsControllerUpdate,
  tagNamesControllerCreate,
  tagNamesControllerFindAll,
  tagNamesControllerUpdate,
  timelinesControllerCreate,
  timelinesControllerFindAll,
  timelinesControllerUpdate,
} from '../generated/api/sdk.gen';
import type {
  AutoNoteDto,
  AutoTagConditionDto,
  AutoTagDto,
  TagNameDto,
  TimelineDto,
} from '../generated/api/types.gen';

/** Wrapper key, also what identifies a file as one of ours. */
export const CONFIG_BACKUP_KEY = 'timesheetTrackerConfig';

/** Bumped only when the shape changes in a way an older import cannot read. */
export const CONFIG_BACKUP_VERSION = 1;

/**
 * The key the auto tags page has always used for its copy/paste exchange format. Import still
 * accepts that shape so links shared before this existed keep working.
 */
const LEGACY_AUTO_TAGS_KEY = 'timesheetTrackerAutoTags';

/** How many writes are in flight at once, matching the existing auto tag paste import. */
const IMPORT_CONCURRENCY = 5;

export interface ExportedTagName {
  id: string;
  title: string;
  code?: string;
  color?: string;
  note?: string;
  canGrow?: boolean;
}

export interface ExportedTimeline {
  id: string;
  title: string;
  timelineType: TimelineDto['timelineType'];
  eventProviderInfo: Record<string, unknown> | null;
  visualOrder: number;
  color?: string | null;
}

export interface ExportedAutoTag {
  id: string;
  title: string;
  tagNameId: string;
  priority: number;
  conditions: AutoTagConditionDto[];
  activeFrom?: string | null;
  activeUntil?: string | null;
}

export interface ExportedAutoNote {
  id: string;
  title: string;
  tagNameIds: string[];
  variable: string;
  extractRegex?: string;
  extractRegexReplacement?: string;
}

export interface ConfigBackup {
  version: number;
  exportedAt: string;
  tagNames: ExportedTagName[];
  timelines: ExportedTimeline[];
  autoTags: ExportedAutoTag[];
  autoNotes: ExportedAutoNote[];
}

export type ConfigBackupFile = { [CONFIG_BACKUP_KEY]: ConfigBackup };

export interface ImportCounts {
  created: number;
  updated: number;
  skipped: number;
}

export interface ImportResult {
  tagNames: ImportCounts;
  timelines: ImportCounts;
  autoTags: ImportCounts;
  autoNotes: ImportCounts;
  /** Records that could not be imported, one human readable line each. */
  warnings: string[];
}

/** The generated client reports failures in the result rather than throwing, so unpack both. */
async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown }>,
  what: string
): Promise<T> {
  const { data, error } = await request;
  if (error !== undefined || data === undefined) {
    throw new Error(`${what} failed: ${error ? JSON.stringify(error) : 'empty response'}`);
  }
  return data;
}

/** Same, for the update endpoints, which answer with an empty body. */
async function ensureOk(request: Promise<{ error?: unknown }>, what: string): Promise<void> {
  const { error } = await request;
  if (error !== undefined) {
    throw new Error(`${what} failed: ${JSON.stringify(error)}`);
  }
}

/** Titles are what records are matched on, so compare them the way a human would. */
function titleKey(title: string | undefined | null): string {
  return (title ?? '').trim().toLowerCase();
}

function indexByTitle<T extends { title?: string }>(items: T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    const key = titleKey(item.title);
    // First one wins: a database with two identically titled records keeps the older of the two.
    if (key && !index.has(key)) index.set(key, item);
  }
  return index;
}

function emptyCounts(): ImportCounts {
  return { created: 0, updated: 0, skipped: 0 };
}

export async function fetchConfigBackup(): Promise<ConfigBackup> {
  const [tagNames, timelines, autoTags, autoNotes] = await Promise.all([
    unwrap(tagNamesControllerFindAll(), 'Reading tag names'),
    unwrap(timelinesControllerFindAll(), 'Reading timelines'),
    unwrap(autoTagsControllerFindAll(), 'Reading auto tags'),
    unwrap(autoNotesControllerFindAll(), 'Reading auto notes'),
  ]);

  return {
    version: CONFIG_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // Ids are kept because they are what ties auto tags and auto notes to their tag name inside
    // the file. Server-managed fields (timestamps, the joined tagName object) are dropped.
    tagNames: (tagNames as TagNameDto[]).map((tagName) => ({
      id: tagName.id ?? '',
      title: tagName.title ?? '',
      code: tagName.code,
      color: tagName.color,
      note: tagName.note,
      canGrow: tagName.canGrow,
    })),
    timelines: (timelines as TimelineDto[]).map((timeline) => ({
      id: timeline.id,
      title: timeline.title,
      timelineType: timeline.timelineType,
      eventProviderInfo: (timeline.eventProviderInfo as Record<string, unknown> | null) ?? null,
      visualOrder: timeline.visualOrder,
      color: timeline.color ?? null,
    })),
    autoTags: (autoTags as AutoTagDto[]).map((autoTag) => ({
      id: autoTag.id,
      title: autoTag.title,
      tagNameId: autoTag.tagNameId,
      priority: autoTag.priority,
      conditions: autoTag.conditions,
      activeFrom: autoTag.activeFrom ?? null,
      activeUntil: autoTag.activeUntil ?? null,
    })),
    autoNotes: (autoNotes as AutoNoteDto[]).map((autoNote) => ({
      id: autoNote.id,
      title: autoNote.title,
      tagNameIds: autoNote.tagNameIds ?? [],
      variable: autoNote.variable,
      extractRegex: autoNote.extractRegex,
      extractRegexReplacement: autoNote.extractRegexReplacement,
    })),
  };
}

/** Serialises a backup into the exact text that lands in the file. */
export function serializeConfigBackup(backup: ConfigBackup): string {
  return JSON.stringify({ [CONFIG_BACKUP_KEY]: backup } as ConfigBackupFile, null, 2);
}

/**
 * Reads a file back into a backup, throwing with a readable reason when it is not one of ours.
 * Also accepts the older auto-tags-only clipboard format.
 */
export function parseConfigBackup(text: string): ConfigBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('That file does not contain a Timesheet Tracker configuration');
  }
  const root = parsed as Record<string, unknown>;

  if (Array.isArray(root[LEGACY_AUTO_TAGS_KEY])) {
    return {
      version: CONFIG_BACKUP_VERSION,
      exportedAt: '',
      tagNames: [],
      timelines: [],
      autoTags: root[LEGACY_AUTO_TAGS_KEY] as ExportedAutoTag[],
      autoNotes: [],
    };
  }

  const backup = root[CONFIG_BACKUP_KEY] as ConfigBackup | undefined;
  if (!backup || typeof backup !== 'object') {
    throw new Error('That file does not contain a Timesheet Tracker configuration');
  }
  if (backup.version > CONFIG_BACKUP_VERSION) {
    throw new Error(
      `That file was written by a newer version of Timesheet Tracker (format ${backup.version})`
    );
  }

  return {
    version: backup.version ?? CONFIG_BACKUP_VERSION,
    exportedAt: backup.exportedAt ?? '',
    tagNames: Array.isArray(backup.tagNames) ? backup.tagNames : [],
    timelines: Array.isArray(backup.timelines) ? backup.timelines : [],
    autoTags: Array.isArray(backup.autoTags) ? backup.autoTags : [],
    autoNotes: Array.isArray(backup.autoNotes) ? backup.autoNotes : [],
  };
}

/** Total number of records a backup would touch, for the confirmation step. */
export function countConfigBackup(backup: ConfigBackup): number {
  return (
    backup.tagNames.length +
    backup.timelines.length +
    backup.autoTags.length +
    backup.autoNotes.length
  );
}

/**
 * Writes a backup into the current database. Records are matched to existing ones by title:
 * a match is updated in place, anything else is created.
 */
export async function importConfigBackup(backup: ConfigBackup): Promise<ImportResult> {
  const result: ImportResult = {
    tagNames: emptyCounts(),
    timelines: emptyCounts(),
    autoTags: emptyCounts(),
    autoNotes: emptyCounts(),
    warnings: [],
  };

  // Tag names go first and in one pass: auto tags and auto notes need the finished id mapping,
  // and a rule may well point at a tag name this very import is creating.
  const existingTagNames = (await unwrap(
    tagNamesControllerFindAll(),
    'Reading tag names'
  )) as TagNameDto[];
  const tagNamesByTitle = indexByTitle(existingTagNames);

  /** Id as written in the file -> id in this database. */
  const tagNameIds = new Map<string, string>();
  for (const tagName of existingTagNames) {
    // Same database as the export: ids line up already, so references survive untouched.
    if (tagName.id) tagNameIds.set(tagName.id, tagName.id);
  }

  for (const imported of backup.tagNames) {
    const body = {
      title: imported.title,
      code: imported.code ?? '',
      color: imported.color ?? '',
      note: imported.note,
      canGrow: imported.canGrow ?? true,
    };
    const existing = tagNamesByTitle.get(titleKey(imported.title));

    if (existing?.id) {
      await ensureOk(
        tagNamesControllerUpdate({ path: { id: existing.id }, body }),
        `Updating tag name "${imported.title}"`
      );
      tagNameIds.set(imported.id, existing.id);
      result.tagNames.updated++;
    } else {
      const created = await unwrap(
        tagNamesControllerCreate({ body }),
        `Creating tag name "${imported.title}"`
      );
      if (created.id) {
        tagNameIds.set(imported.id, created.id);
        tagNamesByTitle.set(titleKey(imported.title), created);
      }
      result.tagNames.created++;
    }
  }

  const existingTimelines = (await unwrap(
    timelinesControllerFindAll(),
    'Reading timelines'
  )) as TimelineDto[];
  const timelinesByTitle = indexByTitle(existingTimelines);

  await mapLimit(backup.timelines, IMPORT_CONCURRENCY, async (imported: ExportedTimeline) => {
    const body = {
      title: imported.title,
      timelineType: imported.timelineType,
      visualOrder: imported.visualOrder,
      color: imported.color ?? null,
    };
    const existing = timelinesByTitle.get(titleKey(imported.title));

    if (existing) {
      await ensureOk(
        // Only the timeline types that fetch from somewhere carry provider info. Sending `{}` for
        // the ones that do not would replace a stored null with an empty object for no reason, so
        // the field is left out entirely unless the file actually has something to put there.
        timelinesControllerUpdate({
          path: { id: existing.id },
          body: imported.eventProviderInfo
            ? { ...body, eventProviderInfo: imported.eventProviderInfo }
            : body,
        }),
        `Updating timeline "${imported.title}"`
      );
      result.timelines.updated++;
    } else {
      await unwrap(
        timelinesControllerCreate({
          body: { ...body, eventProviderInfo: imported.eventProviderInfo ?? {} },
        }),
        `Creating timeline "${imported.title}"`
      );
      result.timelines.created++;
    }
  });

  const existingAutoTags = (await unwrap(
    autoTagsControllerFindAll(),
    'Reading auto tags'
  )) as AutoTagDto[];
  const autoTagsByTitle = indexByTitle(existingAutoTags);

  await mapLimit(backup.autoTags, IMPORT_CONCURRENCY, async (imported: ExportedAutoTag) => {
    const tagNameId = tagNameIds.get(imported.tagNameId);
    if (!tagNameId) {
      // Without a tag name the rule has nothing to apply, so it is left out rather than created
      // pointing at an id that does not exist here.
      result.autoTags.skipped++;
      result.warnings.push(
        `Auto tag "${imported.title}" was skipped: its tag name is not in this file or database`
      );
      return;
    }

    const body = {
      title: imported.title,
      tagNameId,
      priority: imported.priority,
      conditions: imported.conditions,
      activeFrom: imported.activeFrom ?? null,
      activeUntil: imported.activeUntil ?? null,
    };
    const existing = autoTagsByTitle.get(titleKey(imported.title));

    if (existing) {
      await ensureOk(
        autoTagsControllerUpdate({ path: { id: existing.id }, body }),
        `Updating auto tag "${imported.title}"`
      );
      result.autoTags.updated++;
    } else {
      await unwrap(autoTagsControllerCreate({ body }), `Creating auto tag "${imported.title}"`);
      result.autoTags.created++;
    }
  });

  const existingAutoNotes = (await unwrap(
    autoNotesControllerFindAll(),
    'Reading auto notes'
  )) as AutoNoteDto[];
  const autoNotesByTitle = indexByTitle(existingAutoNotes);

  await mapLimit(backup.autoNotes, IMPORT_CONCURRENCY, async (imported: ExportedAutoNote) => {
    const importedTagNameIds = imported.tagNameIds ?? [];
    const tagNameIdsForNote = importedTagNameIds
      .map((id) => tagNameIds.get(id))
      .filter((id): id is string => Boolean(id));

    // An empty list means "applies to every tag", so a note that loses all of its tag names would
    // silently widen rather than narrow. Leave it out and say so instead.
    if (importedTagNameIds.length > 0 && tagNameIdsForNote.length === 0) {
      result.autoNotes.skipped++;
      result.warnings.push(
        `Auto note "${imported.title}" was skipped: none of its tag names are in this file or database`
      );
      return;
    }
    if (tagNameIdsForNote.length < importedTagNameIds.length) {
      result.warnings.push(
        `Auto note "${imported.title}" lost ${importedTagNameIds.length - tagNameIdsForNote.length} tag name reference(s) that are not in this file or database`
      );
    }

    const body = {
      title: imported.title,
      tagNameIds: tagNameIdsForNote,
      variable: imported.variable,
      extractRegex: imported.extractRegex ?? '',
      extractRegexReplacement: imported.extractRegexReplacement ?? '',
    };
    const existing = autoNotesByTitle.get(titleKey(imported.title));

    if (existing) {
      await ensureOk(
        autoNotesControllerUpdate({ path: { id: existing.id }, body }),
        `Updating auto note "${imported.title}"`
      );
      result.autoNotes.updated++;
    } else {
      await unwrap(autoNotesControllerCreate({ body }), `Creating auto note "${imported.title}"`);
      result.autoNotes.created++;
    }
  });

  return result;
}
