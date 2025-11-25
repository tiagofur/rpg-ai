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
  ICharacter,
  IReward,
  CommandType,
  IGameEffect,
  EffectType,
  IGameEntity
} from '../interfaces.js';
import { CombatDescriptionGenerator } from '../utils/CombatDescriptionGenerator.js';

export interface IAttackParameters {
  targetId: string;
}

/**
 * Comando de ataque
 * Permite al personaje atacar a un objetivo
 */
export class AttackCommand extends BaseGameCommand {
  private damageRoll: number = 0;

  private hitChance: number = 0;

  private isCritical: boolean = false;

  constructor() {
    super(
      'Attack',
      'Perform a basic attack against a target',
      CommandType.ATTACK,
      1000, // 1 segundo de cooldown
      1     // Nivel 1 requerido
    );
  }

  override canUndo(): boolean {
    return false; // Los ataques no se pueden deshacer
  }

  // eslint-disable-next-line class-methods-use-this
  protected get requiredParameters(): Array<string> {
    return ['targetId'];
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const warnings: Array<string> = [];
    const requirements: Array<any> = [];

    const parameters = context.parameters as IAttackParameters;
    let target = context.target as ICharacter | undefined;

    // Intentar resolver el objetivo si no está presente pero tenemos ID
    if (!target && parameters?.targetId) {
      target = this.findTarget(context, parameters.targetId);
    }

    // Verificar que hay un objetivo
    if (!target) {
      errors.push('No target selected for attack');
      return { isValid: false, errors, warnings, requirements };
    }

    // Verificar que el objetivo es válido para atacar
    if (target.id === context.character.id) {
      errors.push('Cannot attack yourself');
      return { isValid: false, errors, warnings, requirements };
    }

    // Verificar que el objetivo es hostil o atacable
    if (target.isHostile === false) {
      warnings.push('Target is not hostile');
    }

    // Verificar rango de ataque (simplificado)
    const distance = this.calculateDistance(context.character, target);
    if (distance > 2) {
      errors.push('Target is too far away');
    }

    // Verificar stamina suficiente
    if (context.character.stamina.current < 10) {
      errors.push('Not enough stamina to attack');
    }

    // Verificar que el personaje tiene un arma equipada (opcional)
    if (!context.character.equipment.weapon) {
      warnings.push('No weapon equipped - using unarmed attack');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requirements
    };
  }

  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const { weapon } = context.character.equipment;
    let baseStaminaCost = weapon ? 15 : 10; // Menos costo si no hay arma

    // Modificadores por habilidades
    if (context.character.skills['martial_arts']) {
      const skill = context.character.skills['martial_arts'];
      baseStaminaCost *= (1 - (skill.level * 0.02)); // -2% por nivel
    }

    // Modificadores por efectos
    const fatigueEffect = context.character.effects.find(effect => effect.name === 'fatigue');
    if (fatigueEffect) {
      baseStaminaCost *= 1.2; // +20% costo con fatiga
    }

    return {
      stamina: Math.floor(baseStaminaCost),
      cooldownMs: this.cooldownMs
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const attacker = context.character;
    const parameters = context.parameters as IAttackParameters;

    let target = context.target as ICharacter | undefined;
    if (!target && parameters?.targetId) {
      target = this.findTarget(context, parameters.targetId);
    }

    if (!target) {
      throw new Error('Target not found');
    }

    const logEntries: Array<IGameLogEntry> = [];
    const notifications: Array<INotification> = [];

    // Calcular probabilidad de golpe
    this.hitChance = this.calculateHitChance(attacker, target);

    // Tirada de dados para ver si acierta
    const hitRoll = Math.random() * 100;

    if (hitRoll > this.hitChance) {
      // Fallo
      const missMessage = CombatDescriptionGenerator.generateMissDescription(attacker.name, target.name);

      logEntries.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        category: 'combat',
        message: missMessage,
        data: { attacker: attacker.name, target: target.name, hitChance: this.hitChance, roll: hitRoll, type: 'miss' }
      });

      notifications.push({
        id: uuidv4(),
        type: 'info',
        title: 'Attack Missed',
        message: missMessage,
        timestamp: new Date().toISOString(),
        duration: 3000
      });

