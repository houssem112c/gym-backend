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
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
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
