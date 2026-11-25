/**
 * Mobile Security Hooks for React Native
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RiskAssessmentResponse,
  requiresSecurityChallenge,
  shouldBlock,
} from '../lib/security/risk-assessment';
import {
  generateMobileDeviceFingerprint,
  getStoredMobileDeviceFingerprint,
  storeMobileDeviceFingerprint,
} from '../lib/security/mobile-device-fingerprint';
import { mobileSecurityApi } from '../services/mobile-security-api';

/**
 * Hook for mobile device fingerprinting
 */
export function useMobileDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const stored = await getStoredMobileDeviceFingerprint();
        if (stored) {
          setFingerprint(stored);
        } else {
          const generated = await generateMobileDeviceFingerprint();
          await storeMobileDeviceFingerprint(generated);
          setFingerprint(generated);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize fingerprint';
        setError(message);
        console.error('Device fingerprint error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, []);

  return { fingerprint, isLoading, error };
}

/**
 * Hook for risk assessment
 */
export function useMobileRiskAssessment() {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fingerprint } = useMobileDeviceFingerprint();

  const assess = useCallback(async () => {
    if (!fingerprint) return null;

    setIsLoading(true);
    setError(null);

    try {
      const assessment = await mobileSecurityApi.assessRisk({
        deviceId: fingerprint.deviceId,
        platform: fingerprint.platform,
        osVersion: fingerprint.osVersion,
        appVersion: fingerprint.appVersion,
        screenDimensions: fingerprint.screenDimensions,
      });

      setRiskAssessment(assessment);
      return assessment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Risk assessment failed';
      setError(message);
      console.error('Risk assessment error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint]);

  const requiresChallenge = riskAssessment
    ? requiresSecurityChallenge(riskAssessment.riskScore)
    : false;

  const isBlocked = riskAssessment ? shouldBlock(riskAssessment.riskScore) : false;

  return {
    riskAssessment,
    assess,
    isLoading,
    error,
    requiresChallenge,
    isBlocked,
  };
}

/**
 * Hook for SMS verification
 */
export function useMobileSmsVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (phone: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const success = await mobileSecurityApi.sendSmsVerification(phone);
      if (!success) throw new Error('Failed to send SMS');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS send failed';
      setError(message);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const verify = useCallback(async (phone: string, code: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const success = await mobileSecurityApi.verifySmsCode(phone, code);
      if (!success) throw new Error('Invalid SMS code');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS verification failed';
      setError(message);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return { send, verify, isVerifying, error };
}

/**
 * Hook for blacklist checking
 */
export function useMobileBlacklistCheck() {
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBlacklist = async () => {
      try {
        const result = await mobileSecurityApi.checkBlacklist();
        setIsBlacklisted(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Blacklist check failed';
        setError(message);
        console.error('Blacklist check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlacklist();
  }, []);

  return { isBlacklisted, isLoading, error };
}

/**
 * Hook for stored authentication attempts
 */
export function useMobileAuthAttempts() {
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const increment = useCallback(async () => {
    try {
      const current = (await AsyncStorage.getItem('@auth_attempts')) || '0';
      const newAttempts = parseInt(current) + 1;
      await AsyncStorage.setItem('@auth_attempts', newAttempts.toString());
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockTime = Date.now() + 15 * 60 * 1000; // 15 minute lockout
        await AsyncStorage.setItem('@auth_lockout_time', lockTime.toString());
        setIsLocked(true);
        setLockoutTime(lockTime);
      }

      return newAttempts;
    } catch (error) {
      console.error('Failed to increment auth attempts:', error);
      return 0;
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('@auth_attempts');
      await AsyncStorage.removeItem('@auth_lockout_time');
      setAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);
    } catch (error) {
      console.error('Failed to reset auth attempts:', error);
    }
  }, []);

  const checkLockout = useCallback(async () => {
    try {
      const lockTime = await AsyncStorage.getItem('@auth_lockout_time');
      if (lockTime) {
        const now = Date.now();
        const lockTimeNum = parseInt(lockTime);

        if (now > lockTimeNum) {
          // Lockout expired
          await reset();
        } else {
          setIsLocked(true);
          setLockoutTime(lockTimeNum);
        }
      }
    } catch (error) {
      console.error('Failed to check lockout:', error);
    }
  }, [reset]);

  useEffect(() => {
    checkLockout();
  }, [checkLockout]);

  return { attempts, isLocked, lockoutTime, increment, reset };
}

/**
 * Hook for IP intelligence
 */
export function useMobileIpIntelligence() {
  const [ipIntel, setIpIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIpIntel = async () => {
      try {
        const intel = await mobileSecurityApi.getIpIntelligence();
        setIpIntel(intel);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch IP data';
        setError(message);
        console.error('IP intelligence error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIpIntel();
  }, []);

  return { ipIntel, isLoading, error };
}

/**
 * Hook for app security status
 */
export function useMobileAppSecurityStatus() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const appStatus = await mobileSecurityApi.checkAppSecurity();
        setStatus(appStatus);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check app status';
        setError(message);
        console.error('App security status error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return { status, isLoading, error };
}
