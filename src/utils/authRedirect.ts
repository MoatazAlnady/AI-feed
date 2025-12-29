/**
 * Returns the correct redirect URL base for authentication.
 * Handles edge cases where window.location.origin might return localhost
 * or capacitor:// URLs that aren't publicly reachable.
 */
export const getAuthRedirectUrl = (path: string = '/'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Production site URL - this should match your Supabase Site URL configuration
  const PRODUCTION_URL = 'https://d877ed87-6ac2-4300-a1e1-c5a672b278e8.lovableproject.com';
  
  // Check if we're in an environment that uses non-reachable URLs
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isCapacitor = origin.startsWith('capacitor://') || origin.startsWith('ionic://');
  const isEmpty = !origin;
  
  // Use production URL for non-reachable origins
  const baseUrl = (isLocalhost || isCapacitor || isEmpty) ? PRODUCTION_URL : origin;
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};
