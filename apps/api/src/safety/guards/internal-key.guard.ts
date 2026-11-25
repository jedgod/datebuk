import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "crypto";

// Guards service-to-service endpoints (currently: apps/signaling asking whether two
// users have blocked each other before allowing them into the same call room) against
// the same shared secret used for apps/api -> apps/signaling calls (SIGNALING_INTERNAL_KEY,
// set once in the shared .env both processes load).
@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const expected = process.env.SIGNALING_INTERNAL_KEY || "";
    if (!expected) throw new UnauthorizedException();

    const req = ctx.switchToHttp().getRequest();
    const provided = Buffer.from(String(req.headers["x-internal-key"] || ""));
    const expectedBuffer = Buffer.from(expected);
    if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
