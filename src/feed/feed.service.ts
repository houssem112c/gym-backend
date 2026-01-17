import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FeedService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async createPost(userId: string, content?: string, mediaUrls: string[] = []) {
        const post = await this.prisma.feedPost.create({
            data: {
                userId,
                content,
                media: {
                    create: mediaUrls.map((url, index) => ({
                        url,
                        order: index,
                    })),
                },
            },
            include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
                media: true,
                _count: {
                    select: { likes: true, comments: true },
                },
                likes: true,
            },
        });

        // Trigger notifications
        try {
            let targetUserIds: string[] = [];
            if (post.user.role === Role.ADMIN) {
                // Notify all users except the admin themselves
                const allUsers = await this.prisma.user.findMany({
                    where: { id: { not: userId } },
                    select: { id: true },
                });
                targetUserIds = allUsers.map(u => u.id);
            } else {
                // Notify friends
                const friendships = await this.prisma.friendship.findMany({
                    where: {
                        OR: [
                            { requesterId: userId, status: 'ACCEPTED' },
                            { addresseeId: userId, status: 'ACCEPTED' },
                        ],
                    },
                });
                targetUserIds = friendships.map(f =>
                    f.requesterId === userId ? f.addresseeId : f.requesterId
                );
            }

            // Create notification for each target user
            for (const targetId of targetUserIds) {
                await this.notificationsService.createNotification({
                    userId: targetId,
                    actorId: userId,
                    type: NotificationType.POST_CREATED,
                    referenceId: post.id,
                    title: post.user.role === Role.ADMIN ? 'New Admin Post' : 'New Friend Post',
                    message: `${post.user.name} shared a new post.`,
                });
            }
        } catch (error) {
            console.error('Failed to trigger notifications for post:', error);
        }

        return post;
    }

    async getFeed(userId: string) {
        // Get accepted friendships
        const friendships = await this.prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' },
                ],
            },
        });

        const friendIds = friendships.map(f =>
            f.requesterId === userId ? f.addresseeId : f.requesterId
        );

        return this.prisma.feedPost.findMany({
            where: {
                OR: [
                    { userId: userId }, // My own posts
                    { userId: { in: friendIds } }, // Friends' posts
                    { user: { role: 'ADMIN' } }, // All admin posts
                ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                media: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { likes: true, comments: true },
                },
                likes: true,
            },
        });
    }

    async getPostsByUser(userId: string) {
        return this.prisma.feedPost.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                media: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { likes: true, comments: true },
                },
                likes: true,
            },
        });
    }

    async likePost(userId: string, postId: string) {
        return this.prisma.feedLike.upsert({
            where: {
                userId_postId: { userId, postId },
            },
            create: { userId, postId },
            update: {},
        });
    }

    async unlikePost(userId: string, postId: string) {
        return this.prisma.feedLike.delete({
            where: {
                userId_postId: { userId, postId },
            },
        });
    }

    async addComment(userId: string, postId: string, content: string) {
        return this.prisma.feedComment.create({
            data: {
                userId,
                postId,
                content,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    async getComments(postId: string) {
        return this.prisma.feedComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    async sharePost(userId: string, originalPostId: string, content?: string) {
        const sharedPost = await this.prisma.feedPost.create({
            data: {
                userId,
                sharedPostId: originalPostId,
                content: content, // This is the user's caption for the share
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                sharedPost: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    }
                }
            },
        });

        // Trigger notification for the original poster
        try {
            const originalPost = await this.prisma.feedPost.findUnique({
                where: { id: originalPostId },
                select: { userId: true },
            });

            if (originalPost && originalPost.userId !== userId) {
                await this.notificationsService.createNotification({
                    userId: originalPost.userId,
                    actorId: userId,
                    type: NotificationType.POST_CREATED, // Maybe add SHARE_POST type later
                    referenceId: sharedPost.id,
                    title: 'Post Shared',
                    message: `${sharedPost.user.name} shared your post.`,
                });
            }
        } catch (error) {
            console.error('Failed to trigger share notification:', error);
        }

        return sharedPost;
    }
}
