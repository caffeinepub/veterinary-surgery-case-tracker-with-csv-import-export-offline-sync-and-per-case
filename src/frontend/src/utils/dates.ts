// Timezone-safe date-only utilities

/**
 * Validates and normalizes a YYYY-MM-DD date string
 */
export function validateDateOnlyString(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  
  // Basic validation
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  
  return trimmed;
}

/**
 * Converts a YYYY-MM-DD date string to nanoseconds (for Arrival Date storage)
 * Uses UTC noon to avoid timezone shifts
 */
export function dateOnlyToNanoseconds(dateStr: string): bigint {
  const validated = validateDateOnlyString(dateStr);
  if (!validated) {
    // Fallback to current date
    return BigInt(Date.now()) * BigInt(1_000_000);
  }
  
  const [year, month, day] = validated.split('-').map(Number);
  // Create date at UTC noon to avoid timezone boundary issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Converts nanoseconds back to a YYYY-MM-DD date-only string
 */
export function nanosecondsToDateOnlyString(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  const date = new Date(ms);
  
  // Extract UTC date components to avoid timezone shifts
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string for display (MM/DD/YYYY)
 * Does NOT use Date object to avoid timezone shifts
 */
export function formatDateOnlyString(dateStr: string): string {
  const validated = validateDateOnlyString(dateStr);
  if (!validated) return '';
  
  const [year, month, day] = validated.split('-');
  return `${month}/${day}/${year}`;
}

/**
 * Formats a date of birth string for display
 */
export function formatDateOfBirth(dateStr: string): string {
  return formatDateOnlyString(dateStr);
}

/**
 * Creates a Date object from YYYY-MM-DD for use with date pickers
 * Uses local timezone interpretation for UI consistency
 */
export function dateOnlyStringToLocalDate(dateStr: string): Date | null {
  const validated = validateDateOnlyString(dateStr);
  if (!validated) return null;
  
  const [year, month, day] = validated.split('-').map(Number);
  // Create in local timezone for date picker
  return new Date(year, month - 1, day);
}

/**
 * Converts a Date object to YYYY-MM-DD using local date components
 */
export function localDateToDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Legacy functions for backward compatibility (non-date-only use cases)
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function nanosecondsToDate(nanos: bigint): Date {
  return new Date(Number(nanos / BigInt(1_000_000)));
}

export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Gets today's date as YYYY-MM-DD string
 */
export function getTodayDateOnlyString(): string {
  const today = new Date();
  return localDateToDateOnlyString(today);
}
