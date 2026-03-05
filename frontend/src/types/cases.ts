import type { SurgeryCase, TasksChecklist, CompletePatientDemographics } from '../backend';

export type { TasksChecklist, CompletePatientDemographics };

export interface LocalSurgeryCase extends SurgeryCase {
  pendingSync?: boolean;
  demographicsRawText?: string;
  capturedImageUrl?: string;
  localId?: string;
}

export interface CaseFormData {
  medicalRecordNumber: string;
  arrivalDate: string;
  petName: string;
  ownerLastName: string;
  species: 'Canine' | 'Feline' | 'Other';
  breed: string;
  sex: 'Male' | 'Male Neutered' | 'Female' | 'Female Spayed';
  dateOfBirth: string;
  presentingComplaint: string;
  notes: string;
  demographicsRawText: string;
  capturedImageUrl?: string;
  requiredTasks: TasksChecklist;
}
