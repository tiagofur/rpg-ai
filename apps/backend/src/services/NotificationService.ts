import { PrismaClient } from '@prisma/client';
import type { IRedisClient } from '../cache/interfaces/IRedisClient.js';
import { GameError as AppError, ErrorCode } from '../errors/GameError.js';

interface PushMessage {
    to: string;
    sound?: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export class NotificationService {
    private readonly prisma: PrismaClient;

    // Redis currently not used in this service
    // private readonly redis: IRedisClient;

    constructor(prisma: PrismaClient, _redis: IRedisClient) {
        this.prisma = prisma;
        // this.redis = redis; // Redis not currently used
    }

    /**
     * Register a push token for a user
     */
    public async registerPushToken(userId: string, token: string): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await this.prisma.user.update({
                where: { id: userId },
                data: { pushToken: token } as any,
            });
        } catch (error) {
            // console.error('Error registering push token:', error);
            throw new AppError('Failed to register push token', ErrorCode.INTERNAL_SERVER_ERROR, 500);
        }
    }

    /**
     * Send a push notification to a user
     */
    public async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true } as any,
            }) as any;

            if (!user?.pushToken) {
                // console.warn(`No push token found for user ${userId}`);
                return;
            }

            const message: PushMessage = {
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                ...(data ? { data } : {}),
            };

            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
        } catch (error) {
            // console.error('Error sending push notification:', error);
            // Don't throw here to avoid breaking the flow if notification fails
        }
    }

    /**
     * Schedule a local notification (simulated via backend delay or cron)
     * For real scheduling, use a job queue like BullMQ
     */
    public async scheduleNotification(userId: string, title: string, body: string, delaySeconds: number): Promise<void> {
        // In a real app, add to BullMQ queue with delay
        // For now, we'll just use setTimeout (NOT RECOMMENDED FOR PRODUCTION)
        setTimeout(() => {
            void this.sendPushNotification(userId, title, body);
        }, delaySeconds * 1000);
    }
}
