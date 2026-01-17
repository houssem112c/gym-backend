import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwtService: JwtService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'JWT_SECRET') return 'secret';
            if (key === 'JWT_REFRESH_SECRET') return 'refreshSecret';
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should successfully register a user', async () => {
            const dto = { email: 'test@example.com', password: 'password', name: 'Test User' };
            const createdUser = { id: '1', ...dto, password: 'hashedPassword', role: 'USER' };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);
            (jwtService.signAsync as jest.Mock).mockResolvedValue('token');

            const result = await service.register(dto);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
            expect(prisma.user.create).toHaveBeenCalled();
            expect(result.user.email).toBe(dto.email);
        });

        it('should throw UnauthorizedException if user already exists', async () => {
            const dto = { email: 'test@example.com', password: 'password', name: 'Test User' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', ...dto });

            await expect(service.register(dto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('login', () => {
        it('should return tokens on successful login', async () => {
            const dto = { email: 'test@example.com', password: 'password' };
            const user = { id: '1', email: dto.email, password: 'hashedPassword', name: 'Test', role: 'USER' };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
            (jwtService.signAsync as jest.Mock).mockResolvedValue('token');
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(dto);

            expect(result.access_token).toBe('token');
            expect(prisma.user.update).toHaveBeenCalled(); // updateRefreshToken
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens', async () => {
            const user = { id: '1', email: 'test@example.com', refreshToken: 'hashedRT' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwtService.signAsync as jest.Mock).mockResolvedValue('newToken');

            const result = await service.refreshTokens('1', 'rt');
            expect(result.accessToken).toBe('newToken');
        });

        it('should throw UnauthorizedException on invalid token', async () => {
            const user = { id: '1', email: 'test@example.com', refreshToken: 'hashedRT' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.refreshTokens('1', 'rt')).rejects.toThrow(UnauthorizedException);
        });
    });
});
