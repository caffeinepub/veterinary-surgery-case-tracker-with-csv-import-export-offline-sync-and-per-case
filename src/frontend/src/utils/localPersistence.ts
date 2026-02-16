import type { LocalSurgeryCase } from '../types/cases';

const STORAGE_KEY = 'vet_surgery_cases';
const LAST_SYNC_KEY = 'vet_last_sync';

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

export function saveCasesLocally(cases: LocalSurgeryCase[]): void {
  try {
    // Ensure we're saving the complete case objects with all fields
    const casesToSave = cases.map((c) => ({
      ...c,
      patientDemographics: normalizeDemographics(c.patientDemographics),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(casesToSave));
  } catch (error) {
    console.error('Failed to save cases locally:', error);
  }
}

export function loadCasesLocally(): LocalSurgeryCase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const cases = JSON.parse(data);
    
    // Normalize cases to ensure all demographics fields exist with safe defaults
    // and preserve local-only fields (pendingSync, demographicsRawText, capturedImageUrl)
    return cases.map((c: any) => ({
      ...c,
      patientDemographics: normalizeDemographics(c.patientDemographics),
      pendingSync: c.pendingSync || false,
      demographicsRawText: c.demographicsRawText,
      capturedImageUrl: c.capturedImageUrl,
    }));
  } catch (error) {
    console.error('Failed to load cases locally:', error);
    return [];
  }
}

export function saveLastSyncTime(timestamp: bigint): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
  } catch (error) {
    console.error('Failed to save last sync time:', error);
  }
}

export function getLastSyncTime(): bigint {
  try {
    const data = localStorage.getItem(LAST_SYNC_KEY);
    return data ? BigInt(data) : BigInt(0);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return BigInt(0);
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error('Failed to clear local storage:', error);
  }
}
