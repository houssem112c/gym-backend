import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async createWithFile(file: Express.Multer.File, createStoryDto: CreateStoryDto) {
    // Upload file to Supabase
    const mediaUrl = await this.supabase.uploadFile(
      file.buffer,
      file.originalname,
      'gym-stories',
      ''
    );

    // Determine media type from file mimetype
    const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

    // Default duration to 12 hours (43200 seconds) if not provided
    const duration = createStoryDto.duration || 43200;

    return this.prisma.story.create({
      data: {
        ...createStoryDto,
        mediaUrl,
        mediaType,
        duration,
        expiresAt: createStoryDto.expiresAt ? new Date(createStoryDto.expiresAt) : null,
      },
      include: {
        category: true,
      },
    });
  }

  async create(createStoryDto: CreateStoryDto) {
    return this.prisma.story.create({
      data: {
        categoryId: createStoryDto.categoryId,
        mediaUrl: createStoryDto.mediaUrl,
        mediaType: createStoryDto.mediaType,
        caption: createStoryDto.caption,
        duration: createStoryDto.duration,
        order: createStoryDto.order,
        expiresAt: createStoryDto.expiresAt ? new Date(createStoryDto.expiresAt) : null,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    const now = new Date();
    return this.prisma.story.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: [
        { category: { order: 'asc' } },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findAllGroupedByCategory() {
    const now = new Date();
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Group stories by category
    const grouped = stories.reduce((acc, story) => {
      const categoryId = story.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: story.category,
          stories: [],
        };
      }
      acc[categoryId].stories.push(story);
      return acc;
    }, {});

    // Convert to array and sort by category order
    return Object.values(grouped).sort((a: any, b: any) => a.category.order - b.category.order);
  }

  async findOne(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return story;
  }

  async update(id: string, updateStoryDto: UpdateStoryDto) {
    await this.findOne(id); // Check if exists
    return this.prisma.story.update({
      where: { id },
      data: {
        ...updateStoryDto,
        expiresAt: updateStoryDto.expiresAt ? new Date(updateStoryDto.expiresAt) : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    const story = await this.findOne(id); // Check if exists
    
    // Delete file from Supabase if it exists
    if (story.mediaUrl) {
      try {
        await this.supabase.deleteFile(story.mediaUrl, 'gym-stories');
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }
    
    return this.prisma.story.delete({
      where: { id },
    });
  }
}
