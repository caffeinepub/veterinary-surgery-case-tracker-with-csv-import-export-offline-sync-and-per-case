import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { loadCasesLocally, saveCasesLocally } from '../utils/localPersistence';
import type { LocalSurgeryCase } from '../types/cases';
import type { SurgeryCase } from '../backend';
import { normalizeTasksChecklist } from '../utils/tasksChecklist';

export function useCasesStore() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const casesQuery = useQuery<LocalSurgeryCase[]>({
    queryKey: ['surgeryCases'],
    queryFn: async () => {
      const localCases = loadCasesLocally();
      
      // Normalize local cases
      const normalizedLocalCases = localCases.map((c) => ({
        ...c,
        tasksChecklist: normalizeTasksChecklist(c.tasksChecklist),
      }));
      
      if (!actor) {
        return normalizedLocalCases;
      }

      try {
        const serverCases = await actor.getAllSurgeryCases();
        const mergedCases: LocalSurgeryCase[] = serverCases.map((sc) => ({
          ...sc,
          tasksChecklist: normalizeTasksChecklist(sc.tasksChecklist),
          pendingSync: false,
        }));
        saveCasesLocally(mergedCases);
        return mergedCases;
      } catch (error) {
        console.error('Failed to fetch from server, using local:', error);
        return normalizedLocalCases;
      }
    },
    enabled: !actorFetching,
  });

  const addCase = useMutation({
    mutationFn: async (newCase: LocalSurgeryCase) => {
      const currentCases = casesQuery.data || [];
      const normalizedCase = {
        ...newCase,
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
    addCase,
    updateCase,
    importCases,
  };
}
