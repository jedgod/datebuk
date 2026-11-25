import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

/**
 * Risk Engine Service - Calculates fraud/risk scores
 */

@Injectable()
export class RiskEngineService {
  private readonly RISK_THRESHOLDS = {
    BLOCK: 80,
    CHALLENGE: 40,
  };

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Calculate initial risk based on IP intelligence
   */
  calculateInitialRisk(ipIntel: any): number {
    let score = 0;

    if (!ipIntel) return 0;

    // VPN detected
    if (ipIntel.isVpn) {
      score += 50;
    }

    // Proxy detected
    if (ipIntel.isProxy) {
      score += 30;
    }

    // Datacenter IP
    if (ipIntel.isDatacenter) {
      score += 20;
    }

    // Geographic anomaly
    if (ipIntel.isAnomalousLocation) {
      score += 40;
    }

    // Threat reputation
    if (ipIntel.threatLevel === 'high') {
      score += 60;
    } else if (ipIntel.threatLevel === 'medium') {
      score += 30;
    }

    return Math.min(score, 100);
  }

  /**
   * Evaluate full risk based on multiple factors
   */
  async evaluateFullRisk(features: {
    ipIntel: any;
    deviceId: string;
    userId?: string;
    eventType?: string;
    previousAttempts?: number;
  }): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresChallenge: boolean;
    requiresSMS: boolean;
    reasons: string[];
  }> {
    let score = this.calculateInitialRisk(features.ipIntel);
    const reasons: string[] = [];

    // Check device velocity
    if (features.previousAttempts && features.previousAttempts > 3) {
      score += Math.min(features.previousAttempts * 10, 20);
      reasons.push('Multiple failed attempts detected');
    }

    // Get ML prediction if available
    try {
      const mlScore = await this.getMlPrediction(features);
      score = Math.round((score + mlScore) / 2); // Blend with ML
      if (mlScore > 60) {
        reasons.push('Unusual activity pattern detected');
      }
    } catch (error) {
      console.warn('ML prediction failed, using rule-based score:', error);
    }

    const riskLevel =
      score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

    return {
      riskScore: score,
      riskLevel,
      requiresChallenge: score >= this.RISK_THRESHOLDS.CHALLENGE,
      requiresSMS: score >= this.RISK_THRESHOLDS.BLOCK ? false : true, // High risk blocks, medium requests SMS
      reasons,
    };
  }

  /**
   * Get ML prediction from ML service
   */
  private async getMlPrediction(features: any): Promise<number> {
    try {
      const mlEndpoint = this.configService.get('ML_ENDPOINT', 'http://localhost:5000/predict');
      const response = await lastValueFrom(
        this.httpService.post(mlEndpoint, {
          features: this.extractMlFeatures(features),
        }),
      );
      return response.data.score || 0;
    } catch (error) {
      console.error('ML prediction error:', error);
      return 0; // Fail gracefully
    }
  }

  /**
   * Extract features for ML model
   */
  private extractMlFeatures(features: any): Record<string, any> {
    return {
      isVpn: features.ipIntel?.isVpn ? 1 : 0,
      isProxy: features.ipIntel?.isProxy ? 1 : 0,
      isDatacenter: features.ipIntel?.isDatacenter ? 1 : 0,
      threatLevel: this.threatLevelToScore(features.ipIntel?.threatLevel),
      deviceAge: features.deviceAge || 0,
      accountAge: features.accountAge || 0,
      previousAttempts: features.previousAttempts || 0,
    };
  }

  private threatLevelToScore(level: string): number {
    const scores: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
    return scores[level] || 0;
  }
}
