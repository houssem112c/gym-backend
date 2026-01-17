import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('ExercisesController', () => {
    let controller: ExercisesController;
    let service: ExercisesService;

    const mockExercisesService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSupabaseService = {
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ExercisesController],
            providers: [
                { provide: ExercisesService, useValue: mockExercisesService },
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compile();

        controller = module.get<ExercisesController>(ExercisesController);
        service = module.get<ExercisesService>(ExercisesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create exercise with files', async () => {
            const body = { name: 'E' };
            const files = {
                image: [{ originalname: 'i.jpg', buffer: Buffer.from('') }],
                video: [{ originalname: 'v.mp4', buffer: Buffer.from('') }],
            };
            (mockSupabaseService.uploadFile as jest.Mock).mockResolvedValue('http');
            (mockExercisesService.create as jest.Mock).mockResolvedValue({ id: '1' });

            await controller.create(body, files as any);
            expect(mockSupabaseService.uploadFile).toHaveBeenCalledTimes(2);
            expect(mockExercisesService.create).toHaveBeenCalled();
        });
    });
});
