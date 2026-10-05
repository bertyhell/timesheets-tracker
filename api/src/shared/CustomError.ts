/**
 * An Error that carries the error it wraps (as the standard `cause`) plus extra debugging info.
 * It doesn't log itself: whoever handles it (a caller's console.error or the global exception
 * filter) logs it once.
 */
export class CustomError extends Error {
  constructor(
    message: string,
    cause: unknown = null,
    public readonly additionalInfo: unknown = null
  ) {
    super(message, cause == null ? undefined : { cause });
    this.name = 'CustomError';
  }

  public override toString(): string {
    return safeStringify({
      message: this.message,
      innerException: describeCause(this.cause),
      additionalInfo: this.additionalInfo,
      stack: this.stack,
    });
  }
}

function describeCause(cause: unknown): string | null {
  if (cause == null) {
    return null;
  }
  if (cause instanceof Error) {
    return cause.toString() + (cause.stack ? '\n' + cause.stack : '');
  }
  return safeStringify(cause);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    // circular structures
    return String(value);
  }
}
