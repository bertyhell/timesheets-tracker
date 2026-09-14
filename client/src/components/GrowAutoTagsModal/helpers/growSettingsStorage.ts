const STORAGE_KEY = 'timesheetTracker.growAutoTags';

/** Same default as the gap bridging the api already does while calculating auto tags. */
export const DEFAULT_MAX_GROW_MINUTES = 15;

export interface GrowSettings {
  maxGrowMinutes: number;
  /** Ids of the timelines whose first and last event bound the growth. */
  boundTimelineIds: string[];
  overrideTags: boolean;
  /**
   * Titles of the tag names left out of the copy. Stored as the exclusions rather than the
   * selection, so a tag name met for the first time is copied along by default.
   */
  excludedTagNameTitles: string[];
}

export const DEFAULT_GROW_SETTINGS: GrowSettings = {
  maxGrowMinutes: DEFAULT_MAX_GROW_MINUTES,
  boundTimelineIds: [],
  overrideTags: false,
  excludedTagNameTitles: [],
};

/**
 * The dialog is reopened on most days, so its settings are remembered rather than re-entered.
 * Local storage is unavailable in a private window and its contents can be anything, so every
 * field falls back to its default on its own.
 */
export function readGrowSettings(): GrowSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_GROW_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<GrowSettings>;
    return {
      maxGrowMinutes:
        typeof parsed.maxGrowMinutes === 'number' && parsed.maxGrowMinutes >= 0
          ? parsed.maxGrowMinutes
          : DEFAULT_MAX_GROW_MINUTES,
      boundTimelineIds: Array.isArray(parsed.boundTimelineIds)
        ? parsed.boundTimelineIds.filter((id): id is string => typeof id === 'string')
        : [],
      overrideTags: parsed.overrideTags === true,
      excludedTagNameTitles: Array.isArray(parsed.excludedTagNameTitles)
        ? parsed.excludedTagNameTitles.filter((title): title is string => typeof title === 'string')
        : [],
    };
  } catch {
    return DEFAULT_GROW_SETTINGS;
  }
}

export function writeGrowSettings(settings: GrowSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A preference that cannot be saved is not worth failing the dialog over.
  }
}
