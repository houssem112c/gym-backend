import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExercisesService', () => {
    let service: ExercisesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        exercise: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExercisesService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ExercisesService>(ExercisesService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create exercise', async () => {
            const dto = { name: 'Pushup' };
            (prisma.exercise.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            const result = await service.create(dto as any);
            expect(result).toHaveProperty('id', '1');
        });
    });
});
