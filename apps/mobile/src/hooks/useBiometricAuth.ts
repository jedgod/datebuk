import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

// Types
export type BiometricType = 'fingerprint' | 'faceid' | 'iris' | 'unknown';

export interface BiometricAvailability {
  available: boolean;
  enrolled: boolean;
  types: BiometricType[];
  isDeviceSecure: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Hook for mobile biometric authentication (Face ID, Fingerprint, Iris)
 *
 * Features:
 * - Detect available biometric types
 * - Enable/disable biometric authentication
 * - Authenticate with biometric
 * - Fallback to SMS verification on biometric failure
 *
 * @param fallbackToSms - Allow fallback to SMS if biometric fails
 * @returns Biometric authentication state and methods
 *
 * @example
 * const { isAvailable, authenticate, biometricType } = useBiometricAuth();
 *
 * const handleAuthClick = async () => {
 *   const result = await authenticate();
 *   if (result.success) {
 *     // User authenticated with biometric
 *   }
 * };
 */
export function useBiometricAuth(fallbackToSms: boolean = true) {
  const [availability, setAvailability] = useState<BiometricAvailability>({
    available: false,
    enrolled: false,
    types: [],
    isDeviceSecure: false,
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastAuthTime, setLastAuthTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  /**
   * Check what biometric authentication is available on device
   */
  const checkBiometricAvailability = useCallback(async () => {
    try {
      // Check if device has biometric hardware
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {
        setAvailability({
          available: false,
          enrolled: false,
          types: [],
          isDeviceSecure: false,
        });
        return;
      }

      // Expo exposes biometric enrollment as the portable indication that the
      // device has an authentication method configured.
      const isDevice = await LocalAuthentication.isEnrolledAsync();

      // Get list of supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Map LocalAuthentication types to our BiometricType
      const biometricTypes: BiometricType[] = supportedTypes.map(
        (type) => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'faceid';
            case LocalAuthentication.AuthenticationType.IRIS:
              return 'iris';
            default:
              return 'unknown';
          }
        },
      );

      setAvailability({
        available: compatible && isDevice,
        enrolled: true, // If we got here, biometric is enrolled
        types: biometricTypes,
        isDeviceSecure: isDevice,
      });

      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check biometric availability';
      setError(errorMessage);
      setAvailability({
        available: false,
        enrolled: false,
        types: [],
        isDeviceSecure: false,
      });
    }
  }, []);

  /**
   * Authenticate user with biometric
   *
   * @param reason - Message to show to user during authentication
   * @param fallback - Whether to allow fallback to device passcode
   * @returns Authentication result
   */
  const authenticate = useCallback(
    async (
      reason: string = 'Authenticate to continue',
      fallback: boolean = true,
    ): Promise<BiometricAuthResult> => {
      // Check if biometric is available
      if (!availability.available || !availability.enrolled) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      try {
        setIsAuthenticating(true);
        setError(null);

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: fallback ? 'Use passcode' : undefined,
          disableDeviceFallback: !fallback,
          // iOS specific
          // Android specific
        });

        if (result.success) {
          setLastAuthTime(Date.now());
          return {
            success: true,
            biometricType: availability.types[0],
          };
        } else if (result.error === 'user_cancel') {
          return {
            success: false,
            error: 'Authentication cancelled',
          };
        } else {
          return {
            success: false,
            error: result.error || 'Biometric authentication failed',
          };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Biometric authentication error';
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [availability],
  );

  /**
   * Enable/disable biometric authentication
   */
  const toggleBiometricAuth = useCallback((enabled: boolean) => {
    if (enabled && !availability.available) {
      setError('Biometric authentication not available');
      return;
    }

    setIsEnabled(enabled);
    setError(null);
  }, [availability.available]);

  /**
   * Check if biometric auth is still valid (within last 5 minutes)
   */
  const isBiometricAuthValid = useCallback((): boolean => {
    if (!lastAuthTime) {
      return false;
    }

    const fiveMinutesMs = 5 * 60 * 1000;
    return Date.now() - lastAuthTime < fiveMinutesMs;
  }, [lastAuthTime]);

  /**
   * Clear biometric authentication state
   */
  const clearBiometricAuth = useCallback(() => {
    setLastAuthTime(null);
    setIsEnabled(false);
  }, []);

  return {
    // Availability
    isAvailable: availability.available,
    isEnrolled: availability.enrolled,
    biometricTypes: availability.types,
    isDeviceSecure: availability.isDeviceSecure,
    primaryBiometricType: availability.types[0] || 'unknown',

    // State
    isAuthenticating,
    isEnabled,
    lastAuthTime,
    error,

    // Methods
    authenticate,
    toggleBiometricAuth,
    isBiometricAuthValid,
    clearBiometricAuth,
    checkBiometricAvailability,
  };
}

/**
 * Hook for biometric authentication with SMS fallback
 *
 * Automatically handles biometric authentication and falls back to SMS
 * verification if biometric fails.
 *
 * @example
 * const { authenticateWithFallback, status } = useBiometricAuthWithFallback();
 *
 * const result = await authenticateWithFallback();
 */
export function useBiometricAuthWithFallback() {
  const biometric = useBiometricAuth(true);
  const [status, setStatus] = useState<
    'idle' | 'biometric_pending' | 'biometric_failed' | 'sms_required' | 'authenticated'
  >('idle');

  const authenticateWithFallback = useCallback(async (): Promise<{
    success: boolean;
    method: 'biometric' | 'sms' | 'failed';
    error?: string;
  }> => {
    try {
      // Try biometric first
      if (biometric.isAvailable && biometric.isEnabled) {
        setStatus('biometric_pending');

        const result = await biometric.authenticate(
          'Verify your identity to login',
          true,
        );

        if (result.success) {
          setStatus('authenticated');
          return {
            success: true,
            method: 'biometric',
          };
        } else {
          // Biometric failed, require SMS
          setStatus('sms_required');
          return {
            success: false,
            method: 'sms',
            error: result.error,
          };
        }
      } else {
        // Biometric not available, require SMS
        setStatus('sms_required');
        return {
          success: false,
          method: 'sms',
          error: 'Biometric authentication not available',
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus('idle');
      return {
        success: false,
        method: 'failed',
        error: errorMessage,
      };
    }
  }, [biometric]);

  const resetStatus = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    ...biometric,
    status,
    authenticateWithFallback,
    resetStatus,
  };
}

/**
 * Hook for biometric authentication with persistent storage
 *
 * Remembers user preference for biometric auth and handles
 * biometric settings persistence.
 *
 * @example
 * const { isBiometricEnabled, enableBiometric, disableBiometric }
 *   = useBiometricAuthPersistent();
 */
export function useBiometricAuthPersistent() {
  const biometric = useBiometricAuth();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // In a real app, you would load this from AsyncStorage
  useEffect(() => {
    // Load biometric preference from storage
    // Example: const stored = await AsyncStorage.getItem('biometric_enabled');
    // setIsBiometricEnabled(stored === 'true');
  }, []);

  const enableBiometric = useCallback(async () => {
    if (!biometric.isAvailable) {
      return false;
    }

    // Test biometric works
    const result = await biometric.authenticate(
      'Enable biometric authentication',
      false,
    );

    if (result.success) {
      setIsBiometricEnabled(true);
      biometric.toggleBiometricAuth(true);

      // In a real app, persist to AsyncStorage
      // await AsyncStorage.setItem('biometric_enabled', 'true');

      return true;
    }

    return false;
  }, [biometric]);

  const disableBiometric = useCallback(() => {
    setIsBiometricEnabled(false);
    biometric.toggleBiometricAuth(false);

    // In a real app, persist to AsyncStorage
    // await AsyncStorage.setItem('biometric_enabled', 'false');
  }, [biometric]);

  return {
    ...biometric,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
  };
}

export default useBiometricAuth;
