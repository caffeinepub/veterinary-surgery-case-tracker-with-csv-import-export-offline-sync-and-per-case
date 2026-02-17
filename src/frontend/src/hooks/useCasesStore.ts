import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGetAllSurgeryCases } from './useQueries';
import type { LocalSurgeryCase } from '../types/cases';
import type { SurgeryCaseUpdate } from '../backend';
import { loadCasesFromLocal, saveCasesToLocal } from '../utils/localPersistence';
import { mergeCases } from '../utils/mergeCases';

export function useCasesStore() {
  const queryClient = useQueryClient();
  const { data: serverCases = [], isLoading: isLoadingServer } = useGetAllSurgeryCases();

  const casesQuery = useQuery<LocalSurgeryCase[]>({
    queryKey: ['mergedCases'],
    queryFn: () => {
      const localCases = loadCasesFromLocal();
      return mergeCases(localCases, serverCases);
    },
    enabled: !isLoadingServer,
  });

  const addCase = useMutation({
    mutationFn: async (newCase: LocalSurgeryCase) => {
      const currentCases = casesQuery.data || [];
      const updatedCases = [...currentCases, newCase];
      saveCasesToLocal(updatedCases);
      const verifiedCases = loadCasesFromLocal();
      return verifiedCases;
    },
    onSuccess: (verifiedCases) => {
      queryClient.setQueryData(['mergedCases'], verifiedCases);
    },
  });

  const updateCase = useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: bigint; updates: SurgeryCaseUpdate & { demographicsRawText?: string; capturedImageUrl?: string; _delete?: boolean } }) => {
      const currentCases = casesQuery.data || [];
      
      if (updates._delete) {
        const updatedCases = currentCases.filter((c) => c.caseId !== caseId);
        saveCasesToLocal(updatedCases);
        return loadCasesFromLocal();
      }

      const updatedCases = currentCases.map((c) => {
        if (c.caseId !== caseId) return c;

        const normalized: LocalSurgeryCase = {
          ...c,
          medicalRecordNumber: updates.medicalRecordNumber ?? c.medicalRecordNumber,
          presentingComplaint: updates.presentingComplaint ?? c.presentingComplaint ?? '',
          notes: updates.notes ?? c.notes ?? '',
          arrivalDate: updates.arrivalDate ?? c.arrivalDate,
          patientDemographics: updates.patientDemographics ?? c.patientDemographics,
          tasksChecklist: updates.tasksChecklist ?? c.tasksChecklist,
          demographicsRawText: updates.demographicsRawText ?? c.demographicsRawText,
          capturedImageUrl: updates.capturedImageUrl ?? c.capturedImageUrl,
          lastSyncTimestamp: BigInt(Date.now()) * BigInt(1000000),
          isSynchronized: false,
          pendingSync: true,
        };

        return normalized;
      });

      saveCasesToLocal(updatedCases);
      return loadCasesFromLocal();
    },
    onSuccess: (verifiedCases) => {
      queryClient.setQueryData(['mergedCases'], verifiedCases);
    },
  });

  return {
    cases: casesQuery.data,
    isLoading: isLoadingServer || casesQuery.isLoading,
    addCase,
    updateCase,
  };
}
