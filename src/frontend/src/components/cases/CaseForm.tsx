import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import DateField from './DateField';
import DemographicsQuickAdd from './DemographicsQuickAdd';
import { useCreateSurgeryCase, useUpdateSurgeryCase } from '../../hooks/useQueries';
import { useCasesStore } from '../../hooks/useCasesStore';
import { dateOnlyToNanoseconds, nanosecondsToDateOnlyString, getTodayDateOnlyString } from '../../utils/dates';
import { findLatestMatchingCase, getPrefillData } from '../../utils/prefill';
import type { CaseFormData } from '../../types/cases';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';
import { TASK_DEFINITIONS, createDefaultTasksChecklist, setTaskRequired } from '../../utils/tasksChecklist';
import type { TasksChecklist } from '../../types/cases';

interface CaseFormProps {
  editingCaseId: bigint | null;
  onCancelEdit: () => void;
  onSaveComplete: () => void;
}

export default function CaseForm({ editingCaseId, onCancelEdit, onSaveComplete }: CaseFormProps) {
  const { cases } = useCasesStore();
  const createCase = useCreateSurgeryCase();
  const updateCase = useUpdateSurgeryCase();

  const [formData, setFormData] = useState<CaseFormData>({
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
    requiredTasks: createDefaultTasksChecklist(),
  });

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showPrefillSuggestion, setShowPrefillSuggestion] = useState(false);
  const [prefillCase, setPrefillCase] = useState<any>(null);
  const [hasAutoPrefilled, setHasAutoPrefilled] = useState(false);

  useEffect(() => {
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
          presentingComplaint: '',
          notes: '',
          demographicsRawText: '',
          requiredTasks: caseToEdit.tasksChecklist,
        });
        setTouchedFields(new Set());
        setHasAutoPrefilled(false);
      }
    } else {
      // Reset form when creating new case
      setFormData({
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
        requiredTasks: createDefaultTasksChecklist(),
      });
      setTouchedFields(new Set());
      setHasAutoPrefilled(false);
    }
  }, [editingCaseId, cases]);

  useEffect(() => {
    if (!editingCaseId && formData.medicalRecordNumber.trim()) {
      const matching = findLatestMatchingCase(formData.medicalRecordNumber, cases);
      if (matching) {
        setPrefillCase(matching);
        setShowPrefillSuggestion(true);
        
        // Auto-prefill only if no demographic fields have been touched yet
        const demographicFields = ['petName', 'ownerLastName', 'species', 'breed', 'sex', 'dateOfBirth'];
        const hasTouchedDemographics = demographicFields.some(field => touchedFields.has(field));
        
        if (!hasAutoPrefilled && !hasTouchedDemographics) {
          handlePrefill(matching);
          setHasAutoPrefilled(true);
        }
      } else {
        setShowPrefillSuggestion(false);
        setPrefillCase(null);
        setHasAutoPrefilled(false);
      }
    } else {
      setShowPrefillSuggestion(false);
      setPrefillCase(null);
      setHasAutoPrefilled(false);
    }
  }, [formData.medicalRecordNumber, editingCaseId, cases, touchedFields, hasAutoPrefilled]);

  const handlePrefill = (caseToUse?: any) => {
    const sourceCase = caseToUse || prefillCase;
    if (!sourceCase) return;

    const prefillData = getPrefillData(sourceCase);
    const newFormData = { ...formData };

    // Only prefill fields that haven't been touched by the user
    Object.entries(prefillData).forEach(([key, value]) => {
      if (!touchedFields.has(key) && value !== undefined && value !== null) {
        (newFormData as any)[key] = value;
      }
    });

    setFormData(newFormData);
    setShowPrefillSuggestion(false);
    
    if (!caseToUse) {
      toast.success('Demographics prefilled from previous case');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));
  };

  const handleTaskRequiredToggle = (taskKey: keyof TasksChecklist) => {
    setFormData((prev) => ({
      ...prev,
      requiredTasks: setTaskRequired(
        prev.requiredTasks,
        taskKey,
        !prev.requiredTasks[taskKey].required
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medicalRecordNumber.trim()) {
      toast.error('Medical Record # is required');
      return;
    }

    try {
      const patientDemographics = {
        name: formData.petName,
        ownerLastName: formData.ownerLastName,
        species: formData.species,
        breed: formData.breed,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
      };

      if (editingCaseId) {
        await updateCase.mutateAsync({
          caseId: editingCaseId,
          updates: {
            medicalRecordNumber: formData.medicalRecordNumber,
            patientDemographics,
            arrivalDate: dateOnlyToNanoseconds(formData.arrivalDate),
            tasksChecklist: formData.requiredTasks,
          },
        });
        toast.success('Case updated successfully');
        onSaveComplete();
      } else {
        await createCase.mutateAsync({
          medicalRecordNumber: formData.medicalRecordNumber,
          patientDemographics,
          arrivalDate: dateOnlyToNanoseconds(formData.arrivalDate),
          tasksChecklist: formData.requiredTasks,
        });
        toast.success('Case created successfully');
        onSaveComplete();
      }
    } catch (error) {
      console.error('Failed to save case:', error);
      toast.error('Failed to save case');
    }
  };

  const handleCancel = () => {
    onCancelEdit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showPrefillSuggestion && hasAutoPrefilled && (
        <Alert className="bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              <strong>Auto-filled</strong> from previous case with this Medical Record #
            </span>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={() => handlePrefill()}
            >
              Refresh Data
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showPrefillSuggestion && !hasAutoPrefilled && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Previous case found with this Medical Record #</span>
            <Button type="button" size="sm" onClick={() => handlePrefill()}>
              Prefill Demographics
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicalRecordNumber">Medical Record # *</Label>
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
            onChange={(dateStr) => handleFieldChange('arrivalDate', dateStr || getTodayDateOnlyString())}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="petName">Pet Name</Label>
          <Input
            id="petName"
            value={formData.petName}
            onChange={(e) => handleFieldChange('petName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerLastName">Owner Last Name</Label>
          <Input
            id="ownerLastName"
            value={formData.ownerLastName}
            onChange={(e) => handleFieldChange('ownerLastName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="species">Species</Label>
          <Select value={formData.species} onValueChange={(value) => handleFieldChange('species', value)}>
            <SelectTrigger id="species">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Canine">Canine</SelectItem>
              <SelectItem value="Feline">Feline</SelectItem>
              <SelectItem value="Avian">Avian</SelectItem>
              <SelectItem value="Exotic">Exotic</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => handleFieldChange('breed', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <Select value={formData.sex} onValueChange={(value) => handleFieldChange('sex', value)}>
            <SelectTrigger id="sex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male Neutered">Male Neutered</SelectItem>
              <SelectItem value="Female Spayed">Female Spayed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <DateField
            value={formData.dateOfBirth}
            onChange={(dateStr) => handleFieldChange('dateOfBirth', dateStr || '')}
          />
        </div>
      </div>

      <DemographicsQuickAdd
        value={formData.demographicsRawText}
        onChange={(text) => handleFieldChange('demographicsRawText', text)}
      />

      <div className="space-y-3">
        <Label className="text-base font-semibold">Required Tasks</Label>
        <p className="text-sm text-muted-foreground">Select which tasks are required for this case</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(TASK_DEFINITIONS).map(([key, definition]) => (
            <div key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`task-${key}`}
                checked={formData.requiredTasks[key as keyof TasksChecklist].required}
                onChange={() => handleTaskRequiredToggle(key as keyof TasksChecklist)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor={`task-${key}`} className="text-sm font-normal cursor-pointer">
                {definition.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createCase.isPending || updateCase.isPending}>
          {(createCase.isPending || updateCase.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            editingCaseId ? 'Update Case' : 'Create Case'
          )}
        </Button>
      </div>
    </form>
  );
}
