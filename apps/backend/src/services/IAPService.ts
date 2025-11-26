import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { AuthenticationService } from './AuthenticationService.js';
import type { IRedisClient } from '../cache/interfaces/IRedisClient.js';
import { GameError as AppError, ErrorCode } from '../errors/GameError.js';
import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '../types/premium.js';

export interface IAPReceipt {
    platform: 'apple' | 'google';
    productId: string;
    receipt: string; // Base64 encoded receipt data
    transactionId?: string;
}

export interface IAPVerificationResult {
    success: boolean;
    plan: SubscriptionPlan;
    expiresAt: Date;
}

export class IAPService {
    private readonly authService: AuthenticationService;

    private readonly redis: IRedisClient;

    private readonly prisma: PrismaClient;

    constructor(
        authService: AuthenticationService,
        redis: IRedisClient,
        prisma: PrismaClient
    ) {
        this.authService = authService;
        this.redis = redis;
        this.prisma = prisma;
    }

    /**
     * Verify and process an In-App Purchase receipt
     */
    public async verifyAndProcessReceipt(userId: string, data: IAPReceipt): Promise<IAPVerificationResult> {
        try {
            // 1. Validate Receipt with Apple/Google
            // In a real implementation, use a library like 'iap' or 'google-play-billing-validator'
            // const validationResponse = await iap.verify(data);

            // MOCK VALIDATION for now
            const isValid = true;
            if (!isValid) {
                throw new AppError('Invalid receipt', ErrorCode.VALIDATION_ERROR, 400);
            }

            // 2. Determine Plan from Product ID
            const plan = this.getPlanFromProductId(data.productId);
            const billingInterval = this.getIntervalFromProductId(data.productId);

            // 3. Check for existing subscription
            const existingSub = await this.prisma.subscription.findUnique({
                where: { userId }
            });

            const now = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + (billingInterval === BillingInterval.YEARLY ? 12 : 1));

            const subscriptionData = {
                userId,
                plan,
                status: SubscriptionStatus.ACTIVE,
                billingInterval,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                iapProvider: data.platform,
                iapTransactionId: data.transactionId || randomUUID(), // Should come from validation
                iapOriginalTransactionId: data.transactionId, // Should come from validation
                updatedAt: now,
            };

            if (existingSub) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await this.prisma.subscription.update({
                    where: { id: existingSub.id },
                    data: subscriptionData as any
                });
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await this.prisma.subscription.create({
                    data: {
                        ...subscriptionData,
                        stripeCustomerId: undefined,
                        stripeSubscriptionId: undefined,
                    } as any
                });
            }

            // 4. Update User Role
            await this.updateUserRole(userId, plan);

            // 5. Cache
            await this.redis.del(`subscription:active:${userId}`);

            return { success: true, plan, expiresAt: periodEnd };

        } catch (error) {
            // console.error('IAP Verification Error:', error);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to verify purchase', ErrorCode.INTERNAL_SERVER_ERROR, 500);
        }
    }

    private getPlanFromProductId(productId: string): SubscriptionPlan {
        if (productId.includes('supreme')) return SubscriptionPlan.SUPREME;
        if (productId.includes('premium')) return SubscriptionPlan.PREMIUM;
        if (productId.includes('basic')) return SubscriptionPlan.BASIC;
        return SubscriptionPlan.FREE;
    }

    private getIntervalFromProductId(productId: string): BillingInterval {
        if (productId.includes('yearly') || productId.includes('annual')) return BillingInterval.YEARLY;
        return BillingInterval.MONTHLY;
    }

    private async updateUserRole(userId: string, plan: SubscriptionPlan): Promise<void> {
        // Reuse logic from PremiumFeaturesService or move to shared helper
        // For now, simple mapping
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roleMap: Record<string, any> = {
            [SubscriptionPlan.FREE]: 'USER',
            [SubscriptionPlan.BASIC]: 'USER',
            [SubscriptionPlan.PREMIUM]: 'PREMIUM_USER',
            [SubscriptionPlan.SUPREME]: 'PREMIUM_USER',
        };
        await this.authService.updateUserRole(userId, roleMap[plan]);
    }
}
