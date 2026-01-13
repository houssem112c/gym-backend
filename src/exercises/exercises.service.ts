import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';

@Injectable()
export class ExercisesService {
    constructor(private prisma: PrismaService) { }

    async create(createExerciseDto: CreateExerciseDto) {
        return this.prisma.exercise.create({
            data: createExerciseDto,
        });
    }

    async findAll() {
        return this.prisma.exercise.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const exercise = await this.prisma.exercise.findUnique({
            where: { id },
        });

        if (!exercise) {
            throw new NotFoundException(`Exercise with ID ${id} not found`);
        }

        return exercise;
    }

    async update(id: string, updateExerciseDto: UpdateExerciseDto) {
        try {
            return await this.prisma.exercise.update({
                where: { id },
                data: updateExerciseDto,
            });
        } catch (error) {
            throw new NotFoundException(`Exercise with ID ${id} not found`);
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.exercise.delete({
                where: { id },
            });
        } catch (error) {
            throw new NotFoundException(`Exercise with ID ${id} not found`);
        }
    }
}
