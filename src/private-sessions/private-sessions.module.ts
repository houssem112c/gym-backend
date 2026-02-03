
import { Module } from '@nestjs/common';
import { PrivateSessionsService } from './private-sessions.service';
import { PrivateSessionsController } from './private-sessions.controller';
import { PrismaService } from '../prisma/prisma.service'; // Assuming shared module or import
import { NotificationsModule } from '../notifications/notifications.module'; // For sending notifications

@Module({
    imports: [NotificationsModule],
    controllers: [PrivateSessionsController],
    providers: [PrivateSessionsService, PrismaService],
    exports: [PrivateSessionsService],
})
export class PrivateSessionsModule { }
