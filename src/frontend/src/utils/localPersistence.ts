import type { LocalSurgeryCase } from '../types/cases';

const STORAGE_KEY = 'vet_surgery_cases';
const LAST_SYNC_KEY = 'vet_last_sync';

export function saveCasesLocally(cases: LocalSurgeryCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (error) {
    console.error('Failed to save cases locally:', error);
  }
}

export function loadCasesLocally(): LocalSurgeryCase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
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
