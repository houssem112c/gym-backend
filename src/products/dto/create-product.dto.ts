import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    stock?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    pointsPrice?: number;
}
