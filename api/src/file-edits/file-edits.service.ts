import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/database.service';
import { TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';
import { isNoisePath } from './helpers/is-noise-path';
import { findLocalHistoryStores } from './helpers/local-history-stores';
import { parseLocalHistory, RawFileEdit } from './helpers/local-history-parser';
import { mergeFileEdits } from './helpers/merge-file-edits';
import { createRepoNameResolver } from './helpers/resolve-repo-name';

/** Bumping the suffix retires caches written by an older mapping instead of replaying them. */
const CACHE_KEY_PREFIX = 'file-edits-';
const CACHE_KEY_VERSION = 'v2';

const MERGE_GAP_MINUTES = 5;
const MIN_EVENT_DURATION_MS = 60 * 1000;

/** A merged block of time spent in one file, as cached and as rendered. */
interface FileEditSessionDto {
  startedAt: string;
  endedAt: string;
  fileName: string;
  /** Relative to the repository root — the absolute path is noise in the UI. */
  filePath: string;
  repoName: string;
  fileExtension: string;
  editCount: number;
}

@Injectable()
export class FileEditsService {
  private readonly logger = new Logger(FileEditsService.name);

  /**
   * The parsed result of the last scan, keyed by the identity of the stores it was built from.
   * Reading and parsing ~18MB costs around 120ms, which is cheap but not free when several
   * timelines refresh at once, and today's events can never be served from the day cache.
   */
  private scanCache: { key: string; sessionsByDay: Map<string, FileEditSessionDto[]> } | null =
    null;

  /** Stale-version caches are dropped once per process, on the first scan that needs the db. */
  private hasPrunedStaleCaches = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /** Drops the in-process scan, so the next request re-reads the stores from disk. */
  clearScanCache(): void {
    this.scanCache = null;
  }

  async getEventsForRange(
    startedAt: string,
    endedAt: string,
    timelineId: string,
    clearCache = false
  ): Promise<TimelineEventDto[]> {
    const dayKeys = this.getDayKeysInRange(startedAt, endedAt);

    const sessionsByDay = new Map<string, FileEditSessionDto[]>();
    const missingDays: string[] = [];

    for (const dayKey of dayKeys) {
      const cached = clearCache ? null : this.readDayCache(dayKey);
      if (cached) {
        sessionsByDay.set(dayKey, cached);
      } else {
        missingDays.push(dayKey);
      }
    }

    if (missingDays.length) {
      // One scan fills every missing day at once: the stores are global, so slicing the work per
      // day would re-read the same files over and over.
      const scanned = this.scanStores(clearCache);
      const todayKey = this.toDayKey(new Date());

      for (const dayKey of missingDays) {
        const sessions = scanned.get(dayKey) ?? [];
        sessionsByDay.set(dayKey, sessions);

        // A past day can no longer change, so its result is cached for good — including when it
        // is empty, which is what stops a quiet day from being rescanned forever.
        if (dayKey < todayKey) {
          this.writeDayCache(dayKey, sessions);
        }
      }
    }

    const rangeStart = new Date(startedAt).getTime();
    const rangeEnd = new Date(endedAt).getTime();

    return [...sessionsByDay.values()]
      .flat()
      .filter((session) => {
        // Sessions are bucketed by the day they start on, so one running over midnight must still
        // be included when only the day it ends on is in view.
        const sessionStart = new Date(session.startedAt).getTime();
        const sessionEnd = new Date(session.endedAt).getTime();
        return sessionStart < rangeEnd && sessionEnd > rangeStart;
      })
      .map(
        (session): TimelineEventDto => ({
          id: `file-edit-${session.filePath}-${session.startedAt}`,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          info: {
            fileName: session.fileName,
            filePath: session.filePath,
            repoName: session.repoName,
            fileExtension: session.fileExtension,
            editCount: session.editCount,
          },
          timelineId,
        })
      );
  }

  /**
   * Reads every Local History store and folds it into merged sessions grouped by local day.
   * Repeats are served from `scanCache` until the stores change on disk.
   */
  private scanStores(clearCache: boolean): Map<string, FileEditSessionDto[]> {
    const stores = findLocalHistoryStores();
    const cacheKey = stores.map((store) => `${store.id}:${store.mtimeMs}:${store.size}`).join('|');

    if (!clearCache && this.scanCache?.key === cacheKey) {
      return this.scanCache.sessionsByDay;
    }

    this.pruneStaleCaches();

    const edits: RawFileEdit[] = [];
    for (const store of stores) {
      try {
        const buffer = fs.readFileSync(store.dataPath);
        for (const edit of parseLocalHistory(buffer)) {
          if (!isNoisePath(edit.filePath)) edits.push(edit);
        }
      } catch (err) {
        // A store being locked or mid-rewrite by a running IDE must not take out the timeline.
        this.logger.warn(`Could not read local history store ${store.id}: ${err}`);
      }
    }

    const deduped = this.dedupeEdits(edits);
    const sessions = mergeFileEdits(deduped, MERGE_GAP_MINUTES, MIN_EVENT_DURATION_MS);
    const resolveRepoName = createRepoNameResolver();

    const sessionsByDay = new Map<string, FileEditSessionDto[]>();
    for (const session of sessions) {
      const repoName = resolveRepoName(session.filePath);
      const fileName = path.basename(session.filePath);
      const dayKey = this.toDayKey(new Date(session.startedAt));

      const daySessions = sessionsByDay.get(dayKey) ?? [];
      daySessions.push({
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        fileName,
        filePath: this.toRepoRelativePath(session.filePath, repoName),
        repoName,
        fileExtension: path.extname(fileName).replace(/^\./, ''),
        editCount: session.editCount,
      });
      sessionsByDay.set(dayKey, daySessions);
    }

    this.scanCache = { key: cacheKey, sessionsByDay };
    return sessionsByDay;
  }

  /**
   * Drops day caches written by an earlier mapping. They are excluded from the age-based purge —
   * deliberately, since they are the only durable copy of history JetBrains has since dropped — so
   * without this a version bump would orphan them permanently.
   */
  private pruneStaleCaches(): void {
    if (this.hasPrunedStaleCaches) return;
    this.hasPrunedStaleCaches = true;

    const db = this.databaseService.getDb();
    db.prepare(
      'DELETE FROM cachedNetworkRequests WHERE cacheKey LIKE ? AND cacheKey NOT LIKE ?'
    ).run(`${CACHE_KEY_PREFIX}%`, `%-${CACHE_KEY_VERSION}`);
  }

  /**
   * Two IDE versions in use at the same time record the same edit twice, so revisions of one file
   * within the same minute collapse into one.
   */
  private dedupeEdits(edits: RawFileEdit[]): RawFileEdit[] {
    const seen = new Set<string>();
    return edits.filter((edit) => {
      const key = `${edit.filePath}|${Math.floor(edit.editedAt / 60000)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Trims an absolute path back to the repository it lives in, keeping the repo folder itself. */
  private toRepoRelativePath(filePath: string, repoName: string): string {
    const marker = `${path.sep}${repoName}${path.sep}`;
    const index = filePath.lastIndexOf(marker);
    return index === -1 ? filePath : filePath.slice(index + marker.length);
  }

  /**
   * Local rather than UTC days: the timeline renders the user's calendar day, so bucketing on UTC
   * would file an evening edit under tomorrow for anyone east of Greenwich.
   */
  private toDayKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private getDayKeysInRange(startedAt: string, endedAt: string): string[] {
    const dayKeys: string[] = [];
    const cursor = new Date(startedAt);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endedAt).getTime();

    while (cursor.getTime() <= end) {
      dayKeys.push(this.toDayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dayKeys;
  }

  private getCacheKey(dayKey: string): string {
    return `${CACHE_KEY_PREFIX}${dayKey}-${CACHE_KEY_VERSION}`;
  }

  private readDayCache(dayKey: string): FileEditSessionDto[] | null {
    const db = this.databaseService.getDb();
    const row = db
      .prepare('SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?')
      .get(this.getCacheKey(dayKey)) as { responseJson: string } | undefined;
    return row ? (JSON.parse(row.responseJson) as FileEditSessionDto[]) : null;
  }

  private writeDayCache(dayKey: string, sessions: FileEditSessionDto[]): void {
    const db = this.databaseService.getDb();
    db.prepare(
      'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
    ).run(this.getCacheKey(dayKey), JSON.stringify(sessions));
  }
}
