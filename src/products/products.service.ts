import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto) {
        // Ensure numbers are parsed if coming from FormData strings
        const data = {
            ...createProductDto,
            price: Number(createProductDto.price),
            stock: createProductDto.stock ? Number(createProductDto.stock) : undefined,
            pointsPrice: createProductDto.pointsPrice ? Number(createProductDto.pointsPrice) : null,
        };
        return this.prisma.product.create({
            data,
        });
    }

    findAll() {
        return this.prisma.product.findMany({
            where: { isActive: true },
        });
    }

    findOne(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
        });
    }

    update(id: string, updateProductDto: UpdateProductDto) {
        const data: any = { ...updateProductDto };

        if (updateProductDto.price !== undefined) data.price = Number(updateProductDto.price);
        if (updateProductDto.stock !== undefined) data.stock = Number(updateProductDto.stock);
        if (updateProductDto.pointsPrice !== undefined) data.pointsPrice = updateProductDto.pointsPrice ? Number(updateProductDto.pointsPrice) : null;

        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
