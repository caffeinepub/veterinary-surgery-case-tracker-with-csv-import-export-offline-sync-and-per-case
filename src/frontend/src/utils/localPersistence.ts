import type { LocalSurgeryCase } from '../types/cases';

const STORAGE_KEY = 'surgery-cases-local';

/**
 * Custom JSON serializer that handles BigInt values
 */
function serializeWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

/**
 * Custom JSON deserializer that restores BigInt values
 */
function deserializeWithBigInt(json: string): any {
  return JSON.parse(json, (key, value) => {
    // Restore BigInt for known fields
    if (key === 'caseId' || key === 'arrivalDate' || key === 'lastSyncTimestamp') {
      return typeof value === 'string' ? BigInt(value) : value;
    }
    return value;
  });
}

/**
 * Normalizes a case to ensure all expected fields are present
 */
function normalizeCase(c: any): LocalSurgeryCase {
  return {
    ...c,
    presentingComplaint: c.presentingComplaint ?? '',
    demographicsRawText: c.demographicsRawText ?? '',
    capturedImageUrl: c.capturedImageUrl ?? undefined,
    pendingSync: c.pendingSync ?? false,
  };
}

/**
 * Saves cases to localStorage with BigInt support
 * @throws Error if save fails (including quota exceeded)
 */
export function saveCasesToLocal(cases: LocalSurgeryCase[]): void {
  try {
    const serialized = serializeWithBigInt(cases);
    localStorage.setItem(STORAGE_KEY, serialized);
    
    // Verify the save was successful by reading back
    const verification = localStorage.getItem(STORAGE_KEY);
    if (verification !== serialized) {
      throw new Error('Local storage verification failed');
    }
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please clear some space and try again.');
    }
    throw new Error(`Failed to save to local storage: ${error.message}`);
  }
}

/**
 * Loads cases from localStorage with BigInt support and normalization
 */
export function loadCasesFromLocal(): LocalSurgeryCase[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = deserializeWithBigInt(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeCase) : [];
  } catch (error) {
    console.error('Failed to load cases from localStorage:', error);
    return [];
  }
}

/**
 * Clears all cases from localStorage
 */
export function clearLocalCases(): void {
  localStorage.removeItem(STORAGE_KEY);
}
