/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
/* eslint-disable unicorn/prefer-event-target */
import { EventEmitter } from 'node:events';
import { PrismaClient } from '@prisma/client';
import {
    IGuildService,
    IGuild,
    IGuildResources,
    GuildRankingCategory
} from '../interfaces/IChat.js';
import { IRedisClient } from '../../cache/interfaces/IRedisClient.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';
import { ILogger } from '../../logging/interfaces/ILogger.js';

export class GuildService extends EventEmitter implements IGuildService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private prisma: any;

    public constructor(
        _redis: IRedisClient,
        _logger: ILogger,
        prisma: PrismaClient
    ) {
        super();
        this.prisma = prisma;
    }

    public async createGuild(guildData: Partial<IGuild>): Promise<IGuild> {
        if (!guildData.name || !guildData.tag || !guildData.ownerId) {
            throw new GameError('Missing required guild data', ErrorCode.VALIDATION_ERROR, 400);
        }

        try {
            const guild = await this.prisma.guild.create({
                data: {
                    name: guildData.name,
                    tag: guildData.tag,
                    description: guildData.description,
                    ownerId: guildData.ownerId,
                    resources: { gold: 0 },
                    members: {
                        create: {
                            userId: guildData.ownerId,
                            role: 'owner'
                        }
                    }
                },
                include: {
                    members: true
                }
            });

            return this.mapPrismaGuildToIGuild(guild);
        } catch (error) {
            throw new GameError('Failed to create guild', ErrorCode.INTERNAL_SERVER_ERROR, 500, { error });
        }
    }

    public async disbandGuild(guildId: string, userId: string): Promise<void> {
        const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
        if (!guild) throw new GameError('Guild not found', ErrorCode.RESOURCE_NOT_FOUND, 404);
        if (guild.ownerId !== userId) throw new GameError('Not authorized', ErrorCode.UNAUTHORIZED, 403);

        await this.prisma.guild.delete({ where: { id: guildId } });
    }

    public async joinGuild(guildId: string, userId: string): Promise<IGuild> {
        const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
        if (!guild) throw new GameError('Guild not found', ErrorCode.RESOURCE_NOT_FOUND, 404);

        await this.prisma.guildMember.create({
            data: {
                guildId,
                userId,
                role: 'member'
            }
        });

        return this.mapPrismaGuildToIGuild(guild);
    }

    public async leaveGuild(guildId: string, userId: string): Promise<void> {
        await this.prisma.guildMember.deleteMany({
            where: {
                guildId,
                userId
            }
        });
    }

    public async kickMember(guildId: string, ownerId: string, targetUserId: string): Promise<void> {
        const guild = await this.prisma.guild.findUnique({ where: { id: guildId } });
        if (!guild) throw new GameError('Guild not found', ErrorCode.RESOURCE_NOT_FOUND, 404);
        if (guild.ownerId !== ownerId) throw new GameError('Not authorized', ErrorCode.UNAUTHORIZED, 403);

        await this.prisma.guildMember.deleteMany({
            where: {
                guildId,
                userId: targetUserId
            }
        });
    }

    public async promoteToOfficer(_guildId: string, _ownerId: string, _targetUserId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async demoteFromOfficer(_guildId: string, _ownerId: string, _targetUserId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async transferOwnership(_guildId: string, _ownerId: string, _newOwnerId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async updateGuildInfo(_guildId: string, _ownerId: string, _updates: Partial<IGuild>): Promise<IGuild> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async contributeResources(_guildId: string, _userId: string, _resources: Partial<IGuildResources>): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async upgradeTechnology(_guildId: string, _userId: string, _technologyId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async searchGuilds(query: string): Promise<Array<IGuild>> {
        const guilds = await this.prisma.guild.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { tag: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 10
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return guilds.map((g: any) => this.mapPrismaGuildToIGuild(g));
    }

    public async getGuildRankings(_category: GuildRankingCategory): Promise<Array<IGuild>> {
        const guilds = await this.prisma.guild.findMany({
            orderBy: { level: 'desc' },
            take: 10
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return guilds.map((g: any) => this.mapPrismaGuildToIGuild(g));
    }

    public async getGuild(guildId: string): Promise<IGuild> {
        const guild = await this.prisma.guild.findUnique({
            where: { id: guildId },
            include: { members: true }
        });
        if (!guild) throw new GameError('Guild not found', ErrorCode.RESOURCE_NOT_FOUND, 404);
        return this.mapPrismaGuildToIGuild(guild);
    }

    private mapPrismaGuildToIGuild(prismaGuild: {
        id: string;
        name: string;
        tag: string;
        description: string | null;
        level: number;
        experience: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resources: any;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
        members?: Array<{ userId: string; role: string }>;
    }): IGuild {
        return {
            id: prismaGuild.id,
            name: prismaGuild.name,
            tag: prismaGuild.tag,
            description: prismaGuild.description || '',
            level: prismaGuild.level,
            experience: prismaGuild.experience,
            resources: prismaGuild.resources as unknown as IGuildResources,
            members: prismaGuild.members ? prismaGuild.members.map((m) => m.userId) : [],
            officers: prismaGuild.members ? prismaGuild.members.filter((m) => m.role === 'officer').map((m) => m.userId) : [],
            ownerId: prismaGuild.ownerId,
            createdAt: prismaGuild.createdAt,
            updatedAt: prismaGuild.updatedAt,
            maxMembers: 50, // Default limit
            reputation: 0, // Not implemented yet
            technologies: [], // Map from prismaGuild.technology IDs if needed
            isRecruiting: true, // Default
            requirements: { minLevel: 0, minReputation: 0 } // Default
        };
    }
}
