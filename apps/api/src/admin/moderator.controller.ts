/**
 * Moderator Queue Controller
 * Handles review and approval of flagged fraud events
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
import { FraudEventTracker } from '../common/fraud/fraud-event-tracker';
import { PrismaService } from '../database/prisma.service';

@Controller('admin/moderator')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModeratorController {
  private readonly logger = new Logger(ModeratorController.name);

  constructor(
    private fraudTracker: FraudEventTracker,
    private prisma: PrismaService,
  ) {}

  /**
   * Get moderation queue
   */
  @RequirePermissions('ADMIN_VIEW_MODERATION')
  @Get('queue')
  async getQueue(
    @Query('status') status?: string,
    @Query('priority') priority?: number,
    @Query('limit') limit?: number,
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority !== undefined) {
      where.priority = Math.floor(priority);
    }

    const queue = await this.prisma.moderatorQueue.findMany({
      where,
      include: {
        fraudEvent: {
          include: {
            explanation: true,
            feedback: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: Math.min(limit || 20, 100),
    });

    return {
      count: queue.length,
      queue,
    };
  }

  /**
   * Get queue statistics
   */
  @RequirePermissions('ADMIN_VIEW_MODERATION')
  @Get('queue/stats')
  async getQueueStats() {
    const pending = await this.prisma.moderatorQueue.count({
      where: { status: 'pending' },
    });

    const approved = await this.prisma.moderatorQueue.count({
      where: { status: 'approved' },
    });

    const rejected = await this.prisma.moderatorQueue.count({
      where: { status: 'rejected' },
    });

    const avgWaitTime = await this.prisma.moderatorQueue.aggregate({
      where: { status: 'pending' },
      _avg: {
        priority: true,
      },
    });

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }

  /**
   * Assign queue item to moderator
   */
  @RequirePermissions('ADMIN_MANAGE_MODERATION')
  @Post('queue/:itemId/assign')
  async assignQueueItem(
    @Param('itemId') itemId: string,
    @Req() req: any,
    @Body() body: { assignTo?: string },
  ) {
    try {
      const moderatorId = body.assignTo || req.user.userId;

      const result = await this.prisma.moderatorQueue.update({
        where: { id: itemId },
        data: {
          assignedTo: moderatorId,
        },
      });

      this.logger.log(`Queue item ${itemId} assigned to ${moderatorId}`);

      return {
        success: true,
        message: 'Item assigned',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Review and approve/reject queue item
   */
  @RequirePermissions('ADMIN_MANAGE_MODERATION')
  @Post('queue/:itemId/review')
  async reviewQueueItem(
    @Param('itemId') itemId: string,
    @Req() req: any,
    @Body() body: { decision: 'approved' | 'rejected'; notes?: string },
  ) {
    try {
      const result = await this.fraudTracker.resolveModerationItem(
        itemId,
        body.decision,
        body.notes,
      );

      // Update with reviewer info
      await this.prisma.moderatorQueue.update({
        where: { id: itemId },
        data: {
          reviewedBy: req.user.userId,
        },
      });

      this.logger.log(
        `Queue item ${itemId} reviewed: ${body.decision} by ${req.user.userId}`,
      );

      return {
        success: true,
        message: `Item ${body.decision}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get item details
   */
  @RequirePermissions('ADMIN_VIEW_MODERATION')
  @Get('queue/:itemId')
  async getQueueItemDetails(@Param('itemId') itemId: string) {
    const item = await this.prisma.moderatorQueue.findUnique({
      where: { id: itemId },
      include: {
        fraudEvent: {
          include: {
            explanation: true,
            feedback: true,
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return {
        success: false,
        error: 'Item not found',
      };
    }

    return {
      success: true,
      data: item,
    };
  }

  /**
   * Escalate queue item
   */
  @RequirePermissions('ADMIN_MANAGE_MODERATION')
  @Post('queue/:itemId/escalate')
  async escalateQueueItem(
    @Param('itemId') itemId: string,
    @Body() body: { reason?: string },
  ) {
    try {
      const result = await this.prisma.moderatorQueue.update({
        where: { id: itemId },
        data: {
          status: 'escalated',
          notes: (body.reason || 'Escalated for review') + '\n' + (await this.getTimestamp()),
          priority: 5, // Highest priority
        },
      });

      this.logger.log(`Queue item ${itemId} escalated`);

      return {
        success: true,
        message: 'Item escalated',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get moderator statistics
   */
  @RequirePermissions('ADMIN_VIEW_MODERATION')
  @Get('stats')
  async getModeratorStats(@Req() req: any) {
    const moderatorId = req.user.userId;

    const reviewed = await this.prisma.moderatorQueue.count({
      where: {
        reviewedBy: moderatorId,
      },
    });

    const assigned = await this.prisma.moderatorQueue.count({
      where: {
        assignedTo: moderatorId,
        status: 'pending',
      },
    });

    const approved = await this.prisma.moderatorQueue.count({
      where: {
        reviewedBy: moderatorId,
        status: 'approved',
      },
    });

    const rejected = await this.prisma.moderatorQueue.count({
      where: {
        reviewedBy: moderatorId,
        status: 'rejected',
      },
    });

    return {
      moderatorId,
      reviewed,
      assigned,
      approved,
      rejected,
      approvalRate: reviewed > 0 ? ((approved / reviewed) * 100).toFixed(2) + '%' : 'N/A',
    };
  }

  /**
   * Get all assigned items for moderator
   */
  @RequirePermissions('ADMIN_VIEW_MODERATION')
  @Get('my-queue')
  async getMyQueue(@Req() req: any, @Query('status') status?: string) {
    const moderatorId = req.user.userId;

    const where: any = {
      assignedTo: moderatorId,
    };

    if (status) {
      where.status = status;
    }

    const queue = await this.prisma.moderatorQueue.findMany({
      where,
      include: {
        fraudEvent: {
          include: {
            explanation: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      moderatorId,
      count: queue.length,
      queue,
    };
  }

  /**
   * Helper to get timestamp
   */
  private async getTimestamp(): Promise<string> {
    return new Date().toISOString();
  }
}
