/**
 * API Security Service
 * Handles all backend security API calls
 */

import { RiskSignals, RiskAssessmentResponse } from '@/lib/security/risk-assessment';
import { generateDeviceFingerprint } from '@/lib/security/device-fingerprint';

// Was defaulting to :3000 (this web app's own port) instead of :4000 (the
// actual API port used by every other file's fallback, e.g. lib/config.ts,
// proxy.ts) — if NEXT_PUBLIC_API_URL was ever unset, this service would
// silently call itself instead of the backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class SecurityApiService {
  /**
   * Get IP intelligence from backend
   */
  static async getIpIntelligence(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/ip-intel`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`IP intelligence fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get IP intelligence:', error);
      return null;
    }
  }

  /**
   * Submit risk assessment to backend
   */
  static async assessRisk(signals: Partial<RiskSignals>): Promise<RiskAssessmentResponse> {
    try {
      const deviceFingerprint = await generateDeviceFingerprint();

      const payload = {
        ...signals,
        deviceId: deviceFingerprint.id,
        userAgent: deviceFingerprint.userAgent,
        timezone: deviceFingerprint.timezone,
        screenResolution: deviceFingerprint.screenResolution,
        timestamp: Date.now(),
      };

      const response = await fetch(`${API_BASE_URL}/api/security/assess-risk`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Risk assessment failed: ${response.statusText}`);
      }

      return await response.json();
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
   * Log IP address for audit trail
   */
  static async logIpAccess(userId: string, eventType: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/security/log-ip`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventType,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to log IP access:', error);
    }
  }

  /**
   * Verify SMS code (for authentication challenges)
   */
  static async verifySmsCode(phone: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-sms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        throw new Error(`SMS verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('Failed to verify SMS:', error);
      return false;
    }
  }

  /**
   * Send SMS verification code
   */
  static async sendSmsVerification(phone: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-sms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error(`SMS send failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  /**
   * Check if IP is blacklisted
   */
  static async checkBlacklist(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/check-blacklist`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isBlacklisted === true;
    } catch (error) {
      console.error('Failed to check blacklist:', error);
      return false;
    }
  }

  /**
   * Get fraud events (admin only)
   */
  static async getFraudEvents(token: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/fraud/events`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fraud events: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get fraud events:', error);
      return [];
    }
  }

  /**
   * Submit fraud feedback (admin)
   */
  static async submitFraudFeedback(
    eventId: number,
    feedback: string,
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/fraud/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, feedback }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to submit fraud feedback:', error);
      return false;
    }
  }
}
