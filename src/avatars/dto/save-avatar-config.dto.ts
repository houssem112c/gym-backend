import { IsOptional, IsString } from 'class-validator';

export class SaveAvatarConfigDto {
  @IsString()
  @IsOptional()
  bodyShape?: string;

  @IsString()
  @IsOptional()
  skinTone?: string;

  @IsString()
  @IsOptional()
  hairStyle?: string;

  @IsString()
  @IsOptional()
  hairColor?: string;

  @IsString()
  @IsOptional()
  faceStyle?: string;

  @IsString()
  @IsOptional()
  eyeStyle?: string;

  @IsString()
  @IsOptional()
  mouthStyle?: string;

  @IsString()
  @IsOptional()
  outfit?: string;

  @IsOptional()
  config?: any;
}
