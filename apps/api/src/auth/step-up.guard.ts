import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";

/**
 * Requires a fresh MFA step-up for the signed-in user (header `X-Step-Up-Token`, obtained from
 * POST /api/auth/step-up, valid 5 minutes). Mount AFTER JwtAuthGuard and PermissionsGuard:
 *
 *   @UseGuards(JwtAuthGuard, PermissionsGuard, StepUpGuard)
 *
 * Permissions answer "may this role do it"; step-up answers "did a human just re-prove it".
 */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.userId;
    const token = req.headers["x-step-up-token"] as string | undefined;
    if (!userId || !this.auth.verifyStepUpToken(token, userId)) {
      throw new ForbiddenException({ message: "Multi-factor confirmation required", code: "STEP_UP_REQUIRED" });
    }
    return true;
  }
}
