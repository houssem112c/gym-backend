import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  // Courses CRUD
  async createCourse(createCourseDto: CreateCourseDto) {
    // Validate that the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createCourseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createCourseDto.categoryId} not found`);
    }

    return this.prisma.course.create({
      data: createCourseDto,
      include: {
        category: true,
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findAllCourses() {
    return this.prisma.course.findMany({
      where: { isActive: true },
      include: {
        category: true,
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOneCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto) {
    // Validate that the category exists if categoryId is being updated
    if (updateCourseDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateCourseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateCourseDto.categoryId} not found`);
      }
    }

    try {
      return await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
        include: {
          category: true,
          schedules: {
            where: { isActive: true },
            orderBy: { startTime: 'asc' },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }

  async removeCourse(id: string) {
    try {
      return await this.prisma.course.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }

  // Schedules CRUD
  async createSchedule(courseId: string, createScheduleDto: CreateScheduleDto) {
    // Verify course exists
    await this.findOneCourse(courseId);

    return this.prisma.courseSchedule.create({
      data: {
        ...createScheduleDto,
        course: {
          connect: { id: courseId },
        },
      },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findAllSchedules(courseId?: string) {
    return this.prisma.courseSchedule.findMany({
      where: courseId ? { courseId, isActive: true } : { isActive: true },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOneSchedule(id: string) {
    const schedule = await this.prisma.courseSchedule.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto) {
    try {
      return await this.prisma.courseSchedule.update({
        where: { id },
        data: updateScheduleDto,
        include: {
          course: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
  }

  async removeSchedule(id: string) {
    try {
      return await this.prisma.courseSchedule.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
  }

  // Calendar schedules by date range
  async getCalendarSchedules(startDate: Date, endDate: Date) {
    const schedules = await this.prisma.courseSchedule.findMany({
      where: {
        isActive: true,
        OR: [
          // One-time events within the date range
          {
            isRecurring: false,
            specificDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // All recurring events (they repeat, so they should always show)
          {
            isRecurring: true,
          },
        ],
      },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return schedules;
  }
}
