import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult } from '../interfaces';
import { GameError, ErrorCode } from '../../errors/GameError';

export interface ICastSpellParameters {
  spellId: string;
  targetId?: string;
  powerLevel?: number; // 1-10, affects mana cost and effectiveness
}

export class CastSpellCommand extends BaseGameCommand {
  protected get commandType(): string {
    return 'cast_spell';
  }

  protected get requiredParameters(): string[] {
    return ['spellId'];
  }

  protected validate(context: IGameContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = context.parameters as ICastSpellParameters;
    const character = context.session.character;

    if (!params.spellId) {
      errors.push('Spell ID is required');
      return { isValid: false, errors };
    }

    // Check if character knows the spell
    const spell = character.spells?.find(s => s.id === params.spellId);
    if (!spell) {
      errors.push('You do not know that spell');
    } else {
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
          const hasComponent = character.inventory?.some(item => 
            item.id === component.id && item.quantity >= component.quantity
          );
          if (!hasComponent) {
            errors.push(`Missing spell component: ${component.name} (need ${component.quantity})`);
          }
        }
      }
    }

    // Validate power level
    if (params.powerLevel !== undefined) {
      if (params.powerLevel < 1 || params.powerLevel > 10) {
        errors.push('Power level must be between 1 and 10');
      }
      if (character.level < params.powerLevel) {
        errors.push('Power level cannot exceed your character level');
      }
    }

    // Validate target if spell requires one
    if (spell?.requiresTarget) {
      if (!params.targetId) {
        errors.push('This spell requires a target');
      } else {
        const target = this.findTarget(context, params.targetId);
        if (!target) {
          errors.push('Target not found');
        } else {
          // Check target validity based on spell type
          const targetValidation = this.validateSpellTarget(spell, character, target);
          if (!targetValidation.valid) {
            errors.push(...targetValidation.errors);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected calculateCost(context: IGameContext): { health: number; mana: number; stamina: number } {
    const params = context.parameters as ICastSpellParameters;
    const character = context.session.character;
    const spell = character.spells?.find(s => s.id === params.spellId)!;
    const powerLevel = params.powerLevel || 1;

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

  protected async executeLogic(context: IGameContext): Promise<ICommandResult> {
    const params = context.parameters as ICastSpellParameters;
    const character = context.session.character;
    const spell = character.spells!.find(s => s.id === params.spellId)!;
    const powerLevel = params.powerLevel || 1;

    // Find target if spell requires one
    const target = spell.requiresTarget ? this.findTarget(context, params.targetId!) : character;

    // Consume spell components
    if (spell.components) {
      await this.consumeComponents(character, spell.components);
    }

    // Calculate spell effectiveness based on power level and character stats
    const effectiveness = this.calculateSpellEffectiveness(spell, character, powerLevel);

    // Apply spell effects
    const spellResult = await this.applySpellEffects(spell, character, target!, effectiveness, context);

    // Update spell cooldown
    spell.lastCast = new Date();

    // Award experience for casting
    const expGained = this.calculateExperienceGain(spell, powerLevel, effectiveness);
    character.experience = (character.experience || 0) + expGained;

    const logEntries = [
      {
        timestamp: new Date(),
        actor: character.name,
        action: 'cast_spell',
        target: target?.name || 'self',
        result: `Cast ${spell.name} at power level ${powerLevel}`,
        metadata: {
          spellId: spell.id,
          spellName: spell.name,
          powerLevel,
          effectiveness,
          manaCost: this.calculateCost(context).mana,
          expGained
        }
      }
    ];

    const notifications = [
      {
        type: 'spell_cast' as const,
        message: spellResult.description,
        recipientId: character.id,
        priority: 'info' as const,
        metadata: {
          spell: spell.name,
          powerLevel,
          effectiveness,
          effects: spellResult.appliedEffects
        }
      }
    ];

    // Notify target if different from caster
    if (target && target.id !== character.id) {
      notifications.push({
        type: 'spell_affected' as const,
        message: `${character.name} cast ${spell.name} on you`,
        recipientId: target.id,
        priority: spellResult.appliedEffects.some(e => e.type === 'damage') ? 'warning' : 'info' as const,
        metadata: {
          caster: character.id,
          spell: spell.name,
          effects: spellResult.appliedEffects
        }
      });
    }

    return {
      success: true,
      data: {
        spell: spell.name,
        powerLevel,
        effectiveness,
        target: target?.name,
        effects: spellResult.appliedEffects,
        expGained,
        manaCost: this.calculateCost(context).mana
      },
      message: spellResult.description,
      logEntries,
      notifications
    };
  }

  private findTarget(context: IGameContext, targetId: string) {
    const currentLocation = context.session.character.position;
    const entities = context.services.worldService.getEntitiesAtLocation(currentLocation);
    return entities.find(entity => entity.id === targetId);
  }

  private validateSpellTarget(spell: any, caster: any, target: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (spell.targetType === 'self' && target.id !== caster.id) {
      errors.push('This spell can only target yourself');
    }

    if (spell.targetType === 'enemy' && target.faction === caster.faction) {
      errors.push('This spell can only target enemies');
    }

    if (spell.targetType === 'ally' && target.faction !== caster.faction) {
      errors.push('This spell can only target allies');
    }

    if (target.attributes.health <= 0 && !spell.canTargetDead) {
      errors.push('Cannot target dead entities with this spell');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private calculateSpellEffectiveness(spell: any, caster: any, powerLevel: number): number {
    let effectiveness = 1.0;

    // Base effectiveness from character stats
    switch (spell.school) {
      case 'fire':
      case 'ice':
      case 'lightning':
        effectiveness *= (caster.attributes.intelligence / 20);
        break;
      case 'healing':
      case 'protection':
        effectiveness *= (caster.attributes.wisdom / 20);
        break;
      case 'illusion':
      case 'enchantment':
        effectiveness *= ((caster.attributes.intelligence + caster.attributes.charisma) / 40);
        break;
      default:
        effectiveness *= ((caster.attributes.intelligence + caster.attributes.wisdom) / 40);
    }

    // Power level multiplier
    effectiveness *= (powerLevel / 5);

    // Random variance (±10%)
    const variance = 0.9 + (Math.random() * 0.2);
    effectiveness *= variance;

    return Math.max(0.1, Math.min(2.0, effectiveness));
  }

  private async applySpellEffects(
    spell: any,
    caster: any,
    target: any,
    effectiveness: number,
    context: IGameContext
  ): Promise<{ appliedEffects: any[]; description: string }> {
    const appliedEffects: any[] = [];
    let description = '';

    if (spell.effects) {
      for (const effect of spell.effects) {
        const result = await this.applySpellEffect(effect, target, effectiveness, context);
        appliedEffects.push(result);
      }
    }

    // Generate description
    if (appliedEffects.length === 0) {
      description = `Cast ${spell.name} but it had no effect.`;
    } else if (appliedEffects.length === 1) {
      description = appliedEffects[0].description;
    } else {
      description = `Cast ${spell.name}. Effects: ${appliedEffects.map(e => e.description).join(', ')}`;
    }

    return { appliedEffects, description };
  }

  private async applySpellEffect(
    effect: any,
    target: any,
    effectiveness: number,
    context: IGameContext
  ): Promise<{ type: string; description: string; value: number }> {
    let value = Math.floor((effect.baseValue || 0) * effectiveness);
    let description = '';

    switch (effect.type) {
      case 'damage':
        // Apply damage with resistance calculation
        const resistance = target.resistances?.[effect.damageType] || 0;
        const actualDamage = Math.max(1, value - resistance);
        target.attributes.health -= actualDamage;
        
        description = `Dealt ${actualDamage} ${effect.damageType} damage`;
        if (resistance > 0) {
          description += ` (resisted ${resistance})`;
        }
        break;

      case 'heal':
        const maxHeal = target.attributes.maxHealth - target.attributes.health;
        const actualHeal = Math.min(value, maxHeal);
        target.attributes.health += actualHeal;
        description = `Healed ${actualHeal} health`;
        if (actualHeal < value) {
          description += ` (overheal ${value - actualHeal})`;
        }
        break;

      case 'buff':
        if (!target.buffs) target.buffs = [];
        target.buffs.push({
          type: effect.subtype,
          value: value,
          duration: effect.duration || 300,
          appliedAt: Date.now(),
          source: 'spell'
        });
        description = `Applied ${effect.subtype} buff (+${value})`;
        break;

      case 'debuff':
        if (!target.debuffs) target.debuffs = [];
        target.debuffs.push({
          type: effect.subtype,
          value: value,
          duration: effect.duration || 180,
          appliedAt: Date.now(),
          source: 'spell'
        });
        description = `Applied ${effect.subtype} debuff (-${value})`;
        break;

      case 'teleport':
        if (effect.location) {
          target.position = { ...effect.location };
          description = `Teleported to ${effect.location.name || 'new location'}`;
        }
        break;

      default:
        description = `Unknown spell effect: ${effect.type}`;
    }

    return { type: effect.type, description, value };
  }

  private async consumeComponents(caster: any, components: any[]): Promise<void> {
    for (const component of components) {
      const item = caster.inventory?.find(item => item.id === component.id);
      if (item && item.quantity >= component.quantity) {
        item.quantity -= component.quantity;
        if (item.quantity <= 0) {
          const index = caster.inventory.indexOf(item);
          if (index > -1) {
            caster.inventory.splice(index, 1);
          }
        }
      }
    }
  }

  private calculateExperienceGain(spell: any, powerLevel: number, effectiveness: number): number {
    const baseExp = spell.level * 10;
    const powerMultiplier = powerLevel / 2;
    const effectivenessMultiplier = Math.min(2.0, effectiveness);
    
    return Math.floor(baseExp * powerMultiplier * effectivenessMultiplier);
  }
}