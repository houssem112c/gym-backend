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
  import { existsSync, mkdirSync } from 'fs';
  import { CoursesService } from './courses.service';
  import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';

  // Multer configuration for file uploads
  // Note: On Render free tier, use /tmp for temporary storage (files will be lost on restart)
  const storage = diskStorage({
    destination: (req, file, cb) => {
      console.log(`📁 Processing file upload for field: ${file.fieldname}`);
      
      // Use /tmp for production (Render) or ./uploads for local development
      const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads';
      console.log(`📂 Base directory: ${baseDir} (NODE_ENV: ${process.env.NODE_ENV})`);
      
      let targetDir;
      if (file.fieldname === 'video') {
        targetDir = `${baseDir}/videos`;
      } else if (file.fieldname === 'thumbnail') {
        targetDir = `${baseDir}/thumbnails`;
      } else {
        console.error(`❌ Invalid field name: ${file.fieldname}`);
        return cb(new Error(`Invalid field name: ${file.fieldname}`), null);
      }
      
      console.log(`🎯 Target directory: ${targetDir}`);
      
      // Create directory if it doesn't exist
      try {
        if (!existsSync(targetDir)) {
          console.log(`📁 Directory doesn't exist, creating: ${targetDir}`);
          mkdirSync(targetDir, { recursive: true });
          console.log(`✅ Successfully created directory: ${targetDir}`);
        } else {
          console.log(`✅ Directory already exists: ${targetDir}`);
        }
        
        console.log(`✅ File destination set to: ${targetDir}`);
        cb(null, targetDir);
      } catch (error) {
        console.error(`❌ Failed to create directory ${targetDir}:`, error.message);
        console.error(`❌ Full error:`, error);
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = file.fieldname + '-' + uniqueSuffix + extname(file.originalname);
        console.log(`💾 Generating filename for ${file.fieldname}: ${filename}`);
        console.log(`📄 Original filename: ${file.originalname}`);
        console.log(`📏 File size: ${file.size || 'unknown'} bytes`);
        cb(null, filename);
      } catch (error) {
        console.error(`❌ Error generating filename:`, error);
        cb(error, null);
      }
    },
  });

  @Controller('courses')
  export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    // Health check endpoint
    @Get('health')
    healthCheck() {
      console.log('🩺 Health check endpoint accessed');
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uploadsPath: process.env.NODE_ENV === 'production' ? '/tmp' : './uploads'
      };
      console.log('🩺 Health status:', JSON.stringify(status, null, 2));
      return status;
    }

    // Public endpoints
    @Get()
    findAll() {
      console.log('📋 Fetching all courses');
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
    async create(
      @Body() body: any,
      @UploadedFiles()
      files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    ) {
      try {
        console.log('=== CREATE COURSE REQUEST START ===');
        console.log('Request body:', JSON.stringify(body, null, 2));
        console.log('Files received:', files ? Object.keys(files) : 'No files');
        
        // Build DTO from multipart form data
        const createCourseDto: CreateCourseDto = {
          title: body.title,
          description: body.description,
          duration: parseInt(body.duration),
          capacity: parseInt(body.capacity),
          instructor: body.instructor,
          categoryId: body.categoryId,
        };

        console.log('Base DTO created:', JSON.stringify(createCourseDto, null, 2));

        // Add file paths to DTO
        if (files?.video && files.video[0]) {
          const videoFile = files.video[0];
          console.log('✅ Video file uploaded successfully:');
          console.log('  - Filename:', videoFile.filename);
          console.log('  - Path:', videoFile.path);
          console.log('  - Size:', videoFile.size, 'bytes');
          // Store relative path for serving static files
          createCourseDto.videoUrl = `/uploads/videos/${videoFile.filename}`;
        } else if (body.videoUrl) {
          console.log('📎 Using external video URL:', body.videoUrl);
          // Allow external URL if no file uploaded
          createCourseDto.videoUrl = body.videoUrl;
        } else {
          console.log('❌ No video file or URL provided');
        }

        if (files?.thumbnail && files.thumbnail[0]) {
          const thumbnailFile = files.thumbnail[0];
          console.log('✅ Thumbnail file uploaded successfully:');
          console.log('  - Filename:', thumbnailFile.filename);
          console.log('  - Path:', thumbnailFile.path);
          console.log('  - Size:', thumbnailFile.size, 'bytes');
          // Store relative path for serving static files
          createCourseDto.thumbnail = `/uploads/thumbnails/${thumbnailFile.filename}`;
        } else if (body.thumbnailUrl) {
          console.log('📎 Using external thumbnail URL:', body.thumbnailUrl);
          createCourseDto.thumbnail = body.thumbnailUrl;
        } else {
          console.log('❌ No thumbnail file or URL provided');
        }

        console.log('Final DTO before service call:', JSON.stringify(createCourseDto, null, 2));
        
        const result = await this.coursesService.createCourse(createCourseDto);
        console.log('✅ Course created successfully:', result.id);
        console.log('=== CREATE COURSE REQUEST END ===');
        
        return result;
      } catch (error) {
        console.error('❌ CREATE COURSE ERROR:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.log('=== CREATE COURSE REQUEST FAILED ===');
        throw error;
      }
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
        const videoFile = files.video[0];
        console.log('Video file updated (PATCH):', videoFile.filename, 'to:', videoFile.path);
        updateCourseDto.videoUrl = `/uploads/videos/${videoFile.filename}`;
      } else if (body.videoUrl) {
        updateCourseDto.videoUrl = body.videoUrl;
      }

      if (files.thumbnail && files.thumbnail[0]) {
        const thumbnailFile = files.thumbnail[0];
        console.log('Thumbnail file updated (PATCH):', thumbnailFile.filename, 'to:', thumbnailFile.path);
        updateCourseDto.thumbnail = `/uploads/thumbnails/${thumbnailFile.filename}`;
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
        const videoFile = files.video[0];
        console.log('Video file updated (PUT):', videoFile.filename, 'to:', videoFile.path);
        updateCourseDto.videoUrl = `/uploads/videos/${videoFile.filename}`;
      } else if (body.videoUrl) {
        updateCourseDto.videoUrl = body.videoUrl;
      }

      if (files.thumbnail && files.thumbnail[0]) {
        const thumbnailFile = files.thumbnail[0];
        console.log('Thumbnail file updated (PUT):', thumbnailFile.filename, 'to:', thumbnailFile.path);
        updateCourseDto.thumbnail = `/uploads/thumbnails/${thumbnailFile.filename}`;
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
