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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useState } from 'react';

interface CaseCardProps {
  surgeryCase: LocalSurgeryCase;
  onEdit: (caseId: bigint) => void;
}

export default function CaseCard({ surgeryCase, onEdit }: CaseCardProps) {
  const { updateCase } = useCasesStore();
  const updateMutation = useUpdateSurgeryCase();
  const deleteMutation = useDeleteSurgeryCase();
  const [isDeleting, setIsDeleting] = useState(false);

  const arrivalDateString = nanosecondsToDateOnlyString(surgeryCase.arrivalDate);
  const formattedArrivalDate = formatDateOnlyString(arrivalDateString);
  const formattedDateOfBirth = formatDateOfBirth(surgeryCase.patientDemographics.dateOfBirth);

  const handleTaskToggle = async (taskKey: keyof TasksChecklistType) => {
    const currentTask = surgeryCase.tasksChecklist[taskKey];
    const updatedChecklist: TasksChecklistType = {
      ...surgeryCase.tasksChecklist,
      [taskKey]: {
        ...currentTask,
        checked: !currentTask.checked,
      },
    };

    try {
      await updateCase.mutateAsync({
        caseId: surgeryCase.caseId,
        updates: {
          tasksChecklist: updatedChecklist,
        },
      });
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await updateCase.mutateAsync({
        caseId: surgeryCase.caseId,
        updates: {
          _delete: true,
        },
      });
      toast.success('Case deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete case:', error);
      toast.error(error.message || 'Failed to delete case');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {surgeryCase.patientDemographics.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="font-medium">MRN: {surgeryCase.medicalRecordNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(surgeryCase.caseId)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Case</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the case for {surgeryCase.patientDemographics.name}? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Arrival:</span>
            <span className="font-medium">{formattedArrivalDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-medium">{surgeryCase.patientDemographics.ownerLastName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Species:</span>
            <span className="font-medium">{surgeryCase.patientDemographics.species}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Breed:</span>
            <span className="font-medium">{surgeryCase.patientDemographics.breed}</span>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sex:</span>
            <span className="font-medium">{surgeryCase.patientDemographics.sex}</span>
          </div>

          {formattedDateOfBirth && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">DOB:</span>
              <span className="font-medium">{formattedDateOfBirth}</span>
            </div>
          )}
        </div>

        {surgeryCase.presentingComplaint && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-start gap-2">
              <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">Presenting Complaint</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap break-words">
                  {surgeryCase.presentingComplaint}
                </p>
              </div>
            </div>
          </div>
        )}

        {surgeryCase.notes && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-md">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100 mb-1">Case Notes</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words">
                  {surgeryCase.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <TasksChecklist tasksChecklist={surgeryCase.tasksChecklist} onTaskToggle={handleTaskToggle} />
        </div>

        {surgeryCase.pendingSync && (
          <Badge variant="outline" className="text-xs">
            Pending Sync
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
