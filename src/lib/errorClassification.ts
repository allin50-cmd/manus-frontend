export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ClassifiedError {
  type: ErrorType;
  isRetryable: boolean;
  message: string;
  httpStatus?: number;
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('failed to fetch') || message.includes('offline')) {
      return {
        type: ErrorType.NETWORK,
        isRetryable: true,
        message: 'Network error — will retry when connection restored',
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timeout exceeded')) {
      return {
        type: ErrorType.TIMEOUT,
        isRetryable: true,
        message: 'Request timeout — will retry with backoff',
      };
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('503') || message.includes('502') || message.includes('504')) {
      return {
        type: ErrorType.SERVER,
        isRetryable: true,
        message: 'Server error — will retry',
      };
    }

    // Too many requests
    if (message.includes('429')) {
      return {
        type: ErrorType.SERVER,
        isRetryable: true,
        message: 'Rate limited — backing off',
      };
    }

    // Client errors (4xx) that are NOT retryable
    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return {
        type: ErrorType.CLIENT,
        isRetryable: false,
        message: 'Client error — check your input and try again',
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      isRetryable: true,
      message: error.message || 'Unknown error',
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    isRetryable: true,
    message: 'Unknown error occurred',
  };
}
