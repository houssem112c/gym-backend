import { Test, TestingModule } from '@nestjs/testing';
import { BmiController } from './bmi.controller';
import { BmiService, BmiStatus } from './bmi.service';
import { BadRequestException } from '@nestjs/common';
import { Gender } from './dto/create-bmi-record.dto';

describe('BmiController', () => {
    let controller: BmiController;
    let service: BmiService;

    const mockBmiService = {
        createBmiRecord: jest.fn(),
        getUserBmiRecords: jest.fn(),
        getLatestBmiRecord: jest.fn(),
        getBmiRecord: jest.fn(),
        deleteBmiRecord: jest.fn(),
        calculateBmi: jest.fn(),
        determineBmiCategory: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BmiController],
            providers: [
                { provide: BmiService, useValue: mockBmiService },
            ],
        }).compile();

        controller = module.get<BmiController>(BmiController);
        service = module.get<BmiService>(BmiService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createBmiRecord', () => {
        it('should create a record successfully', async () => {
            const dto = { age: 25, gender: Gender.MALE, height: 1.80, weight: 75 };
            const req = { user: { id: 'user-1' } };
            const expectedServiceResult = { ...dto, id: '1', bmiValue: 23.15, status: BmiStatus.OK };

            mockBmiService.createBmiRecord.mockResolvedValue(expectedServiceResult);

            const result = await controller.createBmiRecord(dto, req);
            expect(result.success).toBe(true);
            expect(result.data).toBe(expectedServiceResult);
        });

        it('should throw BadRequestException on error', async () => {
            mockBmiService.createBmiRecord.mockRejectedValue(new Error('Test Error'));
            const dto = { age: 25, gender: Gender.MALE, height: 1.80, weight: 75 };
            const req = { user: { id: 'user-1' } };
            await expect(controller.createBmiRecord(dto, req)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getUserBmiRecords', () => {
        it('should return records', async () => {
            mockBmiService.getUserBmiRecords.mockResolvedValue([]);
            const result = await controller.getUserBmiRecords({ user: { id: 'user-1' } });
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });
    });
});
