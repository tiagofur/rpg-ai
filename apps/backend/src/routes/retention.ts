import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/NotificationService.js';
import { DailyRewardService } from '../services/DailyRewardService.js';
import { authenticate } from '../plugins/auth.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export interface RetentionRoutesOptions {
    notificationService: NotificationService;
    dailyRewardService: DailyRewardService;
}

export async function retentionRoutes(
    fastify: FastifyInstance,
    options: RetentionRoutesOptions
) {
    const { notificationService, dailyRewardService } = options;

    /**
     * @route POST /notifications/register
     * @description Register a push token for the current user
     */
    fastify.post('/notifications/register', {
        preHandler: authenticate,
        schema: {
            body: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const { token } = request.body as { token: string };
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (request as any).user!.id;
            await notificationService.registerPushToken(userId, token);
            return { success: true };
        } catch (error) {
            // console.error('Error registering token:', error);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to register token', ErrorCode.INTERNAL_SERVER_ERROR, 500);
        }
    });

    /**
     * @route GET /rewards/daily/check
     * @description Check if daily reward is available
     */
    fastify.get('/rewards/daily/check', {
        preHandler: authenticate,
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (request as any).user!.id;
            const canClaim = await dailyRewardService.canClaimReward(userId);
            return { success: true, data: { canClaim } };
        } catch (error) {
            // console.error('Error checking reward:', error);
            throw new AppError('Failed to check reward', ErrorCode.INTERNAL_SERVER_ERROR, 500);
        }
    });

    /**
     * @route POST /rewards/daily/claim
     * @description Claim daily reward
     */
    fastify.post('/rewards/daily/claim', {
        preHandler: authenticate,
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (request as any).user!.id;
            const result = await dailyRewardService.claimReward(userId);
            return { success: true, data: result };
        } catch (error) {
            // console.error('Error claiming reward:', error);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to claim reward', ErrorCode.INTERNAL_SERVER_ERROR, 500);
        }
    });
}
