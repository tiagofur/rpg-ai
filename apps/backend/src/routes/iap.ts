import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IAPService, IAPReceipt } from '../services/IAPService.js';
import { authenticate } from '../plugins/auth.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export interface IAPRoutesOptions {
    iapService: IAPService;
}

export async function iapRoutes(
    fastify: FastifyInstance,
    options: IAPRoutesOptions
) {
    const { iapService } = options;

    /**
     * @route POST /iap/verify
     * @description Verify an In-App Purchase receipt
     */
    fastify.post('/iap/verify', {
        preHandler: authenticate,
        schema: {
            body: {
                type: 'object',
                required: ['platform', 'productId', 'receipt'],
                properties: {
                    platform: { type: 'string', enum: ['apple', 'google'] },
                    productId: { type: 'string' },
                    receipt: { type: 'string' },
                    transactionId: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const body = request.body as IAPReceipt;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (request as any).user!.id;

            const result = await iapService.verifyAndProcessReceipt(userId, body);

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            // console.error('Error verifying IAP:', error);
            if (error instanceof AppError) throw error;

            throw new AppError(
                'Failed to verify purchase',
                ErrorCode.INTERNAL_SERVER_ERROR,
                500
            );
        }
    });
}
