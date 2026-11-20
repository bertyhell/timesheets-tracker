export interface TrackedActiveState {
  /** Database id, undefined when the block hasn't been written yet */
  id?: string;
  isActive: boolean;
  /** epoch ms */
  startedAt: number;
  /** epoch ms */
  endedAt: number;
}

export interface ActiveStateObservation {
  /** When the observation was made, epoch ms */
  at: number;
  isActive: boolean;
  /** When the user went inactive, if known (last input or lock time), epoch ms */
  inactiveSince?: number;
}

/**
 * Works out which active-state blocks to write for a new observation.
 *
 * Returns the blocks to create (no id) or update (with id) in order; the last one is the new
 * current block. Rules:
 * - Same state as the current block: extend it to the observation time.
 * - Going inactive: back-date the switch to `inactiveSince` (never before the current block's start).
 * - Going active: switch at the observation time.
 * - A gap longer than `maxGapMs` since the previous observation means the computer was asleep (or
 *   the process was frozen): the time since `lastObservedAt` is recorded as inactive.
 */
export function planActiveStateUpdate(
  current: TrackedActiveState | null,
  lastObservedAt: number | null,
  observation: ActiveStateObservation,
  maxGapMs: number
): TrackedActiveState[] {
  if (!current) {
    return [{ isActive: observation.isActive, startedAt: observation.at, endedAt: observation.at }];
  }

  const result: TrackedActiveState[] = [];
  let block: TrackedActiveState = { ...current };

  if (lastObservedAt !== null && observation.at - lastObservedAt > maxGapMs && block.isActive) {
    block.endedAt = Math.max(block.startedAt, lastObservedAt);
    result.push(block);
    block = { isActive: false, startedAt: block.endedAt, endedAt: block.endedAt };
  }

  if (block.isActive === observation.isActive) {
    block.endedAt = Math.max(block.endedAt, observation.at);
    result.push(block);
    return result;
  }

  const switchAt = observation.isActive
    ? observation.at
    : Math.min(
        observation.at,
        Math.max(block.startedAt, observation.inactiveSince ?? observation.at)
      );

  if (switchAt <= block.startedAt) {
    // The whole current block turns out to be the new state: flip it instead of leaving an empty block
    block.isActive = observation.isActive;
    block.endedAt = observation.at;
    result.push(block);
    return result;
  }

  block.endedAt = switchAt;
  result.push(block);
  result.push({ isActive: observation.isActive, startedAt: switchAt, endedAt: observation.at });
  return result;
}
