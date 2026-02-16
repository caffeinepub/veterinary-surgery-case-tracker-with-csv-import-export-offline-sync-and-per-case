/**
 * Classifies backend errors into user-facing English messages.
 * Distinguishes between authorization failures, network/service unavailability,
 * and initialization failures.
 */

export type ErrorCategory = 'authorization' | 'network' | 'initialization' | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
}

/**
 * Converts a raw error into a user-facing English message with proper categorization.
 * 
 * @param error - The error to classify (Error object or string)
 * @param context - Optional context about where the error occurred
 * @returns Classified error with category and user-friendly message
 */
export function classifyBackendError(error: unknown, context?: string): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for authorization failures
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('not authorized')) {
    return {
      category: 'authorization',
      message: 'You are not authorized to access this resource. Please check your permissions.',
    };
  }

  // Check for canister/service unavailability
  if (lowerMessage.includes('canister') || 
      lowerMessage.includes('service unavailable') ||
      lowerMessage.includes('replica')) {
    return {
      category: 'network',
      message: 'Backend service is currently unavailable. Please try again in a moment.',
    };
  }

  // Check for network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection')) {
    return {
      category: 'network',
      message: 'Network error connecting to backend. Please check your internet connection.',
    };
  }

  // Check for actor initialization failures
  if (lowerMessage.includes('actor') || 
      lowerMessage.includes('initialization') ||
      lowerMessage.includes('initialize')) {
    return {
      category: 'initialization',
      message: context 
        ? `Failed to initialize backend: ${errorMessage}`
        : 'Failed to initialize backend connection. Please try again.',
    };
  }

  // Generic fallback
  return {
    category: 'unknown',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Creates a user-friendly error message for actor initialization failures.
 */
export function createActorInitError(originalError?: unknown): ClassifiedError {
  if (originalError) {
    const classified = classifyBackendError(originalError, 'actor initialization');
    return {
      category: 'initialization',
      message: classified.message,
    };
  }
  
  return {
    category: 'initialization',
    message: 'Failed to initialize backend connection. Please try again.',
  };
}
