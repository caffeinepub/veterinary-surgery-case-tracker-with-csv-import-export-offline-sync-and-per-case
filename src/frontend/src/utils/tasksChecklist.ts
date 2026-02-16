import type { TasksChecklist, TaskItem } from '../backend';

export interface TaskDefinition {
  key: keyof TasksChecklist;
  label: string;
  defaultRequired: boolean;
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
  { key: 'dischargeNotes', label: 'Discharge Notes', defaultRequired: true },
  { key: 'pdvmNotified', label: 'pDVM Notified', defaultRequired: true },
  { key: 'labs', label: 'Labs', defaultRequired: false },
  { key: 'histo', label: 'Histo', defaultRequired: false },
  { key: 'surgeryReport', label: 'Surgery Report', defaultRequired: false },
  { key: 'imaging', label: 'Imaging', defaultRequired: false },
  { key: 'culture', label: 'Culture', defaultRequired: false },
];

/**
 * Creates a default TasksChecklist with all 7 tasks
 * Discharge Notes and pDVM Notified are required by default
 */
export function createDefaultTasksChecklist(): TasksChecklist {
  const checklist: any = {};
  
  TASK_DEFINITIONS.forEach((def) => {
    checklist[def.key] = {
      required: def.defaultRequired,
      checked: false,
    };
  });
  
  return checklist as TasksChecklist;
}

/**
 * Normalizes a partial or legacy TasksChecklist to the full 7-task structure
 * Ensures all tasks have both required and checked fields
 */
export function normalizeTasksChecklist(partial: Partial<TasksChecklist> | any): TasksChecklist {
  const normalized: any = {};
  
  TASK_DEFINITIONS.forEach((def) => {
    const existing = partial?.[def.key];
    
    if (existing && typeof existing === 'object') {
      // If it exists and has the new structure
      normalized[def.key] = {
        required: existing.required ?? def.defaultRequired,
        checked: existing.checked ?? false,
      };
    } else if (existing && typeof existing === 'boolean') {
      // Legacy format: just a boolean for checked
      normalized[def.key] = {
        required: def.defaultRequired,
        checked: existing,
      };
    } else if (existing && existing.checked !== undefined) {
      // Old format: { checked: boolean } without required
      normalized[def.key] = {
        required: def.defaultRequired,
        checked: existing.checked ?? false,
      };
    } else {
      // Missing entirely
      normalized[def.key] = {
        required: def.defaultRequired,
        checked: false,
      };
    }
  });
  
  return normalized as TasksChecklist;
}

/**
 * Gets only the required tasks from a checklist
 */
export function getRequiredTasks(checklist: TasksChecklist): Array<{ key: keyof TasksChecklist; label: string; checked: boolean }> {
  return TASK_DEFINITIONS
    .filter((def) => checklist[def.key].required)
    .map((def) => ({
      key: def.key,
      label: def.label,
      checked: checklist[def.key].checked,
    }));
}

/**
 * Toggles the checked state of a task while preserving the required flag
 */
export function toggleTaskChecked(checklist: TasksChecklist, taskKey: keyof TasksChecklist): TasksChecklist {
  return {
    ...checklist,
    [taskKey]: {
      required: checklist[taskKey].required,
      checked: !checklist[taskKey].checked,
    },
  };
}

/**
 * Updates the required state of a task while preserving the checked flag
 */
export function setTaskRequired(checklist: TasksChecklist, taskKey: keyof TasksChecklist, required: boolean): TasksChecklist {
  return {
    ...checklist,
    [taskKey]: {
      required,
      checked: checklist[taskKey].checked,
    },
  };
}

/**
 * Maps CSV column names to task keys
 */
export function getTaskKeyFromCsvColumn(columnName: string): keyof TasksChecklist | null {
  const mapping: Record<string, keyof TasksChecklist> = {
    'Discharge Notes': 'dischargeNotes',
    'pDVM Notified': 'pdvmNotified',
    'Labs': 'labs',
    'Histo': 'histo',
    'Surgery Report': 'surgeryReport',
    'Imaging': 'imaging',
    'Culture': 'culture',
  };
  
  return mapping[columnName] || null;
}

/**
 * Gets CSV column name from task key
 */
export function getCsvColumnFromTaskKey(taskKey: keyof TasksChecklist): string {
  const def = TASK_DEFINITIONS.find((d) => d.key === taskKey);
  return def?.label || taskKey;
}
