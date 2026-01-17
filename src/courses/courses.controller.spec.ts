import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CoursesController', () => {
    let controller: CoursesController;
    let service: CoursesService;

    const mockCoursesService = {
        findAllCourses: jest.fn(),
        findOneCourse: jest.fn(),
        createCourse: jest.fn(),
        updateCourse: jest.fn(),
        removeCourse: jest.fn(),
        createSchedule: jest.fn(),
        findAllSchedules: jest.fn(),
    };

    const mockSupabaseService = {
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CoursesController],
            providers: [
                { provide: CoursesService, useValue: mockCoursesService },
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compile();

        controller = module.get<CoursesController>(CoursesController);
        service = module.get<CoursesService>(CoursesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all courses', async () => {
            mockCoursesService.findAllCourses.mockResolvedValue([]);
            expect(await controller.findAll()).toEqual([]);
        });
    });

    describe('create', () => {
        it('should create course with file uploads', async () => {
            const body = { title: 'T', duration: '60', capacity: '10' };
            const files = {
                video: [{ originalname: 'v.mp4', buffer: Buffer.from('') }],
                thumbnail: [{ originalname: 't.jpg', buffer: Buffer.from('') }],
            };

            (mockSupabaseService.uploadFile as jest.Mock).mockResolvedValue('http://url');
            mockCoursesService.createCourse.mockResolvedValue({ id: '1' });

            const result = await controller.create(body, files as any);
            expect(result.id).toBe('1');
            expect(mockSupabaseService.uploadFile).toHaveBeenCalledTimes(2);
        });
    });
});
