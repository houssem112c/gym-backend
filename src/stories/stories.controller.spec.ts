import { Test, TestingModule } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { BadRequestException } from '@nestjs/common';

describe('StoriesController', () => {
    let controller: StoriesController;
    let service: StoriesService;

    const mockStoriesService = {
        createWithFile: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findAllGroupedByCategory: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StoriesController],
            providers: [
                { provide: StoriesService, useValue: mockStoriesService },
            ],
        }).compile();

        controller = module.get<StoriesController>(StoriesController);
        service = module.get<StoriesService>(StoriesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('uploadStory', () => {
        it('should upload story if file valid', async () => {
            const file = { mimetype: 'image/jpeg', size: 1000 } as any;
            mockStoriesService.createWithFile.mockResolvedValue({ id: '1' });

            await controller.uploadStory(file, {} as any);
            expect(mockStoriesService.createWithFile).toHaveBeenCalled();
        });

        it('should throw if file invalid type', async () => {
            const file = { mimetype: 'application/pdf', size: 1000 } as any;
            await expect(controller.uploadStory(file, {} as any)).rejects.toThrow(BadRequestException);
        });
    });
});
