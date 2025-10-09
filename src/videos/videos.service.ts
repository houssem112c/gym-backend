import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateVideoCategoryDto,
    UpdateVideoCategoryDto,
    CreateVideoDto,
    UpdateVideoDto,
} from './dto/video.dto';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  // Categories CRUD
  async createCategory(createCategoryDto: CreateVideoCategoryDto) {
    return this.prisma.videoCategory.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.videoCategory.findMany({
      include: {
        videos: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.videoCategory.findUnique({
      where: { id },
      include: {
        videos: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findCategoryBySlug(slug: string) {
    const category = await this.prisma.videoCategory.findUnique({
      where: { slug },
      include: {
        videos: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateVideoCategoryDto) {
    try {
      return await this.prisma.videoCategory.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async removeCategory(id: string) {
    try {
      return await this.prisma.videoCategory.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  // Videos CRUD
  async createVideo(createVideoDto: CreateVideoDto) {
    const { categoryId, ...videoData } = createVideoDto;

    return this.prisma.video.create({
      data: {
        ...videoData,
        category: {
          connect: { id: categoryId },
        },
      },
      include: {
        category: true,
      },
    });
  }

  async findAllVideos(categoryId?: string, includeUnpublished = false) {
    return this.prisma.video.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(includeUnpublished ? {} : { isPublished: true }),
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });
  }

  async findOneVideo(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async updateVideo(id: string, updateVideoDto: UpdateVideoDto) {
    const { categoryId, ...videoData } = updateVideoDto;

    try {
      return await this.prisma.video.update({
        where: { id },
        data: {
          ...videoData,
          ...(categoryId && {
            category: {
              connect: { id: categoryId },
            },
          }),
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
  }

  async removeVideo(id: string) {
    try {
      return await this.prisma.video.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
  }
}
