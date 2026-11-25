/**
 * Device Fingerprinting
 * Generates a unique device identifier for security purposes
 */

interface DeviceFingerprint {
  id: string;
  userAgent: string;
  acceptLanguage: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  timestamp: number;
}

export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  const timestamp = Date.now();

  // Get available device info
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const acceptLanguage = typeof navigator !== 'undefined' ? navigator.language : '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screenResolution = typeof window !== 'undefined' 
    ? `${window.innerWidth}x${window.innerHeight}` 
    : 'unknown';
  const colorDepth = typeof screen !== 'undefined' ? screen.colorDepth : 24;

  // Create a simple hash from the components
  const components = [userAgent, acceptLanguage, timezone, screenResolution, colorDepth].join('|');
  const id = await hashString(components);

  return {
    id,
    userAgent,
    acceptLanguage,
    timezone,
    screenResolution,
    colorDepth,
    timestamp,
  };
}

/**
 * Simple hash function (not cryptographically secure, but good for fingerprinting)
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Store device fingerprint in localStorage
 */
export function storeDeviceFingerprint(fingerprint: DeviceFingerprint): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('device_fingerprint', JSON.stringify(fingerprint));
    } catch (error) {
      console.warn('Failed to store device fingerprint:', error);
    }
  }
}

/**
 * Retrieve device fingerprint from localStorage
 */
export function getStoredDeviceFingerprint(): DeviceFingerprint | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('device_fingerprint');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to retrieve device fingerprint:', error);
      return null;
    }
  }
  return null;
}

/**
 * Check if device fingerprint matches (for security validation)
 */
export async function validateDeviceFingerprint(): Promise<boolean> {
  const currentFingerprint = await generateDeviceFingerprint();
  const storedFingerprint = getStoredDeviceFingerprint();

  if (!storedFingerprint) {
    storeDeviceFingerprint(currentFingerprint);
    return true;
  }

  return currentFingerprint.id === storedFingerprint.id;
}
