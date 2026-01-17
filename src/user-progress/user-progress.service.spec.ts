import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressService } from './user-progress.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserProgressService', () => {
    let service: UserProgressService;
    let prisma: PrismaService;

    const mockPrismaService = {
        userProgressPhoto: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        userMeasurement: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        userPR: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserProgressService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<UserProgressService>(UserProgressService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('addPhoto', () => {
        it('should add photo', async () => {
            (prisma.userProgressPhoto.create as jest.Mock).mockResolvedValue({ id: '1' });
            await service.addPhoto('u1', {} as any);
            expect(prisma.userProgressPhoto.create).toHaveBeenCalled();
        });
    });
});
