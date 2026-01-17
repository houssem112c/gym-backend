import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        importFromExcel: jest.fn(),
        exportToExcel: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create user', async () => {
            mockUsersService.create.mockResolvedValue({ id: '1' });
            await controller.create({} as any);
            expect(mockUsersService.create).toHaveBeenCalled();
        });
    });
});
