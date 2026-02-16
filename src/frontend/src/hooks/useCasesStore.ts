import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { loadCasesLocally, saveCasesLocally } from '../utils/localPersistence';
import { mergeCases } from '../utils/mergeCases';
import type { LocalSurgeryCase } from '../types/cases';
import { normalizeTasksChecklist } from '../utils/tasksChecklist';
import { useState, useEffect } from 'react';

function normalizeDemographics(demographics: any) {
  return {
    name: String(demographics?.name || '').trim(),
    ownerLastName: String(demographics?.ownerLastName || '').trim(),
    species: String(demographics?.species || '').trim(),
    breed: String(demographics?.breed || '').trim(),
    sex: String(demographics?.sex || '').trim(),
    dateOfBirth: String(demographics?.dateOfBirth || '').trim(),
  };
}

export function useCasesStore() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [fetchError, setFetchError] = useState<string | null>(null);

  const casesQuery = useQuery<LocalSurgeryCase[]>({
    queryKey: ['surgeryCases'],
    queryFn: async () => {
      const localCases = loadCasesLocally();
      
      // Normalize local cases to ensure all fields exist
      const normalizedLocalCases = localCases.map((c) => ({
        ...c,
        patientDemographics: normalizeDemographics(c.patientDemographics),
        tasksChecklist: normalizeTasksChecklist(c.tasksChecklist),
      }));
      
      if (!actor) {
        setFetchError(null);
        return normalizedLocalCases;
      }

      try {
        const serverCases = await actor.getAllSurgeryCases();
        
        // Merge server cases with local cases (preserving local-only cases and fields)
        const mergedCases = mergeCases(normalizedLocalCases, serverCases);
        
        // Normalize merged cases
        const normalizedMergedCases = mergedCases.map((c) => ({
          ...c,
          patientDemographics: normalizeDemographics(c.patientDemographics),
          tasksChecklist: normalizeTasksChecklist(c.tasksChecklist),
        }));
        
        saveCasesLocally(normalizedMergedCases);
        setFetchError(null);
        return normalizedMergedCases;
      } catch (error: any) {
        const errorMessage = error.message?.includes('Unauthorized')
          ? 'Not authorized to access cases from backend'
          : 'Failed to fetch cases from backend';
        
        console.error('Failed to fetch from server, using local:', error);
        setFetchError(errorMessage);
        return normalizedLocalCases;
      }
    },
    enabled: !actorFetching,
    retry: false,
  });

  const addCase = useMutation({
    mutationFn: async (newCase: LocalSurgeryCase) => {
      const currentCases = casesQuery.data || [];
      const normalizedCase = {
        ...newCase,
        patientDemographics: normalizeDemographics(newCase.patientDemographics),
        tasksChecklist: normalizeTasksChecklist(newCase.tasksChecklist),
        pendingSync: true,
      };
      const updatedCases = [...currentCases, normalizedCase];
      saveCasesLocally(updatedCases);
      return updatedCases;
    },
    onSuccess: (updatedCases) => {
      queryClient.setQueryData(['surgeryCases'], updatedCases);
    },
  });

  const updateCase = useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: bigint; updates: Partial<LocalSurgeryCase> }) => {
      const currentCases = casesQuery.data || [];
      const updatedCases = currentCases.map((c) => {
        if (c.caseId === caseId) {
          const updated = { ...c, ...updates, pendingSync: true };
          if (updates.patientDemographics) {
            updated.patientDemographics = normalizeDemographics(updates.patientDemographics);
          }
          if (updates.tasksChecklist) {
            updated.tasksChecklist = normalizeTasksChecklist(updates.tasksChecklist);
          }
          return updated;
        }
        return c;
      });
      saveCasesLocally(updatedCases);
      return updatedCases;
    },
    onSuccess: (updatedCases) => {
      queryClient.setQueryData(['surgeryCases'], updatedCases);
    },
  });

  const importCases = useMutation({
    mutationFn: async (importedCases: LocalSurgeryCase[]) => {
      const currentCases = casesQuery.data || [];
      const normalizedImported = importedCases.map((c) => ({
        ...c,
        patientDemographics: normalizeDemographics(c.patientDemographics),
        tasksChecklist: normalizeTasksChecklist(c.tasksChecklist),
      }));
      const updatedCases = [...currentCases, ...normalizedImported];
      saveCasesLocally(updatedCases);
      return updatedCases;
    },
    onSuccess: (updatedCases) => {
      queryClient.setQueryData(['surgeryCases'], updatedCases);
    },
  });

  return {
    cases: casesQuery.data || [],
    isLoading: casesQuery.isLoading,
    fetchError,
    addCase,
    updateCase,
    importCases,
  };
}
