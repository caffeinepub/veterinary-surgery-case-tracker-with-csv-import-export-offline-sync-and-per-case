import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Calendar, FileText, User, Stethoscope, Users, Heart } from 'lucide-react';
import { nanosecondsToDateOnlyString, formatDateOnlyString, formatDateOfBirth } from '../../utils/dates';
import type { LocalSurgeryCase } from '../../types/cases';
import TasksChecklist from './TasksChecklist';
import { useCasesStore } from '../../hooks/useCasesStore';
import { useUpdateSurgeryCase } from '../../hooks/useQueries';
import type { TasksChecklist as TasksChecklistType } from '../../types/cases';

interface CaseCardProps {
  case: LocalSurgeryCase;
  onEdit: (caseId: bigint) => void;
}

export default function CaseCard({ case: surgeryCase, onEdit }: CaseCardProps) {
  const arrivalDateStr = nanosecondsToDateOnlyString(surgeryCase.arrivalDate);
  const formattedArrivalDate = formatDateOnlyString(arrivalDateStr);
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
          <Button variant="ghost" size="sm" onClick={() => onEdit(surgeryCase.caseId)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Arrival:</span>
            <span>{formattedArrivalDate}</span>
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
