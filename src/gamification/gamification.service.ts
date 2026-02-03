import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpAction } from '@prisma/client';
import { BadgeService } from './badge.service';

@Injectable()
export class GamificationService {
    private readonly logger = new Logger(GamificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly badgeService: BadgeService,
    ) { }

    async getUserGamification(userId: string) {
        let gamification = await this.prisma.userGamification.findUnique({
            where: { userId },
        });

        if (!gamification) {
            gamification = await this.prisma.userGamification.create({
                data: { userId },
            });
        }

        const xpToNextLevel = this.calculateXpForLevel(gamification.level + 1);
        const currentLevelXp = this.calculateXpForLevel(gamification.level);

        return {
            ...gamification,
            xpToNextLevel,
            currentLevelXp,
            progress: (gamification.totalXp - currentLevelXp) / (xpToNextLevel - currentLevelXp),
        };
    }

    async awardXp(userId: string, action: XpAction, amount: number, metadata?: any) {
        try {
            // 1. Create XP transaction
            await this.prisma.xpTransaction.create({
                data: {
                    userId,
                    amount,
                    action,
                    metadata,
                },
            });

            // 2. Update user's total XP, points and stats
            const pointsAwarded = amount * 2; // User wants more points than XP
            const statsUpdate: any = {
                totalXp: { increment: amount },
                totalPoints: { increment: pointsAwarded },
            };

            // Increment specific counters based on action
            if (action === XpAction.POST_CREATED) statsUpdate.postsCount = { increment: 1 };
            if (action === XpAction.ORDER_COMPLETED) statsUpdate.ordersCount = { increment: 1 };
            if (action === XpAction.COURSE_COMPLETED) statsUpdate.coursesCount = { increment: 1 };
            if (action === XpAction.COMMENT_ADDED) statsUpdate.commentsCount = { increment: 1 };
            if (action === XpAction.POST_LIKED) statsUpdate.likesCount = { increment: 1 };

            const updated = await this.prisma.userGamification.update({
                where: { userId },
                data: statsUpdate,
            });

            // 3. Check for level up
            const currentLevel = updated.level;
            const newLevel = this.calculateLevel(updated.totalXp);

            if (newLevel > currentLevel) {
                await this.prisma.userGamification.update({
                    where: { userId },
                    data: { level: newLevel },
                });

                // Award XP for leveling up or trigger level badges
                await this.badgeService.checkAndAwardBadges(userId);
            } else {
                // Check for other badges anyway if stats changed
                await this.badgeService.checkAndAwardBadges(userId);
            }

            return { totalXp: updated.totalXp, level: newLevel, leveledUp: newLevel > currentLevel };
        } catch (e) {
            this.logger.error(`Failed to award XP to user ${userId}: ${e.message}`);
            return null;
        }
    }

    calculateLevel(totalXp: number): number {
        // XP for level N = 100 * N^1.5
        // Inverse: Level = (XP / 100)^(1/1.5)
        if (totalXp < 100) return 1;
        return Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1;
    }

    calculateXpForLevel(level: number): number {
        if (level <= 1) return 0;
        return Math.floor(100 * Math.pow(level - 1, 1.5));
    }

    async getLeaderboard(limit: number = 10) {
        return this.prisma.userGamification.findMany({
            take: limit,
            orderBy: { totalXp: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async getXpHistory(userId: string) {
        return this.prisma.xpTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async updateLoginStreak(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const gamification = await this.getUserGamification(userId);
        const lastLogin = gamification.lastLoginDate;

        if (!lastLogin) {
            await this.prisma.userGamification.update({
                where: { userId },
                data: {
                    currentStreak: 1,
                    longestStreak: 1,
                    lastLoginDate: new Date(),
                },
            });
            await this.awardXp(userId, XpAction.DAILY_LOGIN, 5);
            return;
        }

        const lastLoginDay = new Date(lastLogin);
        lastLoginDay.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            const newStreak = gamification.currentStreak + 1;
            await this.prisma.userGamification.update({
                where: { userId },
                data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, gamification.longestStreak),
                    lastLoginDate: new Date(),
                },
            });
            await this.awardXp(userId, XpAction.DAILY_LOGIN, 5 + Math.min(newStreak, 10)); // Bonus XP for streak
        } else if (diffDays > 1) {
            // Streak broken
            await this.prisma.userGamification.update({
                where: { userId },
                data: {
                    currentStreak: 1,
                    lastLoginDate: new Date(),
                },
            });
            await this.awardXp(userId, XpAction.DAILY_LOGIN, 5);
        }
        // If diffDays === 0, already logged in today, do nothing
    }

    async spendPoints(userId: string, amount: number) {
        const gamification = await this.prisma.userGamification.findUnique({
            where: { userId },
        });

        if (!gamification || gamification.totalPoints < amount) {
            throw new Error('Insufficient points');
        }

        return this.prisma.userGamification.update({
            where: { userId },
            data: {
                totalPoints: { decrement: amount },
            },
        });
    }
}
