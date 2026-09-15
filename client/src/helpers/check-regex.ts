export interface RegexCheck {
  valid: boolean;
  /** The engine's own SyntaxError text when invalid, so the message matches what actually failed. */
  message: string;
}

/**
 * Mirrors the plain `new RegExp(value)` the backend does, so this advisory check agrees with the
 * code that will really run the pattern instead of being a second, approximate validator.
 *
 * Returns null for an empty value: a field that has not been filled in yet is not "invalid".
 */
export function checkRegex(value: string): RegexCheck | null {
  if (!value) return null;
  try {
    new RegExp(value);
    return { valid: true, message: 'Valid regex' };
  } catch (error) {
    return { valid: false, message: error instanceof Error ? error.message : 'Invalid regex' };
  }
}
