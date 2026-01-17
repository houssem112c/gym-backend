import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;

    const mockCategoriesService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        reorder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                { provide: CategoriesService, useValue: mockCategoriesService },
            ],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create category', async () => {
            const dto = { name: 'Test' };
            mockCategoriesService.create.mockResolvedValue({ id: '1', ...dto });
            expect(await controller.create(dto)).toHaveProperty('id');
        });
    });
});
