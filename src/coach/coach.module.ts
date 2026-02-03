import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { UsersModule } from '../users/users.module';
import { FeedModule } from '../feed/feed.module';
import { BmiModule } from '../bmi/bmi.module';

@Module({
    imports: [UsersModule, FeedModule, BmiModule],
    controllers: [CoachController],
})
export class CoachModule { }
