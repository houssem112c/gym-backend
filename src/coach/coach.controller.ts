import { Controller, Get, UseGuards, Req, Param, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FeedService } from '../feed/feed.service';
import { BmiService } from '../bmi/bmi.service';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH as any)
export class CoachController {
    constructor(
        private readonly usersService: UsersService,
        private readonly feedService: FeedService,
        private readonly bmiService: BmiService
    ) { }

    @Get('list')
    @Roles(Role.USER, Role.ADMIN, Role.COACH)
    async listCoaches() {
        return this.usersService.listCoaches();
    }

    @Get('my-users')
    async getMyUsers(@Req() req) {
        const coachId = req.user.id;
        return this.usersService.getMyUsers(coachId);
    }

    @Get('user/:id/profile')
    async getUserProfile(@Req() req, @Param('id') userId: string) {
        const coachId = req.user.id;
        const user = await this.usersService.findOne(userId) as any;

        if (!user || user.coachId !== coachId) {
            throw new ForbiddenException('You are not assigned to this user');
        }

        return user;
    }

    @Get('user/:id/posts')
    async getUserPosts(@Req() req, @Param('id') userId: string) {
        const coachId = req.user.id;
        const user = await this.usersService.findOne(userId) as any;

        if (!user || user.coachId !== coachId) {
            throw new ForbiddenException('You are not assigned to this user');
        }

        return this.feedService.getUserPosts(userId);
    }

    @Get('user/:id/bmi')
    async getUserBmi(@Req() req, @Param('id') userId: string) {
        const coachId = req.user.id;
        const user = await this.usersService.findOne(userId) as any;
        if (!user || user.coachId !== coachId) {
            throw new ForbiddenException('You are not assigned to this user');
        }

        return this.bmiService.getUserBmiRecords(userId);
    }
}
