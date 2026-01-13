import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutPlanDto, UpdateWorkoutPlanDto } from './dto/workout-plan.dto';

@Injectable()
export class WorkoutPlansService {
    constructor(private prisma: PrismaService) { }

    async create(createWorkoutPlanDto: CreateWorkoutPlanDto) {
        const { exercises, ...planData } = createWorkoutPlanDto;

        return this.prisma.workoutPlan.create({
            data: {
                ...planData,
                exercises: exercises ? {
                    create: exercises.map((ex) => ({
                        exerciseId: ex.exerciseId,
                        order: ex.order,
                        sets: ex.sets,
                        reps: ex.reps,
                        notes: ex.notes,
                    })),
                } : undefined,
            },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    async findAll() {
        return this.prisma.workoutPlan.findMany({
            where: { isActive: true },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { title: 'asc' },
        });
    }

    async findOne(id: string) {
        const plan = await this.prisma.workoutPlan.findUnique({
            where: { id },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!plan) {
            throw new NotFoundException(`Workout Plan with ID ${id} not found`);
        }

        return plan;
    }

    async update(id: string, updateWorkoutPlanDto: UpdateWorkoutPlanDto) {
        const { exercises, ...planData } = updateWorkoutPlanDto;

        // If exercises are provided, we replace the existing ones
        if (exercises) {
            // Delete existing exercises first
            await this.prisma.workoutPlanExercise.deleteMany({
                where: { workoutPlanId: id },
            });
        }

        try {
            return await this.prisma.workoutPlan.update({
                where: { id },
                data: {
                    ...planData,
                    exercises: exercises ? {
                        create: exercises.map((ex) => ({
                            exerciseId: ex.exerciseId,
                            order: ex.order,
                            sets: ex.sets,
                            reps: ex.reps,
                            notes: ex.notes,
                        })),
                    } : undefined,
                },
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                        },
                        orderBy: { order: 'asc' },
                    },
                },
            });
        } catch (error) {
            throw new NotFoundException(`Workout Plan with ID ${id} not found`);
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.workoutPlan.delete({
                where: { id },
            });
        } catch (error) {
            throw new NotFoundException(`Workout Plan with ID ${id} not found`);
        }
    }

    async getRecommended(userId: string) {
        // Get the latest BMI record for the user
        const latestBmi = await this.prisma.bmiRecord.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!latestBmi) {
            // Default to showing all plans if no BMI record
            return this.findAll();
        }

        // Map BMI category/status to goals
        let targetGoal = 'Strength';
        const category = latestBmi.category.toLowerCase();

        if (category.includes('overweight') || category.includes('obesity')) {
            targetGoal = 'Weight Loss';
        } else if (category.includes('underweight')) {
            targetGoal = 'Muscle Building';
        } else {
            targetGoal = 'Fitness';
        }

        return this.prisma.workoutPlan.findMany({
            where: {
                isActive: true,
                goal: { contains: targetGoal, mode: 'insensitive' }
            },
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { order: 'asc' }
                }
            }
        });
    }
}
