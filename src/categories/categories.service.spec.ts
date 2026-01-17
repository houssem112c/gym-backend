import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        category: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $connect: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a category', async () => {
            const dto = { name: 'Cardio' };
            (prisma.category.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });
            (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.create(dto);
            expect(result).toHaveProperty('id', '1');
            expect(prisma.category.create).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all active categories', async () => {
            (prisma.category.findMany as jest.Mock).mockResolvedValue([{ id: '1' }]);

            const result = await service.findAll();
            expect(result).toHaveLength(1);
        });
    });
});
