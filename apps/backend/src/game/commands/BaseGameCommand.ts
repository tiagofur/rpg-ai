import { v4 as uuidv4 } from 'uuid';
import {
  IGameCommand,
  IGameContext,
  ICommandResult,
  IValidationResult,
  ICommandCost,
  IUndoResult,
  CommandType,
  IGameEffect,
  IGameLogEntry,
  LogLevel,
  INotification,
  EffectType
} from '../interfaces.js';

/**
 * Clase base abstracta para todos los comandos del juego
 * Implementa la lógica común y define la estructura del patrón Command
 */
export abstract class BaseGameCommand implements IGameCommand {
  readonly id: string;

  readonly name: string;

  readonly description: string;

  readonly type: CommandType;

  readonly cooldownMs: number;

  readonly requiredLevel: number;

  readonly requiredItems?: Array<string>;

  readonly requiredSkills?: Array<string>;

  constructor(
    name: string,
    description: string,
    type: CommandType,
    cooldownMs: number = 0,
    requiredLevel: number = 1
  ) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.type = type;
    this.cooldownMs = cooldownMs;
    this.requiredLevel = requiredLevel;
  }

  /**
   * Método principal que ejecuta el comando
   * Implementa el template method pattern para validación y ejecución
   */
  async execute(context: IGameContext): Promise<ICommandResult> {
    const startTime = Date.now();
    const logEntries: Array<IGameLogEntry> = [];
    const notifications: Array<INotification> = [];

    try {
      // Validar comando
      const validation = this.validate(context);
      if (!validation.isValid) {
        return this.createFailureResult(
          `Command validation failed: ${validation.errors.join(', ')}`,
          logEntries,
          notifications
        );
      }

      // Calcular coste
      const cost = this.calculateCost(context);

      // Verificar recursos suficientes
      const canAfford = this.canAffordCost(context, cost);
      if (!canAfford) {
        return this.createFailureResult(
          'Insufficient resources to execute command',
          logEntries,
          notifications
        );
      }

      // Deducir coste
      await this.deductCost(context, cost);

      // Ejecutar lógica específica del comando
      const result = await this.executeSpecificCommand(context, logEntries, notifications);

      // Registrar ejecución exitosa
      logEntries.push(this.createLogEntry(
        LogLevel.INFO,
        'Command executed successfully',
        { commandId: this.id, commandName: this.name, executionTime: Date.now() - startTime }
      ));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logEntries.push(this.createLogEntry(
        LogLevel.ERROR,
        `Command execution failed: ${errorMessage}`,
        { commandId: this.id, commandName: this.name, error: errorMessage }
      ));

      return this.createFailureResult(
        `Command execution failed: ${errorMessage}`,
        logEntries,
        notifications
      );
    }
  }

  /**
   * Valida si el comando puede ser ejecutado en el contexto actual
   */
  validate(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const warnings: Array<string> = [];
    const requirements: Array<any> = [];

    // Validar nivel mínimo
    if (context.character.level < this.requiredLevel) {
      errors.push(`Character level ${context.character.level} is below required level ${this.requiredLevel}`);
    }

    // Validar fase del juego
    const phaseValidation = this.validateGamePhase(context);
    if (!phaseValidation.isValid) {
      errors.push(...phaseValidation.errors);
    }

    // Validar cooldown
    const cooldownValidation = this.validateCooldown(context);
    if (!cooldownValidation.isValid) {
      errors.push(...cooldownValidation.errors);
    }

    // Validar requisitos específicos del comando
    const specificValidation = this.validateSpecificRequirements(context);
    if (!specificValidation.isValid) {
      errors.push(...specificValidation.errors);
      warnings.push(...specificValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requirements
    };
  }

  /**
   * Calcula el coste de ejecutar el comando
   */
  calculateCost(context: IGameContext): ICommandCost {
    const baseCost = this.calculateBaseCost(context);
    const modifiers = this.calculateCostModifiers(context);

    return {
      mana: Math.max(0, (baseCost.mana || 0) * (modifiers.manaMultiplier || 1)),
      stamina: Math.max(0, (baseCost.stamina || 0) * (modifiers.staminaMultiplier || 1)),
      health: Math.max(0, (baseCost.health || 0) * (modifiers.healthMultiplier || 1)),
      gold: Math.max(0, (baseCost.gold || 0) * (modifiers.goldMultiplier || 1)),
      items: baseCost.items || [],
      cooldownMs: Math.max(0, (baseCost.cooldownMs || 0) * (modifiers.cooldownMultiplier || 1))
    };
  }

  /**
   * Determina si el comando puede ser deshecho
   */
  canUndo(): boolean {
    return false; // Por defecto, los comandos no se pueden deshacer
  }

  /**
   * Deshace el comando si es posible
   */
  async undo(context: IGameContext): Promise<IUndoResult> {
    if (!this.canUndo()) {
      return {
        success: false,
        message: 'This command cannot be undone',
        logEntries: [this.createLogEntry(LogLevel.WARN, 'Command cannot be undone')]
      };
    }

    try {
      return await this.undoLogic(context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to undo command: ${errorMessage}`,
        logEntries: [this.createLogEntry(LogLevel.ERROR, `Undo failed: ${errorMessage}`)]
      };
    }
  }

  // ===== MÉTODOS ABSTRACTOS PARA IMPLEMENTAR =====

  /**
   * Ejecuta la lógica específica del comando
   */
  protected abstract executeSpecificCommand(
    context: IGameContext,
    logEntries: Array<IGameLogEntry>,
    notifications: Array<INotification>
  ): Promise<ICommandResult>;

  /**
   * Valida requisitos específicos del comando
   */
  protected abstract validateSpecificRequirements(context: IGameContext): IValidationResult;

  /**
   * Calcula el coste base del comando
   */
  protected abstract calculateBaseCost(context: IGameContext): ICommandCost;

  /**
   * Calcula modificadores del coste (habilidades, items, etc.)
   */
  protected calculateCostModifiers(_context: IGameContext): any {
    return {};
  }

  /**
   * Implementa la lógica de deshacer (opcional)
   */
  protected async undoLogic(_context: IGameContext): Promise<IUndoResult> {
    return {
      success: false,
      message: 'Undo not implemented for this command',
      logEntries: [this.createLogEntry(LogLevel.WARN, 'Undo not implemented')]
    };
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Valida la fase del juego
   */
  protected validateGamePhase(_context: IGameContext): IValidationResult {
    return { isValid: true, errors: [], warnings: [], requirements: [] };
  }

  /**
   * Valida el cooldown del comando
   */
  protected validateCooldown(_context: IGameContext): IValidationResult {
    const errors: Array<string> = [];

    // Aquí iría la lógica para verificar cooldowns
    // Por ejemplo, verificar en Redis o en el estado del personaje

    return { isValid: errors.length === 0, errors, warnings: [], requirements: [] };
  }

  /**
   * Verifica si el personaje puede pagar el coste
   */
  protected canAffordCost(context: IGameContext, cost: ICommandCost): boolean {
    const {character} = context;

    // Verificar mana
    if (cost.mana && character.mana.current < cost.mana) {
      return false;
    }

    // Verificar stamina
    if (cost.stamina && character.stamina.current < cost.stamina) {
      return false;
    }

    // Verificar salud
    if (cost.health && character.health.current <= cost.health) {
      return false;
    }

    // Verificar oro
    if (cost.gold && character.inventory.gold < cost.gold) {
      return false;
    }

    // Verificar items
    if (cost.items && cost.items.length > 0) {
      // Aquí iría la lógica para verificar items específicos
    }

    return true;
  }

  /**
   * Deduce el coste del personaje
   */
  protected async deductCost(_context: IGameContext, cost: ICommandCost): Promise<void> {
    // Esta lógica debería ser atómica y manejada por el GameEngine
    // Aquí solo definimos qué costes se deben deducir

    if (cost.mana) {
      // Deducir mana
    }

    if (cost.stamina) {
      // Deducir stamina
    }

    if (cost.health) {
      // Deducir salud
    }

    if (cost.gold) {
      // Deducir oro
    }

    if (cost.items && cost.items.length > 0) {
      // Consumir items
    }

    if (cost.cooldownMs && cost.cooldownMs > 0) {
      // Aplicar cooldown
    }
  }

  /**
   * Crea un resultado de comando exitoso
   */
  protected createSuccessResult(
    message: string,
    effects: Array<IGameEffect> = [],
    rewards: Array<any> = [],
    experienceGained: number = 0,
    newState?: Partial<any>,
    logEntries: Array<IGameLogEntry> = [],
    notifications: Array<INotification> = []
  ): ICommandResult {
    return {
      success: true,
      commandId: this.id,
      message,
      effects,
      rewards,
      experienceGained,
      ...(newState ? { newState } : {}),
      logEntries,
      notifications
    };
  }

  /**
   * Crea un resultado de comando fallido
   */
  protected createFailureResult(
    message: string,
    logEntries: Array<IGameLogEntry> = [],
    notifications: Array<INotification> = []
  ): ICommandResult {
    return {
      success: false,
      commandId: this.id,
      message,
      effects: [],
      rewards: [],
      experienceGained: 0,
      logEntries,
      notifications
    };
  }

  /**
   * Crea una entrada de log
   */
  protected createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): IGameLogEntry {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      category: 'command',
      message,
      ...(data ? { data } : {})
    };
  }

  protected createNotification(
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string
  ): INotification {
    return {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      duration: 5000
    };
  }

  protected createDamageEffect(
    targetId: string,
    damage: number,
    sourceId: string
  ): IGameEffect {
    return {
      id: uuidv4(),
      name: 'Physical Damage',
      description: `Deals ${damage} physical damage`,
      type: EffectType.DAMAGE_OVER_TIME,
      duration: 0,
      remainingDuration: 0,
      magnitude: damage,
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1,
      sourceId,
      targetId
    };
  }
}