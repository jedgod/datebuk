/**
 * Fraud Admin Controller
 * Handles fraud event management and review
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { FraudEventTracker } from '../common/fraud/fraud-event-tracker';
import { PrismaService } from '../database/prisma.service';
import { AddIpBlacklistDto, RemoveIpBlacklistDto } from './dto/blacklist.dto';

@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FraudController {
  private readonly logger = new Logger(FraudController.name);

  constructor(
    private fraudTracker: FraudEventTracker,
    private prisma: PrismaService,
  ) {}

  /**
   * Get recent fraud events
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('events')
  async getEvents(
    @Query('limit') limit?: number,
    @Query('type') eventType?: string,
    @Query('resolved') resolved?: string,
  ) {
   const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (resolved !== undefined) {
      where.resolved = resolved === 'true';
    }

    const events = await this.prisma.fraudEvent.findMany({
      where,
      include: {
        feedback: true,
        explanation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit || 20, 100),
    });

    return {
      count: events.length,
      events,
    };
  }

  /**
   * Get fraud statistics
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('stats')
  async getStats(@Query('hours') hours?: number) {
    return this.fraudTracker.getFraudStats(hours || 24);
  }

  /**
   * Provide feedback on fraud event
   */
  @RequirePermissions('ADMIN_MANAGE_FRAUD')
  @Post('events/:eventId/feedback')
  async provideFeedback(
    @Param('eventId') eventId: string,
    @Body() body: { feedback: 'legitimate' | 'fraud' | 'unsure'; reason?: string },
  ) {
    try {
      const result = await this.fraudTracker.provideFeedback(
        eventId,
        body.feedback,
        body.reason,
      );

      return {
        success: true,
        message: 'Feedback recorded',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Feedback error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get fraud event details
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('events/:eventId')
  async getEventDetails(@Param('eventId') eventId: string) {
    const event = await this.fraudTracker.getEventWithDetails(eventId);

    if (!event) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    return {
      success: true,
      data: event,
    };
  }

  /**
   * Block an IP address
   */
  @RequirePermissions('ADMIN_MANAGE_FRAUD')
  @Post('blacklist/add')
  async addIpToBlacklist(
    @Body() body: AddIpBlacklistDto,
  ) {
    try {
      const entry = await this.prisma.ipBlacklist.create({
        data: {
          ip: body.ip,
          reason: body.reason,
          severity: body.severity || 'medium',
        },
      });

      this.logger.log(`IP blacklisted: ${body.ip}`);

      return {
        success: true,
        message: 'IP blacklisted',
        data: entry,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if IP is blacklisted
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('blacklist/check/:ip')
  async checkBlacklist(@Param('ip') ip: string) {
    const entry = await this.prisma.ipBlacklist.findUnique({
      where: { ip },
    });

    return {
      ip,
      blacklisted: !!entry && entry.blocked,
      entry,
    };
  }

  /**
   * Remove IP from blacklist
   */
  @RequirePermissions('ADMIN_MANAGE_FRAUD')
  @Post('blacklist/remove')
  async removeIpFromBlacklist(@Body() body: RemoveIpBlacklistDto) {
    try {
      await this.prisma.ipBlacklist.delete({
        where: { ip: body.ip },
      });

      this.logger.log(`IP removed from blacklist: ${body.ip}`);

      return {
        success: true,
        message: 'IP removed from blacklist',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List blacklisted IPs
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('blacklist/list')
  async listBlacklist(@Query('limit') limit?: number) {
    const entries = await this.prisma.ipBlacklist.findMany({
      where: { blocked: true },
      orderBy: { addedAt: 'desc' },
      take: Math.min(limit || 20, 100),
    });

    return {
      count: entries.length,
      entries,
    };
  }

  /**
   * Get fraud events by IP
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('ip/:ip/events')
  async getEventsByIp(@Param('ip') ip: string) {
    const events = await this.prisma.fraudEvent.findMany({
      where: { ip },
      include: {
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      ip,
      count: events.length,
      events,
    };
  }

  /**
   * Get fraud events by user
   */
  @RequirePermissions('ADMIN_VIEW_FRAUD')
  @Get('user/:userId/events')
  async getEventsByUser(@Param('userId') userId: string) {
    const events = await this.prisma.fraudEvent.findMany({
      where: { userId },
      include: {
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      userId,
      count: events.length,
      events,
    };
  }
}
