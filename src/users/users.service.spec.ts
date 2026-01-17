import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hash'));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create user', async () => {
            const dto = { email: 'e', password: 'p' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            await service.create(dto);
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should throw if user exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
            await expect(service.create({ email: 'e' })).rejects.toThrow(ConflictException);
        });
    });
});
