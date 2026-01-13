import { IsString, IsOptional, IsEnum, IsUrl, IsBoolean } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateExerciseDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    muscleGroup?: string;

    @IsString()
    @IsOptional()
    equipment?: string;

    @IsUrl()
    @IsOptional()
    videoUrl?: string;

    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateExerciseDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    muscleGroup?: string;

    @IsString()
    @IsOptional()
    equipment?: string;

    @IsUrl()
    @IsOptional()
    videoUrl?: string;

    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
