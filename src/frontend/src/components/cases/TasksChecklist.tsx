import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import type { TasksChecklist } from '../../types/cases';
import { getRequiredTasks, toggleTaskChecked } from '../../utils/tasksChecklist';

interface TasksChecklistProps {
  tasks: TasksChecklist;
  onChange: (tasks: TasksChecklist) => void;
  disabled?: boolean;
}

export default function TasksChecklist({ tasks, onChange, disabled }: TasksChecklistProps) {
  const requiredTasks = getRequiredTasks(tasks);

  const handleToggle = (taskKey: keyof TasksChecklist) => {
    onChange(toggleTaskChecked(tasks, taskKey));
  };

  if (requiredTasks.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Tasks</h4>
        <p className="text-xs text-muted-foreground">No tasks required for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Tasks</h4>
      <div className="space-y-2">
        {requiredTasks.map((task) => (
          <div key={task.key} className="flex items-center space-x-2">
            <Checkbox
              id={`${task.key}-checkbox`}
              checked={task.checked}
              onCheckedChange={() => handleToggle(task.key)}
              disabled={disabled}
            />
            <Label
              htmlFor={`${task.key}-checkbox`}
              className={`text-sm cursor-pointer ${
                task.checked ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
