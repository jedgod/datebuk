import { IsEmail, IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../common/security/password-policy';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  jobTitle: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  requireTwoFactor?: boolean;

  roleIds: string[]; // IDs of roles to assign
}

export class ResetStaffPasswordDto {
  @IsEmail()
  email: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  newPassword: string;
}

export class SuspendStaffDto {
  @IsString()
  reason: string;
}

export class UpdateStaffRolesDto {
  roleIds: string[];
}

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;
}
