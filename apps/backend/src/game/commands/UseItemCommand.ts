import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, ICommandCost, IValidationResult, IGameLogEntry, INotification, LogLevel, EffectType, IGameEffect, CommandType } from '../interfaces.js';

export interface IUseItemParameters {
  itemId: string;
  targetId?: string;
  quantity?: number;
}

export class UseItemCommand extends BaseGameCommand {
  constructor() {
    super(
      'Use Item',
      'Use an item from inventory',
      CommandType.USE_ITEM,
      1000, // 1 second cooldown
      1
    );
  }

  protected get commandType(): string {
    return 'use_item';
  }

  protected get requiredParameters(): Array<string> {
    return ['itemId'];
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const parameters = context.parameters as IUseItemParameters;
    const {character} = context;

    if (!parameters.itemId) {
      errors.push('Item ID is required');
      return { isValid: false, errors, warnings: [], requirements: [] };
    }

    // Check if character has the item
    const item = character.inventory.items.find((index: any) => index.id === parameters.itemId);
    if (item) {
      // Check quantity
      const requestedQuantity = parameters.quantity || 1;
      if (item.quantity < requestedQuantity) {
        errors.push(`Not enough ${item.name}. Have: ${item.quantity}, Need: ${requestedQuantity}`);
      }

      // Check if item is usable (has effects or script)
      if ((!item.effects || item.effects.length === 0) && !item.script) {
        errors.push(`${item.name} is not usable`);
      }
    } else {
      errors.push('Item not found in inventory');
    }

    // If target is specified, validate it
    if (parameters.targetId) {
      const target = this.findTarget(context, parameters.targetId);
      if (target) {
        // Check if item can be used on this target
        if (item) {
          const targetValidation = this.validateTargetForItem(item, character, target);
          if (!targetValidation.valid) {
            errors.push(...targetValidation.errors);
          }
        }
      } else {
        errors.push('Target not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      requirements: []
    };
  }

  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const parameters = context.parameters as IUseItemParameters;
    const {character} = context;
    const item = character.inventory.items.find((index: any) => index.id === parameters.itemId);

    if (!item) {
      return { health: 0, mana: 0, stamina: 0 };
    }

    // Most items consume a small amount of stamina to use
    const baseStaminaCost = 1;
    const quantity = parameters.quantity || 1;

    return {
      health: 0,
      mana: 0,
      stamina: baseStaminaCost * quantity
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const parameters = context.parameters as IUseItemParameters;
    const {character} = context;
    const item = character.inventory.items.find((index: any) => index.id === parameters.itemId)!;
    const quantity = parameters.quantity || 1;

    // Find target if specified
    const target = parameters.targetId ? this.findTarget(context, parameters.targetId) : character;

    // Apply item effects
    const effects = await this.applyItemEffects(item, character, target, quantity, context);

    // Consume item (reduce quantity or remove)
    await this.consumeItem(character, item, quantity);

    const logEntry: IGameLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'command',
      message: `Used ${quantity} ${item.name}(s)`,
      data: {
        itemId: item.id,
        itemName: item.name,
        quantity,
        targetId: target?.id,
        effects: effects.appliedEffects
      }
    };

    const notifications: Array<INotification> = [
      {
        id: uuidv4(),
        type: 'info',
        title: 'Item Used',
        message: effects.description,
        timestamp: new Date().toISOString(),
        duration: 3000
      }
    ];

    // Notify target if different from user
    if (target && target.id !== character.id) {
      notifications.push({
        id: uuidv4(),
        type: 'info',
        title: 'Item Used On You',
        message: `${character.name} used ${item.name} on you`,
        timestamp: new Date().toISOString(),
        duration: 3000
      });
    }

    return {
      success: true,
      commandId: this.id,
      message: effects.description,
      effects: effects.appliedEffects,
      rewards: [],
      experienceGained: 0,
      logEntries: [logEntry],
      notifications
    };
  }

  private findTarget(context: IGameContext, targetId: string) {
    // Look in current location entities
    if (!context.services?.worldService) return;
    const currentLocation = context.character.position;
    if (!currentLocation) return;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);

    return entities.find((entity: any) => entity.id === targetId);
  }

  private validateTargetForItem(_item: any, _user: any, target: any): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    if (target.health && target.health.current <= 0) {
      errors.push('Cannot use items on dead targets');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async applyItemEffects(
    item: any,
    user: any,
    target: any,
    quantity: number,
    context: IGameContext
  ): Promise<{ appliedEffects: Array<IGameEffect>; description: string }> {
    const appliedEffects: Array<IGameEffect> = [];
    let description = '';

    // Apply each effect the item has
    if (item.effects) {
      for (const effect of item.effects) {
        const result = await this.applyEffect(effect, target, quantity, context, user);
        if (result.effect) {
          appliedEffects.push(result.effect);
        }
        if (description) description += ', ';
        description += result.description;
      }
    }

    // Generate description based on effects
    if (appliedEffects.length === 0 && !description) {
      description = `Used ${item.name} but nothing happened.`;
    } else if (!description) {
      description = `Used ${item.name}.`;
    }

    return { appliedEffects, description };
  }

  private async applyEffect(
    effect: any,
    target: any,
    quantity: number,
    _context: IGameContext,
    user: any
  ): Promise<{ effect: IGameEffect | undefined; description: string; value: number }> {
    const multiplier = quantity;
    let description = '';
    let value = 0;
    let gameEffect: IGameEffect | undefined;

    switch (effect.type) {
      case 'heal': {
        value = Math.floor((effect.magnitude || 0) * multiplier);
        description = `Restored ${value} health`;

        gameEffect = {
          id: uuidv4(),
          name: 'Item Heal',
          description,
          type: EffectType.HEAL_OVER_TIME, // Instant heal
          duration: 0,
          remainingDuration: 0,
          magnitude: value,
          isStackable: false,
          maxStacks: 1,
          currentStacks: 1,
          sourceId: user.id,
          targetId: target.id
        };
        break;
      }

      case 'mana_restore': {
        value = Math.floor((effect.magnitude || 0) * multiplier);
        description = `Restored ${value} mana`;

        gameEffect = {
          id: uuidv4(),
          name: 'Item Mana Restore',
          description,
          type: EffectType.BUFF, // Or custom type
          duration: 0,
          remainingDuration: 0,
          magnitude: value,
          isStackable: false,
          maxStacks: 1,
          currentStacks: 1,
          sourceId: user.id,
          targetId: target.id
        };
        break;
      }

      case 'buff': {
        value = (effect.magnitude || 0) * multiplier;
        description = `Applied ${effect.name || 'buff'} (+${value})`;

        gameEffect = {
          id: uuidv4(),
          name: effect.name || 'Item Buff',
          description,
          type: EffectType.BUFF,
          duration: effect.duration || 300_000,
          remainingDuration: effect.duration || 300_000,
          magnitude: value,
          isStackable: true,
          maxStacks: 5,
          currentStacks: 1,
          sourceId: user.id,
          targetId: target.id
        };
        break;
      }

      case 'teleport': {
        if (effect.metadata?.location) {
          description = `Teleported to ${effect.metadata.location.name || 'new location'}`;
        }
        break;
      }

      default: {
        description = `Unknown effect: ${effect.type}`;
      }
    }

    return { effect: gameEffect, description, value };
  }

  private async consumeItem(_character: any, _item: any, _quantity: number): Promise<void> {
    // In a real system, we would return a state change to update inventory
  }
}