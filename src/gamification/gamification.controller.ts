import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
    constructor(
        private readonly gamificationService: GamificationService,
        private readonly badgeService: BadgeService,
    ) { }

    @Get('me')
    async getMyGamification(@Request() req) {
        return this.gamificationService.getUserGamification(req.user.id);
    }

    @Get('leaderboard')
    async getLeaderboard(@Query('limit') limit?: string) {
        return this.gamificationService.getLeaderboard(limit ? parseInt(limit) : 10);
    }

    @Get('badges')
    async getAllBadges() {
        return this.badgeService.getAllBadges();
    }

    @Get('badges/me')
    async getMyBadges(@Request() req) {
        return this.badgeService.getUserBadges(req.user.id);
    }

    @Get('history')
    async getXpHistory(@Request() req) {
        return this.gamificationService.getXpHistory(req.user.id);
    }
}
