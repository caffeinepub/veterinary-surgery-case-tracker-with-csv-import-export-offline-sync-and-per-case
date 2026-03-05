import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import type { TasksChecklist as TasksChecklistType } from '../../types/cases';
import { TASK_DEFINITIONS, normalizeTasksChecklist } from '../../utils/tasksChecklist';

interface TasksChecklistProps {
  tasksChecklist: TasksChecklistType;
  onTaskToggle: (taskKey: keyof TasksChecklistType) => void;
}

export default function TasksChecklist({ tasksChecklist, onTaskToggle }: TasksChecklistProps) {
  const normalized = normalizeTasksChecklist(tasksChecklist);

  // Filter to show only required tasks that are not yet completed
  const visibleTasks = TASK_DEFINITIONS.filter((task) => {
    const taskItem = normalized[task.key];
    return taskItem.required && !taskItem.checked;
  });

  if (visibleTasks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        All tasks completed
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">Tasks</h4>
      <div className="space-y-2">
        {visibleTasks.map((task) => {
          const taskItem = normalized[task.key];
          
          // Determine if this task needs a colored border
          let borderClass = '';
          if (task.key === 'histo') {
            borderClass = 'border-2 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/20';
          } else if (task.key === 'imaging') {
            borderClass = 'border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20';
          }

          return (
            <div
              key={task.key}
              className={`flex items-center space-x-2 p-2 rounded-md ${borderClass}`}
            >
              <Checkbox
                id={`task-${task.key}`}
                checked={taskItem.checked}
                onCheckedChange={() => onTaskToggle(task.key)}
              />
              <Label
                htmlFor={`task-${task.key}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {task.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
