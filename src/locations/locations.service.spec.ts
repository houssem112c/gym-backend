import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LocationsService', () => {
    let service: LocationsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        location: {
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
                LocationsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<LocationsService>(LocationsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create location', async () => {
            const dto = { name: 'Gym 1', address: 'Addr', city: 'City' };
            (prisma.location.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });
            const result = await service.create(dto as any);
            expect(result).toHaveProperty('id', '1');
        });
    });
});
