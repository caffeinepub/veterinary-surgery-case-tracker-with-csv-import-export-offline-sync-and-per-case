import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { getDraftAdminToken, isDraftAdminTokenMissing } from '../utils/draftAdminToken';
import { classifyBackendError, createMissingTokenError } from '../utils/backendErrorMessages';
import { type backendInterface } from '../backend';

export interface UseActorWithErrorReturn {
  actor: backendInterface | null;
  isFetching: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

/**
 * Enhanced wrapper around useActor that adds error tracking and retry functionality.
 * This hook monitors actor initialization and captures failures for user-friendly error display.
 */
export function useActorWithError(): UseActorWithErrorReturn {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [previousActor, setPreviousActor] = useState<backendInterface | null>(null);

  const isAuthenticated = !!identity;

  // Monitor actor initialization state
  useEffect(() => {
    // If we're authenticated and not fetching, but have no actor, there was likely an error
    if (isAuthenticated && !isFetching && !actor && previousActor === null) {
      // Check if the admin token is missing
      if (isDraftAdminTokenMissing()) {
        const tokenError = createMissingTokenError();
        setError(tokenError.message);
      } else {
        // Generic initialization failure
        setError('Failed to initialize backend connection. Please try again.');
      }
    } else if (actor) {
      // Successfully got an actor, clear any errors
      setError(null);
      setPreviousActor(actor);
    }
  }, [isAuthenticated, isFetching, actor, previousActor]);

  // Clear error when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setError(null);
      setPreviousActor(null);
    }
  }, [isAuthenticated]);

  const retry = async () => {
    setError(null);
    setPreviousActor(null);
    
    // Invalidate and refetch the actor query
    await queryClient.invalidateQueries({ 
      queryKey: ['actor', identity?.getPrincipal().toString()] 
    });
    await queryClient.refetchQueries({ 
      queryKey: ['actor', identity?.getPrincipal().toString()] 
    });
  };

  return {
    actor,
    isFetching,
    error,
    retry,
  };
}
