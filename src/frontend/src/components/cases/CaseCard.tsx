import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Calendar, FileText, User, Stethoscope, Users, Heart, ClipboardList, Trash2 } from 'lucide-react';
import { nanosecondsToDateOnlyString, formatDateOnlyString, formatDateOfBirth } from '../../utils/dates';
import type { LocalSurgeryCase } from '../../types/cases';
import TasksChecklist from './TasksChecklist';
import { useCasesStore } from '../../hooks/useCasesStore';
import { useUpdateSurgeryCase, useDeleteSurgeryCase } from '../../hooks/useQueries';
import type { TasksChecklist as TasksChecklistType } from '../../types/cases';
import { toast } from 'sonner';

interface CaseCardProps {
  case: LocalSurgeryCase;
  onEdit: (caseId: bigint) => void;
}

export default function CaseCard({ case: surgeryCase, onEdit }: CaseCardProps) {
  const arrivalDateStr = nanosecondsToDateOnlyString(surgeryCase.arrivalDate);
  const formattedArrivalDate = formatDateOnlyString(arrivalDateStr);
  const { updateCase: updateLocalCase, deleteCase: deleteLocalCase } = useCasesStore();
  const updateServerCase = useUpdateSurgeryCase();
  const deleteServerCase = useDeleteSurgeryCase();

  const handleTasksChange = async (newTasks: TasksChecklistType) => {
    // Update local state immediately
    await updateLocalCase.mutateAsync({
      caseId: surgeryCase.caseId,
      updates: { tasksChecklist: newTasks },
    });

    // Update server
    try {
      await updateServerCase.mutateAsync({
        caseId: surgeryCase.caseId,
        updates: { tasksChecklist: newTasks },
      });
    } catch (error) {
      console.error('Failed to sync task update to server:', error);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the case for ${surgeryCase.patientDemographics.name || 'this patient'}?`
    );

    if (!confirmed) return;

    try {
      // Delete from local storage immediately
      await deleteLocalCase.mutateAsync(surgeryCase.caseId);

      // Attempt to delete from server if connected
      try {
        await deleteServerCase.mutateAsync(surgeryCase.caseId);
      } catch (serverError: any) {
        console.error('Failed to delete case from server:', serverError);
        toast.error('Case deleted locally, but server deletion failed. It may reappear after sync.');
      }
    } catch (error: any) {
      console.error('Failed to delete case:', error);
      toast.error('Failed to delete case. Please try again.');
    }
  };

  const demographics = surgeryCase.patientDemographics;
  const formattedDOB = formatDateOfBirth(demographics.dateOfBirth);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {demographics.name || 'Unnamed Patient'}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                MRN: {surgeryCase.medicalRecordNumber}
              </Badge>
              {demographics.species && (
                <Badge variant="secondary" className="text-xs">
                  {demographics.species}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(surgeryCase.caseId)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Arrival:</span>
            <span>{formattedArrivalDate}</span>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-accent bg-accent/10">
            <ClipboardList className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent-foreground" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-accent-foreground block">Presenting Complaint:</span>
              <span className="text-accent-foreground break-words whitespace-normal">
                {surgeryCase.presentingComplaint || '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Owner:</span>
            <span>{demographics.ownerLastName || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Sex:</span>
            <span>{demographics.sex || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">DOB:</span>
            <span>{formattedDOB || '—'}</span>
          </div>

          {demographics.breed && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Breed:</span>
              <span>{demographics.breed}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <TasksChecklist
            tasks={surgeryCase.tasksChecklist}
            onChange={handleTasksChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
