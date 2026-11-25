/**
 * Fraud Event Tracker Service
 * Handles logging and tracking of fraud events and decisions
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';

// Previously imported from the dead `common/risk/risk.engine.ts` (removed —
// see ultra_datebuk-08-01-2026.txt, L-4 — it was never actually wired up
// anywhere except an excluded .bak file). Only the shape actually consumed
// by logDecision() below is needed here.
export interface RiskAssessmentResponse {
  riskScore: number;
  riskLevel: string;
  factors: string[];
  confidence: number;
}

export interface FraudEventInput {
  userId?: string;
  ip: string;
  eventType: string; // 'signup', 'login', 'payment', etc
  riskScore: number;
  riskLevel: string;
  details: any;
  decisionApplied?: string; // 'allow', 'challenge', 'block'
  challengeMethod?: string; // 'sms', 'email', 'captcha'
}

@Injectable()
export class FraudEventTracker {
  private readonly logger = new Logger(FraudEventTracker.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Track a fraud event
   */
  async trackEvent(input: FraudEventInput): Promise<any> {
    try {
      const event = await this.prisma.fraudEvent.create({
        data: {
          userId: input.userId,
          ip: input.ip,
          eventType: input.eventType,
          riskScore: input.riskScore,
          riskLevel: input.riskLevel,
          details: input.details,
          decisionApplied: input.decisionApplied,
          challengeMethod: input.challengeMethod,
        },
      });

      // Track in Redis for real-time analytics
      await this.trackInRedis(input);

      this.logger.log(
        `Fraud event tracked: ${input.eventType} - Risk: ${input.riskScore}`,
      );

      return event;
    } catch (error) {
      this.logger.error(`Failed to track fraud event: ${error.message}`);
      // Still track in Redis for analytics even if DB fails
      await this.trackInRedis(input);
      throw error;
    }
  }

  /**
   * Log fraud decision and create moderation queue if needed
   */
  async logDecision(
    fraudEventId: string,
    decision: string,
    assessment: RiskAssessmentResponse,
  ): Promise<any> {
    try {
      // Store explanation
      const explanation = await this.prisma.fraudExplanation.create({
        data: {
          fraudEventId,
          factors: assessment.factors,
          sources: {
            riskScore: assessment.riskScore,
            level: assessment.riskLevel,
            confidence: assessment.confidence,
          },
          explanation: `Risk: ${assessment.riskLevel}. Factors: ${assessment.factors.join(', ')}`,
        },
      });

      // Queue for moderation if high risk
      if (assessment.riskScore > 70) {
        const event = await this.prisma.fraudEvent.findUnique({
          where: { id: fraudEventId },
        });

        await this.prisma.moderatorQueue.create({
          data: {
            fraudEventId,
            userId: event?.userId,
            reason: `High risk ${event?.eventType}: ${assessment.factors.join(', ')}`,
            priority: Math.floor(assessment.riskScore / 20), // 0-5
          },
        });

        this.logger.log(`Event ${fraudEventId} queued for moderation`);
      }

      return explanation;
    } catch (error) {
      this.logger.error(`Failed to log decision: ${error.message}`);
      throw error;
    }
  }

  /**
   * Provide feedback on fraud event
   */
  async provideFeedback(
    fraudEventId: string,
    feedback: 'legitimate' | 'fraud' | 'unsure',
    reason?: string,
  ): Promise<any> {
    try {
      const result = await this.prisma.fraudFeedback.upsert({
        where: { fraudEventId },
        update: {
          feedback,
          reason,
          providedAt: new Date(),
        },
        create: {
          fraudEventId,
          feedback,
          reason,
        },
      });

      // Update event as resolved
      const fraudEvent = await this.prisma.fraudEvent.update({
        where: { id: fraudEventId },
        data: {
          resolved: true,
        },
      });

      // The appeal path: marking a false-positive suspension "legitimate" previously only
      // set resolved=true and stopped there — the account stayed SUSPENDED forever with
      // no code path anywhere that ever flipped it back. A "restrict"-tier flag (see
      // AuthService.flagIpRisk / UsersService.assertNotUnderRiskReview) already lifts
      // automatically once resolved=true; a "block"-tier suspension needs this extra step
      // since it also changed accountStatus and revoked sessions.
      if (feedback === "legitimate" && fraudEvent.userId && fraudEvent.decisionApplied === "block") {
        const user = await this.prisma.user.findUnique({ where: { id: fraudEvent.userId }, select: { accountStatus: true } });
        if (user?.accountStatus === "SUSPENDED") {
          await this.prisma.user.update({ where: { id: fraudEvent.userId }, data: { accountStatus: "ACTIVE" } });
          this.logger.log(`Reinstated user ${fraudEvent.userId} after fraud event ${fraudEventId} was marked legitimate`);
        }
      }

      // Track feedback in Redis for ML retraining
      await this.trackFeedback(fraudEventId, feedback);

      this.logger.log(`Feedback provided for event ${fraudEventId}: ${feedback}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to provide feedback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get fraud event with details
   */
  async getEventWithDetails(eventId: string): Promise<any> {
    return this.prisma.fraudEvent.findUnique({
      where: { id: eventId },
      include: {
        feedback: true,
        explanation: true,
        moderationQueue: true,
      },
    });
  }

  /**
   * Get events for moderation
   */
  async getModeratorQueue(limit: number = 10, status: string = 'pending'): Promise<any[]> {
    return this.prisma.moderatorQueue.findMany({
      where: { status },
      include: {
        fraudEvent: {
          include: {
            explanation: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
      take: limit,
    });
  }

  /**
   * Resolve moderation queue item
   */
  async resolveModerationItem(
    queueId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ): Promise<any> {
    try {
      const result = await this.prisma.moderatorQueue.update({
        where: { id: queueId },
        data: {
          status: decision === 'approved' ? 'approved' : 'rejected',
          notes,
          reviewedAt: new Date(),
        },
      });

      this.logger.log(`Moderation item ${queueId} resolved: ${decision}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to resolve moderation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get fraud statistics
   */
  async getFraudStats(hours: number = 24): Promise<any> {
    const since = new Date(Date.now() - hours * 3600000);

    const stats = await this.prisma.fraudEvent.groupBy({
      by: ['eventType', 'riskLevel'],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: true,
    });

    const total = await this.prisma.fraudEvent.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    });

    const resolved = await this.prisma.fraudEvent.count({
      where: {
        createdAt: {
          gte: since,
        },
        resolved: true,
      },
    });

    return {
      total,
      resolved,
      pending: total - resolved,
      byType: stats,
      fraudRate: ((total - resolved) / total * 100).toFixed(2) + '%',
    };
  }

  /**
   * Track event in Redis for real-time analytics
   */
  private async trackInRedis(input: FraudEventInput): Promise<void> {
    try {
      const key = `events:${input.eventType}:${new Date().toISOString().split('T')[0]}`;
      await this.redisService.increment(key, 86400 * 7); // 7-day TTL

      // Track by risk level
      const riskKey = `risk:${input.riskLevel}:${input.eventType}`;
      await this.redisService.increment(riskKey, 86400 * 7);

      // Track by IP
      const ipKey = `ip:${input.ip}:events`;
      await this.redisService.increment(ipKey, 3600); // 1-hour TTL
    } catch (error) {
      this.logger.debug(`Redis tracking failed: ${error.message}`);
    }
  }

  /**
   * Track feedback for ML retraining
   */
  private async trackFeedback(eventId: string, feedback: string): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const key = `feedback:${feedback}:${date}`;
      await this.redisService.increment(key, 86400 * 7);
    } catch (error) {
      this.logger.debug(`Feedback tracking failed: ${error.message}`);
    }
  }
}
