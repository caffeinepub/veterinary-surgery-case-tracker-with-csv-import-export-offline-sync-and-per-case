import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Calendar, FileText, User, Stethoscope } from 'lucide-react';
import { nanosecondsToDate } from '../../utils/dates';
import type { LocalSurgeryCase } from '../../types/cases';
import { format } from 'date-fns';
import TasksChecklist from './TasksChecklist';
import { useCasesStore } from '../../hooks/useCasesStore';
import { useUpdateSurgeryCase } from '../../hooks/useQueries';
import type { TasksChecklist as TasksChecklistType } from '../../types/cases';

interface CaseCardProps {
  case: LocalSurgeryCase;
  onEdit: (caseId: bigint) => void;
}

export default function CaseCard({ case: surgeryCase, onEdit }: CaseCardProps) {
  const arrivalDate = nanosecondsToDate(surgeryCase.arrivalDate);
  const { updateCase: updateLocalCase } = useCasesStore();
  const updateServerCase = useUpdateSurgeryCase();

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

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-semibold">{surgeryCase.medicalRecordNumber}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(arrivalDate, 'MMM dd, yyyy')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(surgeryCase.caseId)}
            className="hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {surgeryCase.patientDemographics.name || 'No name'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {surgeryCase.patientDemographics.species}
                {surgeryCase.patientDemographics.breed && ` • ${surgeryCase.patientDemographics.breed}`}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <TasksChecklist
            tasks={surgeryCase.tasksChecklist}
            onChange={handleTasksChange}
          />
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
