// Generate a device fingerprint for anonymous users
// This is not bulletproof but provides reasonable uniqueness for rate limiting

const FINGERPRINT_KEY = 'ai_feed_device_fp';

export const generateDeviceFingerprint = (): string => {
  // Check if we already have a fingerprint stored
  const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (storedFingerprint) {
    return storedFingerprint;
  }

  // Generate a new fingerprint based on browser characteristics
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown',
    // Add some randomness to make it unique per device/browser
    Math.random().toString(36).substring(2, 15),
    Date.now().toString(36)
  ];

  // Create a simple hash from the components
  const fingerprintString = components.join('|');
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const fingerprint = `fp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  
  // Store the fingerprint
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  
  return fingerprint;
};

export const getDeviceFingerprint = (): string => {
  return localStorage.getItem(FINGERPRINT_KEY) || generateDeviceFingerprint();
};
