/**
 * E2E Tests - Premium & Subscription Features
 * Tests subscription management and premium limits
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server.js';

describe('E2E - Premium Features Flow', () => {
    let app: FastifyInstance;
    let accessToken: string;
    let userId: string;

    const testUser = {
        username: `premiumtest_${Date.now()}`,
        email: `premiumtest_${Date.now()}@example.com`,
        password: 'Test123!@#',
    };

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();

        const registerResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: testUser,
        });

        const registerBody = JSON.parse(registerResponse.body);
        accessToken = registerBody.accessToken;
        userId = registerBody.user.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Subscription Status', () => {
        it('should get current subscription status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/subscription/status',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('planId');
            expect(body).toHaveProperty('status');
            expect(body.planId).toBe('free'); // New user should be on free plan
        });

        it('should get available plans', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/subscription/plans',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThan(0);

            const freePlan = body.find((p: any) => p.id === 'free');
            expect(freePlan).toBeDefined();
            expect(freePlan).toHaveProperty('limits');
        });
    });

    describe('Usage Limits', () => {
        it('should get current usage stats', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/subscription/usage',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('aiCallsUsed');
            expect(body).toHaveProperty('aiCallsLimit');
            expect(body).toHaveProperty('imagesGenerated');
            expect(body).toHaveProperty('imagesLimit');
            expect(body).toHaveProperty('savedGamesUsed');
            expect(body).toHaveProperty('savedGamesLimit');
        });

        it('should respect free tier AI call limits', async () => {
            // Create character and session
            const charResponse = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    name: 'Test',
                    race: 'human',
                    class: 'warrior',
                    attributes: {
                        strength: 14,
                        dexterity: 12,
                        constitution: 14,
                        intelligence: 10,
                        wisdom: 10,
                        charisma: 10,
                    },
                },
            });

            const charBody = JSON.parse(charResponse.body);

            const sessionResponse = await app.inject({
                method: 'POST',
                url: '/api/session/create',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    characterId: charBody.id,
                },
            });

            const sessionBody = JSON.parse(sessionResponse.body);

            // Execute many actions to hit limit (free tier = 100)
            const actions = [];
            for (let i = 0; i < 105; i++) {
                actions.push(
                    app.inject({
                        method: 'POST',
                        url: `/api/game/${sessionBody.id}/action`,
                        headers: {
                            authorization: `Bearer ${accessToken}`,
                        },
                        payload: {
                            type: 'custom',
                            parameters: {
                                input: 'look',
                            },
                        },
                    })
                );
            }

            const responses = await Promise.all(actions);
            const limited = responses.some((r) => r.statusCode === 429 || r.statusCode === 402);

            expect(limited).toBe(true);
        });
    });

    describe('Stripe Integration', () => {
        it('should create checkout session', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/stripe/create-checkout',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    priceId: 'price_test_basic',
                    successUrl: 'https://example.com/success',
                    cancelUrl: 'https://example.com/cancel',
                },
            });

            // Should create session or fail gracefully if Stripe not configured
            expect([200, 201, 503]).toContain(response.statusCode);

            if (response.statusCode === 200 || response.statusCode === 201) {
                const body = JSON.parse(response.body);
                expect(body).toHaveProperty('sessionId');
                expect(body).toHaveProperty('url');
            }
        });

        it('should handle webhook events', async () => {
            const webhookPayload = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        customer: 'cus_test',
                        subscription: 'sub_test',
                        metadata: {
                            userId,
                            planId: 'basic',
                        },
                    },
                },
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/stripe/webhook',
                payload: webhookPayload,
                headers: {
                    'stripe-signature': 'test-signature',
                },
            });

            // Webhook should process or fail verification
            expect([200, 400]).toContain(response.statusCode);
        });

        it('should get customer portal link', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/stripe/portal',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            // Should return portal URL or 404 if no customer
            expect([200, 404, 503]).toContain(response.statusCode);
        });
    });

    describe('Daily Rewards', () => {
        it('should claim daily reward', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/retention/daily-reward',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('reward');
            expect(body).toHaveProperty('streak');
            expect(body.claimed).toBe(true);
        });

        it('should not allow claiming twice in same day', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/retention/daily-reward',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.error).toMatch(/already claimed|too soon/i);
        });

        it('should get reward history', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/retention/rewards-history',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThan(0);
        });
    });

    describe('In-App Purchases', () => {
        it('should validate Apple receipt', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/iap/apple/verify',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    receiptData: 'fake-receipt-data',
                    productId: 'com.rpgai.basic.monthly',
                },
            });

            // Should fail with fake receipt but not crash
            expect([200, 400, 401]).toContain(response.statusCode);
        });

        it('should validate Google Play purchase', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/iap/google/verify',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    purchaseToken: 'fake-token',
                    productId: 'basic_monthly',
                    packageName: 'com.rpgai.app',
                },
            });

            // Should fail with fake token but not crash
            expect([200, 400, 401]).toContain(response.statusCode);
        });
    });
});
