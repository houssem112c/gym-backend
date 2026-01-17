import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContactsService', () => {
    let service: ContactsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        contact: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ContactsService>(ContactsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create anonymous contact', async () => {
            const dto = { name: 'Test', email: 'test@e.com', message: 'Hi' };
            (prisma.contact.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            const result = await service.create(dto as any);
            expect(result).toHaveProperty('id', '1');
        });
    });

    describe('findOne', () => {
        it('should return contact for admin', async () => {
            const contact = { id: '1', userId: 'user-2' };
            (prisma.contact.findUnique as jest.Mock).mockResolvedValue(contact);

            const result = await service.findOne('1', 'admin-id', 'ADMIN');
            expect(result).toEqual(contact);
        });

        it('should throw if user requests others message', async () => {
            const contact = { id: '1', userId: 'other-user' };
            (prisma.contact.findUnique as jest.Mock).mockResolvedValue(contact);

            await expect(service.findOne('1', 'my-id', 'USER')).rejects.toThrow();
        });
    });
});
