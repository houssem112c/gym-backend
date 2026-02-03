
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePrivateSessionDto {
    @IsNotEmpty()
    @IsString()
    coachId: string;

    @IsNotEmpty()
    @IsDateString()
    date: string; // ISO Date "2024-01-01"

    @IsNotEmpty()
    @IsString()
    startTime: string; // "HH:mm"

    @IsNotEmpty()
    @IsString()
    endTime: string; // "HH:mm"

    @IsOptional()
    @IsString()
    note?: string;
}
