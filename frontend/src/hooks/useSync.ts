import { useState } from 'react';
import { useActor } from './useActor';
import { useQueryClient } from '@tanstack/react-query';
import { loadCasesFromLocal, saveCasesToLocal } from '../utils/localPersistence';
import { mergeCases, prepareCasesForSync } from '../utils/mergeCases';
import type { LocalSurgeryCase } from '../types/cases';
import { normalizeTasksChecklist } from '../utils/tasksChecklist';
import { classifyBackendError } from '../utils/backendErrorMessages';
import type { SurgeryCase } from '../backend';

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
 * Fetches all surgery cases using pagination to avoid heap overflow.
 * @param actor - The backend actor
 * @returns Array of all surgery cases
 */
async function fetchAllCasesPaginated(actor: any): Promise<SurgeryCase[]> {
  const pageSize = 50; // Conservative page size to avoid heap issues
  let allCases: SurgeryCase[] = [];
  let start = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await actor.getSurgeryCases(BigInt(start), BigInt(pageSize));
    
    if (page.length === 0) {
      hasMore = false;
    } else {
      allCases = allCases.concat(page);
      start += page.length;
      
      // If we got fewer results than requested, we've reached the end
      if (page.length < pageSize) {
        hasMore = false;
      }
    }
  }

  return allCases;
}

export function useSync() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sync = async () => {
    if (!actor) {
      setSyncError('Backend connection not available');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const localCases = loadCasesFromLocal().map(normalizeCase);
      const pendingCases = localCases.filter((c) => c.pendingSync);

      // Fetch current server state using pagination
      const currentServerCases = await fetchAllCasesPaginated(actor);

      // If there are pending changes, prepare full union for sync
      if (pendingCases.length > 0) {
        const casesToSync = prepareCasesForSync(localCases, currentServerCases);
        await actor.syncLocalChanges(casesToSync);
      }

      // Re-fetch after sync to get the complete server state
      const serverCases = await fetchAllCasesPaginated(actor);
      
      // Merge server cases with local cases (preserving local-only fields)
      const mergedCases = mergeCases(localCases, serverCases);
      
      // Normalize merged cases
      const normalizedMergedCases: LocalSurgeryCase[] = mergedCases.map((c) => ({
        ...c,
        patientDemographics: normalizeDemographics(c.patientDemographics),
        tasksChecklist: normalizeTasksChecklist(c.tasksChecklist),
        presentingComplaint: c.presentingComplaint ?? '',
        pendingSync: false, // Clear pending flag after successful sync
      }));

      saveCasesToLocal(normalizedMergedCases);

      // Update both query keys
      queryClient.setQueryData(['mergedCases'], normalizedMergedCases);
      queryClient.invalidateQueries({ queryKey: ['serverSurgeryCases'] });
      queryClient.invalidateQueries({ queryKey: ['mergedCases'] });

      setIsSyncing(false);
      return true;
    } catch (error: any) {
      console.error('Sync failed:', error);
      
      // Use classified error for user-facing message
      const classified = classifyBackendError(error, 'sync');
      setSyncError(classified.message);
      
      setIsSyncing(false);
      return false;
    }
  };

  return { sync, isSyncing, syncError };
}
