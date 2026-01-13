import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkoutPlansService } from './workout-plans.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateWorkoutPlanDto, UpdateWorkoutPlanDto } from './dto/workout-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('workout-plans')
export class WorkoutPlansController {
    constructor(
        private readonly workoutPlansService: WorkoutPlansService,
        private readonly supabaseService: SupabaseService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(FileInterceptor('image'))
    async create(
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        // Parse JSON strings from FormData
        const createWorkoutPlanDto: CreateWorkoutPlanDto = {
            title: body.title,
            description: body.description,
            durationWeeks: parseInt(body.durationWeeks),
            difficulty: body.difficulty,
            goal: body.goal,
            imageUrl: body.imageUrl,
            isActive: body.isActive === 'true' || body.isActive === true,
            exercises: body.exercises ? JSON.parse(body.exercises) : [],
        };

        if (file) {
            createWorkoutPlanDto.imageUrl = await this.supabaseService.uploadFile(
                file.buffer,
                file.originalname,
                'gym-workout-plans',
                'images'
            );
        }

        return this.workoutPlansService.create(createWorkoutPlanDto);
    }

    @Get()
    findAll() {
        return this.workoutPlansService.findAll();
    }

    @Get('recommended')
    @UseGuards(JwtAuthGuard)
    getRecommended(@Request() req) {
        return this.workoutPlansService.getRecommended(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workoutPlansService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(FileInterceptor('image'))
    async update(
        @Param('id') id: string,
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        const updateWorkoutPlanDto: UpdateWorkoutPlanDto = { ...body };

        // Handle types and parsing for FormData
        if (body.durationWeeks) updateWorkoutPlanDto.durationWeeks = parseInt(body.durationWeeks);
        if (body.isActive !== undefined) {
            updateWorkoutPlanDto.isActive = body.isActive === 'true' || body.isActive === true;
        }
        if (body.exercises) {
            updateWorkoutPlanDto.exercises = typeof body.exercises === 'string'
                ? JSON.parse(body.exercises)
                : body.exercises;
        }

        if (file) {
            updateWorkoutPlanDto.imageUrl = await this.supabaseService.uploadFile(
                file.buffer,
                file.originalname,
                'gym-workout-plans',
                'images'
            );
        }

        return this.workoutPlansService.update(id, updateWorkoutPlanDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.workoutPlansService.remove(id);
    }
}
