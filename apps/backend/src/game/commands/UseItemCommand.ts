import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult } from '../interfaces';
import { GameError, ErrorCode } from '../../errors/GameError';

export interface IUseItemParameters {
  itemId: string;
  targetId?: string;
  quantity?: number;
}

export class UseItemCommand extends BaseGameCommand {
  protected get commandType(): string {
    return 'use_item';
  }

  protected get requiredParameters(): string[] {
    return ['itemId'];
  }

  protected validate(context: IGameContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = context.parameters as IUseItemParameters;
    const character = context.session.character;

    if (!params.itemId) {
      errors.push('Item ID is required');
      return { isValid: false, errors };
    }

    // Check if character has the item
    const item = character.inventory?.find(item => item.id === params.itemId);
    if (!item) {
      errors.push('Item not found in inventory');
    } else {
      // Check quantity
      const requestedQuantity = params.quantity || 1;
      if (item.quantity < requestedQuantity) {
        errors.push(`Not enough ${item.name}. Have: ${item.quantity}, Need: ${requestedQuantity}`);
      }

      // Check if item is usable
      if (!item.usable) {
        errors.push(`${item.name} is not usable`);
      }

      // Check cooldown
      if (item.cooldown && item.lastUsed) {
        const now = Date.now();
        const cooldownEnd = new Date(item.lastUsed).getTime() + (item.cooldown * 1000);
        if (now < cooldownEnd) {
          const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
          errors.push(`${item.name} is on cooldown for ${remainingSeconds} more seconds`);
        }
      }
    }

    // If target is specified, validate it
    if (params.targetId) {
      const target = this.findTarget(context, params.targetId);
      if (!target) {
        errors.push('Target not found');
      } else {
        // Check if item can be used on this target
        const targetValidation = this.validateTargetForItem(item, character, target);
        if (!targetValidation.valid) {
          errors.push(...targetValidation.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected calculateCost(context: IGameContext): { health: number; mana: number; stamina: number } {
    const params = context.parameters as IUseItemParameters;
    const character = context.session.character;
    const item = character.inventory?.find(item => item.id === params.itemId);

    if (!item) {
      return { health: 0, mana: 0, stamina: 0 };
    }

    // Most items consume a small amount of stamina to use
    const baseStaminaCost = 1;
    const quantity = params.quantity || 1;

    return {
      health: 0,
      mana: 0,
      stamina: baseStaminaCost * quantity
    };
  }

  protected async executeLogic(context: IGameContext): Promise<ICommandResult> {
    const params = context.parameters as IUseItemParameters;
    const character = context.session.character;
    const item = character.inventory!.find(item => item.id === params.itemId)!;
    const quantity = params.quantity || 1;

    // Find target if specified
    const target = params.targetId ? this.findTarget(context, params.targetId) : character;

    // Apply item effects
    const effects = await this.applyItemEffects(item, character, target!, quantity, context);

    // Consume item (reduce quantity or remove)
    await this.consumeItem(character, item, quantity);

    // Update cooldown
    if (item.cooldown) {
      item.lastUsed = new Date();
    }

    const logEntries = [
      {
        timestamp: new Date(),
        actor: character.name,
        action: 'use_item',
        target: target?.name || 'self',
        result: `Used ${quantity} ${item.name}(s)`,
        metadata: {
          itemId: item.id,
          itemName: item.name,
          quantity,
          targetId: target?.id,
          effects: effects.appliedEffects
        }
      }
    ];

    const notifications = [
      {
        type: 'item_use' as const,
        message: effects.description,
        recipientId: character.id,
        priority: 'info' as const,
        metadata: {
          item: item.name,
          quantity,
          effects: effects.appliedEffects
        }
      }
    ];

    // Notify target if different from user
    if (target && target.id !== character.id) {
      notifications.push({
        type: 'item_used_on' as const,
        message: `${character.name} used ${item.name} on you`,
        recipientId: target.id,
        priority: 'info' as const,
        metadata: {
          usedBy: character.id,
          item: item.name,
          effects: effects.appliedEffects
        }
      });
    }

    return {
      success: true,
      data: {
        itemUsed: item.name,
        quantity,
        target: target?.name,
        effects: effects.appliedEffects,
        remainingQuantity: item.quantity
      },
      message: effects.description,
      logEntries,
      notifications
    };
  }

  private findTarget(context: IGameContext, targetId: string) {
    // Look in current location entities
    const currentLocation = context.session.character.position;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);
    
    return entities.find(entity => entity.id === targetId);
  }

  private validateTargetForItem(item: any, user: any, target: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if item can be used on others
    if (item.targetType === 'self' && target.id !== user.id) {
      errors.push('This item can only be used on yourself');
    }

    if (item.targetType === 'enemy' && target.faction === user.faction) {
      errors.push('This item can only be used on enemies');
    }

    if (item.targetType === 'ally' && target.faction !== user.faction) {
      errors.push('This item can only be used on allies');
    }

    if (target.attributes.health <= 0) {
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
  ): Promise<{ appliedEffects: any[]; description: string }> {
    const appliedEffects: any[] = [];
    let description = '';

    // Apply each effect the item has
    if (item.effects) {
      for (const effect of item.effects) {
        const result = await this.applyEffect(effect, target, quantity, context);
        appliedEffects.push(result);
      }
    }

    // Generate description based on effects
    if (appliedEffects.length === 0) {
      description = `Used ${item.name} but nothing happened.`;
    } else if (appliedEffects.length === 1) {
      description = appliedEffects[0].description;
    } else {
      description = `Used ${item.name}. Effects: ${appliedEffects.map(e => e.description).join(', ')}`;
    }

    return { appliedEffects, description };
  }

  private async applyEffect(
    effect: any,
    target: any,
    quantity: number,
    context: IGameContext
  ): Promise<{ type: string; description: string; value: number }> {
    const multiplier = quantity;
    let description = '';
    let value = 0;

    switch (effect.type) {
      case 'heal':
        value = Math.floor(effect.value * multiplier);
        const actualHeal = Math.min(value, target.attributes.maxHealth - target.attributes.health);
        target.attributes.health += actualHeal;
        description = `Restored ${actualHeal} health`;
        break;

      case 'mana_restore':
        value = Math.floor(effect.value * multiplier);
        const actualRestore = Math.min(value, target.attributes.maxMana - target.attributes.mana);
        target.attributes.mana += actualRestore;
        description = `Restored ${actualRestore} mana`;
        break;

      case 'buff':
        value = effect.value * multiplier;
        // Apply buff to target (this would typically add a status effect)
        if (!target.buffs) target.buffs = [];
        target.buffs.push({
          type: effect.subtype,
          value: value,
          duration: effect.duration || 300, // 5 minutes default
          appliedAt: Date.now()
        });
        description = `Applied ${effect.subtype} buff (+${value})`;
        break;

      case 'teleport':
        if (effect.location) {
          target.position = { ...effect.location };
          description = `Teleported to ${effect.location.name || 'new location'}`;
        }
        break;

      default:
        description = `Unknown effect: ${effect.type}`;
    }

    return { type: effect.type, description, value };
  }

  private async consumeItem(character: any, item: any, quantity: number): Promise<void> {
    item.quantity -= quantity;
    
    if (item.quantity <= 0) {
      // Remove item from inventory
      const index = character.inventory.indexOf(item);
      if (index > -1) {
        character.inventory.splice(index, 1);
      }
    }
  }
}