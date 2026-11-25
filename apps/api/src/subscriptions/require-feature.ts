import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FeatureAccessService } from "./feature-access.service";

export const FEATURE_KEY = "required_feature";

/**
 * Gate a route on the caller's subscription plan (and daily quota) for one feature.
 * Use after JwtAuthGuard:
 *
 *   @UseGuards(JwtAuthGuard, FeatureGuard)
 *   @RequireFeature("chat.attach")
 *
 * The guard consumes one unit of quota on admission, so use it for features whose handler
 * rarely fails. For work that must roll the quota back on failure, or that needs
 * match/block/consent context, call FeatureAccessService.consume() from the service layer
 * instead, with context the server derived itself.
 */
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector, private access: FeatureAccessService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string | undefined>(FEATURE_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!feature) return true;
    const userId = ctx.switchToHttp().getRequest().user?.userId;
    if (!userId) return false;
    await this.access.require(userId, feature);
    return true;
  }
}
