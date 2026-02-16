import type { LocalSurgeryCase } from '../types/cases';

const STORAGE_KEY = 'surgery-cases';

/**
 * Normalize a case loaded from storage to ensure all required fields exist.
 * Handles backward compatibility for legacy capturedImageUrl and other fields.
 */
function normalizeCase(rawCase: any): LocalSurgeryCase {
  return {
    caseId: BigInt(rawCase.caseId || 0),
    medicalRecordNumber: rawCase.medicalRecordNumber || '',
    presentingComplaint: rawCase.presentingComplaint || '',
    arrivalDate: BigInt(rawCase.arrivalDate || 0),
    patientDemographics: {
      name: rawCase.patientDemographics?.name || '',
      ownerLastName: rawCase.patientDemographics?.ownerLastName || '',
      species: rawCase.patientDemographics?.species || 'Canine',
      breed: rawCase.patientDemographics?.breed || '',
      sex: rawCase.patientDemographics?.sex || 'Male',
      dateOfBirth: rawCase.patientDemographics?.dateOfBirth || '',
    },
    tasksChecklist: rawCase.tasksChecklist || {
      dischargeNotes: { required: false, checked: false },
      pdvmNotified: { required: false, checked: false },
      labs: { required: false, checked: false },
      histo: { required: false, checked: false },
      surgeryReport: { required: false, checked: false },
      imaging: { required: false, checked: false },
      culture: { required: false, checked: false },
    },
    lastSyncTimestamp: BigInt(rawCase.lastSyncTimestamp || 0),
    isSynchronized: rawCase.isSynchronized ?? false,
    pendingSync: rawCase.pendingSync ?? false,
    demographicsRawText: rawCase.demographicsRawText || '',
    capturedImageUrl: rawCase.capturedImageUrl, // Preserve legacy field
  };
}

/**
 * Custom JSON serializer that handles BigInt values.
 */
function serializeJSON(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

/**
 * Custom JSON deserializer that converts BigInt strings back to BigInt.
 */
function deserializeJSON(json: string): any {
  return JSON.parse(json, (key, value) => {
    if (
      typeof value === 'string' &&
      (key === 'caseId' || key === 'arrivalDate' || key === 'lastSyncTimestamp')
    ) {
      try {
        return BigInt(value);
      } catch {
        return value;
      }
    }
    return value;
  });
}

/**
 * Load all cases from localStorage with normalization for backward compatibility.
 */
export function loadCasesFromLocal(): LocalSurgeryCase[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const rawCases = deserializeJSON(stored);
    if (!Array.isArray(rawCases)) return [];

    return rawCases.map(normalizeCase);
  } catch (error) {
    console.error('Failed to load cases from localStorage:', error);
    return [];
  }
}

/**
 * Save cases to localStorage with verification.
 * Throws an error if the save fails.
 */
export function saveCasesToLocal(cases: LocalSurgeryCase[]): void {
  try {
    const serialized = serializeJSON(cases);
    localStorage.setItem(STORAGE_KEY, serialized);

    // Verify the save was successful
    const verification = localStorage.getItem(STORAGE_KEY);
    if (verification !== serialized) {
      throw new Error('localStorage verification failed after save');
    }
  } catch (error) {
    console.error('Failed to save cases to localStorage:', error);
    throw new Error('Failed to save cases locally. Please check your browser storage settings.');
  }
}

/**
 * Clear all cases from localStorage.
 */
export function clearLocalCases(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cases from localStorage:', error);
  }
}
