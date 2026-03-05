import type { LocalSurgeryCase } from '../types/cases';
import type { SurgeryCase } from '../backend';

/**
 * Merges local and server cases by caseId, preserving local-only fields
 * and ensuring no cases are lost during fetch/sync operations.
 * 
 * @param localCases - Cases from localStorage (may include pendingSync, demographicsRawText, capturedImageUrl)
 * @param serverCases - Cases from backend (authoritative for shared caseIds)
 * @returns Merged array where server data wins for shared caseIds, but local-only fields are preserved
 */
export function mergeCases(
  localCases: LocalSurgeryCase[],
  serverCases: SurgeryCase[]
): LocalSurgeryCase[] {
  const mergedMap = new Map<string, LocalSurgeryCase>();

  // First, add all local cases to the map
  for (const localCase of localCases) {
    const key = localCase.caseId.toString();
    mergedMap.set(key, localCase);
  }

  // Then, update with server cases (server data wins for shared fields)
  for (const serverCase of serverCases) {
    const key = serverCase.caseId.toString();
    const existingLocal = mergedMap.get(key);

    // If case exists locally, preserve local-only fields
    if (existingLocal) {
      mergedMap.set(key, {
        ...serverCase,
        pendingSync: existingLocal.pendingSync || false,
        demographicsRawText: existingLocal.demographicsRawText,
        capturedImageUrl: existingLocal.capturedImageUrl,
      });
    } else {
      // New case from server
      mergedMap.set(key, {
        ...serverCase,
        pendingSync: false,
      });
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Prepares cases for sync by merging server state with local pending changes.
 * This ensures syncLocalChanges receives the full union of cases, not just a subset.
 * 
 * @param localCases - All local cases (including pending)
 * @param serverCases - Current server cases
 * @returns Array of cases to sync (server cases + local pending changes applied)
 */
export function prepareCasesForSync(
  localCases: LocalSurgeryCase[],
  serverCases: SurgeryCase[]
): SurgeryCase[] {
  const syncMap = new Map<string, SurgeryCase>();

  // Start with all server cases
  for (const serverCase of serverCases) {
    const key = serverCase.caseId.toString();
    syncMap.set(key, serverCase);
  }

  // Apply local pending changes (overwrite server fields for shared caseIds, add new cases)
  for (const localCase of localCases) {
    if (localCase.pendingSync) {
      const key = localCase.caseId.toString();
      // Convert LocalSurgeryCase to SurgeryCase (strip local-only fields)
      const { pendingSync, demographicsRawText, capturedImageUrl, localId, ...serverFields } = localCase;
      syncMap.set(key, serverFields as SurgeryCase);
    }
  }

  return Array.from(syncMap.values());
}
