import type { LocalSurgeryCase } from '../types/cases';

/**
 * Finds the most recent case matching the given MRN
 */
export function findLatestMatchingCase(
  mrn: string,
  cases: LocalSurgeryCase[]
): LocalSurgeryCase | null {
  if (!mrn || !mrn.trim()) return null;

  const normalizedMrn = mrn.trim().toLowerCase();
  const matchingCases = cases.filter(
    (c) => c.medicalRecordNumber.trim().toLowerCase() === normalizedMrn
  );

  if (matchingCases.length === 0) return null;

  // Sort by arrival date descending (most recent first)
  matchingCases.sort((a, b) => {
    const diff = Number(b.arrivalDate - a.arrivalDate);
    if (diff !== 0) return diff;
    return Number(b.caseId - a.caseId);
  });

  return matchingCases[0];
}

/**
 * Extracts prefill data from a case
 */
export function getPrefillData(sourceCase: LocalSurgeryCase) {
  return {
    petName: sourceCase.patientDemographics.name || '',
    ownerLastName: sourceCase.patientDemographics.ownerLastName || '',
    species: sourceCase.patientDemographics.species || 'Canine',
    breed: sourceCase.patientDemographics.breed || '',
    sex: sourceCase.patientDemographics.sex || 'Male',
    dateOfBirth: sourceCase.patientDemographics.dateOfBirth || '',
  };
}
