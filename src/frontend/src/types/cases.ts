import type { SurgeryCase as BackendSurgeryCase, TasksChecklist, PatientDemographics } from '../backend';

export interface LocalSurgeryCase extends BackendSurgeryCase {
  localId?: string;
  pendingSync?: boolean;
  demographicsRawText?: string;
  capturedImageUrl?: string;
}

export interface CaseFormData {
  medicalRecordNumber: string;
  arrivalDate: Date;
  petName: string;
  ownerLastName: string;
  species: 'Canine' | 'Feline' | 'Other';
  breed: string;
  sex: 'Male' | 'Male Neutered' | 'Female' | 'Female Spayed';
  dateOfBirth: Date | null;
  presentingComplaint: string;
  notes: string;
  demographicsRawText: string;
  requiredTasks: TasksChecklist;
}

export type { TasksChecklist, PatientDemographics };
