import type { LocalSurgeryCase } from '../types/cases';
import type { CaseFormData } from '../types/cases';

export function findLatestMatchingCase(
  medicalRecordNumber: string,
  cases: LocalSurgeryCase[]
): LocalSurgeryCase | null {
  if (!medicalRecordNumber.trim()) return null;

  const matchingCases = cases.filter(
    (c) => c.medicalRecordNumber === medicalRecordNumber.trim()
  );

  if (matchingCases.length === 0) return null;

  return matchingCases.sort((a, b) => {
    return Number(b.arrivalDate - a.arrivalDate);
  })[0];
}

export function getPrefillData(matchingCase: LocalSurgeryCase): Partial<CaseFormData> {
  const demographics = matchingCase.patientDemographics;
  
  return {
    petName: demographics.name,
    ownerLastName: '', // Not stored in backend
    species: demographics.species as 'Canine' | 'Feline' | 'Other',
    breed: demographics.breed,
    sex: 'Male', // Not stored in backend, default
    dateOfBirth: null, // Age is stored, not DOB
  };
}
