import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutSessionsService } from './workout-sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkoutSessionsService', () => {
    let service: WorkoutSessionsService;
    let prisma: PrismaService;

    let mockPrismaService: any;

    beforeEach(async () => {
        mockPrismaService = {
            workoutSession: {
                create: jest.fn(),
                updateMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                findFirst: jest.fn(),
            },
            setLog: {
                create: jest.fn(),
                update: jest.fn(),
                findUnique: jest.fn(),
            },
            userPR: {
                findFirst: jest.fn(),
                upsert: jest.fn(),
            }
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkoutSessionsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<WorkoutSessionsService>(WorkoutSessionsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startSession', () => {
        it('should start a session', async () => {
            (prisma.workoutSession.create as jest.Mock).mockResolvedValue({ id: '1' });
            await service.startSession('u1', { workoutPlanId: 'p1' });
            expect(prisma.workoutSession.updateMany).toHaveBeenCalled(); // cancel old
            expect(prisma.workoutSession.create).toHaveBeenCalled();
        });
    });

    describe('logSet', () => {
        it('should log set and check PR', async () => {
            (prisma.workoutSession.findUnique as jest.Mock).mockResolvedValue({ id: 's1', userId: 'u1' });
            (prisma.setLog.create as jest.Mock).mockResolvedValue({ id: 'sl1' });
            (prisma.userPR.findFirst as jest.Mock).mockResolvedValue(null); // No existing PR -> New PR
            (prisma.userPR.upsert as jest.Mock).mockResolvedValue({});
            (prisma.setLog.update as jest.Mock).mockResolvedValue({});

            await service.logSet('s1', { exerciseId: 'e1', setNumber: 1, weight: 100, reps: 5 });

            expect(prisma.setLog.create).toHaveBeenCalled();
            expect(prisma.userPR.upsert).toHaveBeenCalled(); // New PR
            expect(prisma.setLog.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { isPersonalRecord: true }
            }));
        });

        it('should log set but not PR if weight lower', async () => {
            (prisma.workoutSession.findUnique as jest.Mock).mockResolvedValue({ id: 's1', userId: 'u1' });
            (prisma.setLog.create as jest.Mock).mockResolvedValue({ id: 'sl1' });
            (prisma.userPR.findFirst as jest.Mock).mockResolvedValue({ weight: 200, reps: 5 }); // Existing PR higher

            // Should default to returning just the set log details via findUnique or similar
            (prisma.setLog.findUnique as jest.Mock).mockResolvedValue({});

            await service.logSet('s1', { exerciseId: 'e1', setNumber: 1, weight: 100, reps: 5 });

            expect(prisma.setLog.create).toHaveBeenCalled();
            expect(prisma.userPR.upsert).not.toHaveBeenCalled();
        });
    });
});
