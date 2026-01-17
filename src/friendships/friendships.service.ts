import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FriendshipsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async sendFriendRequest(requesterId: string, addresseeId: string) {
        if (requesterId === addresseeId) {
            throw new BadRequestException('You cannot send a friend request to yourself');
        }

        // Check if a friendship already exists
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });

        if (existingFriendship) {
            throw new BadRequestException('Friendship or request already exists');
        }

        const friendship = await this.prisma.friendship.create({
            data: {
                requesterId,
                addresseeId,
                status: FriendshipStatus.PENDING,
            },
            include: { requester: true },
        });

        // Trigger notification
        await this.notificationsService.createNotification({
            userId: addresseeId,
            actorId: requesterId,
            type: NotificationType.FRIEND_REQUEST,
            referenceId: friendship.id,
            title: 'New Friend Request',
            message: `${friendship.requester.name} sent you a friend request.`,
        });

        return friendship;
    }

    async acceptFriendRequest(userId: string, requestId: string) {
        const request = await this.prisma.friendship.findUnique({
            where: { id: requestId },
        });

        if (!request || request.addresseeId !== userId || request.status !== FriendshipStatus.PENDING) {
            throw new BadRequestException('Invalid request');
        }

        const friendship = await this.prisma.friendship.update({
            where: { id: requestId },
            data: { status: FriendshipStatus.ACCEPTED },
            include: { addressee: true },
        });

        // Trigger notification
        await this.notificationsService.createNotification({
            userId: friendship.requesterId,
            actorId: userId,
            type: NotificationType.FRIEND_ACCEPTED,
            referenceId: friendship.id,
            title: 'Friend Request Accepted',
            message: `${friendship.addressee.name} accepted your friend request!`,
        });

        return friendship;
    }

    async declineFriendRequest(userId: string, requestId: string) {
        const request = await this.prisma.friendship.findUnique({
            where: { id: requestId },
        });

        if (!request || request.addresseeId !== userId || request.status !== FriendshipStatus.PENDING) {
            throw new BadRequestException('Invalid request');
        }

        return this.prisma.friendship.update({
            where: { id: requestId },
            data: { status: FriendshipStatus.DECLINED },
        });
    }

    async getFriends(userId: string) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: FriendshipStatus.ACCEPTED },
                    { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
                ],
            },
            include: {
                requester: { select: { id: true, name: true, avatar: true } },
                addressee: { select: { id: true, name: true, avatar: true } },
            },
        });

        return friendships.map((f) => (f.requesterId === userId ? f.addressee : f.requester));
    }

    async getPendingRequests(userId: string) {
        return this.prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: FriendshipStatus.PENDING,
            },
            include: {
                requester: { select: { id: true, name: true, avatar: true, email: true } },
            },
        });
    }

    async getFriendshipStatus(userId: string, targetId: string) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: userId },
                ],
            },
        });

        if (!friendship) return null;
        return friendship;
    }
}
