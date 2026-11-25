import { Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsEmail, IsString, Length, Matches, MaxLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RecoveryService } from "./recovery.service";

class PhoneDto {
  @IsString() @MaxLength(20) @Matches(/^\+[1-9]\d{7,14}$/, { message: "Enter your mobile number in international format, e.g. +14155550123" })
  phone!: string;
}
class PhoneVerifyDto extends PhoneDto {
  @IsString() @Length(6, 6) @Matches(/^\d{6}$/)
  code!: string;
}
class RecoveryRequestDto {
  @IsEmail() @MaxLength(254)
  email!: string;
}
class RecoveryVerifyDto extends RecoveryRequestDto {
  @IsString() @Length(6, 6) @Matches(/^\d{6}$/)
  code!: string;
}

const ctx = (req: any, deviceId?: string) => ({ ip: req.ip as string, deviceId, userAgent: req.headers["user-agent"] as string });

/**
 * Phone verification and SMS recovery. None of these requires a paid plan.
 * Per-IP throttles here are only the outer layer; the OTP engine and fraud service apply the
 * per-recipient / per-device / per-user limits.
 */
@Controller("auth")
export class OtpController {
  constructor(private recovery: RecoveryService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("phone/otp/request")
  requestPhone(@Req() req: any, @Body() dto: PhoneDto, @Headers("x-device-id") deviceId?: string) {
    return this.recovery.requestPhoneVerification(req.user.userId, dto.phone, ctx(req, deviceId));
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("phone/otp/verify")
  confirmPhone(@Req() req: any, @Body() dto: PhoneVerifyDto) {
    return this.recovery.confirmPhoneVerification(req.user.userId, dto.phone, dto.code);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("recovery/sms/request")
  requestRecovery(@Req() req: any, @Body() dto: RecoveryRequestDto, @Headers("x-device-id") deviceId?: string) {
    return this.recovery.requestRecovery(dto.email, ctx(req, deviceId));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("recovery/sms/verify")
  verifyRecovery(@Req() req: any, @Body() dto: RecoveryVerifyDto) {
    return this.recovery.verifyRecovery(dto.email, dto.code, ctx(req));
  }
}
