import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGetAllSurgeryCases } from './useQueries';
import type { LocalSurgeryCase } from '../types/cases';
import type { SurgeryCaseUpdate } from '../backend';
import { loadCasesFromLocal, saveCasesToLocal } from '../utils/localPersistence';
import { mergeCases } from '../utils/mergeCases';

export function useCasesStore() {
  const queryClient = useQueryClient();
  const serverQuery = useGetAllSurgeryCases();
  const { data: serverCases = [], isLoading: isLoadingServer, error: serverError, refetch: refetchServer } = serverQuery;

  // Load local cases immediately without waiting for server
  const casesQuery = useQuery<LocalSurgeryCase[]>({
    queryKey: ['mergedCases', serverCases],
    queryFn: () => {
      const localCases = loadCasesFromLocal();
      return mergeCases(localCases, serverCases);
    },
    // Always enabled - compute merged cases even while server is loading
    enabled: true,
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
      queryClient.setQueryData(['mergedCases', serverCases], verifiedCases);
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
      queryClient.setQueryData(['mergedCases', serverCases], verifiedCases);
    },
  });

  const hasAnyCases = (casesQuery.data?.length ?? 0) > 0;
  const isInitialLoad = !casesQuery.data && casesQuery.isLoading;

  return {
    cases: casesQuery.data,
    isLoading: isInitialLoad,
    hasAnyCases,
    serverError,
    isLoadingServer,
    refetchServer,
    addCase,
    updateCase,
  };
}
