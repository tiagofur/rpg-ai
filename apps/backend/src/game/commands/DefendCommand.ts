import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult } from '../interfaces';
import { GameError, ErrorCode } from '../../errors/GameError';

export interface IDefendParameters {
  defenseType?: 'dodge' | 'block' | 'parry' | 'counter';
  focusTarget?: string; // Optional target to focus defense on
}

export class DefendCommand extends BaseGameCommand {
  protected get commandType(): string {
    return 'defend';
  }

  protected get requiredParameters(): string[] {
    return []; // All parameters are optional
  }

  protected validate(context: IGameContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = context.parameters as IDefendParameters;
    const character = context.session.character;

    // Check if character can defend
    if (character.attributes.health <= 0) {
      errors.push('Cannot defend while dead');
    }

    if (character.status?.includes('stunned')) {
      errors.push('Cannot defend while stunned');
    }

    if (character.status?.includes('confused')) {
      errors.push('Cannot defend effectively while confused');
    }

    // Validate defense type
    if (params.defenseType) {
      const validTypes = ['dodge', 'block', 'parry', 'counter'];
      if (!validTypes.includes(params.defenseType)) {
        errors.push(`Invalid defense type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Check if character has required equipment/skills for defense type
      const defenseValidation = this.validateDefenseType(character, params.defenseType);
      if (!defenseValidation.valid) {
        errors.push(...defenseValidation.errors);
      }
    }

    // Validate focus target if specified
    if (params.focusTarget) {
      const target = this.findTarget(context, params.focusTarget);
      if (!target) {
        errors.push('Focus target not found');
      } else if (target.id === character.id) {
        errors.push('Cannot focus defense on yourself');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected calculateCost(context: IGameContext): { health: number; mana: number; stamina: number } {
    const params = context.parameters as IDefendParameters;
    const character = context.session.character;
    const defenseType = params.defenseType || 'dodge';

    let staminaCost = 5; // Base cost
    let manaCost = 0;

    switch (defenseType) {
      case 'dodge':
        staminaCost = 8;
        break;
      case 'block':
        staminaCost = 6;
        // Requires shield
        if (character.equipment?.shield) {
          staminaCost -= 2; // Shield reduces stamina cost
        }
        break;
      case 'parry':
        staminaCost = 7;
        manaCost = 2; // Requires concentration
        break;
      case 'counter':
        staminaCost = 12;
        manaCost = 5; // Advanced technique
        break;
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

  protected async executeLogic(context: IGameContext): Promise<ICommandResult> {
    const params = context.parameters as IDefendParameters;
    const character = context.session.character;
    const defenseType = params.defenseType || 'dodge';

    // Calculate defense bonuses
    const defenseBonuses = this.calculateDefenseBonuses(character, defenseType);

    // Apply defense buff
    const defenseEffect = await this.applyDefenseEffect(character, defenseType, defenseBonuses, params.focusTarget);

    // Set up counter-attack if using counter defense
    let counterSetup = null;
    if (defenseType === 'counter') {
      counterSetup = await this.setupCounterAttack(character);
    }

    const logEntries = [
      {
        timestamp: new Date(),
        actor: character.name,
        action: 'defend',
        target: params.focusTarget || 'general',
        result: `Adopted ${defenseType} stance`,
        metadata: {
          defenseType,
          focusTarget: params.focusTarget,
          bonuses: defenseBonuses,
          staminaCost: this.calculateCost(context).stamina,
          manaCost: this.calculateCost(context).mana
        }
      }
    ];

    const notifications = [
      {
        type: 'defense' as const,
        message: defenseEffect.description,
        recipientId: character.id,
        priority: 'info' as const,
        metadata: {
          defenseType,
          bonuses: defenseBonuses,
          duration: defenseEffect.duration
        }
      }
    ];

    // Notify focus target if different from defender
    if (params.focusTarget && params.focusTarget !== character.id) {
      notifications.push({
        type: 'defense_focused' as const,
        message: `${character.name} is focusing their defense on you`,
        recipientId: params.focusTarget,
        priority: 'info' as const,
        metadata: {
          defender: character.id,
          defenseType
        }
      });
    }

    return {
      success: true,
      data: {
        defenseType,
        bonuses: defenseBonuses,
        focusTarget: params.focusTarget,
        counterSetup,
        duration: defenseEffect.duration
      },
      message: defenseEffect.description,
      logEntries,
      notifications
    };
  }

  private validateDefenseType(character: any, defenseType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (defenseType) {
      case 'block':
        if (!character.equipment?.shield) {
          errors.push('Blocking requires a shield');
        }
        break;
      case 'parry':
        if (!character.equipment?.weapon || character.equipment.weapon.type !== 'melee') {
          errors.push('Parrying requires a melee weapon');
        }
        if (character.attributes.dexterity < 12) {
          errors.push('Parrying requires at least 12 dexterity');
        }
        break;
      case 'counter':
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
      case 'dodge':
        bonuses.dodgeChance = 25 + Math.floor((character.attributes.dexterity - 10) * 2);
        bonuses.defenseRating = Math.floor(character.attributes.dexterity / 2);
        break;
      case 'block':
        bonuses.blockChance = 30 + Math.floor((character.attributes.strength - 10) * 1.5);
        bonuses.damageReduction = 15 + Math.floor((character.attributes.constitution - 10) / 2);
        if (character.equipment?.shield) {
          bonuses.blockChance += 20;
          bonuses.damageReduction += 10;
        }
        break;
      case 'parry':
        bonuses.parryChance = 20 + Math.floor((character.attributes.dexterity - 10) * 2.5);
        if (character.equipment?.weapon) {
          bonuses.parryChance += 15;
        }
        break;
      case 'counter':
        bonuses.counterChance = 15 + Math.floor((character.attributes.dexterity - 10) * 1.5);
        if (character.equipment?.weapon) {
          bonuses.counterChance += 10;
        }
        break;
    }

    // General bonuses from stats and equipment
    bonuses.defenseRating += Math.floor((character.attributes.dexterity + character.attributes.wisdom) / 4);

    // Equipment bonuses
    if (character.equipment?.armor) {
      bonuses.defenseRating += character.equipment.armor.defense || 0;
      bonuses.damageReduction += character.equipment.armor.damageReduction || 0;
    }

    return bonuses;
  }

  private async applyDefenseEffect(character: any, defenseType: string, bonuses: any, focusTarget?: string): Promise<{ description: string; duration: number }> {
    const duration = 180; // 3 minutes in seconds
    
    if (!character.defensiveStances) {
      character.defensiveStances = [];
    }

    // Remove existing defense stance
    character.defensiveStances = character.defensiveStances.filter((stance: any) => stance.type !== 'active');

    // Add new defense stance
    const defenseStance = {
      type: 'active',
      defenseType,
      bonuses,
      focusTarget,
      appliedAt: Date.now(),
      expiresAt: Date.now() + (duration * 1000)
    };

    character.defensiveStances.push(defenseStance);

    let description = `You adopt a defensive ${defenseType} stance`;
    if (focusTarget) {
      description += ` focused on your target`;
    }
    description += `. Duration: ${duration} seconds`;

    return { description, duration };
  }

  private async setupCounterAttack(character: any): Promise<any> {
    if (!character.counterAttack) {
      character.counterAttack = {};
    }

    character.counterAttack = {
      available: true,
      chance: 15 + Math.floor((character.attributes.dexterity - 10) * 1.5),
      damageMultiplier: 0.8,
      expiresAt: Date.now() + 30000 // 30 seconds
    };

    return {
      chance: character.counterAttack.chance,
      damageMultiplier: character.counterAttack.damageMultiplier,
      duration: 30
    };
  }

  private findTarget(context: IGameContext, targetId: string) {
    const currentLocation = context.session.character.position;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);
    return entities.find(entity => entity.id === targetId);
  }
}