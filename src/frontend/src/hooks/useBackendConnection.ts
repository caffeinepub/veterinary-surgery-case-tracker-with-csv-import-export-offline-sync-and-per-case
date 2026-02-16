import { useActorWithError } from './useActorWithError';
import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { classifyBackendError } from '../utils/backendErrorMessages';

export interface BackendConnectionStatus {
  isConnected: boolean;
  isInitializing: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

/**
 * Higher-level backend connection manager that composes Internet Identity + actor lifecycle
 * to probe backend connectivity and derive a single connection status with human-readable errors.
 */
export function useBackendConnection(): BackendConnectionStatus {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching, error: actorError, retry: retryActor } = useActorWithError();
  const queryClient = useQueryClient();
  const [probeError, setProbeError] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing' || actorFetching || isProbing;

  // Probe backend connectivity with a read call after actor is ready
  const probeQuery = useQuery({
    queryKey: ['backendConnectionProbe', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        // Attempt a simple read call to verify backend connectivity
        await actor.getCallerUserProfile();
        return true;
      } catch (error: any) {
        // Classify the error for user-friendly messaging
        const classified = classifyBackendError(error, 'backend probe');
        throw new Error(classified.message);
      }
    },
    enabled: isAuthenticated && !!actor && !actorFetching && !actorError,
    retry: false,
    staleTime: 30000, // Consider connection valid for 30 seconds
  });

  // Update probe error state based on probe results
  useEffect(() => {
    if (probeQuery.isError) {
      const errorMessage = probeQuery.error instanceof Error 
        ? probeQuery.error.message 
        : 'Failed to connect to backend';
      setProbeError(errorMessage);
    } else if (probeQuery.isSuccess) {
      setProbeError(null);
    }
  }, [probeQuery.isError, probeQuery.isSuccess, probeQuery.error]);

  // Retry function that performs full reset: actor init + probe
  const retry = async () => {
    setIsProbing(true);
    setProbeError(null);
    
    try {
      // First, retry actor initialization
      await retryActor();
      
      // Then refetch the probe query
      await probeQuery.refetch();
      
      // If successful, invalidate dependent queries to refresh data
      if (probeQuery.isSuccess) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return key !== 'actor' && key !== 'backendConnectionProbe';
          }
        });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      // Error will be captured by actor or probe query
    } finally {
      setIsProbing(false);
    }
  };

  // Determine the primary error to display
  // Priority: actor initialization error > probe error
  const primaryError = actorError || probeError;

  const isConnected = isAuthenticated && !!actor && !actorError && probeQuery.isSuccess && !primaryError;

  return {
    isConnected,
    isInitializing,
    error: primaryError,
    retry,
  };
}
