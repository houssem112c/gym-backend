import { IsString, IsOptional, IsEnum, IsUrl, IsNumber, IsInt, Min } from 'class-validator';
import { PhotoType } from '@prisma/client';

export class CreateProgressPhotoDto {
    @IsUrl()
    imageUrl: string;

    @IsEnum(PhotoType)
    @IsOptional()
    type?: PhotoType;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateMeasurementDto {
    @IsNumber()
    @IsOptional()
    weight?: number;

    @IsNumber()
    @IsOptional()
    bodyFat?: number;

    @IsNumber()
    @IsOptional()
    waist?: number;

    @IsNumber()
    @IsOptional()
    chest?: number;

    @IsNumber()
    @IsOptional()
    arms?: number;

    @IsNumber()
    @IsOptional()
    legs?: number;
}

export class CreatePRDto {
    @IsString()
    exerciseId: string;

    @IsNumber()
    @Min(0)
    weight: number;

    @IsInt()
    @Min(1)
    reps: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
