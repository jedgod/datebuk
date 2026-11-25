/**
 * Mobile Device Fingerprinting
 * Adapted for React Native and Expo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform, Dimensions } from 'react-native';
import * as Crypto from 'expo-crypto';

export interface MobileDeviceFingerprint {
  id: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;
  screenDimensions: string;
  timestamp: number;
  installId: string;
}

/**
 * Generate unique device fingerprint for mobile
 */
export async function generateMobileDeviceFingerprint(): Promise<MobileDeviceFingerprint> {
  const timestamp = Date.now();
  
  // Get device information
  const platform = Platform.OS as 'ios' | 'android' | 'web';
  const osVersion = Platform.Version?.toString() || 'unknown';
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const { width, height } = Dimensions.get('window');
  const screenDimensions = `${Math.round(width)}x${Math.round(height)}`;
  
  // Get unique install ID
  const installId = Constants.sessionId || Constants.installationId || 'unknown';
  
  // Create fingerprint components
  const components = [
    platform,
    osVersion,
    appVersion,
    screenDimensions,
    Constants.expoConfig?.name || 'app',
  ].join('|');

  // Hash components
  const id = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    components
  );

  return {
    id,
    deviceId: installId,
    platform,
    osVersion,
    appVersion,
    screenDimensions,
    timestamp,
    installId,
  };
}

/**
 * Store device fingerprint in AsyncStorage. This is not a bearer credential
 * (it's a derived, spoofable identifier used only as a risk-scoring signal,
 * never as an auth token), so plain AsyncStorage is fine here — unlike the
 * access token, which lives in secureStorage.ts / expo-secure-store.
 */
export async function storeMobileDeviceFingerprint(
  fingerprint: MobileDeviceFingerprint
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      '@datepage_device_fingerprint',
      JSON.stringify(fingerprint)
    );
  } catch (error) {
    console.warn('Failed to store device fingerprint:', error);
  }
}

/**
 * Retrieve device fingerprint from storage
 */
export async function getStoredMobileDeviceFingerprint(): Promise<MobileDeviceFingerprint | null> {
  try {
    const stored = await AsyncStorage.getItem('@datepage_device_fingerprint');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to retrieve device fingerprint:', error);
    return null;
  }
}

/**
 * Validate device fingerprint hasn't changed
 */
export async function validateMobileDeviceFingerprint(): Promise<boolean> {
  try {
    const currentFingerprint = await generateMobileDeviceFingerprint();
    const storedFingerprint = await getStoredMobileDeviceFingerprint();

    if (!storedFingerprint) {
      await storeMobileDeviceFingerprint(currentFingerprint);
      return true;
    }

    // Consider device valid if ID matches
    return currentFingerprint.id === storedFingerprint.id;
  } catch (error) {
    console.error('Device fingerprint validation error:', error);
    return true; // Fail gracefully
  }
}

/**
 * Get device model information (for threat assessment)
 */
export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isTablet: Dimensions.get('window').width > 600,
    screenDimensions: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
  };
}
