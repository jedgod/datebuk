import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; email: string; temp?: boolean }) {
    // The short-lived "temp" tokens issued mid-login (OTP verification, forced MFA
    // setup) are signed with this same secret, so without this check they'd pass
    // JwtAuthGuard on every protected route exactly like a real access token — letting
    // someone skip 2FA/mandatory-MFA entirely just by using the temp token directly.
    if (payload.temp) throw new UnauthorizedException("Temporary token cannot be used as a session credential");
    return { userId: payload.sub, email: payload.email };
  }
}
