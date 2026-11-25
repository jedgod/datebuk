import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MinLength(2)
  key: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
