import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
    let controller: LocationsController;
    let service: LocationsService;

    const mockLocationsService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findActive: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LocationsController],
            providers: [
                { provide: LocationsService, useValue: mockLocationsService },
            ],
        }).compile();

        controller = module.get<LocationsController>(LocationsController);
        service = module.get<LocationsService>(LocationsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create location', async () => {
            const dto = { name: 'Loc' };
            mockLocationsService.create.mockResolvedValue({ id: '1' });
            expect(await controller.create(dto as any)).toEqual({ id: '1' });
        });
    });
});
