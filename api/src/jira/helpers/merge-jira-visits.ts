export interface JiraVisit {
  issueKey: string;
  startedAt: string;
  endedAt: string;
}

/**
 * Folds consecutive visits to the same ticket into one block.
 *
 * Reading a ticket normally produces a burst of separate website events — every in-page navigation,
 * tab switch and alt-tab to the browser starts a new one — and rendering each of those as its own
 * block turns a 40 minute stretch on one ticket into a row of unreadable slivers. Visits to the same
 * key are therefore joined across gaps shorter than `maxGapMinutes`; a longer gap means the user
 * genuinely went away and came back, which stays two blocks.
 *
 * A gap is bridged rather than left empty, because the user was still working on that ticket while
 * they were briefly in another program — that is exactly the time the timeline is meant to capture.
 */
export function mergeJiraVisits(visits: JiraVisit[], maxGapMinutes: number): JiraVisit[] {
  if (!visits.length) {
    return [];
  }

  const maxGapMs = Math.max(0, maxGapMinutes) * 60 * 1000;
  const sortedVisits = [...visits].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  return sortedVisits.reduce<JiraVisit[]>((merged, visit) => {
    const previous = merged.at(-1);
    const gapMs = previous
      ? new Date(visit.startedAt).getTime() - new Date(previous.endedAt).getTime()
      : Infinity;

    if (previous && previous.issueKey === visit.issueKey && gapMs <= maxGapMs) {
      // `endedAt` can move backwards when two visits overlap, so keep the later of the two.
      previous.endedAt = previous.endedAt > visit.endedAt ? previous.endedAt : visit.endedAt;
      return merged;
    }

    merged.push({ ...visit });
    return merged;
  }, []);
}
