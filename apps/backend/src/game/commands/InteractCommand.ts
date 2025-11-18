import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult } from '../interfaces';
import { GameError, ErrorCode } from '../../errors/GameError';

export interface IInteractParameters {
  targetId: string;
  interactionType: 'talk' | 'trade' | 'examine' | 'pickpocket' | 'intimidate' | 'persuade' | 'help';
  dialogueOption?: string;
  tradeOffer?: {
    items: Array<{ itemId: string; quantity: number }>;
    gold: number;
  };
}

export class InteractCommand extends BaseGameCommand {
  protected get commandType(): string {
    return 'interact';
  }

  protected get requiredParameters(): string[] {
    return ['targetId', 'interactionType'];
  }

  protected validate(context: IGameContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = context.parameters as IInteractParameters;
    const character = context.session.character;

    if (!params.targetId) {
      errors.push('Target ID is required');
    }

    if (!params.interactionType) {
      errors.push('Interaction type is required');
    } else {
      const validTypes = ['talk', 'trade', 'examine', 'pickpocket', 'intimidate', 'persuade', 'help'];
      if (!validTypes.includes(params.interactionType)) {
        errors.push(`Invalid interaction type. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    // Find and validate target
    const target = params.targetId ? this.findTarget(context, params.targetId) : null;
    if (!target) {
      errors.push('Target not found or not in range');
    } else {
      // Validate interaction based on target type and state
      const interactionValidation = this.validateInteraction(target, params.interactionType, character);
      if (!interactionValidation.valid) {
        errors.push(...interactionValidation.errors);
      }

      // Special validations for specific interaction types
      switch (params.interactionType) {
        case 'trade':
          if (!target.canTrade) {
            errors.push('This target cannot trade');
          }
          if (params.tradeOffer && !this.validateTradeOffer(params.tradeOffer, character)) {
            errors.push('Invalid trade offer');
          }
          break;

        case 'pickpocket':
          if (target.faction === character.faction && target.faction !== 'neutral') {
            errors.push('Cannot pickpocket allies');
          }
          if (character.attributes.dexterity < 12) {
            errors.push('Need at least 12 dexterity for pickpocketing');
          }
          break;

        case 'intimidate':
        case 'persuade':
          if (target.attributes.health <= 0) {
            errors.push('Cannot use social skills on dead targets');
          }
          break;
      }
    }

    // Character state validations
    if (character.attributes.health <= 0) {
      errors.push('Cannot interact while dead');
    }

    if (character.status?.includes('stunned')) {
      errors.push('Cannot interact while stunned');
    }

    if (character.status?.includes('silenced') && ['talk', 'persuade', 'intimidate'].includes(params.interactionType)) {
      errors.push('Cannot speak while silenced');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected calculateCost(context: IGameContext): { health: number; mana: number; stamina: number } {
    const params = context.parameters as IInteractParameters;
    
    let staminaCost = 2; // Base cost
    let manaCost = 0;

    switch (params.interactionType) {
      case 'trade':
        staminaCost = 1;
        break;
      case 'examine':
        staminaCost = 1;
        manaCost = 2; // Requires concentration
        break;
      case 'pickpocket':
        staminaCost = 8;
        manaCost = 3; // Requires focus
        break;
      case 'intimidate':
      case 'persuade':
        staminaCost = 4;
        manaCost = 5; // Requires mental effort
        break;
      case 'help':
        staminaCost = 3;
        manaCost = 1;
        break;
    }

    return {
      health: 0,
      mana: manaCost,
      stamina: staminaCost
    };
  }

  protected async executeLogic(context: IGameContext): Promise<ICommandResult> {
    const params = context.parameters as IInteractParameters;
    const character = context.session.character;
    const target = this.findTarget(context, params.targetId)!;

    // Execute the specific interaction
    let interactionResult: any;
    let experienceGained = 0;

    switch (params.interactionType) {
      case 'talk':
        interactionResult = await this.executeTalk(character, target, params.dialogueOption);
        break;

      case 'trade':
        interactionResult = await this.executeTrade(character, target, params.tradeOffer);
        break;

      case 'examine':
        interactionResult = await this.executeExamine(character, target);
        experienceGained = 5;
        break;

      case 'pickpocket':
        const pickpocketResult = await this.executePickpocket(character, target, context);
        interactionResult = pickpocketResult.result;
        experienceGained = pickpocketResult.success ? 25 : 0;
        break;

      case 'intimidate':
        const intimidateResult = await this.executeSocialSkill(character, target, 'intimidate');
        interactionResult = intimidateResult.result;
        experienceGained = intimidateResult.success ? 15 : 5;
        break;

      case 'persuade':
        const persuadeResult = await this.executeSocialSkill(character, target, 'persuade');
        interactionResult = persuadeResult.result;
        experienceGained = persuadeResult.success ? 15 : 5;
        break;

      case 'help':
        interactionResult = await this.executeHelp(character, target);
        experienceGained = 10;
        break;
    }

    // Award experience for social interactions
    if (experienceGained > 0) {
      character.experience = (character.experience || 0) + experienceGained;
    }

    const logEntries = [
      {
        timestamp: new Date(),
        actor: character.name,
        action: 'interact',
        target: target.name,
        result: `Used ${params.interactionType} interaction`,
        metadata: {
          interactionType: params.interactionType,
          targetId: target.id,
          targetType: target.type,
          success: interactionResult.success,
          experienceGained,
          staminaCost: this.calculateCost(context).stamina,
          manaCost: this.calculateCost(context).mana
        }
      }
    ];

    const notifications = [
      {
        type: 'interaction' as const,
        message: interactionResult.message,
        recipientId: character.id,
        priority: interactionResult.success ? 'info' : 'warning' as const,
        metadata: {
          interactionType: params.interactionType,
          target: target.name,
          success: interactionResult.success,
          rewards: interactionResult.rewards,
          experienceGained
        }
      }
    ];

    // Notify target for certain interactions
    if (['talk', 'trade', 'intimidate', 'persuade', 'help'].includes(params.interactionType)) {
      notifications.push({
        type: 'interacted_with' as const,
        message: `${character.name} interacted with you using ${params.interactionType}`,
        recipientId: target.id,
        priority: ['intimidate'].includes(params.interactionType) ? 'warning' : 'info' as const,
        metadata: {
          interactor: character.id,
          interactionType: params.interactionType,
          success: interactionResult.success
        }
      });
    }

    return {
      success: interactionResult.success,
      data: {
        interactionType: params.interactionType,
        target: target.name,
        result: interactionResult.data,
        rewards: interactionResult.rewards,
        experienceGained,
        staminaCost: this.calculateCost(context).stamina,
        manaCost: this.calculateCost(context).mana
      },
      message: interactionResult.message,
      logEntries,
      notifications
    };
  }

  private findTarget(context: IGameContext, targetId: string) {
    const currentLocation = context.session.character.position;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);
    return entities.find(entity => entity.id === targetId && entity.interactable !== false);
  }

  private validateInteraction(target: any, interactionType: string, character: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (target.attributes?.health <= 0 && !['examine'].includes(interactionType)) {
      errors.push('Cannot interact with dead targets');
    }

    if (target.interactable === false) {
      errors.push('This target cannot be interacted with');
    }

    if (interactionType === 'trade' && !target.canTrade) {
      errors.push('This target cannot trade');
    }

    if (interactionType === 'talk' && target.type === 'creature' && !target.canSpeak) {
      errors.push('This creature cannot speak');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateTradeOffer(offer: any, character: any): boolean {
    if (!offer || !offer.items || !Array.isArray(offer.items)) {
      return false;
    }

    // Check if character has all offered items
    for (const offeredItem of offer.items) {
      const item = character.inventory?.find(item => item.id === offeredItem.itemId);
      if (!item || item.quantity < offeredItem.quantity) {
        return false;
      }
    }

    // Check if character has enough gold
    if (offer.gold > (character.gold || 0)) {
      return false;
    }

    return true;
  }

  private async executeTalk(character: any, target: any, dialogueOption?: string): Promise<any> {
    if (!target.dialogue) {
      return {
        success: true,
        message: `${target.name} doesn't have much to say.`,
        data: { response: 'No significant dialogue available.' }
      };
    }

    // Simple dialogue system - in a real implementation, this would be much more complex
    const responses = target.dialogue.responses || [];
    let response = responses[0] || { text: `${target.name} nods politely.`, type: 'neutral' };

    if (dialogueOption && target.dialogue.options) {
      const selectedOption = target.dialogue.options.find((opt: any) => opt.id === dialogueOption);
      if (selectedOption) {
        response = selectedOption.response || response;
      }
    }

    // Update relationship based on dialogue
    if (target.relationship !== undefined) {
      const relationshipChange = response.type === 'friendly' ? 1 : response.type === 'hostile' ? -1 : 0;
      target.relationship += relationshipChange;
    }

    return {
      success: true,
      message: response.text,
      data: { 
        response: response.text,
        relationshipChange: response.type === 'friendly' ? 1 : response.type === 'hostile' ? -1 : 0
      }
    };
  }

  private async executeTrade(character: any, target: any, tradeOffer?: any): Promise<any> {
    if (!tradeOffer) {
      // Just opening trade window - show what target has to offer
      const availableItems = target.inventory?.slice(0, 10) || [];
      return {
        success: true,
        message: `You open trade with ${target.name}.`,
        data: { 
          availableItems,
          targetGold: target.gold || 0,
          targetName: target.name
        }
      };
    }

    // Process actual trade
    // This is simplified - in a real implementation, you'd have complex trade logic
    const tradeSuccess = Math.random() > 0.2; // 80% success rate for now

    if (tradeSuccess) {
      // Remove items from character
      for (const offeredItem of tradeOffer.items) {
        const item = character.inventory.find(item => item.id === offeredItem.itemId);
        if (item) {
          item.quantity -= offeredItem.quantity;
          if (item.quantity <= 0) {
            character.inventory.splice(character.inventory.indexOf(item), 1);
          }
        }
      }

      // Remove gold from character
      character.gold = (character.gold || 0) - tradeOffer.gold;

      // Add items to character (simulate receiving items)
      const receivedItems = [{ id: 'traded_item', name: 'Mysterious Trinket', quantity: 1 }];
      character.inventory.push(...receivedItems);

      return {
        success: true,
        message: `Trade with ${target.name} completed successfully!`,
        data: { receivedItems },
        rewards: { items: receivedItems }
      };
    } else {
      return {
        success: false,
        message: `${target.name} rejected your trade offer.`,
        data: { reason: 'Offer not acceptable' }
      };
    }
  }

  private async executeExamine(character: any, target: any): Promise<any> {
    const examination = {
      name: target.name,
      type: target.type,
      level: target.level || 'Unknown',
      health: target.attributes?.health || 'Unknown',
      maxHealth: target.attributes?.maxHealth || 'Unknown',
      description: target.description || 'No detailed description available.',
      equipment: target.equipment || {},
      status: target.status || [],
      relationship: target.relationship || 0
    };

    return {
      success: true,
      message: `You examine ${target.name} carefully.`,
      data: examination
    };
  }

  private async executePickpocket(character: any, target: any, context: IGameContext): Promise<any> {
    // Calculate success chance based on dexterity and target awareness
    const baseChance = 30;
    const dexterityBonus = (character.attributes.dexterity - 10) * 2;
    const levelPenalty = Math.max(0, (target.level || 1) - character.level) * 5;
    const awarenessPenalty = target.status?.includes('alert') ? 20 : 0;
    
    const successChance = Math.max(5, Math.min(95, baseChance + dexterityBonus - levelPenalty - awarenessPenalty));
    const success = Math.random() * 100 < successChance;

    if (success) {
      // Determine what was stolen
      const possibleItems = target.inventory?.slice(0, 3) || [];
      const stolenItem = possibleItems.length > 0 ? possibleItems[Math.floor(Math.random() * possibleItems.length)] : null;
      const goldStolen = Math.floor((target.gold || 0) * 0.1);

      if (stolenItem) {
        character.inventory.push({ ...stolenItem, quantity: 1 });
        // Remove from target
        const targetItem = target.inventory.find((item: any) => item.id === stolenItem.id);
        if (targetItem && targetItem.quantity > 0) {
          targetItem.quantity--;
          if (targetItem.quantity === 0) {
            target.inventory.splice(target.inventory.indexOf(targetItem), 1);
          }
        }
      }

      if (goldStolen > 0) {
        character.gold = (character.gold || 0) + goldStolen;
        target.gold = (target.gold || 0) - goldStolen;
      }

      return {
        success: true,
        result: {
          success: true,
          message: `You successfully pickpocketed ${target.name}!`,
          stolenItem,
          goldStolen
        }
      };
    } else {
      // Failed - target becomes hostile
      if (target.relationship !== undefined) {
        target.relationship = Math.max(-100, target.relationship - 20);
      }
      if (!target.status) target.status = [];
      target.status.push('hostile');

      return {
        success: false,
        result: {
          success: false,
          message: `You failed to pickpocket ${target.name}! They noticed you!`,
          targetNowHostile: true
        }
      };
    }
  }

  private async executeSocialSkill(character: any, target: any, skillType: 'intimidate' | 'persuade'): Promise<any> {
    const baseChance = 50;
    const charismaBonus = (character.attributes.charisma - 10) * 2;
    const levelBonus = Math.max(0, character.level - (target.level || 1)) * 3;
    const relationshipBonus = target.relationship ? Math.floor(target.relationship / 10) : 0;
    
    const successChance = Math.max(10, Math.min(90, baseChance + charismaBonus + levelBonus + relationshipBonus));
    const success = Math.random() * 100 < successChance;

    if (success) {
      // Apply success effects
      const relationshipChange = skillType === 'persuade' ? 10 : -5;
      if (target.relationship !== undefined) {
        target.relationship += relationshipChange;
      }

      const successMessage = skillType === 'persuade' 
        ? `You successfully persuaded ${target.name}!` 
        : `You successfully intimidated ${target.name}!`;

      return {
        success: true,
        result: {
          success: true,
          message: successMessage,
          relationshipChange,
          targetMoreCooperative: true
        }
      };
    } else {
      // Apply failure effects
      const relationshipChange = skillType === 'persuade' ? -5 : -15;
      if (target.relationship !== undefined) {
        target.relationship += relationshipChange;
      }

      const failureMessage = skillType === 'persuade' 
        ? `${target.name} wasn't persuaded by your words.` 
        : `${target.name} wasn't intimidated by your threats.`;

      return {
        success: false,
        result: {
          success: false,
          message: failureMessage,
          relationshipChange,
          targetLessCooperative: true
        }
      };
    }
  }

  private async executeHelp(character: any, target: any): Promise<any> {
    if (target.attributes?.health <= 0) {
      return {
        success: false,
        message: `${target.name} is beyond help.`,
        data: { reason: 'target_dead' }
      };
    }

    if (target.status?.includes('wounded')) {
      // Provide basic first aid
      const healingAmount = 10 + Math.floor(character.attributes.wisdom / 2);
      target.attributes.health = Math.min(target.attributes.maxHealth, target.attributes.health + healingAmount);
      
      // Remove wounded status
      target.status = target.status.filter((status: string) => status !== 'wounded');

      return {
        success: true,
        message: `You helped ${target.name} recover from their wounds.`,
        data: { healingAmount, statusRemoved: 'wounded' },
        rewards: { relationshipChange: 15 }
      };
    }

    if (target.type === 'merchant' && target.needsHelp) {
      return {
        success: true,
        message: `${target.name} appreciates your offer to help.`,
        data: { helpOffered: true },
        rewards: { relationshipChange: 5, discount: 0.1 }
      };
    }

    return {
      success: true,
      message: `${target.name} doesn't need help right now.`,
      data: { noHelpNeeded: true }
    };
  }
}