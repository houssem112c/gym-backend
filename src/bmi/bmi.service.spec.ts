import { Test, TestingModule } from '@nestjs/testing';
import { BmiService, BmiStatus } from './bmi.service';
import { PrismaService } from '../prisma/prisma.service';
import { Gender } from './dto/create-bmi-record.dto';

describe('BmiService', () => {
    let service: BmiService;
    let prisma: PrismaService;

    const mockPrismaService = {
        bmiRecord: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BmiService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<BmiService>(BmiService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateBmi', () => {
        it('should calculate BMI correctly', () => {
            expect(service.calculateBmi(70, 1.75)).toBe(22.86);
        });
    });

    describe('determineBmiCategory', () => {
        it('should return correct category for adults (Normal)', () => {
            const result = service.determineBmiCategory(22, 25, Gender.MALE);
            expect(result.status).toBe(BmiStatus.OK);
            expect(result.category).toBe('Normal');
        });

        it('should return correct category for adults (Overweight)', () => {
            const result = service.determineBmiCategory(27, 25, Gender.MALE);
            expect(result.status).toBe(BmiStatus.CAUTION);
            expect(result.category).toBe('Overweight');
        });

        it('should return correct category for children', () => {
            // 10 year old male, BMI 16 -> Healthy (between 15 and 20)
            const result = service.determineBmiCategory(16, 10, Gender.MALE);
            expect(result.status).toBe(BmiStatus.OK);
        });

        it('should return correct category for elderly', () => {
            // 70 year old, BMI 25 -> Normal/Slightly High for elderly
            const result = service.determineBmiCategory(25, 70, Gender.MALE);
            expect(result.status).toBe(BmiStatus.OK);
        });
    });

    describe('createBmiRecord', () => {
        it('should create a record', async () => {
            const dto = {
                age: 25,
                gender: Gender.MALE,
                height: 1.75,
                weight: 70,
                userId: 'user-1',
            };
            const expectedResult = {
                id: '1',
                ...dto,
                bmiValue: 22.86,
                category: 'Normal',
                status: BmiStatus.OK,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.bmiRecord.create as jest.Mock).mockResolvedValue(expectedResult);

            const result = await service.createBmiRecord('user-1', dto);
            expect(result).toBeDefined();
            expect(prisma.bmiRecord.create).toHaveBeenCalled();
        });
    });

    describe('getUserBmiRecords', () => {
        it('should return list of records', async () => {
            (prisma.bmiRecord.findMany as jest.Mock).mockResolvedValue([]);
            const result = await service.getUserBmiRecords('user-1');
            expect(result).toEqual([]);
            expect(prisma.bmiRecord.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { createdAt: 'desc' },
                include: { user: expect.any(Object) },
            });
        });
    });
});
