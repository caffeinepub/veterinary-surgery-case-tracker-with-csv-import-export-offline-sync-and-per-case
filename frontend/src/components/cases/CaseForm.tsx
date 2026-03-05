import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import DateField from './DateField';
import DemographicsQuickAdd from './DemographicsQuickAdd';
import { useCasesStore } from '../../hooks/useCasesStore';
import { dateOnlyToNanoseconds, nanosecondsToDateOnlyString, getTodayDateOnlyString } from '../../utils/dates';
import { findLatestMatchingCase, getPrefillData } from '../../utils/prefill';
import type { CaseFormData, LocalSurgeryCase } from '../../types/cases';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';
import { TASK_DEFINITIONS, createDefaultTasksChecklist, setTaskRequired, normalizeTasksChecklist, createTasksChecklistForNewCase } from '../../utils/tasksChecklist';
import type { TasksChecklist } from '../../types/cases';
import type { ExtractedDemographics } from '../../utils/demographicsExtract';

interface CaseFormProps {
  editingCaseId: bigint | null;
  onCancelEdit: () => void;
  onSaveComplete: () => void;
}

const getInitialFormData = (): CaseFormData => ({
  medicalRecordNumber: '',
  arrivalDate: getTodayDateOnlyString(),
  petName: '',
  ownerLastName: '',
  species: 'Canine',
  breed: '',
  sex: 'Male',
  dateOfBirth: '',
  presentingComplaint: '',
  notes: '',
  demographicsRawText: '',
  capturedImageUrl: undefined,
  requiredTasks: createDefaultTasksChecklist(),
});