      return {
        success: true, // Command executed successfully, even if attack missed
        commandId: this.id,
        message: 'Attack missed',
        effects: [],
        rewards: [],
        experienceGained: 0,
        logEntries,
        notifications
      };
    }

    // Calcular daño
    this.damageRoll = this.calculateDamage(attacker, target);
    this.isCritical = this.calculateCriticalHit(attacker, target);

    // Determine weapon type for description
    // Assuming weapon has a 'type' or 'category' field, or inferring from name/stats
    // For now, default to UNARMED or BLADE if weapon exists
    const weaponType = attacker.equipment.weapon ? 'BLADE' : 'UNARMED';

    const hitMessage = CombatDescriptionGenerator.generateHitDescription(
      attacker.name,
      target.name,
      this.damageRoll,
      weaponType,
      this.isCritical
    );

    if (this.isCritical) {
      this.damageRoll *= 2; // Daño crítico doble
      logEntries.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        category: 'combat',
        message: hitMessage,
        data: { attacker: attacker.name, target: target.name, damage: this.damageRoll, critical: true, type: 'hit', weaponType }
      });

      notifications.push({
        id: uuidv4(),
        type: 'success',
        title: 'Critical Hit!',
        message: hitMessage,
        timestamp: new Date().toISOString(),
        duration: 3000
      });
    } else {
      logEntries.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        category: 'combat',
        message: hitMessage,
        data: { attacker: attacker.name, target: target.name, damage: this.damageRoll, type: 'hit', weaponType }
      });

      notifications.push({
        id: uuidv4(),
        type: 'info',
        title: 'Hit!',
        message: hitMessage,
        timestamp: new Date().toISOString(),
        duration: 3000
      });
    }

    // Aplicar daño al objetivo
    const damageEffect: IGameEffect = {
      id: uuidv4(),
      name: 'Damage',
      description: `Damage from ${attacker.name}`,
      type: EffectType.DAMAGE_OVER_TIME, // Or instant damage if supported
      duration: 0,
      remainingDuration: 0,
      magnitude: this.damageRoll,
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1,
      sourceId: attacker.id,
      targetId: target.id
    };

    // Conceder experiencia
    const experienceGained = this.calculateExperienceReward(attacker, target, this.damageRoll);

    // Crear recompensas
    const rewards: Array<IReward> = [];
    if (experienceGained > 0) {
      rewards.push({
        type: 'experience',
        amount: experienceGained,
        description: `Gained ${experienceGained} experience`
      });
    }

    return {
      success: true,
      commandId: this.id,
      message: this.isCritical ? 'Critical hit!' : 'Hit successful',
      effects: [damageEffect],
      rewards,
      experienceGained,
      logEntries,
      notifications
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  // eslint-disable-next-line class-methods-use-this
  private findTarget(context: IGameContext, targetId: string): ICharacter | undefined {
    // Buscar en las entidades del estado del juego
    if (context.gameState && context.gameState.entities) {
      const entity = context.gameState.entities[targetId];
      if (entity && (entity.type === 'enemy' || entity.type === 'character')) {
        return entity.data as unknown as ICharacter;
      }
    }
    return undefined;
  }

  private calculateDistance(_attacker: ICharacter, _target: ICharacter): number {
    // Implementar lógica de cálculo de distancia
    // Por ahora, asumimos distancia 1 si están en la misma ubicación
    return 1;
  }

  private calculateHitChance(attacker: ICharacter, target: ICharacter): number {
    let baseChance = 80; // 80% base

    // Modificadores por atributos
    const dexterityBonus = (attacker.attributes.dexterity - 10) * 2; // +2% por punto de destreza sobre 10
    baseChance += dexterityBonus;

    // Modificadores por habilidades
    const weaponSkill = attacker.skills['weapon_mastery'];
    if (weaponSkill) {
      baseChance += weaponSkill.level * 1.5; // +1.5% por nivel
    }

    // Modificadores por equipamiento
    if (attacker.equipment.weapon) {
      baseChance += 5; // Bonus por tener arma
    }

    // Modificadores por efectos
    const accuracyEffect = attacker.effects.find(effect => effect.name === 'accuracy_boost');
    if (accuracyEffect) {
      baseChance += accuracyEffect.magnitude;
    }

    const blindEffect = attacker.effects.find(effect => effect.name === 'blind');
    if (blindEffect) {
      baseChance -= 30; // -30% si está cegado
    }

    // Modificadores del objetivo
    const targetEvasion = target.attributes.dexterity * 1.5;
    baseChance -= targetEvasion;

    // Asegurar que esté entre 5% y 95%
    return Math.max(5, Math.min(95, baseChance));
  }

  private calculateDamage(attacker: ICharacter, target: ICharacter): number {
    let baseDamage = 10; // Daño base

    // Daño por atributos
    const strengthBonus = attacker.attributes.strength * 1.5;
    baseDamage += strengthBonus;

    // Daño por arma
    if (attacker.equipment.weapon) {
      baseDamage += attacker.equipment.weapon.stats?.attack || 0;
    } else {
      // Daño desarmado
      baseDamage += Math.floor(attacker.attributes.strength / 2);
    }

    // Daño por habilidades
    const combatSkill = attacker.skills['combat'];
    if (combatSkill) {
      baseDamage += combatSkill.level * 2;
    }

    // Variación aleatoria (±15%)
    const variation = (Math.random() - 0.5) * 0.3;
    baseDamage *= (1 + variation);

    // Reducción por defensa del objetivo
    const targetDefense = target.attributes.constitution * 0.8;
    baseDamage -= targetDefense;

    // Asegurar daño mínimo
    return Math.max(1, Math.floor(baseDamage));
  }

  private calculateCriticalHit(attacker: ICharacter, _target: ICharacter): boolean {
    let critChance = 5; // 5% base

    // Bonus por destreza
    critChance += (attacker.attributes.dexterity - 10) * 0.5;

    // Bonus por habilidades
    const criticalSkill = attacker.skills['critical_strike'];
    if (criticalSkill) {
      critChance += criticalSkill.level * 0.8;
    }

    // Bonus por efectos
    const criticalEffect = attacker.effects.find(effect => effect.name === 'critical_chance');
    if (criticalEffect) {
      critChance += criticalEffect.magnitude;
    }

    // Tirada de crítico
    return Math.random() * 100 < Math.min(50, critChance); // Máximo 50%
  }

  private calculateExperienceReward(attacker: ICharacter, target: ICharacter, damageDealt: number): number {
    // Experiencia basada en daño infligido y nivel del objetivo
    const baseExp = damageDealt * 2;
    const levelMultiplier = Math.max(0.5, target.level / attacker.level);

    return Math.floor(baseExp * levelMultiplier);
  }
}