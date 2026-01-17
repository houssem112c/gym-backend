import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
    let controller: HealthController;
    let prisma: PrismaService;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('check', () => {
        it('should return ok status if db connected', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            const result = await controller.check();
            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('database', 'connected');
        });

        it('should return error status if db fails', async () => {
            (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await controller.check();
            expect(result).toHaveProperty('status', 'error');
            expect(result).toHaveProperty('database', 'disconnected');
        });
    });
});
