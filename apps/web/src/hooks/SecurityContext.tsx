/**
 * Security Context
 * Provides security state and functions to all child components
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  useDeviceFingerprint,
  useRiskAssessment,
  useBlacklistCheck,
  useIpIntelligence,
  useSmsVerification,
} from './useSecurity';
import { RiskAssessmentResponse, RiskSignals } from '@/lib/security/risk-assessment';

interface SecurityContextType {
  // Device Fingerprinting
  fingerprint: any | null;
  fingerprintLoading: boolean;

  // Risk Assessment
  riskAssessment: RiskAssessmentResponse | null;
  assess: (signals?: Partial<RiskSignals>) => Promise<RiskAssessmentResponse | null>;
  riskLoading: boolean;
  riskError: string | null;
  requiresChallenge: boolean;
  isBlocked: boolean;

  // Blacklist
  isBlacklisted: boolean;
  blacklistLoading: boolean;
  blacklistError: string | null;

  // IP Intelligence
  ipIntel: any | null;
  ipIntelLoading: boolean;
  ipIntelError: string | null;

  // SMS Verification
  sendSms: (phone: string) => Promise<boolean>;
  verifySms: (phone: string, code: string) => Promise<boolean>;
  smsVerifying: boolean;
  smsError: string | null;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { fingerprint, isLoading: fingerprintLoading } = useDeviceFingerprint();
  const {
    riskAssessment,
    assess,
    isLoading: riskLoading,
    error: riskError,
    requiresChallenge,
    isBlocked,
  } = useRiskAssessment();
  const { isBlacklisted, isLoading: blacklistLoading, error: blacklistError } =
    useBlacklistCheck();
  const { ipIntel, isLoading: ipIntelLoading, error: ipIntelError } = useIpIntelligence();
  const { send: sendSms, verify: verifySms, isVerifying: smsVerifying, error: smsError } =
    useSmsVerification();

  const value: SecurityContextType = {
    fingerprint,
    fingerprintLoading,
    riskAssessment,
    assess,
    riskLoading,
    riskError,
    requiresChallenge,
    isBlocked,
    isBlacklisted,
    blacklistLoading,
    blacklistError,
    ipIntel,
    ipIntelLoading,
    ipIntelError,
    sendSms,
    verifySms,
    smsVerifying,
    smsError,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}
