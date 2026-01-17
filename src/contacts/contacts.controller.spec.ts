import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ContactsController', () => {
    let controller: ContactsController;
    let service: ContactsService;

    const mockContactsService = {
        create: jest.fn(),
        createUserMessage: jest.fn(),
        findUserMessages: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContactsController],
            providers: [
                { provide: ContactsService, useValue: mockContactsService },
            ],
        }).compile();

        controller = module.get<ContactsController>(ContactsController);
        service = module.get<ContactsService>(ContactsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all messages for admin', async () => {
            mockContactsService.findAll.mockResolvedValue([]);
            const req = { user: { role: 'ADMIN' } };

            await controller.findAll(undefined, undefined, undefined, req);
            expect(mockContactsService.findAll).toHaveBeenCalled();
        });

        it('should throw for non-admin', async () => {
            const req = { user: { role: 'USER' } };
            expect(() => controller.findAll(undefined, undefined, undefined, req)).toThrow(UnauthorizedException);
        });
    });
});
