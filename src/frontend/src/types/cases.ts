import type { SurgeryCase as BackendSurgeryCase, TasksChecklist, CompletePatientDemographics } from '../backend';

export interface LocalSurgeryCase extends BackendSurgeryCase {
  localId?: string;
  pendingSync?: boolean;
  demographicsRawText?: string;
  capturedImageUrl?: string;
}

export interface CaseFormData {
  medicalRecordNumber: string;
  arrivalDate: string; // YYYY-MM-DD date-only string
  petName: string;
  ownerLastName: string;
  species: 'Canine' | 'Feline' | 'Other';
  breed: string;
  sex: 'Male' | 'Male Neutered' | 'Female' | 'Female Spayed';
  dateOfBirth: string; // YYYY-MM-DD date-only string (empty if not set)
  presentingComplaint: string;
  notes: string;
  demographicsRawText: string;
  capturedImageUrl?: string;
  requiredTasks: TasksChecklist;
}

export type { TasksChecklist, CompletePatientDemographics };
