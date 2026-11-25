/**
 * Mobile Security API Client
 * Communicates with backend security services
 */

import axios, { AxiosInstance } from 'axios';
import { RiskAssessmentResponse } from '../lib/security/risk-assessment';
import { secureStorage } from './secureStorage';

// Same EXPO_PUBLIC_API_URL source as api.ts/websocket.ts/signaling.ts —
// previously this file read `Constants.expoConfig.extra.apiUrl` (a
// hardcoded LAN IP baked into the committed app.json) independently of
// every other service, so the two had to be kept in sync by hand.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE_URL = String(rawApiUrl).replace(/\/$/, '');

export class MobileSecurityApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Previously this relied on an in-memory `authToken` field that nothing
    // in the app ever called `setAuthToken()` to populate, so every request
    // silently went out unauthenticated — harmless for the endpoints that
    // don't require auth (ip-intel, assess-risk, check-blacklist) but would
    // have 401'd log-ip, which does. Read the real session token the same
    // way api.ts does.
    this.api.interceptors.request.use(async (config) => {
      const token = await secureStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get IP intelligence from backend
   */
  async getIpIntelligence(): Promise<any> {
    try {
      const response = await this.api.get('/api/security/ip-intel');
      return response.data;
    } catch (error) {
      console.error('Failed to get IP intelligence:', error);
      return null;
    }
  }

  /**
   * Submit risk assessment to backend
   */
  async assessRisk(signals: {
    deviceId: string;
    platform: string;
    osVersion: string;
    appVersion: string;
    screenDimensions: string;
    suspiciousActivity?: boolean;
    previousFailedAttempts?: number;
  }): Promise<RiskAssessmentResponse> {
    try {
      const response = await this.api.post('/api/security/assess-risk', {
        ...signals,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      console.error('Failed to assess risk:', error);
      // Return moderate risk on error (fail safe)
      return {
        riskScore: 50,
        riskLevel: 'medium',
        requiresChallenge: true,
        requiresSMS: false,
        message: 'Security assessment unavailable. Please try again.',
      };
    }
  }

  /**
   * Log IP access for audit trail
   */
  async logIpAccess(userId: string, eventType: string): Promise<void> {
    try {
      await this.api.post('/api/security/log-ip', {
        userId,
        eventType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log IP access:', error);
    }
  }

  /**
   * Send SMS verification code.
   *
   * NOT WIRED INTO ANY LOGIN/SIGNUP FLOW: `/api/auth/send-sms` and
   * `/api/auth/verify-sms` do not exist in apps/api/src (verified against
   * the live auth.controller.ts route list) — this method and
   * verifySmsCode() below will always fail (404) against the real backend.
   * Do not use this to gate access to anything until those endpoints are
   * actually implemented server-side; doing so today would lock users out
   * on a network call to a route that can never succeed.
   */
  async sendSmsVerification(phone: string): Promise<boolean> {
    try {
      const response = await this.api.post('/api/auth/send-sms', { phone });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  /**
   * Verify SMS code
   */
  async verifySmsCode(phone: string, code: string): Promise<boolean> {
    try {
      const response = await this.api.post('/api/auth/verify-sms', {
        phone,
        code,
      });
      return response.data.verified === true;
    } catch (error) {
      console.error('Failed to verify SMS:', error);
      return false;
    }
  }

  /**
   * Check if IP is blacklisted
   */
  async checkBlacklist(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/security/check-blacklist');
      return response.data.isBlacklisted === true;
    } catch (error) {
      console.error('Failed to check blacklist:', error);
      return false;
    }
  }

  /**
   * Mobile-specific: Check for app update requirement.
   *
   * NOT IMPLEMENTED SERVER-SIDE: `/api/security/app-status` does not exist
   * in apps/api/src. This always falls through to the catch block below and
   * returns the harmless `isSecure: true` default — fails open by design,
   * so it's safe to leave mounted, but it is not actually checking anything
   * today.
   */
  async checkAppSecurity(): Promise<{
    isSecure: boolean;
    minVersion: string;
    message: string;
  }> {
    try {
      const response = await this.api.get('/api/security/app-status');
      return response.data;
    } catch (error) {
      console.error('Failed to check app security:', error);
      return {
        isSecure: true,
        minVersion: '1.0.0',
        message: 'Unable to check security status',
      };
    }
  }

  /**
   * Mobile-specific: Report security incident.
   *
   * NOT IMPLEMENTED SERVER-SIDE: `/api/security/report-incident` does not
   * exist in apps/api/src — calls to this will 404 and the return value
   * will always be `false`.
   */
  async reportSecurityIncident(incident: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<boolean> {
    try {
      const response = await this.api.post('/api/security/report-incident', {
        ...incident,
        timestamp: new Date().toISOString(),
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to report incident:', error);
      return false;
    }
  }

  /**
   * Get security status (rate limiting, lockout, etc).
   *
   * NOT IMPLEMENTED SERVER-SIDE: `/api/security/status` does not exist in
   * apps/api/src. Account lockout is instead tracked purely client-side via
   * useMobileAuthAttempts (AsyncStorage counters) — see LoginScreen.tsx.
   */
  async getSecurityStatus(): Promise<{
    isLocked: boolean;
    remainingAttempts: number;
    unlockTime?: number;
  }> {
    try {
      const response = await this.api.get('/api/security/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get security status:', error);
      return {
        isLocked: false,
        remainingAttempts: 5,
      };
    }
  }
}

/**
 * Singleton instance
 */
export const mobileSecurityApi = new MobileSecurityApiClient();
