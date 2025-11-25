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
  EffectType,
  IGameEffect,
  CommandType,
  ISpell,
  ISpellEffect,
  IItemCost,
  ICharacter,
  IGameEntity
} from '../interfaces.js';

export interface ICastSpellParameters {
  spellId: string;
  targetId?: string;
  powerLevel?: number; // 1-10, affects mana cost and effectiveness
}

export class CastSpellCommand extends BaseGameCommand {
  constructor() {
    super(
      'Cast Spell',
      'Cast a magic spell',
      CommandType.CAST_SPELL,
      2000, // 2 seconds global cooldown
      1
    );
  }

  // eslint-disable-next-line class-methods-use-this
  protected get commandType(): string {
    return 'cast_spell';
  }

  // eslint-disable-next-line class-methods-use-this
  protected get requiredParameters(): Array<string> {
    return ['spellId'];
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const parameters = context.parameters as ICastSpellParameters;

    if (!context.session?.character) {
      return { isValid: false, errors: ['No active character session'], warnings: [], requirements: [] };
    }
    const { character } = context.session;

    if (!parameters.spellId) {
      errors.push('Spell ID is required');
      return { isValid: false, errors, warnings: [], requirements: [] };
    }

    // Check if character knows the spell
    const spell = character.spells?.find((s: ISpell) => s.id === parameters.spellId);
    if (spell) {
      this.validateSpellRequirements(spell, character, errors);
    } else {
      errors.push('You do not know that spell');
    }

    // Validate power level
    if (parameters.powerLevel !== undefined) {
      if (parameters.powerLevel < 1 || parameters.powerLevel > 10) {
        errors.push('Power level must be between 1 and 10');
      }
      if (character.level < parameters.powerLevel) {
        errors.push('Power level cannot exceed your character level');
      }
    }

    // Validate target if spell requires one
    if (spell?.requiresTarget) {
      if (parameters.targetId) {
        const target = this.findTarget(context, parameters.targetId);
        if (target) {
          // Check target validity based on spell type
          const targetValidation = this.validateSpellTarget(spell, character, target);
          if (!targetValidation.valid) {
            errors.push(...targetValidation.errors);
          }
        } else {
          errors.push('Target not found');
        }
      } else {
        errors.push('This spell requires a target');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      requirements: []
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private validateSpellRequirements(spell: ISpell, character: ICharacter, errors: Array<string>): void {
    // Check spell level requirements
    if (character.level < (spell.requiredLevel || 1)) {
      errors.push(`You must be level ${spell.requiredLevel} to cast this spell`);
    }

    // Check if spell is on cooldown
    if (spell.cooldown && spell.lastCast) {
      const now = Date.now();
      const cooldownEnd = new Date(spell.lastCast).getTime() + (spell.cooldown * 1000);
      if (now < cooldownEnd) {
        const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
        errors.push(`${spell.name} is on cooldown for ${remainingSeconds} more seconds`);
      }
    }

    // Check if character has required components
    if (spell.components) {
      for (const component of spell.components) {
        const hasComponent = character.inventory.items.some((item) =>
          item.id === component.itemId && item.quantity >= component.quantity
        );
        if (!hasComponent) {
          // We don't have the component name here easily, just ID
          errors.push(`Missing spell component: ${component.itemId} (need ${component.quantity})`);
        }
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const parameters = context.parameters as ICastSpellParameters;

    if (!context.session?.character) {
      return { health: 0, mana: 0, stamina: 0 };
    }
    const { character } = context.session;

    const spell = character.spells?.find((s: ISpell) => s.id === parameters.spellId);

    if (!spell) {
      return { health: 0, mana: 0, stamina: 0 };
    }

    const powerLevel = parameters.powerLevel || 1;

    // Base mana cost scales with spell level and power level
    const baseManaCost = (spell.manaCost || 10) * spell.level * powerLevel;

    // Reduce cost based on intelligence and wisdom
    const intelligenceBonus = Math.floor((character.attributes.intelligence - 10) / 3);
    const wisdomBonus = Math.floor((character.attributes.wisdom - 10) / 3);
    const finalManaCost = Math.max(1, baseManaCost - intelligenceBonus - wisdomBonus);

    // Some spells also cost stamina (concentration)
    const staminaCost = Math.floor(finalManaCost / 5);

    return {
      health: 0,
      mana: finalManaCost,
      stamina: staminaCost
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const parameters = context.parameters as ICastSpellParameters;

    if (!context.session?.character) {
      throw new Error('No active character session');
    }
    const { character } = context.session;

    const spell = character.spells!.find((s: ISpell) => s.id === parameters.spellId)!;
    const powerLevel = parameters.powerLevel || 1;

    // Find target if spell requires one
    const target = spell.requiresTarget ? this.findTarget(context, parameters.targetId!) : character;

    // Consume spell components
    if (spell.components) {
      await this.consumeComponents(character, spell.components);
    }

    // Calculate spell effectiveness based on power level and character stats
    const effectiveness = this.calculateSpellEffectiveness(spell, character, powerLevel);

    // Apply spell effects
    const spellResult = await this.applySpellEffects(spell, character, target!, effectiveness, context);

    // Update spell cooldown
    // spell.lastCast = new Date(); // Cannot assign to readonly property. 
    // In a real system, we would emit an event or update state via a service.
    // For now, we'll assume the game engine handles state updates based on the result.

    // Award experience for casting
    const experienceGained = this.calculateExperienceGain(spell, powerLevel, effectiveness);
    // character.experience = (character.experience || 0) + expGained; // Readonly

    const logEntry: IGameLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'command',
      message: `Cast ${spell.name} at power level ${powerLevel}`,
      data: {
        spellId: spell.id,
        spellName: spell.name,
        powerLevel,
        effectiveness,
        manaCost: this.calculateBaseCost(context).mana,
        experienceGained
      }
    };

    const notifications: Array<INotification> = [
      {
        id: uuidv4(),
        type: 'info',
        title: 'Spell Cast',
        message: spellResult.description,
        timestamp: new Date().toISOString(),
        duration: 3000
      }
    ];

    // Notify target if different from caster
    if (target && target.id !== character.id) {
      notifications.push({
        id: uuidv4(),
        type: spellResult.appliedEffects.some(e => e.type === EffectType.DAMAGE_OVER_TIME) ? 'warning' : 'info',
        title: 'Spell Effect',
        message: `${character.name} cast ${spell.name} on you`,
        timestamp: new Date().toISOString(),
        duration: 3000
      });
    }

    return {
      success: true,
      commandId: this.id,
      message: spellResult.description,
      effects: spellResult.appliedEffects,
      rewards: [],
      experienceGained,
      logEntries: [logEntry],
      notifications
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private findTarget(context: IGameContext, targetId: string): IGameEntity | ICharacter | undefined {
    // Buscar en las entidades del estado del juego
    if (context.gameState && context.gameState.entities) {
      const entity = context.gameState.entities[targetId];
      if (entity && (entity.type === 'enemy' || entity.type === 'character')) {
        return entity.data as unknown as ICharacter;
      }
    }
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  private validateSpellTarget(spell: ISpell, caster: ICharacter, target: any): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    if (spell.targetType === 'self' && target.id !== caster.id) {
      errors.push('This spell can only target yourself');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (spell.targetType === 'enemy' && target.faction === caster.faction) {
      errors.push('This spell can only target enemies');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (spell.targetType === 'ally' && target.faction !== caster.faction) {
      errors.push('This spell can only target allies');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (target.health && target.health.current <= 0 && !spell.canTargetDead) {
      errors.push('Cannot target dead entities with this spell');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private calculateSpellEffectiveness(spell: ISpell, caster: ICharacter, powerLevel: number): number {
    let effectiveness = 1;

    // Base effectiveness from character stats
    switch (spell.school) {
      case 'fire':
      case 'ice':
      case 'lightning': {
        effectiveness *= (caster.attributes.intelligence / 20);
        break;
      }
      case 'healing':
      case 'protection': {
        effectiveness *= (caster.attributes.wisdom / 20);
        break;
      }
      case 'illusion':
      case 'enchantment': {
        effectiveness *= ((caster.attributes.intelligence + caster.attributes.charisma) / 40);
        break;
      }
      default: {
        effectiveness *= ((caster.attributes.intelligence + caster.attributes.wisdom) / 40);
      }
    }

    // Power level multiplier
    effectiveness *= (powerLevel / 5);

    // Random variance (±10%)
    const variance = 0.9 + (Math.random() * 0.2);
    effectiveness *= variance;

    return Math.max(0.1, Math.min(2, effectiveness));
  }

  private async applySpellEffects(
    spell: ISpell,
    caster: ICharacter,
    target: any,
    effectiveness: number,
    _context: IGameContext
  ): Promise<{ appliedEffects: Array<IGameEffect>; description: string }> {
    const appliedEffects: Array<IGameEffect> = [];
    let description = '';

    if (spell.effects) {
      for (const effect of spell.effects) {
        const result = await this.applySpellEffect(effect, target, effectiveness, caster);
        if (result.effect) {
          appliedEffects.push(result.effect);
        }
        if (description) description += ', ';
        description += result.description;
      }
    }

    // Generate description
    if (appliedEffects.length === 0 && !description) {
      description = `Cast ${spell.name} but it had no effect.`;
    } else if (!description) {
      description = `Cast ${spell.name}.`;
    }

    return { appliedEffects, description };
  }

  // eslint-disable-next-line class-methods-use-this
  private async applySpellEffect(
    effect: ISpellEffect,
    target: any,
    effectiveness: number,
    caster: ICharacter
  ): Promise<{ effect?: IGameEffect; description: string; value: number }> {
    const value = Math.floor((effect.baseValue || 0) * effectiveness);
    let description = '';
    let gameEffect: IGameEffect | undefined;

    switch (effect.type) {
      case 'damage': {
        // Apply damage with resistance calculation
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const resistance = (target.resistances?.[effect.damageType || 'physical'] || 0) as number;
        const actualDamage = Math.max(1, value - resistance);
        // target.health.current -= actualDamage; // Readonly

        description = `Dealt ${actualDamage} ${effect.damageType} damage`;
        if (resistance > 0) {
          description += ` (resisted ${resistance})`;
        }

        gameEffect = {
          id: uuidv4(),
          name: 'Spell Damage',
          description,
          type: EffectType.DAMAGE_OVER_TIME, // Instant damage represented as DOT with 0 duration? Or need INSTANT type?
          duration: 0,
          remainingDuration: 0,
          magnitude: actualDamage,
          isStackable: false,
          maxStacks: 1,
          currentStacks: 1,
          sourceId: caster.id,
          targetId: target.id
        };
        break;
      }

      case 'heal': {
        // const maxHeal = target.health.maximum - target.health.current;
        // const actualHeal = Math.min(value, maxHeal);
        // target.health.current += actualHeal;
        description = `Healed ${value} health`;

        gameEffect = {
          id: uuidv4(),
          name: 'Spell Heal',
          description,
          type: EffectType.HEAL_OVER_TIME,
          duration: 0,
          remainingDuration: 0,
          magnitude: value,
          isStackable: false,
          maxStacks: 1,
          currentStacks: 1,
          sourceId: caster.id,
          targetId: target.id
        };
        break;
      }

      case 'buff': {
        description = `Applied ${effect.subtype} buff (+${value})`;
        gameEffect = {
          id: uuidv4(),
          name: effect.subtype || 'Buff',
          description,
          type: EffectType.BUFF,
          duration: effect.duration || 300_000,
          remainingDuration: effect.duration || 300_000,
          magnitude: value,
          isStackable: true,
          maxStacks: 5,
          currentStacks: 1,
          sourceId: caster.id,
          targetId: target.id
        };
        break;
      }

      case 'debuff': {
        description = `Applied ${effect.subtype} debuff (-${value})`;
        gameEffect = {
          id: uuidv4(),
          name: effect.subtype || 'Debuff',
          description,
          type: EffectType.DEBUFF,
          duration: effect.duration || 180_000,
          remainingDuration: effect.duration || 180_000,
          magnitude: value,
          isStackable: true,
          maxStacks: 5,
          currentStacks: 1,
          sourceId: caster.id,
          targetId: target.id
        };
        break;
      }

      case 'teleport': {
        if (effect.location) {
          // target.position = { ...effect.location };
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          description = `Teleported to ${effect.location.name || 'new location'}`;
          // Teleport is a state change, not exactly an effect in the list, but we can return it as a special effect or handle it in engine
        }
        break;
      }

      default: {
        description = `Unknown spell effect: ${effect.type}`;
      }
    }

    const result: { effect?: IGameEffect; description: string; value: number } = {
      description,
      value
    };
    if (gameEffect) {
      result.effect = gameEffect;
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  private async consumeComponents(caster: ICharacter, components: Array<IItemCost>): Promise<void> {
    for (const component of components) {
      const item = caster.inventory.items.find((index) => index.id === component.itemId);
      if (item && item.quantity >= component.quantity) {
        // item.quantity -= component.quantity; // Readonly
        // In a real system, we would return a state change to update inventory
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private calculateExperienceGain(spell: ISpell, powerLevel: number, effectiveness: number): number {
    const baseExp = spell.level * 10;
    const powerMultiplier = powerLevel / 2;
    const effectivenessMultiplier = Math.min(2, effectiveness);

    return Math.floor(baseExp * powerMultiplier * effectivenessMultiplier);
  }
}