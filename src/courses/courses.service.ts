import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { XpAction } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { CreateCourseDto, UpdateCourseDto, CreateScheduleDto, UpdateScheduleDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private gamificationService: GamificationService,
  ) { }

  // Courses CRUD
  async createCourse(createCourseDto: CreateCourseDto) {
    // Validate that the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createCourseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createCourseDto.categoryId} not found`);
    }

    return (this.prisma.course as any).create({
      data: createCourseDto,
      include: {
        category: true,
        instructorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          }
        },
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  async findAllCourses() {
    return (this.prisma.course as any).findMany({
      where: { isActive: true },
      include: {
        category: true,
        instructorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          }
        },
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findMyCourses(instructorId: string) {
    return (this.prisma.course as any).findMany({
      where: { instructorId, isActive: true },
      include: {
        category: true,
        instructorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          }
        },
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOneCourse(id: string) {
    const course = await (this.prisma.course as any).findUnique({
      where: { id },
      include: {
        category: true,
        instructorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          }
        },
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
      return await (this.prisma.course as any).update({
        where: { id },
        data: updateCourseDto,
        include: {
          category: true,
          instructorUser: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            }
          },
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
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
      } as any,
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
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
      } as any,
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
  async getCalendarSchedules(startDate: Date, endDate: Date, userId?: string) {
    // Fetch course schedules
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
        bookings: userId ? {
          where: { userId }
        } : false,
      } as any,
      orderBy: { startTime: 'asc' },
    });

    let results: any[] = schedules;

    if (userId) {
      // Mark course schedules as booked
      results = schedules.map(s => ({
        ...s,
        isBooked: (s as any).bookings.length > 0
      }));

      // Fetch private sessions for this user (as client or coach)
      const privateSessions = await (this.prisma as any).privateSession.findMany({
        where: {
          status: 'ACCEPTED',
          date: {
            gte: startDate,
            lte: endDate
          },
          OR: [
            { userId: userId },
            { coachId: userId }
          ]
        },
        include: {
          coach: {
            select: { name: true, email: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      // Map private sessions to schedule format
      const mappedPrivateSessions = privateSessions.map(session => ({
        id: session.id,
        courseId: 'private',
        title: `Private Session with ${session.userId === userId ? session.coach.name : session.user.name}`,
        coachName: session.coach.name,
        startTime: session.startTime,
        endTime: session.endTime,
        isRecurring: false,
        specificDate: session.date,
        dayOfWeek: new Date(session.date).getDay(),
        isBooked: true, // Always booked if it's an accepted private session
        course: {
          id: 'private',
          title: 'Private 1-on-1 Session',
          description: session.note,
          instructor: session.coach.name,
          capacity: 1,
          // Mock category for UI consistency
          category: {
            name: 'Private',
            color: '#d946ef', // Fuchsia/Pink for private sessions
            icon: '🔒'
          }
        }
      }));

      results = [...results, ...mappedPrivateSessions];
    }

    return results;
  }

  async bookSession(userId: string, scheduleId: string) {
    // 1. Get schedule and course info
    const schedule = await (this.prisma.courseSchedule as any).findUnique({
      where: { id: scheduleId },
      include: {
        course: true,
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!schedule) {
      throw new NotFoundException(`Session with ID ${scheduleId} not found`);
    }

    // 2. Check capacity
    if ((schedule as any).course.capacity > 0 && (schedule as any)._count.bookings >= (schedule as any).course.capacity) {
      throw new Error('This session is already full');
    }

    // 3. Create booking and assign coach atomically
    return await this.prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await (tx as any).courseBooking.create({
        data: {
          userId,
          scheduleId,
        },
        include: {
          schedule: {
            include: {
              course: true
            }
          }
        }
      });

      // Assign the course instructor as the user's coach if not already assigned
      if ((booking as any).schedule.course.instructorId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            coachId: (booking as any).schedule.course.instructorId
          } as any
        });
      }

      return booking;
    });
  }

  async getMyBookings(userId: string) {
    return (this.prisma as any).courseBooking.findMany({
      where: { userId },
      include: {
        schedule: {
          include: {
            course: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async completeCourse(userId: string, courseId: string) {
    const course = await this.findOneCourse(courseId);

    // Award XP for course completion
    return this.gamificationService.awardXp(userId, XpAction.COURSE_COMPLETED, 20, { courseId: course.id, title: course.title });
  }
}
