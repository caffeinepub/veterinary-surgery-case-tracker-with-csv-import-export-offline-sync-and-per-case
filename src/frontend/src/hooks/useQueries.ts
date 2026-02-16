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

export function useGetAllSurgeryCases() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['surgeryCases'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.getAllSurgeryCases();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to access cases');
        }
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
      patientDemographics,
      arrivalDate,
      tasksChecklist,
    }: {
      medicalRecordNumber: string;
      patientDemographics: CompletePatientDemographics;
      arrivalDate: bigint;
      tasksChecklist: TasksChecklist;
    }) => {
      if (!actor) throw new Error('Backend connection not available');
      try {
        return await actor.createSurgeryCase(medicalRecordNumber, patientDemographics, arrivalDate, tasksChecklist);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Not authorized to create cases');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeryCases'] });
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
      queryClient.invalidateQueries({ queryKey: ['surgeryCases'] });
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
      queryClient.invalidateQueries({ queryKey: ['surgeryCases'] });
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
          throw new Error('Not authorized to access updated cases');
        }
        throw error;
      }
    },
  });
}
