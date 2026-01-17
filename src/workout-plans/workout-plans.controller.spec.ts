import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutPlansController } from './workout-plans.controller';
import { WorkoutPlansService } from './workout-plans.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('WorkoutPlansController', () => {
    let controller: WorkoutPlansController;
    let service: WorkoutPlansService;

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        getRecommended: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSupabase = {
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkoutPlansController],
            providers: [
                { provide: WorkoutPlansService, useValue: mockService },
                { provide: SupabaseService, useValue: mockSupabase },
            ],
        }).compile();

        controller = module.get<WorkoutPlansController>(WorkoutPlansController);
        service = module.get<WorkoutPlansService>(WorkoutPlansService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create plan with image', async () => {
            const body = { title: 'T' };
            const file = { buffer: Buffer.from('') } as any;
            mockSupabase.uploadFile.mockResolvedValue('url');
            mockService.create.mockResolvedValue({ id: '1' });

            await controller.create(body, file);
            expect(mockService.create).toHaveBeenCalled();
            expect(mockSupabase.uploadFile).toHaveBeenCalled();
        });
    });
});
