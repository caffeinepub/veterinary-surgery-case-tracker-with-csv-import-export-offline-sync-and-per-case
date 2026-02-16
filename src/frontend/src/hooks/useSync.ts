import { useState } from 'react';
import { useActor } from './useActor';
import { useQueryClient } from '@tanstack/react-query';
import { loadCasesLocally, saveCasesLocally, saveLastSyncTime } from '../utils/localPersistence';
import type { LocalSurgeryCase } from '../types/cases';

export function useSync() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sync = async () => {
    if (!actor) {
      setSyncError('Not connected to backend');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const localCases = loadCasesLocally();
      const pendingCases = localCases.filter((c) => c.pendingSync);

      if (pendingCases.length > 0) {
        await actor.syncLocalChanges(pendingCases);
      }

      const serverCases = await actor.getAllSurgeryCases();
      
      const mergedCases: LocalSurgeryCase[] = serverCases.map((sc) => ({
        ...sc,
        pendingSync: false,
      }));

      saveCasesLocally(mergedCases);
      saveLastSyncTime(BigInt(Date.now()) * BigInt(1_000_000));

      queryClient.setQueryData(['surgeryCases'], serverCases);
      queryClient.invalidateQueries({ queryKey: ['surgeryCases'] });

      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
      setIsSyncing(false);
      return false;
    }
  };

  return { sync, isSyncing, syncError };
}
