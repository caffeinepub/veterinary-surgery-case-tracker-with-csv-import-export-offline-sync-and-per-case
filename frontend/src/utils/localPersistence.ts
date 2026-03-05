import type { LocalSurgeryCase } from '../types/cases';

const CASES_STORAGE_KEY = 'surgery_cases_local';

export function loadCasesFromLocal(): LocalSurgeryCase[] {
  try {
    const stored = localStorage.getItem(CASES_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored, (key, value) => {
      if (typeof value === 'string' && /^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
      }
      return value;
    });

    // Normalize loaded cases to ensure all expected fields exist
    return parsed.map((c: any) => ({
      ...c,
      presentingComplaint: c.presentingComplaint || '',
      notes: c.notes || '',
      capturedImageUrl: c.capturedImageUrl || undefined,
      demographicsRawText: c.demographicsRawText || '',
      pendingSync: c.pendingSync !== undefined ? c.pendingSync : false,
    }));
  } catch (error) {
    console.error('Failed to load cases from localStorage:', error);
    return [];
  }
}

export function saveCasesToLocal(cases: LocalSurgeryCase[]): void {
  try {
    const serialized = JSON.stringify(cases, (key, value) =>
      typeof value === 'bigint' ? `${value}n` : value
    );
    localStorage.setItem(CASES_STORAGE_KEY, serialized);

    // Verify the save by reading back
    const verification = localStorage.getItem(CASES_STORAGE_KEY);
    if (!verification) {
      throw new Error('Failed to verify localStorage save');
    }
  } catch (error) {
    console.error('Failed to save cases to localStorage:', error);
    throw new Error('Failed to save cases locally. Please check your browser storage settings.');
  }
}

export function clearLocalCases(): void {
  try {
    localStorage.removeItem(CASES_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear local cases:', error);
  }
}
