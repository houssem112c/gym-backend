import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WorkoutSessionsService } from './workout-sessions.service';
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, LogSetDto } from './dto/workout-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
    constructor(private readonly workoutSessionsService: WorkoutSessionsService) { }

    @Post('start')
    startSession(@Request() req, @Body() createDto: CreateWorkoutSessionDto) {
        return this.workoutSessionsService.startSession(req.user.id, createDto);
    }

    @Get('active')
    getActiveSession(@Request() req) {
        return this.workoutSessionsService.getActiveSession(req.user.id);
    }

    @Post(':id/log-set')
    logSet(@Param('id') sessionId: string, @Body() logSetDto: LogSetDto) {
        return this.workoutSessionsService.logSet(sessionId, logSetDto);
    }

    @Post(':id/complete')
    completeSession(@Param('id') sessionId: string, @Body() updateDto: UpdateWorkoutSessionDto) {
        return this.workoutSessionsService.completeSession(sessionId, updateDto);
    }

    @Get('history')
    getHistory(@Request() req) {
        return this.workoutSessionsService.getUserSessions(req.user.id);
    }
}
