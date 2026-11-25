/**
 * Machine Learning Service
 * Handles ML model predictions for fraud detection
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';

export interface MlFeatures {
  ip: string;
  deviceId: string;
  userId?: string;
  email?: string;
  phone?: string;
  eventType: string; // signup, login, payment, etc
  isVpn?: boolean;
  isProxy?: boolean;
  isDatacenter?: boolean;
  previousAttempts?: number;
  ageInDays?: number;
  [key: string]: any;
}

export interface MlPrediction {
  fraudScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  factors: string[]; // Contributing factors
  modelVersion: string;
  inferenceTime: number; // ms
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private mlClient: AxiosInstance;
  private mlEndpoint: string;
  private shadowMode: boolean;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.mlEndpoint = this.configService.get(
      'ML_ENDPOINT',
      'http://localhost:5000/predict',
    );
    this.shadowMode = this.configService.get('SHADOW_ML_MODE', 'false') === 'true';

    this.mlClient = axios.create({
      baseURL: this.mlEndpoint,
      timeout: 5000,
    });
  }

  /**
   * Predict fraud score for given features
   */
  async predict(features: MlFeatures): Promise<MlPrediction> {
    try {
      const startTime = Date.now();

      const response = await this.mlClient.post('/predict', {
        features: this.normalizeFeatures(features),
      });

      const inferenceTime = Date.now() - startTime;

      const prediction: MlPrediction = {
        fraudScore: response.data.fraud_score || 0.5,
        riskLevel: this.scoreToRiskLevel(response.data.fraud_score),
        confidence: response.data.confidence || 0.8,
        factors: response.data.factors || [],
        modelVersion: response.data.model_version || 'unknown',
        inferenceTime,
      };

      // Cache prediction
      await this.cachePrediction(features.deviceId, prediction);

      return prediction;
    } catch (error) {
      this.logger.error(`ML prediction error: ${error.message}`);
      // Fallback to rule-based scoring
      return this.fallbackPredict(features);
    }
  }

  /**
   * Shadow ML mode - run prediction without affecting business logic
   */
  async shadowPredict(features: MlFeatures): Promise<void> {
    if (!this.shadowMode) return;

    try {
      const prediction = await this.predict(features);
      // Log for comparison but don't use in decision
      await this.redisService.setJson(
        `shadow:${features.deviceId}`,
        {
          prediction,
          timestamp: new Date(),
        },
        3600, // 1 hour
      );
    } catch (error) {
      this.logger.debug(`Shadow ML error (ignored): ${error.message}`);
    }
  }

  /**
   * Extract ML features from request context
   */
  extractFeatures(context: any): MlFeatures {
    return {
      ip: context.ip || 'unknown',
      deviceId: context.deviceFingerprint || '',
      userId: context.userId,
      email: context.email,
      phone: context.phone,
      eventType: context.eventType || 'unknown',
      isVpn: context.ipIntel?.is_vpn || false,
      isProxy: context.ipIntel?.is_proxy || false,
      isDatacenter: context.ipIntel?.is_datacenter || false,
      previousAttempts: context.previousAttempts || 0,
      ageInDays: context.accountAgeInDays || 0,
    };
  }

  /**
   * Normalize features for ML model
   */
  private normalizeFeatures(features: MlFeatures): any {
    return {
      ip_hash: this.hashValue(features.ip),
      device_id: features.deviceId,
      person_id: features.userId ? this.hashValue(features.userId) : null,
      event_type: this.encodeEventType(features.eventType),
      is_vpn: features.isVpn ? 1 : 0,
      is_proxy: features.isProxy ? 1 : 0,
      is_datacenter: features.isDatacenter ? 1 : 0,
      previous_attempts: Math.min(features.previousAttempts || 0, 10),
      account_age_days: Math.min(features.ageInDays || 0, 365),
    };
  }

  /**
   * Convert fraud score to risk level
   */
  private scoreToRiskLevel(
    score: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.25) return 'low';
    if (score < 0.5) return 'medium';
    if (score < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Fallback rule-based prediction
   */
  private fallbackPredict(features: MlFeatures): MlPrediction {
    let score = 0.3; // Base risk

    if (features.isVpn) score += 0.15;
    if (features.isProxy) score += 0.1;
    if (features.isDatacenter) score += 0.08;
    if (features.previousAttempts >= 5) score += 0.2;
    if (!features.ageInDays || features.ageInDays < 1) score += 0.15;

    score = Math.min(score, 1);

    return {
      fraudScore: score,
      riskLevel: this.scoreToRiskLevel(score),
      confidence: 0.6,
      factors: this.buildFactors(features),
      modelVersion: 'fallback',
      inferenceTime: 0,
    };
  }

  /**
   * Build list of contributing factors
   */
  private buildFactors(features: MlFeatures): string[] {
    const factors: string[] = [];

    if (features.isVpn) factors.push('VPN detected');
    if (features.isProxy) factors.push('Proxy detected');
    if (features.isDatacenter) factors.push('Datacenter IP');
    if (features.previousAttempts >= 5) factors.push('Multiple failed attempts');
    if (!features.ageInDays || features.ageInDays < 1) factors.push('New account');

    return factors;
  }

  /**
   * Hash value for privacy
   */
  private hashValue(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Encode event type for ML model
   */
  private encodeEventType(eventType: string): number {
    const mapping: { [key: string]: number } = {
      signup: 1,
      login: 2,
      payment: 3,
      password_reset: 4,
      profile_update: 5,
    };
    return mapping[eventType.toLowerCase()] || 0;
  }

  /**
   * Cache prediction result
   */
  private async cachePrediction(
    deviceId: string,
    prediction: MlPrediction,
  ): Promise<void> {
    try {
      await this.redisService.setJson(
        `ml:prediction:${deviceId}`,
        prediction,
        3600, // 1 hour cache
      );
    } catch (error) {
      this.logger.debug(`Failed to cache ML prediction: ${error.message}`);
    }
  }

  /**
   * Get cached prediction
   */
  async getCachedPrediction(deviceId: string): Promise<MlPrediction | null> {
    return this.redisService.getJson(`ml:prediction:${deviceId}`);
  }

  /**
   * Retrain ML model trigger (for background jobs)
   */
  async triggerRetraining(): Promise<void> {
    try {
      await this.mlClient.post ('/retrain', {});
      this.logger.log('ML model retraining triggered');
    } catch (error) {
      this.logger.error(`Failed to trigger retraining: ${error.message}`);
    }
  }
}
