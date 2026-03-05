import { getPersistedUrlParameter } from './urlParams';

/**
 * Retrieves the Draft admin token from URL or sessionStorage.
 * The token is persisted across logout/login within the same browser session.
 * 
 * @returns The admin token if found, or an empty string if not present
 */
export function getDraftAdminToken(): string {
  const token = getPersistedUrlParameter('caffeineAdminToken');
  return token || '';
}

/**
 * Checks if the Draft admin token is missing or empty.
 * 
 * @returns true if the token is missing or empty, false otherwise
 */
export function isDraftAdminTokenMissing(): boolean {
  const token = getDraftAdminToken();
  return !token || token.trim() === '';
}
