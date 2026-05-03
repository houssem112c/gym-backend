
import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PrivateSessionsService } from './private-sessions.service';
import { CreatePrivateSessionDto } from './dto/create-private-session.dto';
import { RespondPrivateSessionDto } from './dto/respond-private-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '@prisma/client';

@Controller('private-sessions')
@UseGuards(JwtAuthGuard)
export class PrivateSessionsController {
    constructor(private readonly privateSessionsService: PrivateSessionsService) { }

    @Post()
    create(@Req() req: any, @Body() createPrivateSessionDto: CreatePrivateSessionDto) {
        const user = req.user as User;
        return this.privateSessionsService.createRequest(user.id, createPrivateSessionDto);
    }

    @Post('coach/create')
    createCoachSession(@Req() req: any, @Body() dto: { userId: string; date: string; startTime: string; endTime: string; note?: string }) {
        const user = req.user as User;
        return this.privateSessionsService.createCoachSession(user.id, dto);
    }

    @Get('availability')
    getAvailability(@Query('coachId') coachId: string, @Query('date') date: string) {
        return this.privateSessionsService.getCoachAvailability(coachId, date);
    }

    @Get('my-sessions')
    getMySessions(@Req() req: any) {
        const user = req.user as User;
        return this.privateSessionsService.getMySessions(user.id);
    }

    @Get('coach-requests')
    getCoachRequests(@Req() req: any) {
        // Ideally check if user is Coach or Admin
        const user = req.user as User;
        return this.privateSessionsService.getCoachRequests(user.id);
    }

    @Patch(':id/respond')
    respond(
        @Param('id') id: string,
        @Req() req: any,
        @Body() respondDto: RespondPrivateSessionDto,
    ) {
        const user = req.user as User;
        return this.privateSessionsService.respondToRequest(id, user.id, respondDto);
    }
}
