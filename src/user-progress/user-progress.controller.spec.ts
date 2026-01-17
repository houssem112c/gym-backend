import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressController } from './user-progress.controller';
import { UserProgressService } from './user-progress.service';

describe('UserProgressController', () => {
    let controller: UserProgressController;
    let service: UserProgressService;

    const mockService = {
        addPhoto: jest.fn(),
        getPhotos: jest.fn(),
        addMeasurement: jest.fn(),
        getMeasurements: jest.fn(),
        addPR: jest.fn(),
        getPRs: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserProgressController],
            providers: [
                { provide: UserProgressService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<UserProgressController>(UserProgressController);
        service = module.get<UserProgressService>(UserProgressService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('addPhoto', () => {
        it('should add photo', async () => {
            mockService.addPhoto.mockResolvedValue({ id: '1' });
            const req = { user: { id: 'u1' } };
            await controller.addPhoto(req, {} as any);
            expect(mockService.addPhoto).toHaveBeenCalledWith('u1', expect.any(Object));
        });
    });
});
