import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('CoursesService', () => {
    let service: CoursesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        category: {
            findUnique: jest.fn(),
        },
        course: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        courseSchedule: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockSupabaseService = {
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CoursesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compile();

        service = module.get<CoursesService>(CoursesService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createCourse', () => {
        it('should create a course if category exists', async () => {
            const dto = { title: 'Test Course', categoryId: 'cat-1', description: 'Desc', duration: 60, capacity: 10, instructor: 'John' };
            (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1' });
            (prisma.course.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            const result = await service.createCourse(dto);
            expect(result).toHaveProperty('id', '1');
        });

        it('should throw NotFoundException if category missing', async () => {
            const dto = { title: 'Test Course', categoryId: 'cat-1', description: 'Desc', duration: 60, capacity: 10, instructor: 'John' };
            (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.createCourse(dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createSchedule', () => {
        it('should create schedule if course exists', async () => {
            (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1' });
            (prisma.courseSchedule.create as jest.Mock).mockResolvedValue({ id: 'sch-1' });

            await service.createSchedule('course-1', {} as any);
            expect(prisma.courseSchedule.create).toHaveBeenCalled();
        });
    });
});
