import { IsNotEmpty, IsNumber, IsEnum, IsPositive, Min, Max } from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export class CreateBmiRecordDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(150)
  age: number;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.5) // Minimum height 0.5m (50cm)
  @Max(3.0) // Maximum height 3m (300cm)
  height: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1) // Minimum weight 1kg
  @Max(500) // Maximum weight 500kg
  weight: number;
}

export class BmiRecordResponseDto {
  id: string;
  userId: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  bmiValue: number;
  category: string;
  status: string;
  notes?: string;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}