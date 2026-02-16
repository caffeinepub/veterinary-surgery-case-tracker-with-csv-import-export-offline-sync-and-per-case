import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

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
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing' || actorFetching || isProbing;

  // Probe backend connectivity with a read call after login
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
        // Parse error messages from backend
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to access backend');
        } else if (error.message?.includes('Canister') || error.message?.includes('canister')) {
          throw new Error('Backend service unavailable');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new Error('Network error connecting to backend');
        } else {
          throw new Error('Failed to connect to backend');
        }
      }
    },
    enabled: isAuthenticated && !!actor && !actorFetching,
    retry: false,
    staleTime: 30000, // Consider connection valid for 30 seconds
  });

  // Update connection error state based on probe results
  useEffect(() => {
    if (probeQuery.isError) {
      const errorMessage = probeQuery.error instanceof Error 
        ? probeQuery.error.message 
        : 'Failed to connect to backend';
      setConnectionError(errorMessage);
    } else if (probeQuery.isSuccess) {
      setConnectionError(null);
    }
  }, [probeQuery.isError, probeQuery.isSuccess, probeQuery.error]);

  // Check for actor initialization errors
  useEffect(() => {
    if (isAuthenticated && !actorFetching && !actor && !probeQuery.isFetching) {
      setConnectionError('Failed to initialize backend connection');
    }
  }, [isAuthenticated, actorFetching, actor, probeQuery.isFetching]);

  const retry = async () => {
    setIsProbing(true);
    setConnectionError(null);
    
    try {
      // Invalidate actor query to force re-initialization
      await queryClient.invalidateQueries({ 
        queryKey: ['actor', identity?.getPrincipal().toString()] 
      });
      
      // Refetch the probe query
      await probeQuery.refetch();
      
      // Invalidate dependent queries to refresh data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key !== 'actor' && key !== 'backendConnectionProbe';
        }
      });
    } catch (error) {
      console.error('Retry failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setIsProbing(false);
    }
  };

  const isConnected = isAuthenticated && !!actor && probeQuery.isSuccess && !connectionError;

  return {
    isConnected,
    isInitializing,
    error: connectionError,
    retry,
  };
}
