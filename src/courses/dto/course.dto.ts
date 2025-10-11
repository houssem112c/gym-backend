import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, IsDateString, IsNumber } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsNotEmpty()
  instructor: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  instructor?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateScheduleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  coachName?: string;

  @IsBoolean()
  isRecurring: boolean;

  // For one-time events
  @IsDateString()
  @IsOptional()
  specificDate?: string;

  // For recurring events
  @IsNumber()
  @IsOptional()
  @Min(0)
  dayOfWeek?: number; // 0-6

  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:mm format

  @IsString()
  @IsNotEmpty()
  endTime: string; // HH:mm format

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  coachName?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsDateString()
  @IsOptional()
  specificDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  dayOfWeek?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
