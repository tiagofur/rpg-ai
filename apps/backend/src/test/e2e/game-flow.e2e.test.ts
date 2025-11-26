/**
 * E2E Tests - Complete Game Flow
 * Tests full gameplay: create session → start game → execute actions → manage state
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server.js';

describe('E2E - Complete Game Flow', () => {
    let app: FastifyInstance;
    let accessToken: string;
    let characterId: string;
    let sessionId: string;

    const testUser = {
        username: `gametest_${Date.now()}`,
        email: `gametest_${Date.now()}@example.com`,
        password: 'Test123!@#',
    };

    beforeAll(async () => {
        app = await buildServer();
        await app.ready();

        // 1. Register user
        const registerResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: testUser,
        });

        const registerBody = JSON.parse(registerResponse.body);
        accessToken = registerBody.accessToken;
        // userId available in registerBody.user.id if needed

        // 2. Create character
        const characterResponse = await app.inject({
            method: 'POST',
            url: '/api/character/create-direct',
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
            payload: {
                name: 'Frodo Baggins',
                race: 'halfling',
                class: 'rogue',
                attributes: {
                    strength: 10,
                    dexterity: 16,
                    constitution: 14,
                    intelligence: 12,
                    wisdom: 14,
                    charisma: 12,
                },
            },
        });

        const characterBody = JSON.parse(characterResponse.body);
        characterId = characterBody.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Session Creation', () => {
        it('should create new game session', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/session/create',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    characterId,
                    campaignId: null, // Start new campaign
                    worldSeed: 'test-world',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('id');
            expect(body).toHaveProperty('state');
            expect(body.state).toHaveProperty('location');
            expect(body.state).toHaveProperty('inventory');
            expect(body.characterId).toBe(characterId);

            sessionId = body.id;
        });

        it('should fail to create session without character', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/session/create',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    campaignId: null,
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should fail to create session with invalid character', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/session/create',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    characterId: '00000000-0000-0000-0000-000000000000',
                    campaignId: null,
                },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('Session Retrieval', () => {
        it('should list user sessions', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/session/my',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThan(0);

            const session = body.find((s: any) => s.id === sessionId);
            expect(session).toBeDefined();
        });

        it('should get specific session', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/session/${sessionId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.id).toBe(sessionId);
            expect(body).toHaveProperty('state');
            expect(body).toHaveProperty('history');
        });
    });

    describe('Game Actions', () => {
        it('should execute look command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'look around',
                    },
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('message');
            expect(body).toHaveProperty('newState');
            expect(body.success).toBe(true);
        });

        it('should execute movement command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'go north',
                    },
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('message');
            expect(body.success).toBe(true);
        });

        it('should execute inventory command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'check inventory',
                    },
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('message');
        });

        it('should fail action on non-existent session', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${fakeId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'look',
                    },
                },
            });

            expect(response.statusCode).toBe(404);
        });

        it('should fail action without authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'look',
                    },
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Combat Simulation', () => {
        it('should handle attack command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'attack goblin',
                    },
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('message');
            // Message should contain combat-related text
            expect(body.message.toLowerCase()).toMatch(/attack|combat|damage|hit|miss/);
        });

        it('should handle defend command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'defend',
                    },
                },
            });

            expect(response.statusCode).toBe(200);
        });

        it('should handle use potion command', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'use_item',
                    parameters: {
                        itemName: 'health potion',
                    },
                },
            });

            // Might fail if no potion in inventory, but should not error
            expect([200, 400]).toContain(response.statusCode);
        });
    });

    describe('Undo/Redo Operations', () => {
        it('should undo last action', async () => {
            // Execute an action first
            await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/action`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    type: 'custom',
                    parameters: {
                        input: 'take torch',
                    },
                },
            });

            // Now undo it
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/undo`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        });

        it('should redo undone action', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/redo`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        });

        it('should fail undo when no history', async () => {
            // Undo all actions first
            for (let i = 0; i < 10; i++) {
                await app.inject({
                    method: 'POST',
                    url: `/api/game/${sessionId}/undo`,
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                    },
                });
            }

            // Try one more
            const response = await app.inject({
                method: 'POST',
                url: `/api/game/${sessionId}/undo`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect([400, 404]).toContain(response.statusCode);
        });
    });

    describe('Session Persistence', () => {
        it('should save session state', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/session/${sessionId}/save`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
        });

        it('should load saved session state', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/session/${sessionId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('state');
            expect(body).toHaveProperty('history');
            expect(body.history.length).toBeGreaterThan(0);
        });
    });

    describe('Session Deletion', () => {
        it('should delete session', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/session/${sessionId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(200);
        });

        it('should fail to access deleted session', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/session/${sessionId}`,
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('Multiplayer Session', () => {
        it('should create multiplayer session', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/session/create',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                },
                payload: {
                    characterId,
                    maxPlayers: 4,
                    isPublic: true,
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.maxPlayers).toBe(4);
            expect(body.isPublic).toBe(true);
        });

        it('should allow another player to join public session', async () => {
            // Create another user
            const user2 = {
                username: `player2_${Date.now()}`,
                email: `player2_${Date.now()}@example.com`,
                password: 'Test123!@#',
            };

            const register2 = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: user2,
            });

            const body2 = JSON.parse(register2.body);
            const token2 = body2.accessToken;

            // Create character for user 2
            const char2Response = await app.inject({
                method: 'POST',
                url: '/api/character/create-direct',
                headers: {
                    authorization: `Bearer ${token2}`,
                },
                payload: {
                    name: 'Gandalf',
                    race: 'human',
                    class: 'mage',
                    attributes: {
                        strength: 10,
                        dexterity: 12,
                        constitution: 12,
                        intelligence: 18,
                        wisdom: 16,
                        charisma: 14,
                    },
                },
            });

            const char2Body = JSON.parse(char2Response.body);

            // List public sessions
            const listResponse = await app.inject({
                method: 'GET',
                url: '/api/session/public',
                headers: {
                    authorization: `Bearer ${token2}`,
                },
            });

            expect(listResponse.statusCode).toBe(200);
            const sessions = JSON.parse(listResponse.body);
            expect(Array.isArray(sessions)).toBe(true);

            if (sessions.length > 0) {
                const publicSession = sessions[0];

                // Join the session
                const joinResponse = await app.inject({
                    method: 'POST',
                    url: `/api/session/${publicSession.id}/join`,
                    headers: {
                        authorization: `Bearer ${token2}`,
                    },
                    payload: {
                        characterId: char2Body.id,
                    },
                });

                expect([200, 201]).toContain(joinResponse.statusCode);
            }
        });
    });
});
