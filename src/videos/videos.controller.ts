import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { VideosService } from './videos.service';
import {
    CreateVideoCategoryDto,
    UpdateVideoCategoryDto,
    CreateVideoDto,
    UpdateVideoDto,
} from './dto/video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Multer configuration for file uploads
const storage = diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, './uploads/videos');
    } else if (file.fieldname === 'thumbnail') {
      cb(null, './uploads/thumbnails');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
  },
});

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Category endpoints
  @Get('categories')
  findAllCategories() {
    return this.videosService.findAllCategories();
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.videosService.findOneCategory(id);
  }

  @Get('categories/slug/:slug')
  findCategoryBySlug(@Param('slug') slug: string) {
    return this.videosService.findCategoryBySlug(slug);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() createCategoryDto: CreateVideoCategoryDto) {
    return this.videosService.createCategory(createCategoryDto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateVideoCategoryDto,
  ) {
    return this.videosService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  removeCategory(@Param('id') id: string) {
    return this.videosService.removeCategory(id);
  }

  // Video endpoints
  @Get()
  findAllVideos(@Query('categoryId') categoryId?: string) {
    return this.videosService.findAllVideos(categoryId);
  }

  @Get(':id')
  findOneVideo(@Param('id') id: string) {
    return this.videosService.findOneVideo(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage },
    ),
  )
  createVideo(
    @Body() body: any,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    // Build DTO from multipart form data
    const createVideoDto: CreateVideoDto = {
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      url: '', // Will be set below if file uploaded
      duration: body.duration ? parseInt(body.duration) : undefined,
    };

    // Add file paths to DTO
    if (files.video && files.video[0]) {
      createVideoDto.url = `/uploads/videos/${files.video[0].filename}`;
    } else if (body.url) {
      // Allow external URL if no file uploaded
      createVideoDto.url = body.url;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      createVideoDto.thumbnail = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    } else if (body.thumbnail) {
      createVideoDto.thumbnail = body.thumbnail;
    }

    if (!createVideoDto.url) {
      throw new Error('Video file or URL is required');
    }

    return this.videosService.createVideo(createVideoDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage },
    ),
  )
  updateVideo(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    // Build DTO from multipart form data
    const updateVideoDto: UpdateVideoDto = {};

    if (body.title) updateVideoDto.title = body.title;
    if (body.description) updateVideoDto.description = body.description;
    if (body.categoryId) updateVideoDto.categoryId = body.categoryId;
    if (body.duration) updateVideoDto.duration = parseInt(body.duration);

    // Add file paths to DTO if new files uploaded
    if (files.video && files.video[0]) {
      updateVideoDto.url = `/uploads/videos/${files.video[0].filename}`;
    } else if (body.url) {
      updateVideoDto.url = body.url;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      updateVideoDto.thumbnail = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    } else if (body.thumbnail) {
      updateVideoDto.thumbnail = body.thumbnail;
    }

    return this.videosService.updateVideo(id, updateVideoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  removeVideo(@Param('id') id: string) {
    return this.videosService.removeVideo(id);
  }
}
