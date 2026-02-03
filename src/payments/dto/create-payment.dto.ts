import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
    @IsOptional()
    @IsString()
    orderId: string;

    @IsNumber()
    amount: number;

    @IsString()
    currency: string;
}
