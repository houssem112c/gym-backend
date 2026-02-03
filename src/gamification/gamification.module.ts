import { Module, Global } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { BadgeService } from './badge.service';

@Global()
@Module({
    controllers: [GamificationController],
    providers: [GamificationService, BadgeService],
    exports: [GamificationService, BadgeService],
})
export class GamificationModule { }
