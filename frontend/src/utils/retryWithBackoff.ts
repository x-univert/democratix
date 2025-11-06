/**
 * Utility for retrying async operations with exponential backoff
 *
 * Provides automatic retry logic for operations that may fail temporarily,
 * such as network requests, IPFS uploads, or blockchain transactions.
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 30000 (30 seconds)
   */
  maxDelay?: number;

  /**
   * Callback function called on each retry attempt
   * @param attempt Current attempt number (1-indexed)
   * @param error Error that triggered the retry
   * @param delay Delay before next retry in ms
   */
  onRetry?: (attempt: number, error: Error, delay: number) => void;

  /**
   * Function to determine if an error should trigger a retry
   * @param error The error to check
   * @returns true if should retry, false otherwise
   * @default () => true (retry all errors)
   */
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  /**
   * The result of the successful operation
   */
  data: T;

  /**
   * Number of attempts made (including successful one)
   */
  attempts: number;

  /**
   * Total time taken in milliseconds
   */
  totalTime: number;

  /**
   * Whether the operation eventually succeeded
   */
  success: boolean;
}

/**
 * Default options for retry logic
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
};

/**
 * Execute an async operation with exponential backoff retry logic
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await ipfsService.uploadJSON(data),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 2000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt}/3: ${error.message}. Waiting ${delay}ms...`);
 *     }
 *   }
 * );
 * console.log('Upload succeeded:', result.data);
 * ```
 *
 * @param operation The async operation to execute
 * @param options Retry options
 * @returns Promise with retry result containing data and metadata
 * @throws Error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  let lastError: Error;
  let attempt = 0;

  for (attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const data = await operation();

      return {
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (options.shouldRetry && !options.shouldRetry(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, lastError, delay);
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  throw new Error(
    `Operation failed after ${opts.maxAttempts} attempts. Last error: ${lastError!.message}`
  );
}

/**
 * Helper to check if an error is a network error that should be retried
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch')
  );
}

/**
 * Helper to check if an error is a rate limit error
 */
export function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  );
}

/**
 * Helper to check if an error is retriable (network or rate limit)
 */
export function isRetriableError(error: Error): boolean {
  return isNetworkError(error) || isRateLimitError(error);
}

/**
 * Wrapper for IPFS operations with automatic retry
 */
export async function retryIPFSOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'IPFS operation'
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    maxAttempts: 3,
    initialDelay: 2000, // 2 seconds
    backoffMultiplier: 2,
    shouldRetry: isRetriableError,
    onRetry: (attempt, error, delay) => {
      console.warn(
        `🔄 ${operationName} failed (attempt ${attempt}/3): ${error.message}. Retrying in ${delay}ms...`
      );
    },
  });

  console.log(`✅ ${operationName} succeeded after ${result.attempts} attempt(s)`);
  return result.data;
}

/**
 * Wrapper for blockchain transaction operations with automatic retry
 */
export async function retryTransactionOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'Transaction'
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    maxAttempts: 2, // Only 2 attempts for transactions (less aggressive)
    initialDelay: 5000, // 5 seconds
    shouldRetry: (error) => {
      // Only retry network errors, not validation errors
      return isNetworkError(error);
    },
    onRetry: (attempt, error, delay) => {
      console.warn(
        `🔄 ${operationName} failed (attempt ${attempt}/2): ${error.message}. Retrying in ${delay}ms...`
      );
    },
  });

  console.log(`✅ ${operationName} succeeded after ${result.attempts} attempt(s)`);
  return result.data;
}
