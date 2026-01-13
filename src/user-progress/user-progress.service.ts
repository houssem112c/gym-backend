import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressPhotoDto, CreateMeasurementDto, CreatePRDto } from './dto/user-progress.dto';

@Injectable()
export class UserProgressService {
    constructor(private prisma: PrismaService) { }

    // Progress Photos
    async addPhoto(userId: string, createProgressPhotoDto: CreateProgressPhotoDto) {
        return this.prisma.userProgressPhoto.create({
            data: {
                ...createProgressPhotoDto,
                userId,
            },
        });
    }

    async getPhotos(userId: string) {
        return this.prisma.userProgressPhoto.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Measurements
    async addMeasurement(userId: string, createMeasurementDto: CreateMeasurementDto) {
        return this.prisma.userMeasurement.create({
            data: {
                ...createMeasurementDto,
                userId,
            },
        });
    }

    async getMeasurements(userId: string) {
        return this.prisma.userMeasurement.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Personal Records (PRs)
    async addPR(userId: string, createPRDto: CreatePRDto) {
        return this.prisma.userPR.create({
            data: {
                ...createPRDto,
                userId,
            },
            include: {
                exercise: true,
            },
        });
    }

    async getPRs(userId: string) {
        return this.prisma.userPR.findMany({
            where: { userId },
            include: {
                exercise: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getExercisePR(userId: string, exerciseId: string) {
        return this.prisma.userPR.findFirst({
            where: { userId, exerciseId },
            orderBy: { weight: 'desc' },
            include: {
                exercise: true,
            },
        });
    }
}
