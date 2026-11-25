/**
 * Experiment Controller
 * Handles A/B testing for risk model variants
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Logger,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Controller('admin/experiment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('ADMIN_MANAGE_EXPERIMENTS')
export class ExperimentController {
  private readonly logger = new Logger(ExperimentController.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Assign user to experiment variant
   */
  async assignToVariant(userId: string, experimentId: string): Promise<string> {
    // Check if already assigned
    const existing = await this.prisma.experimentAssignment.findUnique({
      where: {
        userId_experimentId: {
          userId,
          experimentId,
        },
      },
    });

    if (existing) {
      return existing.variant;
    }

    // Deterministic variant assignment based on user ID
    const hash = this.hashString(userId);
    const variants = ['control', 'treatment_a', 'treatment_b'];
    const variant = variants[Math.abs(hash) % variants.length];

    // Store assignment
    await this.prisma.experimentAssignment.create({
      data: {
        userId,
        experimentId,
        variant,
      },
    });

    return variant;
  }

  /**
   * Get user's variant for experiment
   */
  @Get('variant/:experimentId')
  async getUserVariant(
    @Param('experimentId') experimentId: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    const assignment = await this.prisma.experimentAssignment.findUnique({
      where: {
        userId_experimentId: {
          userId,
          experimentId,
        },
      },
    });

    if (!assignment) {
      // Auto-assign if not exists
      const variant = await this.assignToVariant(userId, experimentId);
      return {
        userId,
        experimentId,
        variant,
      };
    }

    return assignment;
  }

  /**
   * Get experiment results
   */
  @Get('results/:experimentId')
  async getExperimentResults(
    @Param('experimentId') experimentId: string,
    @Query('metric') metric?: string,
  ) {
    const assignments = await this.prisma.experimentAssignment.groupBy({
      by: ['variant'],
      where: { experimentId },
      _count: true,
    });

    // Get fraud rate by variant
    const results: any = {
      experimentId,
      totalAssignments: assignments.reduce((sum, a) => sum + a._count, 0),
      variants: [],
    };

    for (const assignment of assignments) {
      const fraudEvents = await this.prisma.fraudEvent.count({
        where: {
          userId: {
            in: (
              await this.prisma.experimentAssignment.findMany({
                where: {
                  experimentId,
                  variant: assignment.variant,
                },
                select: { userId: true },
              })
            ).map((a) => a.userId || ''),
          },
        },
      });

      const fraudRate = assignment._count > 0 ? fraudEvents / assignment._count : 0;

      results.variants.push({
        variant: assignment.variant,
        count: assignment._count,
        fraudEvents,
        fraudRate: (fraudRate * 100).toFixed(2) + '%',
      });
    }

    return results;
  }

  /**
   * Create new experiment
   */
  @Post('create')
  async createExperiment(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      description?: string;
      variants: string[];
      duration?: number;
    },
  ) {
    try {
      // Create experiment metadata in Redis
      const experimentId = `exp_${Date.now()}`;

      await this.redis.setJson(
        `experiment:${experimentId}`,
        {
          name: body.name,
          description: body.description,
          variants: body.variants,
          startedAt: new Date(),
          endsAt: body.duration
            ? new Date(Date.now() + body.duration * 24 * 3600000)
            : null,
          createdBy: req.user.userId,
        },
        body.duration ? body.duration * 86400 : undefined, // TTL in seconds
      );

      this.logger.log(`Experiment created: ${experimentId} (${body.name})`);

      return {
        success: true,
        experimentId,
        message: 'Experiment created',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get experiment status
   */
  @Get('status/:experimentId')
  async getExperimentStatus(@Param('experimentId') experimentId: string) {
    const experiment = await this.redis.getJson(`experiment:${experimentId}`);

    if (!experiment) {
      return {
        success: false,
        error: 'Experiment not found',
      };
    }

    const assignments = await this.prisma.experimentAssignment.count({
      where: { experimentId },
    });

    return {
      success: true,
      experimentId,
      ...experiment,
      assignmentsCount: assignments,
    };
  }

  /**
   * End experiment
   */
  @Post('end/:experimentId')
  async endExperiment(@Param('experimentId') experimentId: string) {
    try {
      // Get results before ending
      const results = await this.getExperimentResults(experimentId);

      // Archive experiment
      await this.redis.setJson(
        `experiment:${experimentId}:archived`,
        {
          ...results,
          endedAt: new Date(),
        },
        86400 * 365, // 1 year archive
      );

      // Remove active experiment
      await this.redis.delete(`experiment:${experimentId}`);

      this.logger.log(`Experiment ended: ${experimentId}`);

      return {
        success: true,
        message: 'Experiment ended',
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List active experiments
   */
  @Get('list')
  async listExperiments(@Query('limit') limit?: number) {
    const redis = this.redis.getClient();
    const keys: string[] = [];

    // Get all experiment keys
    const stream = redis.scanStream({
      match: 'experiment:*',
      count: 100,
    });

    return new Promise((resolve) => {
      const experiments: any[] = [];

      stream.on('data', async (resultKeys: string[]) => {
        for (const key of resultKeys) {
          if (!key.includes(':archived')) {
            const data = await this.redis.getJson(key);
            if (data) {
              experiments.push({
                id: key.replace('experiment:', ''),
                ...data,
              });
            }
          }
        }
      });

      stream.on('end', () => {
        resolve({
          count: experiments.length,
          experiments: experiments.slice(0, limit || 10),
        });
      });

      stream.on('error', (error) => {
        this.logger.error(`Error listing experiments: ${error.message}`);
        resolve({
          error: error.message,
        });
      });
    });
  }

  /**
   * Hash function for deterministic variant assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}
