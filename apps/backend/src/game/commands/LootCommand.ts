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
    IItem,
    IReward
} from '../interfaces.js';

export interface ILootParameters {
    itemId: string;
}

export class LootCommand extends BaseGameCommand {
    constructor() {
        super(
            'Loot',
            'Pick up an item from the ground',
            CommandType.LOOT,
            500,
            1
        );
    }

    // eslint-disable-next-line class-methods-use-this
    protected get commandType(): string {
        return 'loot';
    }

    // eslint-disable-next-line class-methods-use-this
    protected get requiredParameters(): Array<string> {
        return ['itemId'];
    }

    protected validateSpecificRequirements(context: IGameContext): IValidationResult {
        const errors: Array<string> = [];
        const parameters = context.parameters as ILootParameters;

        if (!context.location) {
            errors.push('You are in the void');
            return { isValid: false, errors, warnings: [], requirements: [] };
        }

        if (!parameters.itemId) {
            errors.push('No item specified to loot');
            return { isValid: false, errors, warnings: [], requirements: [] };
        }

        // Check if item exists in location
        const item = context.location.objects.find((obj) => obj.id === parameters.itemId);
        if (!item) {
            errors.push('Item not found here');
        } else if (!item.isCollectible) {
            errors.push('This object cannot be looted');
        }

        // Check inventory capacity
        if (item && (item as unknown as IItem).weight) {
            const itemWeight = (item as unknown as IItem).weight;
            if (context.character.inventory.currentWeight + itemWeight > context.character.inventory.maxCapacity) {
                errors.push('Inventory is full');
            }
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
            stamina: 5
        };
    }

    protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
        const parameters = context.parameters as ILootParameters;

        // We know item exists from validation
        const itemIndex = context.location.objects.findIndex((obj) => obj.id === parameters.itemId);
        if (itemIndex === -1) {
            throw new Error('Item disappeared');
        }

        const item = context.location.objects[itemIndex] as unknown as IItem;

        // Remove from location
        context.location.objects.splice(itemIndex, 1);

        // Create reward to add to inventory
        const rewards: Array<IReward> = [{
            type: 'item',
            amount: item.quantity || 1,
            itemId: item.id,
            item,
            description: `Looted ${item.name}`
        }];

        const logEntry: IGameLogEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            category: 'command',
            message: `Looted ${item.name}`,
            data: {
                itemId: item.id,
                itemName: item.name
            }
        };

        const notification: INotification = {
            id: uuidv4(),
            type: 'success',
            title: 'Item Looted',
            message: `You picked up ${item.name}`,
            timestamp: new Date().toISOString(),
            duration: 3000
        };

        return {
            success: true,
            commandId: this.id,
            message: `You picked up ${item.name}`,
            effects: [],
            rewards,
            logEntries: [logEntry],
            notifications: [notification]
        };
    }
}
