import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SessionStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export class CreateSetLogDto {
    @IsString()
    exerciseId: string;

    @IsNumber()
    setNumber: number;

    @IsNumber()
    weight: number;

    @IsNumber()
    reps: number;
}

export class CreateWorkoutSessionDto {
    @IsString()
    @IsOptional()
    workoutPlanId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateSetLogDto)
    setLogs?: CreateSetLogDto[];
}

export class UpdateWorkoutSessionDto {
    @IsEnum(SessionStatus)
    @IsOptional()
    status?: SessionStatus;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    totalVolume?: number;
}

export class LogSetDto {
    @IsString()
    exerciseId: string;

    @IsNumber()
    setNumber: number;

    @IsNumber()
    weight: number;

    @IsNumber()
    reps: number;
}
