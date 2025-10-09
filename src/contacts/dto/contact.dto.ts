import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @IsString()
  @IsOptional()
  userId?: string; // For authenticated users
}

export class AdminResponseDto {
  @IsString()
  @IsNotEmpty()
  adminResponse: string;

  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'])
  @IsOptional()
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';

  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export class UpdateContactDto {
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'])
  @IsOptional()
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';

  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @IsOptional()
  isRead?: boolean;
}
