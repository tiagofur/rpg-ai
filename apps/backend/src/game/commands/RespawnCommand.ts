import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import {
    IGameContext,
    ICommandResult,
    IValidationResult,
    ICommandCost,
    IGameLogEntry,
    INotification,
    LogLevel,
    CommandType,
    EffectType
} from '../interfaces.js';

export class RespawnCommand extends BaseGameCommand {
    constructor() {
        super(
            'Respawn',
            'Return to life at the nearest safe location',
            CommandType.RESPAWN,
            5000, // 5 seconds cooldown
            1
        );
    }

    protected get commandType(): string {
        return 'respawn';
    }

    protected validateSpecificRequirements(context: IGameContext): IValidationResult {
        const errors: Array<string> = [];

        if (!context.session?.character) {
            return { isValid: false, errors: ['No character found'], warnings: [], requirements: [] };
        }

        // Can only respawn if dead
        if (context.session.character.health.current > 0) {
            errors.push('You are not dead yet!');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: [],
            requirements: []
        };
    }

    protected calculateBaseCost(_context: IGameContext): ICommandCost {
        return {
            // Free for now
        };
    }

    protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
        const character = context.session!.character;

        const maxHealth = character.health.maximum;
        const healAmount = maxHealth; // Full heal

        const logEntries: Array<IGameLogEntry> = [{
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            category: 'system',
            message: `${character.name} has been resurrected.`
        }];

        const notifications: Array<INotification> = [{
            id: uuidv4(),
            type: 'success',
            title: 'Resurrected',
            message: 'You have returned to life!',
            timestamp: new Date().toISOString(),
            duration: 5000
        }];

        const healEffect = {
            id: uuidv4(),
            name: 'Resurrection',
            description: 'Restored to life',
            type: EffectType.HEAL,
            duration: 0,
            remainingDuration: 0,
            magnitude: healAmount,
            isStackable: false,
            maxStacks: 1,
            currentStacks: 1,
            sourceId: character.id,
            targetId: character.id
        };

        return {
            success: true,
            commandId: this.id,
            message: 'You have been resurrected.',
            effects: [healEffect],
            rewards: [],
            experienceGained: 0,
            logEntries,
            notifications
        };
    }
}
