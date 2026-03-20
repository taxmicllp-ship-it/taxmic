import { logger } from './logger';

interface RetryOptions {
  attempts?: number;   // total attempts (default 3)
  delayMs?: number;    // initial delay in ms (default 200, doubles each retry)
  label?: string;      // log label
}

/**
 * Retry an async operation with exponential back-off.
 * Throws the last error if all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, delayMs = 200, label = 'operation' } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        const wait = delayMs * 2 ** (attempt - 1);
        logger.warn({ event: 'RETRY', label, attempt, nextRetryMs: wait });
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  logger.error({ event: 'RETRY_EXHAUSTED', label, attempts });
  throw lastError;
}
