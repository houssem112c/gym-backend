import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('StoriesService', () => {
    let service: StoriesService;
    let prisma: PrismaService;
    let supabase: SupabaseService;

    const mockPrismaService = {
        story: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockSupabaseService = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    const mockNotificationsService = {
        createNotification: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoriesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: SupabaseService, useValue: mockSupabaseService },
                { provide: NotificationsService, useValue: mockNotificationsService },
            ],
        }).compile();

        service = module.get<StoriesService>(StoriesService);
        prisma = module.get<PrismaService>(PrismaService);
        supabase = module.get<SupabaseService>(SupabaseService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createWithFile', () => {
        it('should create story with file', async () => {
            const dto = {};
            const file = { buffer: Buffer.from(''), originalname: 'test.jpg', mimetype: 'image/jpeg' } as any;
            (supabase.uploadFile as jest.Mock).mockResolvedValue('url');
            (prisma.story.create as jest.Mock).mockResolvedValue({ id: '1', mediaUrl: 'url' });

            const result = await service.createWithFile(file, dto as any);
            expect(result).toHaveProperty('id', '1');
            expect(supabase.uploadFile).toHaveBeenCalled();
        });
    });
});
