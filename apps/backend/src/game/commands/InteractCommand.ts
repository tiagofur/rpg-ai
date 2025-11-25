import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import {
  IGameContext,
  ICommandResult,
  ICommandCost,
  IValidationResult,
  IGameLogEntry,
  INotification,
  LogLevel,
  CommandType,
  ICharacter,
  IGameEntity
} from '../interfaces.js';

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
  constructor() {
    super(
      'Interact',
      'Interact with an entity or object',
      CommandType.INTERACT,
      1000, // 1 second cooldown
      1
    );
  }

  // eslint-disable-next-line class-methods-use-this
  protected get commandType(): string {
    return 'interact';
  }

  // eslint-disable-next-line class-methods-use-this
  protected get requiredParameters(): Array<string> {
    return ['targetId', 'interactionType'];
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const parameters = context.parameters as IInteractParameters;

    if (!context.session?.character) {
      return { isValid: false, errors: ['No active character session'], warnings: [], requirements: [] };
    }
    const { character } = context.session;

    if (!parameters.targetId) {
      errors.push('Target ID is required');
    }

    if (parameters.interactionType) {
      const validTypes = ['talk', 'trade', 'examine', 'pickpocket', 'intimidate', 'persuade', 'help'];
      if (!validTypes.includes(parameters.interactionType)) {
        errors.push(`Invalid interaction type. Must be one of: ${validTypes.join(', ')}`);
      }
    } else {
      errors.push('Interaction type is required');
    }

    // Find and validate target
    const target = parameters.targetId ? this.findTarget(context, parameters.targetId) : undefined;
    if (target) {
      // Validate interaction based on target type and state
      const interactionValidation = this.validateInteraction(target, parameters.interactionType, character);
      if (!interactionValidation.valid) {
        errors.push(...interactionValidation.errors);
      }

      // Special validations for specific interaction types
      this.validateSpecificInteractionType(parameters, target, character, errors);
    } else {
      errors.push('Target not found or not in range');
    }

    // Character state validations
    if (character.health.current <= 0) {
      errors.push('Cannot interact while dead');
    }

    if (character.status?.includes('stunned')) {
      errors.push('Cannot interact while stunned');
    }

    if (character.status?.includes('silenced') && ['talk', 'persuade', 'intimidate'].includes(parameters.interactionType)) {
      errors.push('Cannot speak while silenced');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      requirements: []
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private validateSpecificInteractionType(parameters: IInteractParameters, target: any, character: ICharacter, errors: Array<string>): void {
    switch (parameters.interactionType) {
      case 'trade': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!target.canTrade) {
          errors.push('This target cannot trade');
        }
        if (parameters.tradeOffer && !this.validateTradeOffer(parameters.tradeOffer, character)) {
          errors.push('Invalid trade offer');
        }
        break;
      }

      case 'pickpocket': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (target.faction === character.faction && target.faction !== 'neutral') {
          errors.push('Cannot pickpocket allies');
        }
        if (character.attributes.dexterity < 12) {
          errors.push('Need at least 12 dexterity for pickpocketing');
        }
        break;
      }

      case 'intimidate':
      case 'persuade': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (target.health && target.health.current <= 0) {
          errors.push('Cannot use social skills on dead targets');
        }
        break;
      }

      default: {
        break;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const parameters = context.parameters as IInteractParameters;

    let staminaCost = 2; // Base cost
    let manaCost = 0;

    switch (parameters.interactionType) {
      case 'trade': {
        staminaCost = 1;
        break;
      }
      case 'examine': {
        staminaCost = 1;
        manaCost = 2; // Requires concentration
        break;
      }
      case 'pickpocket': {
        staminaCost = 8;
        manaCost = 3; // Requires focus
        break;
      }
      case 'intimidate':
      case 'persuade': {
        staminaCost = 4;
        manaCost = 5; // Requires mental effort
        break;
      }
      case 'help': {
        staminaCost = 3;
        manaCost = 1;
        break;
      }
      default: {
        break;
      }
    }

    return {
      health: 0,
      mana: manaCost,
      stamina: staminaCost
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const parameters = context.parameters as IInteractParameters;

    if (!context.session?.character) {
      throw new Error('No active character session');
    }
    const { character } = context.session;

    const target = this.findTarget(context, parameters.targetId)!;

    // Execute the specific interaction
    const { interactionResult, experienceGained } = await this.performInteraction(parameters, character, target, context);

    const logEntry: IGameLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'command',
      message: `Used ${parameters.interactionType} interaction on ${target.name}`,
      data: {
        interactionType: parameters.interactionType,
        targetId: target.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        targetType: target.type,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        success: interactionResult.success,
        experienceGained,
        staminaCost: this.calculateBaseCost(context).stamina,
        manaCost: this.calculateBaseCost(context).mana
      }
    };

    const notifications: Array<INotification> = [
      {
        id: uuidv4(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        type: interactionResult.success ? 'info' : 'warning',
        title: 'Interaction Result',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: interactionResult.message,
        timestamp: new Date().toISOString(),
        duration: 5000
      }
    ];

    // Notify target for certain interactions
    if (['talk', 'trade', 'intimidate', 'persuade', 'help'].includes(parameters.interactionType)) {
      notifications.push({
        id: uuidv4(),
        type: ['intimidate'].includes(parameters.interactionType) ? 'warning' : 'info',
        title: 'Interaction Received',
        message: `${character.name} interacted with you using ${parameters.interactionType}`,
        timestamp: new Date().toISOString(),
        duration: 5000
      });
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      success: interactionResult.success,
      commandId: this.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      message: interactionResult.message,
      effects: [],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      rewards: interactionResult.rewards ? [interactionResult.rewards] : [],
      experienceGained,
      logEntries: [logEntry],
      notifications
    };
  }

  private async performInteraction(parameters: IInteractParameters, character: ICharacter, target: any, context: IGameContext): Promise<{ interactionResult: any; experienceGained: number }> {
    let interactionResult: any;
    let experienceGained = 0;

    switch (parameters.interactionType) {
      case 'talk': {
        interactionResult = await this.executeTalk(character, target, parameters.dialogueOption);
        break;
      }

      case 'trade': {
        interactionResult = await this.executeTrade(character, target, parameters.tradeOffer);
        break;
      }

      case 'examine': {
        interactionResult = await this.executeExamine(character, target);
        experienceGained = 5;
        break;
      }

      case 'pickpocket': {
        const pickpocketResult = await this.executePickpocket(character, target, context);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        interactionResult = pickpocketResult.result;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        experienceGained = pickpocketResult.success ? 25 : 0;
        break;
      }

      case 'intimidate': {
        const intimidateResult = await this.executeSocialSkill(character, target, 'intimidate');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        interactionResult = intimidateResult.result;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        experienceGained = intimidateResult.success ? 15 : 5;
        break;
      }

      case 'persuade': {
        const persuadeResult = await this.executeSocialSkill(character, target, 'persuade');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        interactionResult = persuadeResult.result;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        experienceGained = persuadeResult.success ? 15 : 5;
        break;
      }

      case 'help': {
        interactionResult = await this.executeHelp(character, target);
        experienceGained = 10;
        break;
      }

      default: {
        interactionResult = { success: false, message: 'Unknown interaction type' };
      }
    }

    return { interactionResult, experienceGained };
  }

  // eslint-disable-next-line class-methods-use-this
  private findTarget(context: IGameContext, targetId: string): IGameEntity | undefined {
    // Buscar en las entidades del estado del juego
    if (context.gameState && context.gameState.entities) {
      const entity = context.gameState.entities[targetId];
      if (entity) {
        // Check if entity is at the same location as character
        // This is a bit tricky because entities map contains ALL entities.
        // We should check if the entity is in the current location's characters or objects list.
        // But for now, let's assume if we have the ID and it's in entities, we can interact if it's close enough (logic to be added if needed).
        // Actually, GameEngine puts entities in location.characters or location.objects.
        // We can check context.location.characters or context.location.objects.

        if (context.location) {
          const inLocation = context.location.characters.includes(targetId) ||
            context.location.objects.some(obj => obj.id === targetId);

          if (inLocation) {
            // Return the entity wrapper, but InteractCommand expects the data inside usually?
            // The original code returned 'entity' from getEntitiesAtLocation which likely returned the data object or the wrapper.
            // InteractCommand casts it to 'any' and accesses properties like 'health', 'interactable'.
            // So it expects the data object.
            return entity.data as unknown as IGameEntity; // Cast to IGameEntity but it's actually the data object (ICharacter or IGameObject)
          }
        }
      }
    }
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  private validateInteraction(target: any, interactionType: string, _character: any): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.health && target.health.current <= 0 && !['examine'].includes(interactionType)) {
      errors.push('Cannot interact with dead targets');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.interactable === false) {
      errors.push('This target cannot be interacted with');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (interactionType === 'trade' && !target.canTrade) {
      errors.push('This target cannot trade');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (interactionType === 'talk' && target.type === 'creature' && !target.canSpeak) {
      errors.push('This creature cannot speak');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private validateTradeOffer(offer: any, character: ICharacter): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!offer || !offer.items || !Array.isArray(offer.items)) {
      return false;
    }

    // Check if character has all offered items
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    for (const offeredItem of offer.items) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const item = character.inventory?.items?.find((index) => index.id === offeredItem.itemId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!item || item.quantity < offeredItem.quantity) {
        return false;
      }
    }

    // Check if character has enough gold
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (offer.gold > (character.inventory?.gold || 0)) {
      return false;
    }

    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  private async executeTalk(_character: any, target: any, dialogueOption?: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!target.dialogue) {
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `${target.name} doesn't have much to say.`,
        data: { response: 'No significant dialogue available.' }
      };
    }

    // Simple dialogue system - in a real implementation, this would be much more complex
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const responses = (target.dialogue.responses || []) as Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let response = responses[0] || { text: `${target.name} nods politely.`, type: 'neutral' };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dialogueOption && target.dialogue.options) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const selectedOption = target.dialogue.options.find((opt: any) => opt.id === dialogueOption);
      if (selectedOption) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response = selectedOption.response || response;
      }
    }

    // Update relationship based on dialogue
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.relationship !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const relationshipChange = response.type === 'friendly' ? 1 : response.type === 'hostile' ? -1 : 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      target.relationship += relationshipChange;
    }

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: response.text,
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response: response.text,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        relationshipChange: response.type === 'friendly' ? 1 : response.type === 'hostile' ? -1 : 0
      }
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async executeTrade(_character: any, target: any, tradeOffer?: any): Promise<any> {
    if (!tradeOffer) {
      // Just opening trade window - show what target has to offer
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const availableItems = (target.inventory?.items?.slice(0, 10) || []) as Array<any>;
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `You open trade with ${target.name}.`,
        data: {
          availableItems,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          targetGold: target.inventory?.gold || 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          targetName: target.name
        }
      };
    }

    // Process actual trade
    // This is simplified - in a real implementation, you'd have complex trade logic
    const tradeSuccess = Math.random() > 0.2; // 80% success rate for now

    if (tradeSuccess) {
      // Remove items from character
      // Note: In a real implementation, we would modify the inventory here or return a state change
      // For now, we just return success

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `Trade with ${target.name} completed successfully!`,
        data: { receivedItems: [] },
        rewards: { items: [] }
      };
    }
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: `${target.name} rejected your trade offer.`,
      data: { reason: 'Offer not acceptable' }
    };

  }

  // eslint-disable-next-line class-methods-use-this
  private async executeExamine(_character: any, target: any): Promise<any> {
    const examination = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      name: target.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      type: target.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      level: target.level || 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      health: target.health?.current || 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      maxHealth: target.health?.maximum || 'Unknown',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      description: target.description || 'No detailed description available.',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      equipment: target.equipment || {},
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      status: target.status || [],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      relationship: target.relationship || 0
    };

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: `You examine ${target.name} carefully.`,
      data: examination
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private async executePickpocket(character: ICharacter, target: any, _context: IGameContext): Promise<any> {
    // Calculate success chance based on dexterity and target awareness
    const baseChance = 30;
    const dexterityBonus = (character.attributes.dexterity - 10) * 2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const levelPenalty = Math.max(0, (target.level || 1) - character.level) * 5;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const awarenessPenalty = target.status?.includes('alert') ? 20 : 0;

    const successChance = Math.max(5, Math.min(95, baseChance + dexterityBonus - levelPenalty - awarenessPenalty));
    const success = Math.random() * 100 < successChance;

    if (success) {
      // Determine what was stolen
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const possibleItems = (target.inventory?.items?.slice(0, 3) || []) as Array<any>;
      const stolenItem = possibleItems.length > 0 ? possibleItems[Math.floor(Math.random() * possibleItems.length)] : null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const goldStolen = Math.floor((target.inventory?.gold || 0) * 0.1);

      return {
        success: true,
        result: {
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message: `You successfully pickpocketed ${target.name}!`,
          stolenItem,
          goldStolen
        }
      };
    }
    // Failed - target becomes hostile
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.relationship !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      target.relationship = Math.max(-100, target.relationship - 20);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!target.status) target.status = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    target.status.push('hostile');

    return {
      success: false,
      result: {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `You failed to pickpocket ${target.name}! They noticed you!`,
        targetNowHostile: true
      }
    };

  }

  // eslint-disable-next-line class-methods-use-this
  private async executeSocialSkill(character: ICharacter, target: any, skillType: 'intimidate' | 'persuade'): Promise<any> {
    const baseChance = 50;
    const charismaBonus = (character.attributes.charisma - 10) * 2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const levelBonus = Math.max(0, character.level - (target.level || 1)) * 3;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const relationshipBonus = target.relationship ? Math.floor(target.relationship / 10) : 0;

    const successChance = Math.max(10, Math.min(90, baseChance + charismaBonus + levelBonus + relationshipBonus));
    const success = Math.random() * 100 < successChance;

    if (success) {
      // Apply success effects
      const relationshipChange = skillType === 'persuade' ? 10 : -5;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (target.relationship !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        target.relationship += relationshipChange;
      }

      const successMessage = skillType === 'persuade'
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ? `You successfully persuaded ${target.name}!`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
    }
    // Apply failure effects
    const relationshipChange = skillType === 'persuade' ? -5 : -15;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.relationship !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      target.relationship += relationshipChange;
    }

    const failureMessage = skillType === 'persuade'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ? `${target.name} wasn't persuaded by your words.`
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  // eslint-disable-next-line class-methods-use-this
  private async executeHelp(character: ICharacter, target: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.health && target.health.current <= 0) {
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `${target.name} is beyond help.`,
        data: { reason: 'target_dead' }
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (target.status?.includes('wounded')) {
      // Provide basic first aid
      const healingAmount = 10 + Math.floor(character.attributes.wisdom / 2);
      // target.health.current = Math.min(target.health.maximum, target.health.current + healingAmount);
      // Cannot modify readonly properties. Just return the effect.

      // Remove wounded status
      // target.status = target.status.filter((status: string) => status !== 'wounded');

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `You helped ${target.name} recover from their wounds.`,
        data: { healingAmount, statusRemoved: 'wounded' },
        rewards: { relationshipChange: 15 }
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.type === 'merchant' && target.needsHelp) {
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message: `${target.name} appreciates your offer to help.`,
        data: { helpOffered: true },
        rewards: { relationshipChange: 5, discount: 0.1 }
      };
    }

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: `${target.name} doesn't need help right now.`,
      data: { noHelpNeeded: true }
    };
  }
}