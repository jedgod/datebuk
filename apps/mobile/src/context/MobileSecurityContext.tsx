import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  useMobileDeviceFingerprint,
  useMobileRiskAssessment,
  useMobileSmsVerification,
  useMobileAuthAttempts,
  useMobileBlacklistCheck,
  useMobileIpIntelligence,
  useMobileAppSecurityStatus,
} from '../hooks/useMobileSecurity';
import type { RiskAssessmentResponse } from '../lib/security/risk-assessment';

// Types from backend
interface DeviceFingerprint {
  id: string;
  platform: 'iOS' | 'Android';
  osVersion: string;
  screenDimensions: string;
  appVersion: string;
}

interface IpIntelligence {
  ip: string;
  country: string;
  city: string;
  threat_level: string;
}

interface AppSecurityStatus {
  isSecure: boolean;
  minVersion: string;
  message?: string;
}

interface MobileSecurityContextType {
  // Device identification
  deviceFingerprint: DeviceFingerprint | null;
  deviceFingerprintLoading: boolean;
  deviceFingerprintError: string | null;

  // Risk assessment
  riskAssessment: RiskAssessmentResponse | null;
  assessRisk: () => Promise<RiskAssessmentResponse | null>;
  riskAssessmentLoading: boolean;
  riskAssessmentError: string | null;

  // SMS verification
  smsVerificationLoading: boolean;
  smsVerificationError: string | null;
  sendSmsCode: (phone: string) => Promise<boolean>;
  verifySmsCode: (phone: string, code: string) => Promise<boolean>;

  // Auth attempt tracking
  authAttempts: number;
  isAccountLocked: boolean;
  lockoutTimeRemaining: number | null;
  incrementAuthAttempts: () => void;
  resetAuthAttempts: () => void;

  // IP security
  isIpBlacklisted: boolean;
  ipIntelligence: IpIntelligence | null;
  ipCheckLoading: boolean;

  // App security status
  appSecurityStatus: AppSecurityStatus | null;
  appSecurityStatusLoading: boolean;

  // Global security state
  isSecurityCheckRequired: boolean;
  securityChallenge: 'sms' | 'biometric' | null;
  clearSecurityChallenge: () => void;
}

const MobileSecurityContext = createContext<MobileSecurityContextType | undefined>(
  undefined,
);

interface MobileSecurityProviderProps {
  children: ReactNode;
  autoCheckSecurity?: boolean;
}

export function MobileSecurityProvider({
  children,
  autoCheckSecurity = true,
}: MobileSecurityProviderProps) {
  // Device fingerprint
  const {
    fingerprint: deviceFingerprintData,
    isLoading: deviceFingerprintLoading,
    error: deviceFingerprintError,
  } = useMobileDeviceFingerprint();

  // Risk assessment
  const {
    assess: assessRiskFn,
    riskAssessment: riskAssessmentData,
    requiresChallenge,
    isBlocked,
    isLoading: riskAssessmentLoading,
    error: riskAssessmentError,
  } = useMobileRiskAssessment();

  // SMS verification
  const {
    send: sendSmsFn,
    verify: verifySmsCodeFn,
    isVerifying: smsVerificationLoading,
    error: smsVerificationError,
  } = useMobileSmsVerification();

  // Auth attempt tracking
  const {
    attempts: authAttempts,
    isLocked: isAccountLocked,
    lockoutTime,
    increment: incrementAuthAttempts,
    reset: resetAuthAttempts,
  } = useMobileAuthAttempts();

  // IP security
  const {
    isBlacklisted: isIpBlacklisted,
    isLoading: ipCheckLoading,
  } = useMobileBlacklistCheck();

  const { ipIntel: ipIntelligenceData } = useMobileIpIntelligence();

  // App security status
  const {
    status: appSecurityStatusData,
    isLoading: appSecurityStatusLoading,
  } = useMobileAppSecurityStatus();

  // Security challenge state
  const [securityChallenge, setSecurityChallenge] = useState<
    'sms' | 'biometric' | null
  >(null);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState<
    number | null
  >(null);

  // Calculate lockout time remaining
  useEffect(() => {
    if (!lockoutTime) {
      setLockoutTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, lockoutTime - now);

      if (remaining === 0) {
        setLockoutTimeRemaining(null);
        clearInterval(interval);
      } else {
        setLockoutTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Determine if security challenge is required
  const isSecurityCheckRequired = requiresChallenge && !isAccountLocked;

  // Auto-assess risk on mount
  useEffect(() => {
    if (autoCheckSecurity && deviceFingerprintData) {
      assessRiskFn();
    }
  }, [autoCheckSecurity, deviceFingerprintData, assessRiskFn]);

  // Update security challenge based on assessment
  useEffect(() => {
    if (isSecurityCheckRequired) {
      setSecurityChallenge('sms');
    } else if (!requiresChallenge) {
      setSecurityChallenge(null);
    }
  }, [isSecurityCheckRequired, requiresChallenge]);

  const assessRisk = useCallback(async () => {
    return await assessRiskFn();
  }, [assessRiskFn]);

  const sendSmsCode = useCallback(
    async (phone: string) => {
      return await sendSmsFn(phone);
    },
    [sendSmsFn],
  );

  const verifySmsCode = useCallback(
    async (phone: string, code: string) => {
      const result = await verifySmsCodeFn(phone, code);
      if (result) {
        setSecurityChallenge(null);
      }
      return result;
    },
    [verifySmsCodeFn],
  );

  const clearSecurityChallenge = useCallback(() => {
    setSecurityChallenge(null);
  }, []);

  const value: MobileSecurityContextType = {
    // Device fingerprint
    deviceFingerprint: deviceFingerprintData || null,
    deviceFingerprintLoading,
    deviceFingerprintError: deviceFingerprintError || null,

    // Risk assessment
    riskAssessment: riskAssessmentData || null,
    assessRisk,
    riskAssessmentLoading,
    riskAssessmentError: riskAssessmentError || null,

    // SMS verification
    smsVerificationLoading,
    smsVerificationError: smsVerificationError || null,
    sendSmsCode,
    verifySmsCode: verifySmsCode,

    // Auth attempt tracking
    authAttempts,
    isAccountLocked,
    lockoutTimeRemaining,
    incrementAuthAttempts,
    resetAuthAttempts,

    // IP security
    isIpBlacklisted,
    ipIntelligence: ipIntelligenceData || null,
    ipCheckLoading,

    // App security status
    appSecurityStatus: appSecurityStatusData || null,
    appSecurityStatusLoading,

    // Global security state
    isSecurityCheckRequired,
    securityChallenge,
    clearSecurityChallenge,
  };

  return (
    <MobileSecurityContext.Provider value={value}>
      {children}
    </MobileSecurityContext.Provider>
  );
}

/**
 * Hook to access mobile security context
 *
 * @throws {Error} If used outside MobileSecurityProvider
 * @returns {MobileSecurityContextType} Security context
 *
 * @example
 * const { riskAssessment, authAttempts, isAccountLocked } = useMobileSecurityContext();
 */
export function useMobileSecurityContext(): MobileSecurityContextType {
  const context = useContext(MobileSecurityContext);

  if (context === undefined) {
    throw new Error(
      'useMobileSecurityContext must be used within MobileSecurityProvider',
    );
  }

  return context;
}

export default MobileSecurityProvider;
