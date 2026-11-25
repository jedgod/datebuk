import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const SEEKING = ['MEN', 'WOMEN', 'EVERYONE'] as const;
export const ORIENTATIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Prefer not to say'] as const;
export const RELATIONSHIP_GOALS = [
  'Long-term relationship',
  'Short-term relationship',
  'Friendship',
  'Not sure yet',
] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  voiceIntroKey?: string;

  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;

  @IsOptional()
  @IsIn(GENDERS as unknown as string[])
  gender?: (typeof GENDERS)[number];

  /** Who the user wants to see: men, women or everyone. */
  @IsOptional()
  @IsIn(SEEKING as unknown as string[])
  seeking?: (typeof SEEKING)[number];

  @IsOptional()
  @IsIn(ORIENTATIONS as unknown as string[])
  sexualOrientation?: (typeof ORIENTATIONS)[number];

  @IsOptional()
  @IsIn(RELATIONSHIP_GOALS as unknown as string[])
  relationshipGoal?: (typeof RELATIONSHIP_GOALS)[number];

  @IsOptional()
  @IsInt()
  @Min(120)
  @Max(250)
  heightCm?: number;
}
