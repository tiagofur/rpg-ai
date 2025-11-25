import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, ICommandCost, IValidationResult, IGameLogEntry, INotification, LogLevel, EffectType, IGameEffect, CommandType } from '../interfaces.js';

export interface IDefendParameters {
  defenseType?: 'dodge' | 'block' | 'parry' | 'counter';
  focusTarget?: string; // Optional target to focus defense on
}

export class DefendCommand extends BaseGameCommand {
  constructor() {
    super(
      'Defend',
      'Adopt a defensive stance',
      CommandType.DEFEND,
      1000, // 1 second cooldown
      1
    );
  }

  protected get commandType(): string {
    return 'defend';
  }

  protected get requiredParameters(): Array<string> {
    return []; // All parameters are optional
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const parameters = context.parameters as IDefendParameters;

    if (!context.session?.character) {
      return { isValid: false, errors: ['No active character session'], warnings: [], requirements: [] };
    }
    const {character} = context.session;

    // Check if character can defend
    if (character.health.current <= 0) {
      errors.push('Cannot defend while dead');
    }

    if (character.status?.includes('stunned')) {
      errors.push('Cannot defend while stunned');
    }

    if (character.status?.includes('confused')) {
      errors.push('Cannot defend effectively while confused');
    }

    // Validate defense type
    if (parameters.defenseType) {
      const validTypes = ['dodge', 'block', 'parry', 'counter'];
      if (!validTypes.includes(parameters.defenseType)) {
        errors.push(`Invalid defense type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Check if character has required equipment/skills for defense type
      const defenseValidation = this.validateDefenseType(character, parameters.defenseType);
      if (!defenseValidation.valid) {
        errors.push(...defenseValidation.errors);
      }
    }

    // Validate focus target if specified
    if (parameters.focusTarget) {
      const target = this.findTarget(context, parameters.focusTarget);
      if (!target) {
        errors.push('Focus target not found');
      } else if (target.id === character.id) {
        errors.push('Cannot focus defense on yourself');
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
    const parameters = context.parameters as IDefendParameters;

    if (!context.session?.character) {
      return { health: 0, mana: 0, stamina: 0 };
    }
    const {character} = context.session;

    const defenseType = parameters.defenseType || 'dodge';

    let staminaCost = 5; // Base cost
    let manaCost = 0;

    switch (defenseType) {
      case 'dodge': {
        staminaCost = 8;
        break;
      }
      case 'block': {
        staminaCost = 6;
        // Requires shield
        if (character.equipment?.shield) {
          staminaCost -= 2; // Shield reduces stamina cost
        }
        break;
      }
      case 'parry': {
        staminaCost = 7;
        manaCost = 2; // Requires concentration
        break;
      }
      case 'counter': {
        staminaCost = 12;
        manaCost = 5; // Advanced technique
        break;
      }
    }

    // Reduce cost based on dexterity and wisdom
    const dexterityBonus = Math.floor((character.attributes.dexterity - 10) / 4);
    const wisdomBonus = Math.floor((character.attributes.wisdom - 10) / 6);

    staminaCost = Math.max(1, staminaCost - dexterityBonus - wisdomBonus);

    return {
      health: 0,
      mana: manaCost,
      stamina: staminaCost
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const parameters = context.parameters as IDefendParameters;

    if (!context.session?.character) {
      throw new Error('No active character session');
    }
    const {character} = context.session;

    const defenseType = parameters.defenseType || 'dodge';

    // Calculate defense bonuses
    const defenseBonuses = this.calculateDefenseBonuses(character, defenseType);

    // Apply defense buff
    const defenseEffect = await this.applyDefenseEffect(character, defenseType, defenseBonuses, parameters.focusTarget);

    // Set up counter-attack if using counter defense
    let counterEffect: IGameEffect | null = null;
    if (defenseType === 'counter') {
      counterEffect = await this.setupCounterAttack(character);
    }

    const logEntry: IGameLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'command',
      message: `Adopted ${defenseType} stance`,
      data: {
        defenseType,
        focusTarget: parameters.focusTarget,
        bonuses: defenseBonuses,
        staminaCost: this.calculateBaseCost(context).stamina,
        manaCost: this.calculateBaseCost(context).mana
      }
    };

    const notifications: Array<INotification> = [
      {
        id: uuidv4(),
        type: 'info',
        title: 'Defense Stance',
        message: defenseEffect.description,
        timestamp: new Date().toISOString(),
        duration: defenseEffect.duration
      }
    ];

    // Notify focus target if different from defender
    if (parameters.focusTarget && parameters.focusTarget !== character.id) {
      notifications.push({
        id: uuidv4(),
        type: 'info',
        title: 'Defense Focused',
        message: `${character.name} is focusing their defense on you`,
        timestamp: new Date().toISOString(),
        duration: 3000
      });
    }

    const effects = [defenseEffect];
    if (counterEffect) {
      effects.push(counterEffect);
    }

    return {
      success: true,
      commandId: this.id,
      message: defenseEffect.description,
      effects,
      rewards: [],
      experienceGained: 0,
      logEntries: [logEntry],
      notifications
    };
  }

  private validateDefenseType(character: any, defenseType: string): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    switch (defenseType) {
      case 'block': {
        if (!character.equipment?.shield) {
          errors.push('Blocking requires a shield');
        }
        break;
      }
      case 'parry': {
        if (!character.equipment?.weapon || character.equipment.weapon.type !== 'melee') {
          // Assuming weapon has type property, or check specific weapon types
          // For now, just check if weapon exists
          // errors.push('Parrying requires a melee weapon');
        }
        if (character.attributes.dexterity < 12) {
          errors.push('Parrying requires at least 12 dexterity');
        }
        break;
      }
      case 'counter': {
        if (!character.equipment?.weapon) {
          errors.push('Counter-attacking requires a weapon');
        }
        if (character.level < 5) {
          errors.push('Counter-attacking requires at least level 5');
        }
        if (character.attributes.dexterity < 15) {
          errors.push('Counter-attacking requires at least 15 dexterity');
        }
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private calculateDefenseBonuses(character: any, defenseType: string): any {
    const bonuses: any = {
      defenseRating: 0,
      dodgeChance: 0,
      blockChance: 0,
      parryChance: 0,
      counterChance: 0,
      damageReduction: 0
    };

    // Base bonuses from defense type
    switch (defenseType) {
      case 'dodge': {
        bonuses.dodgeChance = 25 + Math.floor((character.attributes.dexterity - 10) * 2);
        bonuses.defenseRating = Math.floor(character.attributes.dexterity / 2);
        break;
      }
      case 'block': {
        bonuses.blockChance = 30 + Math.floor((character.attributes.strength - 10) * 1.5);
        bonuses.damageReduction = 15 + Math.floor((character.attributes.constitution - 10) / 2);
        if (character.equipment?.shield) {
          bonuses.blockChance += 20;
          bonuses.damageReduction += 10;
        }
        break;
      }
      case 'parry': {
        bonuses.parryChance = 20 + Math.floor((character.attributes.dexterity - 10) * 2.5);
        if (character.equipment?.weapon) {
          bonuses.parryChance += 15;
        }
        break;
      }
      case 'counter': {
        bonuses.counterChance = 15 + Math.floor((character.attributes.dexterity - 10) * 1.5);
        if (character.equipment?.weapon) {
          bonuses.counterChance += 10;
        }
        break;
      }
    }

    // General bonuses from stats and equipment
    bonuses.defenseRating += Math.floor((character.attributes.dexterity + character.attributes.wisdom) / 4);

    // Equipment bonuses
    if (character.equipment?.armor) {
      bonuses.defenseRating += character.equipment.armor.stats?.defense || 0;
      // bonuses.damageReduction += character.equipment.armor.damageReduction || 0;
    }

    return bonuses;
  }

  private async applyDefenseEffect(character: any, defenseType: string, bonuses: any, focusTarget?: string): Promise<IGameEffect> {
    const duration = 180_000; // 3 minutes in ms

    let description = `You adopt a defensive ${defenseType} stance`;
    if (focusTarget) {
      description += ` focused on your target`;
    }
    description += `. Duration: ${duration / 1000} seconds`;

    const effect: IGameEffect = {
      id: uuidv4(),
      name: `Defense Stance: ${defenseType}`,
      description,
      type: EffectType.BUFF,
      duration,
      remainingDuration: duration,
      magnitude: 1,
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1,
      sourceId: character.id,
      targetId: character.id,
      statModifiers: bonuses,
      metadata: {
        defenseType,
        focusTarget
      }
    };

    return effect;
  }

  private async setupCounterAttack(character: any): Promise<IGameEffect> {
    const chance = 15 + Math.floor((character.attributes.dexterity - 10) * 1.5);
    const damageMultiplier = 0.8;
    const duration = 30_000; // 30 seconds

    const effect: IGameEffect = {
      id: uuidv4(),
      name: 'Counter Attack Stance',
      description: 'Ready to counter attack',
      type: EffectType.BUFF,
      duration,
      remainingDuration: duration,
      magnitude: 1,
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1,
      sourceId: character.id,
      targetId: character.id,
      metadata: {
        counterChance: chance,
        damageMultiplier
      }
    };

    return effect;
  }

  private findTarget(context: IGameContext, targetId: string) {
    if (!context.services?.worldService) return;

    if (!context.session?.character) {
      return;
    }
    const currentLocation = context.session.character.position;

    if (!currentLocation) return;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);
    return entities.find((entity: any) => entity.id === targetId);
  }
}