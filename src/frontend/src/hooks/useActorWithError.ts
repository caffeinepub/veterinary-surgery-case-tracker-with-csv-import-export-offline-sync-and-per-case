import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { classifyBackendError } from '../utils/backendErrorMessages';

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
  const [initAttempted, setInitAttempted] = useState(false);

  const isAuthenticated = !!identity;

  // Monitor actor initialization state and capture underlying errors
  useEffect(() => {
    // Track that we've attempted initialization
    if (isAuthenticated && !isFetching) {
      setInitAttempted(true);
    }

    // Check for actor query errors from React Query
    const actorQueryState = queryClient.getQueryState(['actor', identity?.getPrincipal().toString()]);
    
    // If we're authenticated, finished fetching, but have no actor after attempting init, there was an error
    if (isAuthenticated && !isFetching && !actor && initAttempted && previousActor === null) {
      // Try to get the actual error from the query state
      if (actorQueryState?.error) {
        const classified = classifyBackendError(actorQueryState.error, 'actor initialization');
        setError(classified.message);
      } else {
        setError('Failed to initialize backend connection. The backend service may be unavailable.');
      }
    } else if (actor) {
      // Successfully got an actor, clear any errors
      setError(null);
      setPreviousActor(actor);
      setInitAttempted(false);
    }
  }, [isAuthenticated, isFetching, actor, previousActor, initAttempted, identity, queryClient]);

  // Clear error when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setError(null);
      setPreviousActor(null);
      setInitAttempted(false);
    }
  }, [isAuthenticated]);

  const retry = async () => {
    setError(null);
    setPreviousActor(null);
    setInitAttempted(false);
    
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
