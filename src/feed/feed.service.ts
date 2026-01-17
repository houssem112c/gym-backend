import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
    constructor(private prisma: PrismaService) { }

    async createPost(userId: string, content?: string, mediaUrls: string[] = []) {
        return this.prisma.feedPost.create({
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
                user: { select: { id: true, name: true, avatar: true } },
                media: true,
            },
        });
    }

    async getFeed() {
        return this.prisma.feedPost.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                media: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { likes: true, comments: true },
                },
                likes: true, // To check if current user liked it on frontend
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
}
