import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;
    let service: AuthService;

    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
        refreshTokens: jest.fn(),
        logout: jest.fn(),
        verifyAdmin: jest.fn(), // Note: verifyAdmin logic is largely in controller/guard, but service mock might be needed
        getProfile: jest.fn(),
        updateProfile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should register a user', async () => {
            const dto = { email: 'test@example.com', password: '123', name: 'Test' };
            const expected = { user: { id: '1', ...dto } };
            mockAuthService.register.mockResolvedValue(expected);

            expect(await controller.register(dto)).toBe(expected);
            expect(mockAuthService.register).toHaveBeenCalledWith(dto);
        });
    });

    describe('login', () => {
        it('should login a user', async () => {
            const dto = { email: 'test@example.com', password: '123' };
            const expected = { accessToken: 'token' };
            mockAuthService.login.mockResolvedValue(expected);

            expect(await controller.login(dto)).toBe(expected);
            expect(mockAuthService.login).toHaveBeenCalledWith(dto);
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens', async () => {
            const dto = { refreshToken: 'rt' };
            const req = { user: { id: '1' } };
            mockAuthService.refreshTokens.mockResolvedValue({ accessToken: 'new' });

            await controller.refreshTokens(dto, req);
            expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('1', 'rt');
        });
    });

    describe('verifyAdmin', () => {
        it('should return user if admin', async () => {
            const req = { user: { id: '1', role: 'ADMIN' } };
            const result = await controller.verifyAdmin(req);
            expect(result).toHaveProperty('role', 'ADMIN');
        });

        it('should throw if not admin', async () => {
            const req = { user: { id: '1', role: 'USER' } };
            await expect(controller.verifyAdmin(req)).rejects.toThrow(UnauthorizedException);
        });
    });
});
