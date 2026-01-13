import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ExercisesService } from './exercises.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('exercises')
export class ExercisesController {
    constructor(
        private readonly exercisesService: ExercisesService,
        private readonly supabaseService: SupabaseService,
    ) {
        console.log('🏋️ ExercisesController initialized');
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image', maxCount: 1 },
            { name: 'video', maxCount: 1 },
        ])
    )
    async create(
        @Body() body: any,
        @UploadedFiles() files: { image?: Express.Multer.File[], video?: Express.Multer.File[] }
    ) {
        const createExerciseDto: CreateExerciseDto = {
            name: body.name,
            description: body.description,
            muscleGroup: body.muscleGroup,
            equipment: body.equipment,
            difficulty: body.difficulty,
            imageUrl: body.imageUrl,
            videoUrl: body.videoUrl,
            isActive: body.isActive === 'true' || body.isActive === true,
        };

        if (files?.image?.[0]) {
            createExerciseDto.imageUrl = await this.supabaseService.uploadFile(
                files.image[0].buffer,
                files.image[0].originalname,
                'gym-exercises',
                'images'
            );
        }

        if (files?.video?.[0]) {
            createExerciseDto.videoUrl = await this.supabaseService.uploadFile(
                files.video[0].buffer,
                files.video[0].originalname,
                'gym-exercises',
                'videos'
            );
        }

        return this.exercisesService.create(createExerciseDto);
    }

    @Get()
    findAll() {
        return this.exercisesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.exercisesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image', maxCount: 1 },
            { name: 'video', maxCount: 1 },
        ])
    )
    async update(
        @Param('id') id: string,
        @Body() body: any,
        @UploadedFiles() files: { image?: Express.Multer.File[], video?: Express.Multer.File[] }
    ) {
        const updateExerciseDto: UpdateExerciseDto = { ...body };

        // Handle boolean conversion for isActive if it comes from FormData
        if (body.isActive !== undefined) {
            updateExerciseDto.isActive = body.isActive === 'true' || body.isActive === true;
        }

        if (files?.image?.[0]) {
            updateExerciseDto.imageUrl = await this.supabaseService.uploadFile(
                files.image[0].buffer,
                files.image[0].originalname,
                'gym-exercises',
                'images'
            );
        }

        if (files?.video?.[0]) {
            updateExerciseDto.videoUrl = await this.supabaseService.uploadFile(
                files.video[0].buffer,
                files.video[0].originalname,
                'gym-exercises',
                'videos'
            );
        }

        return this.exercisesService.update(id, updateExerciseDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.exercisesService.remove(id);
    }
}
