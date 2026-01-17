import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutSessionsController } from './workout-sessions.controller';
import { WorkoutSessionsService } from './workout-sessions.service';

describe('WorkoutSessionsController', () => {
    let controller: WorkoutSessionsController;
    let service: WorkoutSessionsService;

    const mockService = {
        startSession: jest.fn(),
        getActiveSession: jest.fn(),
        logSet: jest.fn(),
        completeSession: jest.fn(),
        getUserSessions: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkoutSessionsController],
            providers: [
                { provide: WorkoutSessionsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<WorkoutSessionsController>(WorkoutSessionsController);
        service = module.get<WorkoutSessionsService>(WorkoutSessionsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('startSession', () => {
        it('should start session', async () => {
            mockService.startSession.mockResolvedValue({ id: '1' });
            await controller.startSession({ user: { id: 'u1' } }, {} as any);
            expect(mockService.startSession).toHaveBeenCalled();
        });
    });
});
