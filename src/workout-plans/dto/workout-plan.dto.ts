import { IsString, IsOptional, IsEnum, IsUrl, IsInt, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '@prisma/client';

export class WorkoutPlanExerciseDto {
    @IsString()
    exerciseId: string;

    @IsInt()
    @IsOptional()
    order?: number;

    @IsInt()
    @IsOptional()
    sets?: number;

    @IsString()
    @IsOptional()
    reps?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateWorkoutPlanDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    goal?: string;

    @IsInt()
    @IsOptional()
    durationWeeks?: number;

    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => WorkoutPlanExerciseDto)
    exercises?: WorkoutPlanExerciseDto[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateWorkoutPlanDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    goal?: string;

    @IsInt()
    @IsOptional()
    durationWeeks?: number;

    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => WorkoutPlanExerciseDto)
    exercises?: WorkoutPlanExerciseDto[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
