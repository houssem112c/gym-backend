import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly supabaseService: SupabaseService,
    ) { }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    async create(
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() image: Express.Multer.File,
    ) {
        if (image) {
            const imageUrl = await this.supabaseService.uploadFile(image.buffer, image.originalname, 'gym-products');
            createProductDto.imageUrl = imageUrl;
        }
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('image'))
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @UploadedFile() image: Express.Multer.File,
    ) {
        if (image) {
            const imageUrl = await this.supabaseService.uploadFile(image.buffer, image.originalname, 'gym-products');
            updateProductDto.imageUrl = imageUrl;
        }
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
