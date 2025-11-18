import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult, IGameEffect, GameEffectType, LogLevel } from '../interfaces';
import { CommandType } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import { AIGatewayService } from '../../ai/AIGatewayService';
import { GoogleGenerativeAI } from '@google/generativeai';
import { GameError } from '../../errors/GameError';
import { ErrorCode } from '../../types';

export interface INarrativeGenerationParams {
  context: string;
  tone: 'epic' | 'dark' | 'mysterious' | 'heroic' | 'tragic';
  length: 'short' | 'medium' | 'long';
  includeDialogue?: boolean;
  characterFocus?: string;
  locationFocus?: string;
}

/**
 * Comando para generar narrativa RPG usando IA
 * Integra el AI Gateway Service para crear historias dinámicas
 */
export class GenerateNarrativeCommand extends BaseGameCommand {
  private readonly aiService: AIGatewayService;

  constructor(aiService: AIGatewayService) {
    super(
      'generate_narrative',
      'Genera narrativa RPG usando inteligencia artificial',
      CommandType.GENERATE_NARRATIVE
    );

    this.aiService = aiService;
    this.cooldownMs = 5000; // 5 segundos de cooldown
    this.requiredLevel = 1; // Nivel mínimo 1
  }

  validate(context: IGameContext): IValidationResult {
    const errors: string[] = [];

    // Validar que el personaje tiene suficiente energía/mana
    if (context.character.attributes.mana < 10) {
      errors.push('No tienes suficiente mana para generar narrativa mágica');
    }

    // Validar que no está en combate (a menos que sea una habilidad especial)
    if (context.gameState.combat && !this.isCombatAllowed(context)) {
      errors.push('No puedes generar narrativa durante el combate');
    }

    // Validar parámetros
    const params = context.parameters as INarrativeGenerationParams;
    if (!params?.context || params.context.length < 10) {
      errors.push('El contexto de narrativa debe tener al menos 10 caracteres');
    }

    if (!params?.tone || !['epic', 'dark', 'mysterious', 'heroic', 'tragic'].includes(params.tone)) {
      errors.push('El tono de narrativa debe ser válido');
    }

    if (!params?.length || !['short', 'medium', 'long'].includes(params.length)) {
      errors.push('La longitud de narrativa debe ser válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  calculateCost(context: IGameContext): ICommandCost {
    const params = context.parameters as INarrativeGenerationParams;
    const baseCost = 10;
    const lengthMultiplier = params?.length === 'long' ? 3 : params?.length === 'medium' ? 2 : 1;
    const toneMultiplier = params?.tone === 'epic' ? 1.5 : 1;

    return {
      mana: Math.floor(baseCost * lengthMultiplier * toneMultiplier),
      stamina: 0,
      gold: 0,
      items: []
    };
  }

  canUndo(): boolean {
    return false; // La generación de narrativa no se puede deshacer
  }

  async execute(context: IGameContext): Promise<ICommandResult> {
    try {
      // Validar comando
      const validation = this.validate(context);
      if (!validation.isValid) {
        return this.createErrorResult(validation.errors.join(', '));
      }

      // Calcular y aplicar costo
      const cost = this.calculateCost(context);
      this.applyCost(context, cost);

      // Obtener parámetros de generación
      const params = context.parameters as INarrativeGenerationParams;

      // Construir contexto RPG para la IA
      const enhancedContext = this.buildRPGContext(context, params);

      // Generar narrativa usando IA
      const aiResult = await this.generateNarrativeWithAI(enhancedContext, params);

      // Crear efectos de la narrativa
      const effects = this.createNarrativeEffects(aiResult, params);

      // Registrar en el log del juego
      const logEntry = this.createLogEntry(context, aiResult, params);

      return {
        success: true,
        commandId: this.id,
        message: `Narrativa ${params.tone} generada exitosamente`,
        effects,
        experienceGained: this.calculateExperience(params),
        logEntries: [logEntry],
        notifications: [
          {
            id: uuidv4(),
            type: 'narrative_generated',
            title: 'Narrativa Generada',
            message: `Se ha generado una historia ${params.tone} de tamaño ${params.length}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'medium'
          }
        ]
      };

    } catch (error) {
      return this.handleExecutionError(error, context);
    }
  }

  private buildRPGContext(context: IGameContext, params: INarrativeGenerationParams): string {
    const character = context.character;
    const location = context.location;
    const gameState = context.gameState;

    let rpgContext = `
      Contexto del Juego RPG:
      - Personaje: ${character.name} (Nivel ${character.level}, Clase: ${character.class})
      - Ubicación: ${location.name} (${location.type})
      - Fase del juego: ${gameState.phase}
      - Turno actual: ${gameState.currentTurn}
      
      Estado del Personaje:
      - Salud: ${character.attributes.health}/${character.attributes.maxHealth}
      - Maná: ${character.attributes.mana}/${character.attributes.maxMana}
      - Experiencia: ${character.experience}
      
      Solicitud de Narrativa:
      - Contexto: ${params.context}
      - Tono: ${params.tone}
      - Longitud: ${params.length}
      - Incluir diálogo: ${params.includeDialogue ? 'Sí' : 'No'}
    `;

    if (params.characterFocus) {
      rpgContext += `\n- Enfoque en personaje: ${params.characterFocus}`;
    }

    if (params.locationFocus) {
      rpgContext += `\n- Enfoque en ubicación: ${params.locationFocus}`;
    }

    // Agregar estado de combate si está activo
    if (gameState.combat) {
      rpgContext += `
      
      Estado de Combate:
      - Enemigos activos: ${gameState.combat.enemies?.length || 0}
      - Aliados: ${gameState.combat.allies?.length || 0}
      - Ronda: ${gameState.combat.currentRound}
      `;
    }

    return rpgContext;
  }

  private async generateNarrativeWithAI(rpgContext: string, params: INarrativeGenerationParams): Promise<string> {
    const prompt = this.buildPrompt(rpgContext, params);

    try {
      const result = await this.aiService.generateText({
        prompt,
        model: 'gemini-2.5-flash',
        temperature: this.getTemperatureForTone(params.tone),
        maxTokens: this.getMaxTokensForLength(params.length),
        context: {
          sessionId: 'narrative-session',
          characterLevel: 1,
          location: 'narrative-location',
          gameState: 'exploration'
        }
      });

      return result.text;
    } catch (error) {
      throw new GameError(
        ErrorCode.AI_PROVIDER_ERROR,
        'Error al generar narrativa con IA',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private buildPrompt(rpgContext: string, params: INarrativeGenerationParams): string {
    const lengthInstructions = this.getLengthInstructions(params.length);
    const toneInstructions = this.getToneInstructions(params.tone);
    const dialogueInstructions = params.includeDialogue ? 'Incluye diálogos entre personajes cuando sea apropiado.' : '';

    return `
    ${rpgContext}
    
    INSTRUCCIONES PARA GENERAR NARRATIVA RPG:
    
    ${lengthInstructions}
    ${toneInstructions}
    ${dialogueInstructions}
    
    La narrativa debe:
    1. Ser coherente con el mundo del juego
    2. Reflejar el nivel y habilidades del personaje
    3. Mantener el tono ${params.tone} consistente
    4. Ser apropiada para un juego RPG de fantasía
    5. Incluir detalles sensoriales (vista, sonido, olor, etc.)
    6. Crear tensión narrativa cuando sea apropiado
    
    Genera la narrativa ahora:
    `;
  }

  private getLengthInstructions(length: string): string {
    switch (length) {
      case 'short':
        return 'Genera una narrativa corta de 2-3 párrafos (100-200 palabras).';
      case 'medium':
        return 'Genera una narrativa media de 4-6 párrafos (200-400 palabras).';
      case 'long':
        return 'Genera una narrativa larga de 7-10 párrafos (400-600 palabras).';
      default:
        return 'Genera una narrativa de longitud media.';
    }
  }

  private getToneInstructions(tone: string): string {
    switch (tone) {
      case 'epic':
        return 'Usa un tono épico y heroico, con lenguaje grandilocuente y descripciones de gran escala.';
      case 'dark':
        return 'Usa un tono oscuro y sombrío, con elementos de horror y suspenso.';
      case 'mysterious':
        return 'Usa un tono misterioso y enigmático, con preguntas sin responder y ambigüedad.';
      case 'heroic':
        return 'Usa un tono heroico y valiente, enfocándote en el coraje y la determinación.';
      case 'tragic':
        return 'Usa un tono trágico y melancólico, con elementos de pérdida y tristeza.';
      default:
        return 'Usa un tono neutro y descriptivo.';
    }
  }

  private getTemperatureForTone(tone: string): number {
    switch (tone) {
      case 'epic': return 0.8;
      case 'dark': return 0.6;
      case 'mysterious': return 0.7;
      case 'heroic': return 0.8;
      case 'tragic': return 0.5;
      default: return 0.7;
    }
  }

  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'short': return 300;
      case 'medium': return 600;
      case 'long': return 1000;
      default: return 600;
    }
  }

  private createNarrativeEffects(aiResult: string, params: INarrativeGenerationParams): IGameEffect[] {
    const effects: IGameEffect[] = [];

    // Efecto de inspiración (buff temporal)
    effects.push({
      id: uuidv4(),
      type: GameEffectType.BUFF,
      name: 'Inspiración Narrativa',
      description: `La historia ${params.tone} te ha inspirado, otorgándote una sensación de ${this.getInspirationType(params.tone)}`,
      duration: 300, // 5 minutos
      statModifiers: {
        intelligence: 2,
        wisdom: 1
      },
      source: 'narrative_generation',
      isStackable: false,
      maxStacks: 1
    });

    // Efecto de fatiga mental (ligero debuff)
    if (params.length === 'long') {
      effects.push({
        id: uuidv4(),
        type: GameEffectType.DEBUFF,
        name: 'Fatiga Mental',
        description: 'La concentración en la narrativa larga te ha dejado mentalmente fatigado',
        duration: 60, // 1 minuto
        statModifiers: {
          mana: -5
        },
        source: 'narrative_generation',
        isStackable: false,
        maxStacks: 1
      });
    }

    return effects;
  }

  private getInspirationType(tone: string): string {
    switch (tone) {
      case 'epic': return 'heroísmo y grandeza';
      case 'dark': return 'precaución y astucia';
      case 'mysterious': return 'curiosidad y perspicacia';
      case 'heroic': return 'valor y determinación';
      case 'tragic': return 'empatía y sabiduría';
      default: return 'reflexión y pensamiento';
    }
  }

  private createLogEntry(context: IGameContext, aiResult: string, params: INarrativeGenerationParams): IGameLogEntry {
    return {
      id: uuidv4(),
      sessionId: context.sessionId,
      level: LogLevel.INFO,
      category: 'narrative',
      message: `Narrativa generada: "${aiResult.substring(0, 100)}..."`,
      timestamp: new Date().toISOString(),
      metadata: {
        tone: params.tone,
        length: params.length,
        contextLength: params.context.length,
        hasDialogue: params.includeDialogue,
        characterFocus: params.characterFocus,
        locationFocus: params.locationFocus
      }
    };
  }

  private calculateExperience(params: INarrativeGenerationParams): number {
    const baseExp = 10;
    const lengthMultiplier = params.length === 'long' ? 3 : params.length === 'medium' ? 2 : 1;
    const complexityMultiplier = params.includeDialogue ? 1.5 : 1;

    return Math.floor(baseExp * lengthMultiplier * complexityMultiplier);
  }

  private handleExecutionError(error: unknown, context: IGameContext): ICommandResult {
    let errorMessage = 'Error desconocido al generar narrativa';
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

    if (error instanceof GameError) {
      errorMessage = error.message;
      errorCode = error.code as ErrorCode;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const logEntry: IGameLogEntry = {
      id: uuidv4(),
      sessionId: context.sessionId,
      level: LogLevel.ERROR,
      category: 'narrative',
      message: `Error al generar narrativa: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      metadata: {
        errorCode,
        errorMessage
      }
    };

    return {
      success: false,
      commandId: this.id,
      message: errorMessage,
      effects: [],
      logEntries: [logEntry],
      notifications: [
        {
          id: uuidv4(),
          type: 'narrative_generation_failed',
          title: 'Error al Generar Narrativa',
          message: 'No se pudo generar la narrativa. Por favor, inténtalo de nuevo.',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high'
        }
      ]
    };
  }

  private applyCost(context: IGameContext, cost: ICommandCost): void {
    // Aplicar el costo al personaje
    if (cost.mana && context.character.attributes.mana >= cost.mana) {
      context.character.attributes.mana -= cost.mana;
    }
  }

  private createErrorResult(message: string): ICommandResult {
    return {
      success: false,
      commandId: this.id,
      message,
      effects: [],
      logEntries: [{
        id: uuidv4(),
        sessionId: '',
        level: LogLevel.ERROR,
        category: 'validation',
        message: `Error de validación: ${message}`,
        timestamp: new Date().toISOString(),
        metadata: {}
      }],
      notifications: []
    };
  }

  private isCombatAllowed(context: IGameContext): boolean {
    // Permitir narrativa en combate solo si es una habilidad especial de ciertas clases
    return context.character.class === 'Bard' ||
      context.character.class === 'Wizard' ||
      context.character.class === 'Sorcerer';
  }
}