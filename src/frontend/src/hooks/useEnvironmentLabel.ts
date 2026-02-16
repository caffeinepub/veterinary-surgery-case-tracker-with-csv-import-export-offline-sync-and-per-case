/**
 * Hook that derives the environment label (Draft or Live) from the current URL.
 * Uses hostname heuristics to determine the environment at runtime.
 */
export function useEnvironmentLabel(): string {
  if (typeof window === 'undefined') {
    return 'Live';
  }

  const hostname = window.location.hostname.toLowerCase();
  
  // Check for draft/staging/localhost indicators
  if (
    hostname.includes('draft') ||
    hostname.includes('staging') ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  ) {
    return 'Draft';
  }
  
  return 'Live';
}
