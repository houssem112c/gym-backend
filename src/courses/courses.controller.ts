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
    Put,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';
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

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Public endpoints
  @Get()
  findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get('calendar')
  getCalendar(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.coursesService.getCalendarSchedules(start, end);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOneCourse(id);
  }

  // Admin endpoints (protected)
  @Post()
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage },
    ),
  )
  create(
    @Body() body: any,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    // Build DTO from multipart form data
    const createCourseDto: CreateCourseDto = {
      title: body.title,
      description: body.description,
      duration: parseInt(body.duration),
      capacity: parseInt(body.capacity),
      instructor: body.instructor,
      categoryId: body.categoryId,
    };

    // Add file paths to DTO
    if (files.video && files.video[0]) {
      createCourseDto.videoUrl = `/uploads/videos/${files.video[0].filename}`;
    } else if (body.videoUrl) {
      // Allow external URL if no file uploaded
      createCourseDto.videoUrl = body.videoUrl;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      createCourseDto.thumbnail = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    } else if (body.thumbnailUrl) {
      createCourseDto.thumbnail = body.thumbnailUrl;
    }

    return this.coursesService.createCourse(createCourseDto);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage },
    ),
  )
  update(
    @Param('id') id: string, 
    @Body() body: any,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    // Build DTO from multipart form data
    const updateCourseDto: UpdateCourseDto = {};

    if (body.title) updateCourseDto.title = body.title;
    if (body.description) updateCourseDto.description = body.description;
    if (body.duration) updateCourseDto.duration = parseInt(body.duration);
    if (body.capacity) updateCourseDto.capacity = parseInt(body.capacity);
    if (body.instructor) updateCourseDto.instructor = body.instructor;
    if (body.categoryId) updateCourseDto.categoryId = body.categoryId;

    // Add file paths to DTO if new files uploaded
    if (files.video && files.video[0]) {
      updateCourseDto.videoUrl = `/uploads/videos/${files.video[0].filename}`;
    } else if (body.videoUrl) {
      updateCourseDto.videoUrl = body.videoUrl;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      updateCourseDto.thumbnail = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    } else if (body.thumbnailUrl) {
      updateCourseDto.thumbnail = body.thumbnailUrl;
    }

    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Put(':id')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage },
    ),
  )
  updatePut(
    @Param('id') id: string, 
    @Body() body: any,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    // Build DTO from multipart form data
    const updateCourseDto: UpdateCourseDto = {};

    if (body.title) updateCourseDto.title = body.title;
    if (body.description) updateCourseDto.description = body.description;
    if (body.duration) updateCourseDto.duration = parseInt(body.duration);
    if (body.capacity) updateCourseDto.capacity = parseInt(body.capacity);
    if (body.instructor) updateCourseDto.instructor = body.instructor;
    if (body.categoryId) updateCourseDto.categoryId = body.categoryId;

    // Add file paths to DTO if new files uploaded
    if (files.video && files.video[0]) {
      updateCourseDto.videoUrl = `/uploads/videos/${files.video[0].filename}`;
    } else if (body.videoUrl) {
      updateCourseDto.videoUrl = body.videoUrl;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      updateCourseDto.thumbnail = `/uploads/thumbnails/${files.thumbnail[0].filename}`;
    } else if (body.thumbnailUrl) {
      updateCourseDto.thumbnail = body.thumbnailUrl;
    }

    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  // Schedule endpoints - nested under course ID
  @Get(':courseId/schedules')
  findCourseSchedules(@Param('courseId') courseId: string) {
    return this.coursesService.findAllSchedules(courseId);
  }

  @Get('schedules/all')
  findAllSchedules() {
    return this.coursesService.findAllSchedules();
  }

  @Post(':courseId/schedules')
  @UseGuards(JwtAuthGuard)
  createSchedule(@Param('courseId') courseId: string, @Body() createScheduleDto: CreateScheduleDto) {
    return this.coursesService.createSchedule(courseId, createScheduleDto);
  }

  @Patch(':courseId/schedules/:id')
  @UseGuards(JwtAuthGuard)
  updateSchedule(@Param('courseId') courseId: string, @Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.coursesService.updateSchedule(id, updateScheduleDto);
  }

  @Delete(':courseId/schedules/:id')
  @UseGuards(JwtAuthGuard)
  removeSchedule(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.coursesService.removeSchedule(id);
  }
}
