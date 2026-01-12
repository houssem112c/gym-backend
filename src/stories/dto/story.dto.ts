import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsString()
  @IsOptional()
  caption?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class UpdateStoryDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}
