import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadStory(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    return this.storiesService.createWithFile(file, createStoryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.create(createStoryDto);
  }

  @Get()
  findAll() {
    return this.storiesService.findAll();
  }

  @Get('grouped')
  findAllGroupedByCategory() {
    return this.storiesService.findAllGroupedByCategory();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateStoryDto: UpdateStoryDto) {
    return this.storiesService.update(id, updateStoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.storiesService.remove(id);
  }
}
