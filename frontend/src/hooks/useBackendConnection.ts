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

  // Stable query key that never includes undefined
  // Use explicit 'anonymous' when not authenticated to avoid cache churn
  const principalKey = isAuthenticated ? identity.getPrincipal().toString() : 'anonymous';

  // Probe backend connectivity with the unauthenticated ping endpoint
  // This runs whenever an actor is available (anonymous or authenticated)
  const probeQuery = useQuery({
    queryKey: ['backendConnectionProbe', principalKey],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        // Use the unauthenticated ping endpoint to verify backend reachability
        // This avoids conflating authorization failures with connectivity issues
        await actor.ping();
        return true;
      } catch (error: any) {
        // Classify the error for user-friendly messaging
        const classified = classifyBackendError(error, 'backend probe');
        throw new Error(classified.message);
      }
    },
    // Run probe whenever actor is available, regardless of auth state
    enabled: !!actor && !actorFetching && !actorError,
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
      // Clear probe error on success
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
      
      // Wait a moment for actor to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then invalidate and refetch the probe query using the stable key
      await queryClient.invalidateQueries({
        queryKey: ['backendConnectionProbe', principalKey]
      });
      
      await queryClient.refetchQueries({
        queryKey: ['backendConnectionProbe', principalKey]
      });
      
      // Check if refetch was successful by examining query state
      const probeQueryState = queryClient.getQueryState(['backendConnectionProbe', principalKey]);
      const wasSuccessful = probeQueryState?.data === true && !probeQueryState?.error;
      
      // If successful, invalidate dependent queries to refresh data
      if (wasSuccessful) {
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

  // Connection is successful when we have an actor, no errors, and probe succeeded
  const isConnected = !!actor && !actorError && probeQuery.isSuccess && !primaryError;

  return {
    isConnected,
    isInitializing,
    error: primaryError,
    retry,
  };
}
