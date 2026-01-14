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
import { CoursesService } from './courses.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly supabaseService: SupabaseService,
  ) { }

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

  // Debug endpoint to see raw course data
  @Get('debug')
  async debugCourses() {
    const courses = await this.coursesService.findAllCourses();
    console.log('🐛 Debug courses endpoint called');
    console.log('🐛 Total courses:', courses.length);

    return {
      total: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        videoUrl: course.videoUrl,
        thumbnail: course.thumbnail,
        hasVideo: !!course.videoUrl,
        hasThumbnail: !!course.thumbnail,
        videoUrlLength: course.videoUrl?.length || 0,
        thumbnailLength: course.thumbnail?.length || 0,
      }))
    };
  }

  // Quick fix: Convert local paths to full URLs
  @Post('fix-local-urls')
  async fixLocalUrls() {
    console.log('🔧 Converting local file paths to full URLs...');

    try {
      const courses = await this.coursesService.findAllCourses();
      const coursesToFix = courses.filter(course =>
        (course.videoUrl && course.videoUrl.startsWith('/uploads/')) ||
        (course.thumbnail && course.thumbnail.startsWith('/uploads/'))
      );

      console.log(`📋 Found ${coursesToFix.length} courses to fix`);
      const results = [];

      for (const course of coursesToFix) {
        console.log(`🔧 Fixing course: ${course.title}`);

        const updates: any = {};

        // Convert video path to full URL
        if (course.videoUrl && course.videoUrl.startsWith('/uploads/')) {
          updates.videoUrl = `urbangym-amgyh4ghftepesg9.canadacentral-01.azurewebsites.net${course.videoUrl}`;
          console.log(`📹 Fixed video URL: ${updates.videoUrl}`);
        }

        // Convert thumbnail path to full URL  
        if (course.thumbnail && course.thumbnail.startsWith('/uploads/')) {
          updates.thumbnail = `urbangym-amgyh4ghftepesg9.canadacentral-01.azurewebsites.net${course.thumbnail}`;
          console.log(`📸 Fixed thumbnail URL: ${updates.thumbnail}`);
        }

        if (Object.keys(updates).length > 0) {
          await this.coursesService.updateCourse(course.id, updates);
          results.push({
            id: course.id,
            title: course.title,
            updates: updates
          });
        }
      }

      return {
        success: true,
        message: 'Fixed local URLs to full URLs',
        fixedCourses: results.length,
        results: results
      };
    } catch (error) {
      console.error('❌ URL fix failed:', error);
      return {
        success: false,
        message: 'URL fix failed',
        error: error.message
      };
    }
  }

  // Migration endpoint to move local files to Supabase
  @Post('migrate-to-supabase')
  async migrateCourses() {
    console.log('🚀 Starting course migration to Supabase...');

    try {
      const fs = await import('fs');
      const path = await import('path');

      // First, try to create the bucket if it doesn't exist
      console.log('🪣 Ensuring Supabase bucket exists...');
      try {
        // Note: This requires admin privileges in Supabase
        console.log('⚠️  Please ensure the "gym-courses" bucket exists in Supabase Storage');
      } catch (error) {
        console.log('ℹ️  Bucket creation requires manual setup in Supabase dashboard');
      }

      // Find all courses with local file paths
      const courses = await this.coursesService.findAllCourses();
      const coursesToMigrate = courses.filter(course =>
        (course.videoUrl && course.videoUrl.startsWith('/uploads/')) ||
        (course.thumbnail && course.thumbnail.startsWith('/uploads/'))
      );

      console.log(`📋 Found ${coursesToMigrate.length} courses to migrate`);

      const results = [];

      for (const course of coursesToMigrate) {
        console.log(`\n🔄 Migrating course: ${course.title} (${course.id})`);

        const updates: any = {};

        // Migrate video if it's a local path
        if (course.videoUrl && course.videoUrl.startsWith('/uploads/')) {
          const videoPath = path.join(process.cwd(), course.videoUrl);
          const videoFileName = path.basename(course.videoUrl);

          try {
            if (fs.existsSync(videoPath)) {
              console.log(`📹 Migrating video: ${videoFileName}`);
              const videoBuffer = fs.readFileSync(videoPath);
              const videoUrl = await this.supabaseService.uploadFile(
                videoBuffer,
                videoFileName,
                'gym-courses',
                'videos'
              );
              updates.videoUrl = videoUrl;
              console.log(`✅ Video uploaded: ${videoUrl}`);
            } else {
              console.log(`❌ Video file not found: ${videoPath}`);
            }
          } catch (error) {
            console.error(`❌ Failed to upload video: ${error.message}`);
          }
        }

        // Migrate thumbnail if it's a local path
        if (course.thumbnail && course.thumbnail.startsWith('/uploads/')) {
          const thumbnailPath = path.join(process.cwd(), course.thumbnail);
          const thumbnailFileName = path.basename(course.thumbnail);

          try {
            if (fs.existsSync(thumbnailPath)) {
              console.log(`📸 Migrating thumbnail: ${thumbnailFileName}`);
              const thumbnailBuffer = fs.readFileSync(thumbnailPath);
              const thumbnailUrl = await this.supabaseService.uploadFile(
                thumbnailBuffer,
                thumbnailFileName,
                'gym-courses',
                'thumbnails'
              );
              updates.thumbnail = thumbnailUrl;
              console.log(`✅ Thumbnail uploaded: ${thumbnailUrl}`);
            } else {
              console.log(`❌ Thumbnail file not found: ${thumbnailPath}`);
            }
          } catch (error) {
            console.error(`❌ Failed to upload thumbnail: ${error.message}`);
          }
        }

        // Update the course if we have changes
        if (Object.keys(updates).length > 0) {
          const updatedCourse = await this.coursesService.updateCourse(course.id, updates);
          console.log(`✅ Updated course ${course.title} in database`);

          results.push({
            id: course.id,
            title: course.title,
            success: true,
            updates: updates
          });
        } else {
          console.log(`⚠️  No files to migrate for course ${course.title}`);
          results.push({
            id: course.id,
            title: course.title,
            success: false,
            reason: 'No local files found or upload failed'
          });
        }
      }

      console.log('\n🎉 Migration completed!');
      return {
        success: true,
        message: 'Migration completed successfully',
        migratedCourses: results.length,
        results: results,
        note: 'If uploads failed, ensure "gym-courses" bucket exists in Supabase Storage'
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error.message,
        note: 'Please ensure "gym-courses" bucket exists in Supabase Storage dashboard'
      };
    }
  }

  // Public endpoints
  @Get()
  async findAll() {
    console.log('📋 Fetching all courses');
    const courses = await this.coursesService.findAllCourses();
    console.log('📋 Courses found:', courses.length);
    if (courses.length > 0) {
      console.log('📋 Sample course data:', JSON.stringify({
        id: courses[0].id,
        title: courses[0].title,
        videoUrl: courses[0].videoUrl,
        thumbnail: courses[0].thumbnail,
      }, null, 2));
    }
    return courses;
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
      {
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB limit for video uploads
          files: 2, // Max 2 files (video + thumbnail)
        },
        fileFilter: (req, file, cb) => {
          console.log(`🔍 Validating file: ${file.originalname} (${file.mimetype})`);
          console.log(`📏 File size: ${(file.size || 0) / 1024 / 1024} MB`);

          if (file.fieldname === 'video') {
            // Accept video files with stricter validation
            if (file.mimetype.startsWith('video/')) {
              // Check for common video formats that work well on web
              const allowedVideoTypes = [
                'video/mp4',
                'video/webm',
                'video/quicktime', // .mov
              ];

              if (allowedVideoTypes.includes(file.mimetype)) {
                console.log('✅ Video file accepted:', file.mimetype);
                cb(null, true);
              } else {
                console.log('❌ Unsupported video format:', file.mimetype);
                console.log('Supported formats: MP4, WebM, QuickTime');
                cb(new Error('Please upload MP4, WebM, or MOV video files only'), false);
              }
            } else {
              console.log('❌ Invalid video file type:', file.mimetype);
              cb(new Error('Only video files are allowed for video field'), false);
            }
          } else if (file.fieldname === 'thumbnail') {
            // Accept image files
            if (file.mimetype.startsWith('image/')) {
              console.log('✅ Image file accepted');
              cb(null, true);
            } else {
              console.log('❌ Invalid image file type:', file.mimetype);
              cb(new Error('Only image files are allowed for thumbnail field'), false);
            }
          } else {
            console.log('❌ Unknown field:', file.fieldname);
            cb(new Error('Unknown field'), false);
          }
        }
      },
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

      // Upload files to Supabase and add URLs to DTO
      if (files?.video && files.video[0]) {
        const videoFile = files.video[0];
        const videoSizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
        console.log(`📹 Uploading video to Supabase (${videoSizeMB}MB)...`);

        createCourseDto.videoUrl = await this.supabaseService.uploadFile(
          videoFile.buffer,
          videoFile.originalname,
          'gym-courses',
          'videos'
        );
        console.log('✅ Video uploaded:', createCourseDto.videoUrl);
      } else if (body.videoUrl) {
        console.log('📎 Using external video URL:', body.videoUrl);
        createCourseDto.videoUrl = body.videoUrl;
      }

      if (files?.thumbnail && files.thumbnail[0]) {
        const thumbnailFile = files.thumbnail[0];
        console.log('📸 Uploading thumbnail to Supabase...');

        createCourseDto.thumbnail = await this.supabaseService.uploadFile(
          thumbnailFile.buffer,
          thumbnailFile.originalname,
          'gym-courses',
          'thumbnails'
        );
        console.log('✅ Thumbnail uploaded:', createCourseDto.thumbnail);
      } else if (body.thumbnailUrl) {
        console.log('📎 Using external thumbnail URL:', body.thumbnailUrl);
        createCourseDto.thumbnail = body.thumbnailUrl;
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
      {
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB limit for video uploads
          files: 2,
        },
      },
    ),
  )
  async update(
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

    // Upload files to Supabase if new files provided
    if (files.video && files.video[0]) {
      const videoFile = files.video[0];
      console.log('Video file updated (PATCH):', videoFile.originalname, 'size:', videoFile.size);
      updateCourseDto.videoUrl = await this.supabaseService.uploadFile(
        videoFile.buffer,
        videoFile.originalname,
        'gym-courses',
        'videos'
      );
      console.log('Video uploaded to Supabase (PATCH):', updateCourseDto.videoUrl);
    } else if (body.videoUrl) {
      updateCourseDto.videoUrl = body.videoUrl;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      const thumbnailFile = files.thumbnail[0];
      console.log('Thumbnail file updated (PATCH):', thumbnailFile.originalname, 'size:', thumbnailFile.size);
      updateCourseDto.thumbnail = await this.supabaseService.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        'gym-courses',
        'thumbnails'
      );
      console.log('Thumbnail uploaded to Supabase (PATCH):', updateCourseDto.thumbnail);
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
      {
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB limit for video uploads
          files: 2,
        },
      },
    ),
  )
  async updatePut(
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

    // Upload files to Supabase if new files provided
    if (files.video && files.video[0]) {
      const videoFile = files.video[0];
      console.log('Video file updated (PUT):', videoFile.originalname, 'size:', videoFile.size);
      updateCourseDto.videoUrl = await this.supabaseService.uploadFile(
        videoFile.buffer,
        videoFile.originalname,
        'gym-courses',
        'videos'
      );
      console.log('Video uploaded to Supabase (PUT):', updateCourseDto.videoUrl);
    } else if (body.videoUrl) {
      updateCourseDto.videoUrl = body.videoUrl;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      const thumbnailFile = files.thumbnail[0];
      console.log('Thumbnail file updated (PUT):', thumbnailFile.originalname, 'size:', thumbnailFile.size);
      updateCourseDto.thumbnail = await this.supabaseService.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        'gym-courses',
        'thumbnails'
      );
      console.log('Thumbnail uploaded to Supabase (PUT):', updateCourseDto.thumbnail);
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
