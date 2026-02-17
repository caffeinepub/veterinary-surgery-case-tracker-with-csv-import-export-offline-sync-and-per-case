import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, SurgeryCase, CompletePatientDemographics, SurgeryCaseUpdate, TasksChecklist } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        // Handle authorization errors gracefully
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to access profile');
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to save profile');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

/**
 * Fetches all surgery cases using paginated requests to avoid heap overflow.
 * Uses getSurgeryCases(start, limit) in a loop with conservative page size.
 * NEVER calls the legacy getAllSurgeryCases() method.
 */
export function useGetSurgeryCasesPaginated() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['serverSurgeryCases'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend connection not available');
      
      try {
        const PAGE_SIZE = 100;
        const allCases: SurgeryCase[] = [];
        let start = 0;
        let hasMore = true;

        while (hasMore) {
          const page = await actor.getSurgeryCases(BigInt(start), BigInt(PAGE_SIZE));
          
          if (page.length === 0) {
            hasMore = false;
          } else {
            allCases.push(...page);
            start += page.length;
            
            // If we got fewer than PAGE_SIZE, we've reached the end
            if (page.length < PAGE_SIZE) {
              hasMore = false;
            }
          }
        }

        return allCases;
      } catch (error: any) {
        console.error('Server cases fetch error:', error);
        
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to access cases');
        }
        
        // Re-throw with original error for proper error handling
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useCreateSurgeryCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      medicalRecordNumber,
      presentingComplaint,
      patientDemographics,
      arrivalDate,
      tasksChecklist,
      notes,
    }: {
      medicalRecordNumber: string;
      presentingComplaint: string;
      patientDemographics: CompletePatientDemographics;
      arrivalDate: bigint;
      tasksChecklist: TasksChecklist;
      notes: string;
    }) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.createSurgeryCase(
          medicalRecordNumber,
          presentingComplaint,
          patientDemographics,
          arrivalDate,
          tasksChecklist,
          notes
        );
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to create cases');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverSurgeryCases'] });
      queryClient.invalidateQueries({ queryKey: ['mergedCases'] });
    },
  });
}

export function useUpdateSurgeryCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: bigint; updates: SurgeryCaseUpdate }) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.updateSurgeryCase(caseId, updates);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to update cases');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverSurgeryCases'] });
      queryClient.invalidateQueries({ queryKey: ['mergedCases'] });
    },
  });
}

export function useDeleteSurgeryCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: bigint) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.deleteSurgeryCase(caseId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to delete cases');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverSurgeryCases'] });
      queryClient.invalidateQueries({ queryKey: ['mergedCases'] });
    },
  });
}

export function useSyncLocalChanges() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (localCases: SurgeryCase[]) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.syncLocalChanges(localCases);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to sync cases');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverSurgeryCases'] });
      queryClient.invalidateQueries({ queryKey: ['mergedCases'] });
    },
  });
}

export function useGetUpdatedCases() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (since: bigint) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.getUpdatedCases(since);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to fetch updated cases');
        }
        throw error;
      }
    },
  });
}
