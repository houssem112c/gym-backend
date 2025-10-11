import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Put,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  create(@Body() createCategoryDto: CreateCategoryDto) {
    console.log('POST /api/categories called with:', createCategoryDto);
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Put(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  updatePut(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() categories: Array<{ id: string; order: number }>) {
    return this.categoriesService.reorder(categories);
  }
}