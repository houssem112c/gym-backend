import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsString()
    @IsOptional()
    paymentIntentId?: string;

    @IsNumber()
    @IsOptional()
    totalAmount?: number;

    @IsString()
    @IsOptional()
    paymentMethod?: 'MONEY' | 'POINTS';
}
