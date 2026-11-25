import { IsIn, IsIP, IsOptional, IsString, MinLength } from 'class-validator';

export class AddIpBlacklistDto {
  @IsIP()
  ip: string;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;
}

export class RemoveIpBlacklistDto {
  @IsIP()
  ip: string;
}
