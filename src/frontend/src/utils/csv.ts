import type { LocalSurgeryCase } from '../types/cases';
import { nanosecondsToDate, dateToNanoseconds } from './dates';
import { TASK_DEFINITIONS, getTaskKeyFromCsvColumn, normalizeTasksChecklist } from './tasksChecklist';

export interface CsvRow {
  'Medical Record #': string;
  'Arrival Date': string;
  'Pet Name': string;
  'Species': string;
  'Breed': string;
  [key: string]: string;
}

export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: CsvValidationError[];
  warnings: string[];
}

export function casesToCsv(cases: LocalSurgeryCase[]): string {
  const headers = [
    'Medical Record #',
    'Arrival Date',
    'Pet Name',
    'Species',
    'Breed',
    ...TASK_DEFINITIONS.map((t) => t.label),
  ];

  const rows = cases.map((c) => {
    const arrivalDate = nanosecondsToDate(c.arrivalDate);
    const taskValues = TASK_DEFINITIONS.map((task) => {
      const taskItem = c.tasksChecklist[task.key];
      if (!taskItem.required) return '';
      return taskItem.checked ? 'Yes' : 'No';
    });

    return [
      c.medicalRecordNumber,
      arrivalDate.toISOString().split('T')[0],
      c.patientDemographics.name,
      c.patientDemographics.species,
      c.patientDemographics.breed,
      ...taskValues,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

export function parseCsv(csvText: string): CsvParseResult {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    return { 
      rows: [], 
      errors: [{ row: 0, field: 'file', message: 'CSV file is empty or has no data rows' }],
      warnings: [],
    };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const rows: CsvRow[] = [];
  const errors: CsvValidationError[] = [];
  const warnings: string[] = [];

  // Check for unrecognized task columns
  const recognizedTaskColumns = TASK_DEFINITIONS.map((t) => t.label);
  const taskRelatedHeaders = headers.filter((h) => 
    h !== 'Medical Record #' && 
    h !== 'Arrival Date' && 
    h !== 'Pet Name' && 
    h !== 'Species' && 
    h !== 'Breed'
  );
  const unrecognizedColumns = taskRelatedHeaders.filter((h) => !recognizedTaskColumns.includes(h));
  
  if (unrecognizedColumns.length > 0) {
    warnings.push(
      `Unrecognized task columns found and will be ignored: ${unrecognizedColumns.join(', ')}.`
    );
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCsvLine(line);

    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        field: 'row',
        message: `Column count mismatch (expected ${headers.length}, got ${values.length})`,
      });
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    if (!row['Medical Record #'] || !row['Medical Record #'].trim()) {
      errors.push({
        row: i + 1,
        field: 'Medical Record #',
        message: 'Medical Record # is required',
      });
      continue;
    }

    rows.push(row as CsvRow);
  }

  return { rows, errors, warnings };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseTaskValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

export function csvRowToCase(row: CsvRow, tempId: bigint): Partial<LocalSurgeryCase> {
  const arrivalDate = row['Arrival Date']
    ? dateToNanoseconds(new Date(row['Arrival Date']))
    : dateToNanoseconds(new Date());

  // Build tasks checklist from CSV columns
  const tasksChecklist: any = {};
  
  TASK_DEFINITIONS.forEach((task) => {
    const columnValue = row[task.label];
    
    if (columnValue !== undefined && columnValue.trim() !== '') {
      // Column exists and has a value - mark as required
      tasksChecklist[task.key] = {
        required: true,
        checked: parseTaskValue(columnValue),
      };
    } else {
      // Column missing or empty - not required
      tasksChecklist[task.key] = {
        required: false,
        checked: false,
      };
    }
  });

  return {
    caseId: tempId,
    medicalRecordNumber: row['Medical Record #'].trim(),
    arrivalDate,
    patientDemographics: {
      name: row['Pet Name'] || '',
      species: row['Species'] || 'Other',
      breed: row['Breed'] || '',
      age: BigInt(0),
    },
    tasksChecklist: normalizeTasksChecklist(tasksChecklist),
    lastSyncTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
    isSynchronized: false,
    pendingSync: true,
  };
}
