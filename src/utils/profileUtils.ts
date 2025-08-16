/**
 * Utility functions for creator profile handling
 */

export interface ProfileReference {
  id: string;
  handle?: string;
  full_name?: string;
}

/**
 * Generate a canonical link to a creator's profile page
 * Uses handle if available, falls back to ID
 */
export function getCreatorProfileLink(profile: ProfileReference): string {
  if (profile.handle) {
    return `/creator/${profile.handle}`;
  }
  return `/creator/${profile.id}`;
}

/**
 * Generate a display name for a profile
 */
export function getProfileDisplayName(profile: ProfileReference): string {
  return profile.full_name || 'AI Enthusiast';
}

/**
 * Generate profile link props for React Router Link components
 */
export function getProfileLinkProps(profile: ProfileReference) {
  return {
    to: getCreatorProfileLink(profile),
    prefetch: 'intent' as const
  };
}