export default function CaseForm({ editingCaseId, onCancelEdit, onSaveComplete }: CaseFormProps) {
  const { cases, addCase, updateCase } = useCasesStore();
  const [formData, setFormData] = useState<CaseFormData>(getInitialFormData());
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showPrefillSuggestion, setShowPrefillSuggestion] = useState(false);
  const [prefillCase, setPrefillCase] = useState<any>(null);
  const [hasAutoPrefilled, setHasAutoPrefilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitializedRef = useRef(false);

  // Initialize form data once when component mounts or editingCaseId changes
  useEffect(() => {
    if (!cases) return;

    if (editingCaseId) {
      const caseToEdit = cases.find((c) => c.caseId === editingCaseId);
      if (caseToEdit) {
        setFormData({
          medicalRecordNumber: caseToEdit.medicalRecordNumber,
          arrivalDate: nanosecondsToDateOnlyString(caseToEdit.arrivalDate),
          petName: caseToEdit.patientDemographics.name,
          ownerLastName: caseToEdit.patientDemographics.ownerLastName,
          species: caseToEdit.patientDemographics.species as any,
          breed: caseToEdit.patientDemographics.breed,
          sex: caseToEdit.patientDemographics.sex as any,
          dateOfBirth: caseToEdit.patientDemographics.dateOfBirth || '',
          presentingComplaint: caseToEdit.presentingComplaint || '',
          notes: caseToEdit.notes || '',
          demographicsRawText: caseToEdit.demographicsRawText || '',
          capturedImageUrl: caseToEdit.capturedImageUrl,
          requiredTasks: normalizeTasksChecklist(caseToEdit.tasksChecklist),
        });
        setTouchedFields(new Set());
        setHasAutoPrefilled(false);
        setShowPrefillSuggestion(false);
        setPrefillCase(null);
        isInitializedRef.current = true;
      }
    } else {
      // Reset form when creating new case
      setFormData(getInitialFormData());
      setTouchedFields(new Set());
      setShowPrefillSuggestion(false);
      setPrefillCase(null);
      setHasAutoPrefilled(false);
      isInitializedRef.current = true;
    }
  }, [editingCaseId, cases]);

  // Handle prefill suggestion - only run after initialization and when not editing
  useEffect(() => {
    if (!isInitializedRef.current || !cases) return;
    if (editingCaseId || hasAutoPrefilled) return;
    if (!formData.medicalRecordNumber.trim()) {
      setShowPrefillSuggestion(false);
      setPrefillCase(null);
      return;
    }

    const matchingCase = findLatestMatchingCase(formData.medicalRecordNumber, cases);
    if (matchingCase) {
      const hasUntouchedFields = ['petName', 'ownerLastName', 'species', 'breed', 'sex', 'dateOfBirth'].some(
        (field) => !touchedFields.has(field)
      );
      if (hasUntouchedFields) {
        setShowPrefillSuggestion(true);
        setPrefillCase(matchingCase);
      } else {
        setShowPrefillSuggestion(false);
        setPrefillCase(null);
      }
    } else {
      setShowPrefillSuggestion(false);
      setPrefillCase(null);
    }
  }, [formData.medicalRecordNumber, cases, editingCaseId, touchedFields, hasAutoPrefilled]);

  const handlePrefill = () => {
    if (prefillCase) {
      const prefillData = getPrefillData(prefillCase);
      setFormData((prev) => ({
        ...prev,
        petName: prefillData.petName,
        ownerLastName: prefillData.ownerLastName,
        species: prefillData.species as 'Canine' | 'Feline' | 'Other',
        breed: prefillData.breed,
        sex: prefillData.sex as 'Male' | 'Male Neutered' | 'Female' | 'Female Spayed',
        dateOfBirth: prefillData.dateOfBirth,
      }));
      setHasAutoPrefilled(true);
      setShowPrefillSuggestion(false);
      toast.success('Demographics prefilled from previous case');
    }
  };

  const handleDismissPrefill = () => {
    setShowPrefillSuggestion(false);
    setHasAutoPrefilled(true);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));
  };

  // Helper to check if a field is effectively empty (null, undefined, or whitespace-only)
  const isFieldEmpty = (value: any): boolean => {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  };

  const handlePasteExtraction = (extracted: ExtractedDemographics) => {
    if (!extracted || Object.keys(extracted).length === 0) {
      toast.info('No demographics detected in pasted text');
      return;
    }

    const updates: Partial<CaseFormData> = {};
    let filledCount = 0;

    // Only fill fields that are empty (including whitespace-only) and not touched
    if (extracted.medicalRecordNumber && isFieldEmpty(formData.medicalRecordNumber) && !touchedFields.has('medicalRecordNumber')) {
      updates.medicalRecordNumber = extracted.medicalRecordNumber;
      filledCount++;
    }
    if (extracted.petName && isFieldEmpty(formData.petName) && !touchedFields.has('petName')) {
      updates.petName = extracted.petName;
      filledCount++;
    }
    if (extracted.ownerLastName && isFieldEmpty(formData.ownerLastName) && !touchedFields.has('ownerLastName')) {
      updates.ownerLastName = extracted.ownerLastName;
      filledCount++;
    }
    if (extracted.species && !touchedFields.has('species')) {
      updates.species = extracted.species;
      filledCount++;
    }
    if (extracted.breed && isFieldEmpty(formData.breed) && !touchedFields.has('breed')) {
      updates.breed = extracted.breed;
      filledCount++;
    }
    if (extracted.sex && !touchedFields.has('sex')) {
      updates.sex = extracted.sex;
      filledCount++;
    }
    if (extracted.dateOfBirth && isFieldEmpty(formData.dateOfBirth) && !touchedFields.has('dateOfBirth')) {
      updates.dateOfBirth = extracted.dateOfBirth;
      filledCount++;
    }
    if (extracted.arrivalDate && !touchedFields.has('arrivalDate')) {
      updates.arrivalDate = extracted.arrivalDate;
      filledCount++;
    }
    if (extracted.presentingComplaint && isFieldEmpty(formData.presentingComplaint) && !touchedFields.has('presentingComplaint')) {
      updates.presentingComplaint = extracted.presentingComplaint;
      filledCount++;
    }

    if (filledCount > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
      toast.success(`Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''} from pasted text`);
    } else {
      toast.info('No new fields to fill from pasted text');
    }
  };

  const handleTaskToggle = (taskKey: keyof TasksChecklist) => {
    setFormData((prev) => {
      const normalized = normalizeTasksChecklist(prev.requiredTasks);
      return {
        ...prev,
        requiredTasks: setTaskRequired(normalized, taskKey, !normalized[taskKey].required),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const arrivalDateNanos = dateOnlyToNanoseconds(formData.arrivalDate);

      if (editingCaseId) {
        // For editing, preserve the existing required flags
        const normalizedTasks = normalizeTasksChecklist(formData.requiredTasks);
        
        await updateCase.mutateAsync({
          caseId: editingCaseId,
          updates: {
            medicalRecordNumber: formData.medicalRecordNumber,
            presentingComplaint: formData.presentingComplaint,
            arrivalDate: arrivalDateNanos,
            patientDemographics: {
              name: formData.petName,
              ownerLastName: formData.ownerLastName,
              species: formData.species,
              breed: formData.breed,
              sex: formData.sex,
              dateOfBirth: formData.dateOfBirth,
            },
            tasksChecklist: normalizedTasks,
            notes: formData.notes,
            demographicsRawText: formData.demographicsRawText,
            capturedImageUrl: formData.capturedImageUrl,
          },
        });
        toast.success('Case updated successfully');
        onSaveComplete();
      } else {
        // For new cases, only include tasks that were checked in the form
        const newCaseTasks = createTasksChecklistForNewCase(formData.requiredTasks);
        
        // Generate a collision-resistant local caseId using timestamp + random component
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const caseId = BigInt(timestamp) * BigInt(1000000) + BigInt(random);
        
        const newCase: LocalSurgeryCase = {
          caseId,
          medicalRecordNumber: formData.medicalRecordNumber,
          presentingComplaint: formData.presentingComplaint,
          arrivalDate: arrivalDateNanos,
          patientDemographics: {
            name: formData.petName,
            ownerLastName: formData.ownerLastName,
            species: formData.species,
            breed: formData.breed,
            sex: formData.sex,
            dateOfBirth: formData.dateOfBirth,
          },
          tasksChecklist: newCaseTasks,
          notes: formData.notes,
          lastSyncTimestamp: BigInt(timestamp) * BigInt(1000000),
          isSynchronized: false,
          pendingSync: true,
          demographicsRawText: formData.demographicsRawText,
          capturedImageUrl: formData.capturedImageUrl,
        };

        await addCase.mutateAsync(newCase);
        toast.success('Case created successfully');
        onSaveComplete();
      }
    } catch (error: any) {
      console.error('Failed to save case:', error);
      toast.error(error.message || 'Failed to save case. Please try again.');
      // Don't close the modal on error - let user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showPrefillSuggestion && prefillCase && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              Found previous case for MRN {formData.medicalRecordNumber}. Auto-fill demographics?
            </span>
            <div className="flex gap-2 ml-4">
              <Button type="button" size="sm" variant="outline" onClick={handleDismissPrefill}>
                No
              </Button>
              <Button type="button" size="sm" onClick={handlePrefill}>
                <Sparkles className="h-3 w-3 mr-1" />
                Yes
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <DemographicsQuickAdd onPaste={handlePasteExtraction} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicalRecordNumber">Medical Record Number *</Label>
          <Input
            id="medicalRecordNumber"
            value={formData.medicalRecordNumber}
            onChange={(e) => handleFieldChange('medicalRecordNumber', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Arrival Date *</Label>
          <DateField
            value={formData.arrivalDate}
            onChange={(value) => handleFieldChange('arrivalDate', value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="petName">Pet Name *</Label>
          <Input
            id="petName"
            value={formData.petName}
            onChange={(e) => handleFieldChange('petName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerLastName">Owner Last Name *</Label>
          <Input
            id="ownerLastName"
            value={formData.ownerLastName}
            onChange={(e) => handleFieldChange('ownerLastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="species">Species *</Label>
          <Select value={formData.species} onValueChange={(value) => handleFieldChange('species', value)}>
            <SelectTrigger id="species">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Canine">Canine</SelectItem>
              <SelectItem value="Feline">Feline</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Breed *</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => handleFieldChange('breed', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex *</Label>
          <Select value={formData.sex} onValueChange={(value) => handleFieldChange('sex', value)}>
            <SelectTrigger id="sex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Male Neutered">Male Neutered</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Female Spayed">Female Spayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <DateField
          value={formData.dateOfBirth}
          onChange={(value) => handleFieldChange('dateOfBirth', value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="presentingComplaint">Presenting Complaint</Label>
        <Textarea
          id="presentingComplaint"
          value={formData.presentingComplaint}
          onChange={(e) => handleFieldChange('presentingComplaint', e.target.value)}
          placeholder="Brief description of the patient's condition..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Case Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Additional notes about this case..."
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <Label>Required Tasks</Label>
        <div className="space-y-2 pl-1">
          {TASK_DEFINITIONS.map((task) => (
            <label key={task.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiredTasks[task.key].required}
                onChange={() => handleTaskToggle(task.key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{task.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : editingCaseId ? (
            'Update Case'
          ) : (
            'Create Case'
          )}
        </Button>
      </div>
    </form>
  );
}
