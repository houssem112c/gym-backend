import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeCategory, XpAction } from '@prisma/client';

@Injectable()
export class BadgeService implements OnApplicationBootstrap {
    private readonly logger = new Logger(BadgeService.name);

    constructor(private readonly prisma: PrismaService) { }

    async onApplicationBootstrap() {
        await this.seedBadges();
    }

    async seedBadges() {
        const defaultBadges = [
            // Social
            { name: 'First Post', description: 'Create your first post', icon: '📸', category: BadgeCategory.SOCIAL, requirement: 1, xpReward: 10 },
            { name: 'Community Member', description: 'Create 10 posts', icon: '🤝', category: BadgeCategory.SOCIAL, requirement: 10, xpReward: 50 },
            { name: 'Influencer', description: 'Create 100 posts', icon: '🌟', category: BadgeCategory.SOCIAL, requirement: 100, xpReward: 200 },

            // Fitness
            { name: 'Fitness Newbie', description: 'Complete your first course', icon: '🏃', category: BadgeCategory.FITNESS, requirement: 1, xpReward: 10 },
            { name: 'Gym Regular', description: 'Complete 20 courses', icon: '🏋️', category: BadgeCategory.FITNESS, requirement: 20, xpReward: 100 },
            { name: 'Fitness Expert', description: 'Complete 50 courses', icon: '💪', category: BadgeCategory.FITNESS, requirement: 50, xpReward: 250 },

            // Shopping
            { name: 'First Purchase', description: 'Make your first order', icon: '🛒', category: BadgeCategory.SHOPPING, requirement: 1, xpReward: 20 },
            { name: 'Regular Customer', description: 'Make 5 orders', icon: '🛍️', category: BadgeCategory.SHOPPING, requirement: 5, xpReward: 50 },
            { name: 'VIP Member', description: 'Make 20 orders', icon: '💎', category: BadgeCategory.SHOPPING, requirement: 20, xpReward: 200 },

            // Consistency
            { name: 'Week Warrior', description: '7 day login streak', icon: '📅', category: BadgeCategory.CONSISTENCY, requirement: 7, xpReward: 50 },
            { name: 'Month Master', description: '30 day login streak', icon: '🔥', category: BadgeCategory.CONSISTENCY, requirement: 30, xpReward: 150 },

            // Level
            { name: 'Level 5 reached', description: 'Reach level 5', icon: '🎖️', category: BadgeCategory.LEVEL, requirement: 5, xpReward: 25 },
            { name: 'Level 10 reached', description: 'Reach level 10', icon: '🥇', category: BadgeCategory.LEVEL, requirement: 10, xpReward: 100 },
            { name: 'Level 25 reached', description: 'Reach level 25', icon: '🏆', category: BadgeCategory.LEVEL, requirement: 25, xpReward: 300 },
        ];

        for (const badge of defaultBadges) {
            await this.prisma.badge.upsert({
                where: { name: badge.name },
                update: badge,
                create: badge,
            });
        }
        this.logger.log('Badges seeded successfully');
    }

    async checkAndAwardBadges(userId: string) {
        const gamification = await this.prisma.userGamification.findUnique({
            where: { userId },
        });

        if (!gamification) return;

        const allBadges = await this.prisma.badge.findMany();
        const userBadges = await this.prisma.userBadge.findMany({
            where: { userId },
        });

        const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge.id)) continue;

            let qualifies = false;

            switch (badge.category) {
                case BadgeCategory.SOCIAL:
                    qualifies = gamification.postsCount >= badge.requirement;
                    break;
                case BadgeCategory.FITNESS:
                    qualifies = gamification.coursesCount >= badge.requirement;
                    break;
                case BadgeCategory.SHOPPING:
                    qualifies = gamification.ordersCount >= badge.requirement;
                    break;
                case BadgeCategory.CONSISTENCY:
                    qualifies = gamification.currentStreak >= badge.requirement;
                    break;
                case BadgeCategory.LEVEL:
                    qualifies = gamification.level >= badge.requirement;
                    break;
            }

            if (qualifies) {
                await this.awardBadge(userId, badge);
            }
        }
    }

    private async awardBadge(userId: string, badge: any) {
        try {
            await this.prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id,
                },
            });

            // Award XP for earning a badge
            // Note: We use a raw prisma call here or we'd have circular dependency if we used GamificationService.awardXp
            // Instead, we'll just increment totalXp and create a transaction manually or handle it in GamificationService
            await this.prisma.xpTransaction.create({
                data: {
                    userId,
                    amount: badge.xpReward,
                    action: XpAction.BADGE_EARNED,
                    description: `Earned badge: ${badge.name}`,
                },
            });

            await this.prisma.userGamification.update({
                where: { userId },
                data: {
                    totalXp: { increment: badge.xpReward },
                },
            });

            this.logger.log(`Awarded badge ${badge.name} to user ${userId}`);
        } catch (e) {
            // Might fail if already earned (unique constraint), which is fine
            if (!e.message.includes('Unique constraint')) {
                this.logger.error(`Failed to award badge ${badge.name} to user ${userId}: ${e.message}`);
            }
        }
    }

    async getAllBadges() {
        return this.prisma.badge.findMany();
    }

    async getUserBadges(userId: string) {
        return this.prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
        });
    }
}
