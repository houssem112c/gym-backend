import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async createNotification(data: {
        userId: string;
        actorId: string;
        type: NotificationType;
        referenceId?: string;
        title: string;
        message: string;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                actorId: data.actorId,
                type: data.type,
                referenceId: data.referenceId,
                title: data.title,
                message: data.message,
            },
        });
    }

    async getNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async deleteNotification(notificationId: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    }
}
