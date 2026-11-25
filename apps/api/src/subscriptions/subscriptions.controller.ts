import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SubscriptionsService } from './subscriptions.service';
import { FeatureAccessService } from './feature-access.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private featureAccess: FeatureAccessService,
  ) {}

  /** The caller's plan, what it includes, and today's quota usage. */
  @Get('usage')
  async usage(@Req() req: any) {
    return this.featureAccess.usage(req.user.userId);
  }

  @Get('entitlements')
  async getEntitlements(@Req() req: any) {
    const userId = req.user.userId;
    return this.subscriptionsService.getEntitlements(userId);
  }

  @Get('customer-info')
  async getCustomerInfo(@Req() req: any) {
    const userId = req.user.userId;
    return this.subscriptionsService.getCustomerInfo(userId);
  }

  @Get('features')
  async getFeatures(@Req() req: any) {
    const userId = req.user.userId;
    return this.subscriptionsService.getPlanFeatures(userId);
  }

  @Post('plan-change')
  async changePlan(
    @Req() req: any,
    @Body() body: { plan: string },
  ) {
    const userId = req.user.userId;
    return this.subscriptionsService.changePlan(userId, body.plan);
  }
}
