import { Equals, IsBoolean, IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsStrongPassword } from "../common/security/password-policy";

export class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) @IsStrongPassword() password!: string;
  @IsString() displayName!: string;
  // The server independently recomputes age from this and rejects anyone
  // under 18 — client-sent ages are never trusted directly (see
  // AuthService.signup). Required, not optional: there is no code path that
  // creates an account without a verified date of birth.
  @IsDateString() dateOfBirth!: string;
  // Must literally be `true` in the request body — a client that never shows
  // this checkbox (or defaults it to checked) still has to explicitly send
  // `true`, so this can't be satisfied by omission.
  @IsBoolean()
  @Equals(true, { message: "You must confirm you are 18 or older and accept the Terms of Service" })
  ageConsent!: boolean;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class RefreshDto {
  // Optional: browser clients rely on the httpOnly `dp_refresh` cookie instead and
  // omit this field entirely; non-browser clients (mobile) still send it explicitly.
  @IsOptional() @IsString() refreshToken?: string;
}

export class VerifyEmailDto {
  @IsString() token!: string;
}

export class RequestResetDto {
  @IsEmail() email!: string;
}

export class ResetDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) @MaxLength(128) @IsStrongPassword() newPassword!: string;
}
