import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, SurgeryCase, PatientDemographics, SurgeryCaseUpdate, TasksChecklist } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
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
      if (!actor) return [];
      return actor.getAllSurgeryCases();
    },
    enabled: !!actor && !actorFetching,
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
      patientDemographics: PatientDemographics;
      arrivalDate: bigint;
      tasksChecklist: TasksChecklist;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSurgeryCase(medicalRecordNumber, patientDemographics, arrivalDate, tasksChecklist);
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
      if (!actor) throw new Error('Actor not available');
      return actor.updateSurgeryCase(caseId, updates);
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
      if (!actor) throw new Error('Actor not available');
      return actor.syncLocalChanges(localCases);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeryCases'] });
    },
  });
}
