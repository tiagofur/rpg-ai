import { BaseGameCommand } from './BaseGameCommand';
import {
  IGameContext,
  ICommandResult,
  IValidationResult,
  ICommandCost,
  IGameLogEntry,
  IGameEffect,
  INotification,
  LogLevel,
  ICharacter,
  IReward,
  CommandType
} from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

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

  canUndo(): boolean {
    return false; // Los ataques no se pueden deshacer
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requirements: any[] = [];

    // Verificar que hay un objetivo
    if (!context.target) {
      errors.push('No target selected for attack');
      return { isValid: false, errors, warnings, requirements };
    }

    // Verificar que el objetivo es válido para atacar
    if (context.target === context.character) {
      errors.push('Cannot attack yourself');
      return { isValid: false, errors, warnings, requirements };
    }

    // Verificar que el objetivo es hostil o atacable
    if ('isHostile' in context.target && !context.target.isHostile) {
      warnings.push('Target is not hostile');
    }

    // Verificar rango de ataque (simplificado)
    const distance = this.calculateDistance(context.character, context.target as ICharacter);
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
    const weapon = context.character.equipment.weapon;
    const baseStaminaCost = weapon ? 15 : 10; // Menos costo si no hay arma
    
    return {
      stamina: baseStaminaCost,
      cooldownMs: this.cooldownMs
    };
  }

  protected calculateCostModifiers(context: IGameContext): any {
    let staminaMultiplier = 1.0;
    let cooldownMultiplier = 1.0;

    // Modificadores por habilidades
    if (context.character.skills.has('martial_arts')) {
      const skill = context.character.skills.get('martial_arts')!;
      staminaMultiplier *= (1 - (skill.level * 0.02)); // -2% por nivel
    }

    // Modificadores por efectos
    const hasteEffect = context.character.effects.find(effect => effect.name === 'haste');
    if (hasteEffect) {
      cooldownMultiplier *= 0.8; // -20% cooldown con prisa
    }

    const fatigueEffect = context.character.effects.find(effect => effect.name === 'fatigue');
    if (fatigueEffect) {
      staminaMultiplier *= 1.2; // +20% costo con fatiga
    }

    return {
      staminaMultiplier,
      cooldownMultiplier
    };
  }

  protected async executeLogic(
    context: IGameContext,
    logEntries: IGameLogEntry[],
    notifications: INotification[]
  ): Promise<ICommandResult> {
    const attacker = context.character;
    const target = context.target as ICharacter;

    // Calcular probabilidad de golpe
    this.hitChance = this.calculateHitChance(attacker, target);
    
    // Tirada de dados para ver si acierta
    const hitRoll = Math.random() * 100;
    
    if (hitRoll > this.hitChance) {
      // Fallo
      logEntries.push(this.createLogEntry(
        LogLevel.INFO,
        `${attacker.name} attacks ${target.name} but misses!`,
        { attacker: attacker.name, target: target.name, hitChance: this.hitChance, roll: hitRoll }
      ));

      notifications.push(this.createNotification(
        'info',
        'Attack Missed',
        'Your attack missed the target!'
      ));

      return this.createSuccessResult(
        'Attack missed',
        [],
        [],
        0,
        undefined,
        logEntries,
        notifications
      );
    }

    // Calcular daño
    this.damageRoll = this.calculateDamage(attacker, target);
    this.isCritical = this.calculateCriticalHit(attacker, target);

    if (this.isCritical) {
      this.damageRoll *= 2; // Daño crítico doble
      logEntries.push(this.createLogEntry(
        LogLevel.INFO,
        `CRITICAL HIT! ${attacker.name} critically hits ${target.name} for ${this.damageRoll} damage!`,
        { attacker: attacker.name, target: target.name, damage: this.damageRoll, critical: true }
      ));

      notifications.push(this.createNotification(
        'success',
        'Critical Hit!',
        `You critically hit ${target.name} for ${this.damageRoll} damage!`
      ));
    } else {
      logEntries.push(this.createLogEntry(
        LogLevel.INFO,
        `${attacker.name} hits ${target.name} for ${this.damageRoll} damage`,
        { attacker: attacker.name, target: target.name, damage: this.damageRoll }
      ));

      notifications.push(this.createNotification(
        'info',
        'Hit!',
        `You hit ${target.name} for ${this.damageRoll} damage`
      ));
    }

    // Aplicar daño al objetivo
    const damageEffect = this.createDamageEffect(target.id, this.damageRoll, attacker.id);

    // Conceder experiencia
    const experienceGained = this.calculateExperienceReward(attacker, target, this.damageRoll);

    // Crear recompensas
    const rewards: IReward[] = [];
    if (experienceGained > 0) {
      rewards.push({
        type: 'experience',
        amount: experienceGained,
        description: `Gained ${experienceGained} experience`
      });
    }

    return this.createSuccessResult(
      this.isCritical ? 'Critical hit!' : 'Hit successful',
      [damageEffect],
      rewards,
      experienceGained,
      undefined,
      logEntries,
      notifications
    );
  }

  // ===== MÉTODOS AUXILIARES =====

  private calculateDistance(attacker: ICharacter, target: ICharacter): number {
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
    const weaponSkill = attacker.skills.get('weapon_mastery');
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
    const combatSkill = attacker.skills.get('combat');
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

  private calculateCriticalHit(attacker: ICharacter, target: ICharacter): boolean {
    let critChance = 5; // 5% base

    // Bonus por destreza
    critChance += (attacker.attributes.dexterity - 10) * 0.5;

    // Bonus por habilidades
    const criticalSkill = attacker.skills.get('critical_strike');
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

  private createDamageEffect(targetId: string, damage: number, sourceId: string): IGameEffect {
    return {
      id: uuidv4(),
      name: 'damage',
      description: `Takes ${damage} damage`,
      type: 'damage_over_time' as any,
      duration: 0, // Efecto instantáneo
      remainingDuration: 0,
      magnitude: -damage, // Negativo para daño
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1,
      sourceId,
      targetId
    };
  }

  private createNotification(type: 'info' | 'warning' | 'error' | 'success', title: string, message: string): INotification {
    return {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      duration: 3000 // 3 segundos
    };
  }
}