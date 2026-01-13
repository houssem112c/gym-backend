import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutSessionDto, UpdateWorkoutSessionDto, LogSetDto, SessionStatus } from './dto/workout-session.dto';

@Injectable()
export class WorkoutSessionsService {
    constructor(private prisma: PrismaService) { }

    async startSession(userId: string, createDto: CreateWorkoutSessionDto) {
        // Close any active sessions first? Or just allow multiple? 
        // Typically one active session at a time makes sense.
        await this.prisma.workoutSession.updateMany({
            where: { userId, status: SessionStatus.IN_PROGRESS },
            data: { status: SessionStatus.CANCELLED, endTime: new Date() }
        });

        return this.prisma.workoutSession.create({
            data: {
                userId,
                workoutPlanId: createDto.workoutPlanId,
                notes: createDto.notes,
                status: SessionStatus.IN_PROGRESS,
                startTime: new Date(),
            }
        });
    }

    async logSet(sessionId: string, logSetDto: LogSetDto) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) throw new NotFoundException('Session not found');

        const setLog = await this.prisma.setLog.create({
            data: {
                workoutSessionId: sessionId,
                exerciseId: logSetDto.exerciseId,
                setNumber: logSetDto.setNumber,
                weight: logSetDto.weight,
                reps: logSetDto.reps,
            }
        });

        // Auto-check for Personal Record
        return this.checkAndSetPR(session.userId, setLog.id, logSetDto);
    }

    private async checkAndSetPR(userId: string, setLogId: string, data: LogSetDto) {
        // Find existing PR for this exercise
        const existingPR = await this.prisma.userPR.findFirst({
            where: { userId, exerciseId: data.exerciseId },
            orderBy: [{ weight: 'desc' }, { reps: 'desc' }]
        });

        let isNewPR = false;
        if (!existingPR) {
            isNewPR = true;
        } else {
            // Logic: higher weight is always a PR. 
            // If weight is same, more reps is a PR.
            if (data.weight > existingPR.weight) {
                isNewPR = true;
            } else if (data.weight === existingPR.weight && data.reps > existingPR.reps) {
                isNewPR = true;
            }
        }

        if (isNewPR) {
            // Update/Create UserPR record
            await this.prisma.userPR.upsert({
                where: {
                    // Since we don't have a unique constraint on (userId, exerciseId), 
                    // we'll update based on the existing ID or create new.
                    // Actually, a user usually has ONE PR per exercise (the absolute best).
                    id: existingPR?.id || 'new-pr'
                },
                update: {
                    weight: data.weight,
                    reps: data.reps,
                    createdAt: new Date(),
                },
                create: {
                    userId,
                    exerciseId: data.exerciseId,
                    weight: data.weight,
                    reps: data.reps,
                }
            });

            // Mark the set log as a PR
            return this.prisma.setLog.update({
                where: { id: setLogId },
                data: { isPersonalRecord: true },
                include: { exercise: { select: { name: true } } }
            });
        }

        return this.prisma.setLog.findUnique({
            where: { id: setLogId },
            include: { exercise: { select: { name: true } } }
        });
    }

    async completeSession(sessionId: string, updateDto: UpdateWorkoutSessionDto) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: sessionId, },
            include: { setLogs: true }
        });

        if (!session) throw new NotFoundException('Session not found');

        // Calculate total volume if not provided
        let totalVolume = updateDto.totalVolume;
        if (totalVolume === undefined) {
            totalVolume = session.setLogs.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        }

        return this.prisma.workoutSession.update({
            where: { id: sessionId },
            data: {
                status: SessionStatus.COMPLETED,
                endTime: new Date(),
                notes: updateDto.notes,
                totalVolume,
            }
        });
    }

    async getUserSessions(userId: string) {
        return this.prisma.workoutSession.findMany({
            where: { userId },
            include: {
                workoutPlan: { select: { title: true } },
                setLogs: {
                    include: { exercise: { select: { name: true } } }
                }
            },
            orderBy: { startTime: 'desc' }
        });
    }

    async getActiveSession(userId: string) {
        return this.prisma.workoutSession.findFirst({
            where: { userId, status: SessionStatus.IN_PROGRESS },
            include: {
                setLogs: {
                    include: { exercise: { select: { name: true } } }
                }
            }
        });
    }
}
