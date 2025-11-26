import { PrismaClient } from '@prisma/client';
import type { IRedisClient } from '../cache/interfaces/IRedisClient.js';
import { NotificationService } from './NotificationService.js';
import { GameError as AppError, ErrorCode } from '../errors/GameError.js';

export interface DailyRewardResult {
    streak: number;
    reward: {
        type: 'gold' | 'gems' | 'item';
        amount: number;
        itemId?: string;
    };
    nextRewardAt: Date;
}

export class DailyRewardService {
    private readonly prisma: PrismaClient;

    // Redis currently not used in this service
    // private readonly redis: IRedisClient;

    private readonly notificationService: NotificationService;

    constructor(prisma: PrismaClient, _redis: IRedisClient, notificationService: NotificationService) {
        this.prisma = prisma;
        // this.redis = redis; // Redis not currently used
        this.notificationService = notificationService;
    }

    /**
     * Check if user can claim daily reward
     */
    public async canClaimReward(userId: string): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await this.prisma.user.findUnique({ where: { id: userId } }) as any;
        if (!user) return false;

        if (!user.lastDailyRewardClaimedAt) return true;

        const lastClaim = new Date(user.lastDailyRewardClaimedAt);
        const now = new Date();

        // Check if it's a new day (simple check, can be improved with timezones)
        return lastClaim.getDate() !== now.getDate() || lastClaim.getMonth() !== now.getMonth() || lastClaim.getFullYear() !== now.getFullYear();
    }

    /**
     * Claim daily reward
     */
    public async claimReward(userId: string): Promise<DailyRewardResult> {
        if (!(await this.canClaimReward(userId))) {
            throw new AppError('Daily reward already claimed today', ErrorCode.RESOURCE_CONFLICT, 409);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await this.prisma.user.findUnique({ where: { id: userId } }) as any;

        // Calculate streak
        let streak = user.dailyRewardStreak || 0;
        const lastClaim = user.lastDailyRewardClaimedAt ? new Date(user.lastDailyRewardClaimedAt) : null;
        const now = new Date();

        if (lastClaim) {
            const diffTime = Math.abs(now.getTime() - lastClaim.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 2) {
                streak = 1; // Reset streak if missed a day
            } else {
                streak += 1;
            }
        } else {
            streak = 1;
        }

        // Calculate Reward based on streak
        const reward = this.calculateReward(streak);

        // Update User
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                lastDailyRewardClaimedAt: now,
                dailyRewardStreak: streak,
            } as any
        });

        // Schedule notification for next day
        await this.notificationService.scheduleNotification(
            userId,
            'Daily Reward Ready!',
            'Your next daily reward is waiting for you. Come back to claim it!',
            24 * 60 * 60 // 24 hours
        );

        const nextRewardAt = new Date(now);
        nextRewardAt.setDate(nextRewardAt.getDate() + 1);
        nextRewardAt.setHours(0, 0, 0, 0);

        return {
            streak,
            reward,
            nextRewardAt
        };
    }

    private calculateReward(streak: number): { type: 'gold' | 'gems' | 'item'; amount: number } {
        // Simple logic: more streak = more gold
        const baseGold = 100;
        const multiplier = Math.min(streak, 7); // Cap at 7 days multiplier

        if (streak % 7 === 0) {
            return { type: 'gems', amount: 10 }; // Weekly gem reward
        }

        return { type: 'gold', amount: baseGold * multiplier };
    }
}
