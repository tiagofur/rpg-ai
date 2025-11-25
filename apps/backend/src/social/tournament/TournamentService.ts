/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
/* eslint-disable unicorn/prefer-event-target */
import { EventEmitter } from 'node:events';
import {
    ITournamentService,
    ITournament
} from '../interfaces/IChat.js';
import { IRedisClient } from '../../cache/interfaces/IRedisClient.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';
import { ILogger } from '../../logging/interfaces/ILogger.js';

export class TournamentService extends EventEmitter implements ITournamentService {
    public constructor(
        _redis: IRedisClient,
        _logger: ILogger
    ) {
        super();
    }

    public async createTournament(_tournamentData: Partial<ITournament>): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async joinTournament(_tournamentId: string, _userId: string): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async leaveTournament(_tournamentId: string, _userId: string): Promise<void> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async startTournament(_tournamentId: string, _userId: string): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async endTournament(_tournamentId: string, _userId: string): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async updateMatchResult(_tournamentId: string, _matchId: string, _winnerId: string, _score?: string): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async getTournament(_tournamentId: string): Promise<ITournament> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async getActiveTournaments(): Promise<Array<ITournament>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async getUpcomingTournaments(): Promise<Array<ITournament>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async getUserTournaments(_userId: string): Promise<Array<ITournament>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }

    public async searchTournaments(_query: string): Promise<Array<ITournament>> {
        throw new GameError('Method not implemented.', ErrorCode.INTERNAL_SERVER_ERROR, 501);
    }
}
