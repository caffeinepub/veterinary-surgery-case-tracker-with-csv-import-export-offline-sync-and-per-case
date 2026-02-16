import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LocalSurgeryCase } from '../types/cases';
import { loadCasesFromLocal, saveCasesToLocal } from '../utils/localPersistence';
import { mergeCases } from '../utils/mergeCases';
import { useGetAllSurgeryCases } from './useQueries';

/**
 * Normalizes a case to ensure all expected fields are present
 */
function normalizeCase(c: LocalSurgeryCase): LocalSurgeryCase {
  return {
    ...c,
    presentingComplaint: c.presentingComplaint ?? '',
    demographicsRawText: c.demographicsRawText ?? '',
    capturedImageUrl: c.capturedImageUrl ?? undefined,
    pendingSync: c.pendingSync ?? false,
  };
}

/**
 * Unified cases store hook that manages both local and server state
 */
export function useCasesStore() {
  const queryClient = useQueryClient();
  const { data: serverCases = [], isLoading: serverLoading } = useGetAllSurgeryCases();

  // Load and merge local + server cases
  const { data: cases = [], isLoading: localLoading } = useQuery<LocalSurgeryCase[]>({
    queryKey: ['mergedCases'],
    queryFn: () => {
      const localCases = loadCasesFromLocal().map(normalizeCase);
      return mergeCases(localCases, serverCases);
    },
    enabled: !serverLoading,
  });

  const isLoading = serverLoading || localLoading;

  // Add case mutation
  const addCase = useMutation({
    mutationFn: async (newCase: LocalSurgeryCase) => {
      const currentLocal = loadCasesFromLocal().map(normalizeCase);
      const updatedLocal = [...currentLocal, normalizeCase(newCase)];
      saveCasesToLocal(updatedLocal);
      
      // Verify save by reloading
      const verified = loadCasesFromLocal().map(normalizeCase);
      const savedCase = verified.find(c => c.caseId === newCase.caseId);
      if (!savedCase) {
        throw new Error('Failed to verify case was saved to local storage');
      }
      return verified;
    },
    onSuccess: (verifiedLocal) => {
      const merged = mergeCases(verifiedLocal, serverCases);
      queryClient.setQueryData(['mergedCases'], merged);
    },
  });

  // Update case mutation
  const updateCase = useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: bigint; updates: Partial<LocalSurgeryCase> }) => {
      const currentLocal = loadCasesFromLocal().map(normalizeCase);
      const updatedLocal = currentLocal.map((c) =>
        c.caseId === caseId
          ? normalizeCase({ ...c, ...updates, pendingSync: true })
          : c
      );
      saveCasesToLocal(updatedLocal);
      
      // Verify save by reloading
      const verified = loadCasesFromLocal().map(normalizeCase);
      const updatedCase = verified.find(c => c.caseId === caseId);
      if (!updatedCase) {
        throw new Error('Failed to verify case update was saved to local storage');
      }
      return verified;
    },
    onSuccess: (verifiedLocal) => {
      const merged = mergeCases(verifiedLocal, serverCases);
      queryClient.setQueryData(['mergedCases'], merged);
    },
  });

  // Delete case mutation
  const deleteCase = useMutation({
    mutationFn: async (caseId: bigint) => {
      const currentLocal = loadCasesFromLocal().map(normalizeCase);
      const updatedLocal = currentLocal.filter((c) => c.caseId !== caseId);
      saveCasesToLocal(updatedLocal);
      
      // Verify deletion
      const verified = loadCasesFromLocal().map(normalizeCase);
      const stillExists = verified.find(c => c.caseId === caseId);
      if (stillExists) {
        throw new Error('Failed to verify case deletion from local storage');
      }
      return verified;
    },
    onSuccess: (verifiedLocal) => {
      const merged = mergeCases(verifiedLocal, serverCases);
      queryClient.setQueryData(['mergedCases'], merged);
    },
  });

  // Import cases mutation
  const importCases = useMutation({
    mutationFn: async (newCases: LocalSurgeryCase[]) => {
      const currentLocal = loadCasesFromLocal().map(normalizeCase);
      const normalizedNew = newCases.map(normalizeCase);
      const updatedLocal = [...currentLocal, ...normalizedNew];
      saveCasesToLocal(updatedLocal);
      
      // Verify save by reloading
      const verified = loadCasesFromLocal().map(normalizeCase);
      return verified;
    },
    onSuccess: (verifiedLocal) => {
      const merged = mergeCases(verifiedLocal, serverCases);
      queryClient.setQueryData(['mergedCases'], merged);
    },
  });

  return {
    cases,
    isLoading,
    addCase,
    updateCase,
    deleteCase,
    importCases,
  };
}
