import type { Program, Website } from '../../types/types';

/**
 * Websites are tracked as point-in-time events by the browser extension: only a startedAt is
 * recorded. The end of a visit therefore has to be derived, and it is whichever of these comes
 * first:
 *  - the start of the next website event (the user navigated or switched tab), or
 *  - the start of the next program event (the user left the browser).
 *
 * Deriving it from the program stream alone is what used to produce overlapping website events:
 * every website inside a single program gap got the exact same endedAt, and program events shorter
 * than MINIMUM_ACTIVITY_DURATION_SECONDS are filtered out of that stream, so those gaps can span
 * an hour or more. Clamping to the next website event as well makes overlap structurally
 * impossible.
 *
 * Websites without any following boundary (nothing happened after them yet) are dropped, as are
 * zero-length ones, so callers always receive a strictly ordered, non-overlapping list.
 */
export function resolveWebsiteEndTimes(
  websites: Website[],
  programs: Program[]
): (Website & { endedAt: string })[] {
  const sortedWebsites = [...websites].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const programStarts = programs
    .map((program) => program.startedAt)
    .sort((a, b) => a.localeCompare(b));

  return sortedWebsites.reduce<(Website & { endedAt: string })[]>((result, website, index) => {
    const nextWebsiteStart = sortedWebsites[index + 1]?.startedAt;
    const nextProgramStart = programStarts.find((startedAt) => startedAt > website.startedAt);

    const boundaries = [nextWebsiteStart, nextProgramStart].filter(
      (boundary): boundary is string => !!boundary && boundary > website.startedAt
    );
    if (!boundaries.length) {
      // Nothing happened after this website yet, so its duration is still unknown
      return result;
    }

    result.push({
      ...website,
      endedAt: boundaries.reduce((earliest, boundary) =>
        boundary < earliest ? boundary : earliest
      ),
    });
    return result;
  }, []);
}
