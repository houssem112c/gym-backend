import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      console.log('Creating category with data:', createCategoryDto);
      
      // Test basic Prisma connection first
      await this.prisma.$connect();
      console.log('Prisma connection successful');
      
      // Try a simple query first to test Category model access
      const existingCategories = await this.prisma.category.findMany({ take: 1 });
      console.log('Category model accessible, found:', existingCategories.length, 'categories');
      
      const result = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description || null,
          color: createCategoryDto.color || '#3B82F6',
          icon: createCategoryDto.icon || '🏋️',
          order: createCategoryDto.order || 0,
        },
      });
      console.log('Category created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        courses: {
          where: { isActive: true },
          include: {
            schedules: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        courses: {
          where: { isActive: true },
          include: {
            schedules: true,
          },
        },
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    // Soft delete by setting isActive to false
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorder(categories: Array<{ id: string; order: number }>) {
    const updates = categories.map(({ id, order }) =>
      this.prisma.category.update({
        where: { id },
        data: { order },
      })
    );

    return Promise.all(updates);
  }
}