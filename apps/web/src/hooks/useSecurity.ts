/**
 * Security Hooks for React Components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RiskAssessmentResponse,
  RiskSignals,
  requiresSecurityChallenge,
  shouldBlock,
} from '@/lib/security/risk-assessment';
import { SecurityApiService } from '@/services/security-api.service';
import {
  generateDeviceFingerprint,
  getStoredDeviceFingerprint,
  storeDeviceFingerprint,
} from '@/lib/security/device-fingerprint';

/**
 * Hook for device fingerprinting
 */
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const stored = getStoredDeviceFingerprint();
        if (stored) {
          setFingerprint(stored);
        } else {
          const generated = await generateDeviceFingerprint();
          storeDeviceFingerprint(generated);
          setFingerprint(generated);
        }
      } catch (error) {
        console.error('Failed to initialize device fingerprint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, []);

  return { fingerprint, isLoading };
}

/**
 * Hook for risk assessment
 */
export function useRiskAssessment() {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assess = useCallback(async (signals?: Partial<RiskSignals>) => {
    setIsLoading(true);
    setError(null);

    try {
      const assessment = await SecurityApiService.assessRisk(signals || {});
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
  }, []);

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
 * Hook for blacklist checking
 */
export function useBlacklistCheck() {
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBlacklist = async () => {
      try {
        const result = await SecurityApiService.checkBlacklist();
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
 * Hook for IP intelligence
 */
export function useIpIntelligence() {
  const [ipIntel, setIpIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIpIntel = async () => {
      try {
        const intel = await SecurityApiService.getIpIntelligence();
        setIpIntel(intel);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch IP intelligence';
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
 * Hook for SMS verification
 */
export function useSmsVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (phone: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const success = await SecurityApiService.sendSmsVerification(phone);
      if (!success) {
        throw new Error('Failed to send SMS');
      }
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
      const success = await SecurityApiService.verifySmsCode(phone, code);
      if (!success) {
        throw new Error('Invalid SMS code');
      }
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
