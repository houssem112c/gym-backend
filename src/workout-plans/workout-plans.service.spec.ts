import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutPlansService } from './workout-plans.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkoutPlansService', () => {
    let service: WorkoutPlansService;
    let prisma: PrismaService;

    const mockPrismaService = {
        workoutPlan: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        // Mock other potential calls like deleteMany for updates
        workoutPlanExercise: {
            deleteMany: jest.fn(),
        },
        bmiRecord: {
            findFirst: jest.fn(),
        }
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkoutPlansService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<WorkoutPlansService>(WorkoutPlansService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create plan', async () => {
            const dto = { title: 'P1', exercises: [{ exerciseId: 'e1', order: 1, sets: 3, reps: 10 }] };
            (prisma.workoutPlan.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            await service.create(dto as any);
            expect(prisma.workoutPlan.create).toHaveBeenCalled();
        });
    });

    describe('getRecommended', () => {
        it('should return all plans if no bmi', async () => {
            (prisma.bmiRecord.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.workoutPlan.findMany as jest.Mock).mockResolvedValue([]);

            await service.getRecommended('u1');
            expect(prisma.workoutPlan.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });

        it('should filter by goal if bmi exists (Overweight)', async () => {
            (prisma.bmiRecord.findFirst as jest.Mock).mockResolvedValue({ category: 'Overweight' });
            (prisma.workoutPlan.findMany as jest.Mock).mockResolvedValue([]);

            await service.getRecommended('u1');
            expect(prisma.workoutPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    goal: { contains: 'Weight Loss', mode: 'insensitive' }
                })
            }));
        });
    });
});
