/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
/* eslint-disable unicorn/prefer-event-target */
import { EventEmitter } from 'node:events';
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
    public constructor(
        _redis: IRedisClient,
        _logger: ILogger
    ) {
        super();
    }

    public async createGuild(_guildData: Partial<IGuild>): Promise<IGuild> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async disbandGuild(_guildId: string, _userId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async joinGuild(_guildId: string, _userId: string): Promise<IGuild> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async leaveGuild(_guildId: string, _userId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async kickMember(_guildId: string, _ownerId: string, _targetUserId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
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

    public async searchGuilds(_query: string): Promise<Array<IGuild>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async getGuildRankings(_category: GuildRankingCategory): Promise<Array<IGuild>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }
}
