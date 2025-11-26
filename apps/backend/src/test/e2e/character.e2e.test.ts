/**
 * E2E Tests - Character Creation & Management
 * Tests complete character lifecycle: create → list → update → delete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server.js';

describe('E2E - Character Management Flow', () => {
    let app: FastifyInstance;
    let accessToken: string;
    let userId: string;
    let characterId: string;

    const testUser = {
        username: `chartest_${Date.now()}`,
        email: `chartest_${Date.now()}@example.com`,
        password: 'Test123!@#',
    };

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();

        // Register and login user
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

    describe('Character Creation - Direct', () => {
        const characterData = {
            name: 'Aragorn',
            race: 'human',
            class: 'warrior',
            attributes: {
                strength: 16,
                dexterity: 14,
                constitution: 15,
                intelligence: 10,
                wisdom: 12,
                charisma: 14,
            },
        };

        it('should create character with direct method', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: characterData,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('id');
            expect(body.name).toBe(characterData.name);
            expect(body.race).toBe(characterData.race);
            expect(body.class).toBe(characterData.class);
            expect(body.attributes.strength).toBe(characterData.attributes.strength);
            expect(body).toHaveProperty('health');
            expect(body).toHaveProperty('mana');
            expect(body.level).toBe(1);
            expect(body.experience).toBe(0);

            // Store character ID for later tests
            characterId = body.id;
        });

        it('should fail to create character without authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                payload: characterData,
            });

            expect(response.statusCode).toBe(401);
        });

        it('should fail to create character with invalid attributes', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    ...characterData,
                    attributes: {
                        strength: 25, // Too high (max is 20)
                        dexterity: 10,
                        constitution: 10,
                        intelligence: 10,
                        wisdom: 10,
                        charisma: 10,
                    },
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should fail to create character with invalid race', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    ...characterData,
                    race: 'alien', // Invalid race
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should fail to create character with invalid class', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    ...characterData,
                    class: 'astronaut', // Invalid class
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Character Listing', () => {
        it('should list user characters', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/character/my',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThan(0);

            const character = body.find((c: any) => c.id === characterId);
            expect(character).toBeDefined();
            expect(character.name).toBe('Aragorn');
        });

        it('should fail to list characters without authentication', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/character/my',
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Character Retrieval', () => {
        it('should get specific character by ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/character/${characterId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.id).toBe(characterId);
            expect(body.name).toBe('Aragorn');
        });

        it('should fail to get non-existent character', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await app.inject({
                method: 'GET',
                url: `/api/character/${fakeId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(404);
        });

        it("should fail to get another user's character", async () => {
            // Create another user
            const otherUser = {
                username: `other_${Date.now()}`,
                email: `other_${Date.now()}@example.com`,
                password: 'Test123!@#',
            };

            const otherRegister = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: otherUser,
            });

            const otherBody = JSON.parse(otherRegister.body);
            const otherToken = otherBody.accessToken;

            // Try to access first user's character
            const response = await app.inject({
                method: 'GET',
                url: `/api/character/${characterId}`,
                headers: {
                    authorization: `Bearer ${otherToken}`,
                },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Character Deletion', () => {
        it('should delete own character', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/character/${characterId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
        });

        it('should fail to get deleted character', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/character/${characterId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(404);
        });

        it('should fail to delete non-existent character', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/character/${fakeId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('Character with AI Generation', () => {
        it('should create character with AI prompt', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-ai',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    prompt: 'Create a wise old wizard with high intelligence and wisdom',
                },
            });

            // This might take longer due to AI processing
            expect([200, 201, 408]).toContain(response.statusCode);

            if (response.statusCode === 201) {
                const body = JSON.parse(response.body);
                expect(body).toHaveProperty('id');
                expect(body).toHaveProperty('name');
                expect(body.class).toBe('mage'); // AI should understand wizard = mage
            }
        });

        it('should fail AI creation without prompt', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/character/create-ai',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {},
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Premium Limits', () => {
        it('should respect free tier character limit', async () => {
            // Free tier typically allows 3 characters
            const characters = [];

            for (let i = 0; i < 5; i++) {
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/character/create-direct',
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                    },
                    payload: {
                        name: `TestChar${i}`,
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

                characters.push(response);
            }

            // Should hit limit eventually
            const forbidden = characters.some((r) => r.statusCode === 403 || r.statusCode === 429);
            expect(forbidden).toBe(true);
        });
    });
});
