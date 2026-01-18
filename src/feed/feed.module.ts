import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { AdminFeedController } from './admin-feed.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    providers: [FeedService],
    controllers: [FeedController, AdminFeedController],
    exports: [FeedService],
})
export class FeedModule { }
