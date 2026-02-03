
import { IsNotEmpty, IsEnum } from 'class-validator';
import { PrivateSessionStatus } from '@prisma/client';

export class RespondPrivateSessionDto {
    @IsNotEmpty()
    @IsEnum(PrivateSessionStatus)
    status: PrivateSessionStatus;
}
