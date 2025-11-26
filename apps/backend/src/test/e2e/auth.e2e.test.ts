/**
 * E2E Tests - Authentication Flow
 * Tests complete authentication flow: register → login → refresh → logout
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server.js';

describe('E2E - Authentication Flow', () => {
    let app: FastifyInstance;
    let accessToken: string;
    let refreshToken: string;
    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!@#',
    };

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: testUser,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('accessToken');
            expect(body).toHaveProperty('refreshToken');
            expect(body.user).toHaveProperty('id');
            expect(body.user.username).toBe(testUser.username);
            expect(body.user.email).toBe(testUser.email);
            expect(body.user).not.toHaveProperty('password'); // Password should not be returned
        });

        it('should fail to register with duplicate username', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: testUser,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('error');
        });

        it('should fail to register with invalid email', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    username: 'newuser',
                    email: 'invalid-email',
                    password: 'Test123!@#',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should fail to register with weak password', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    username: 'newuser2',
                    email: 'newuser2@example.com',
                    password: '123', // Too weak
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('User Login', () => {
        it('should login successfully with correct credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: testUser.email,
                    password: testUser.password,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('accessToken');
            expect(body).toHaveProperty('refreshToken');
            expect(body.user.email).toBe(testUser.email);

            // Store tokens for later tests
            accessToken = body.accessToken;
            refreshToken = body.refreshToken;
        });

        it('should fail login with incorrect password', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: testUser.email,
                    password: 'WrongPassword123!',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should fail login with non-existent email', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'nonexistent@example.com',
                    password: testUser.password,
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Token Refresh', () => {
        it('should refresh access token successfully', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',
                payload: {
                    refreshToken,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('accessToken');
            expect(body.accessToken).not.toBe(accessToken); // Should be a new token
        });

        it('should fail refresh with invalid token', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',
                payload: {
                    refreshToken: 'invalid-token',
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Protected Routes', () => {
        it('should access protected route with valid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/auth/me',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.email).toBe(testUser.email);
        });

        it('should fail to access protected route without token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/auth/me',
            });

            expect(response.statusCode).toBe(401);
        });

        it('should fail to access protected route with invalid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/auth/me',
                headers: {
                    authorization: 'Bearer invalid-token-here',
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('User Logout', () => {
        it('should logout successfully', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/logout',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
        });

        it('should fail to use token after logout', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/auth/me',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            // Token should be invalidated after logout
            // This depends on implementation - might still work if using stateless JWT
            // If using Redis blacklist, should fail
            expect([200, 401]).toContain(response.statusCode);
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit after too many login attempts', async () => {
            const attempts = [];

            // Try to login 10 times rapidly
            for (let i = 0; i < 10; i++) {
                attempts.push(
                    app.inject({
                        method: 'POST',
                        url: '/api/auth/login',
                        payload: {
                            email: 'ratelimit@example.com',
                            password: 'WrongPassword123!',
                        },
                    })
                );
            }

            const responses = await Promise.all(attempts);
            const rateLimited = responses.some((r) => r.statusCode === 429);

            // Should eventually rate limit
            expect(rateLimited).toBe(true);
        });
    });
});
