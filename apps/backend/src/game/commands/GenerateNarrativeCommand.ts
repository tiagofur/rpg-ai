import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, IGameEffect, EffectType, LogLevel, IValidationResult, ICommandCost, IGameLogEntry, INotification , CommandType } from '../interfaces.js';

import { IAIService, AIModel } from '../../ai/interfaces/IAIService.js';
import { GameError } from '../../errors/GameError.js';
import { ErrorCode } from '../../types/index.js';

export interface INarrativeGenerationParameters {
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
  private readonly aiService: IAIService;

  constructor(aiService: IAIService) {
    super(
      'generate_narrative',
      'Genera narrativa RPG usando inteligencia artificial',
      CommandType.GENERATE_NARRATIVE,
      5000, // cooldownMs
      1 // requiredLevel
    );

    this.aiService = aiService;
  }

  protected get commandType(): string {
    return 'generate_narrative';
  }

  protected get requiredParameters(): Array<string> {
    return ['context', 'tone', 'length'];
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];

    // Validar que el personaje tiene suficiente energía/mana
    if (context.character.mana.current < 10) {
      errors.push('No tienes suficiente mana para generar narrativa mágica');
    }

    // Validar que no está en combate (a menos que sea una habilidad especial)
    if (context.gameState.combat && !this.isCombatAllowed(context)) {
      errors.push('No puedes generar narrativa durante el combate');
    }

    // Validar parámetros
    const parameters = context.parameters as INarrativeGenerationParameters;
    if (!parameters?.context || parameters.context.length < 10) {
      errors.push('El contexto de narrativa debe tener al menos 10 caracteres');
    }

    if (!parameters?.tone || !['epic', 'dark', 'mysterious', 'heroic', 'tragic'].includes(parameters.tone)) {
      errors.push('El tono de narrativa debe ser válido');
    }

    if (!parameters?.length || !['short', 'medium', 'long'].includes(parameters.length)) {
      errors.push('La longitud de narrativa debe ser válida');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      requirements: []
    };
  }

  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const parameters = context.parameters as INarrativeGenerationParameters;
    const baseCost = 10;
    const lengthMultiplier = parameters?.length === 'long' ? 3 : parameters?.length === 'medium' ? 2 : 1;
    const toneMultiplier = parameters?.tone === 'epic' ? 1.5 : 1;

    return {
      mana: Math.floor(baseCost * lengthMultiplier * toneMultiplier),
      stamina: 0,
      health: 0
    };
  }

  protected async executeSpecificCommand(
    context: IGameContext,
    _logEntries: Array<IGameLogEntry>,
    _notifications: Array<INotification>
  ): Promise<ICommandResult> {
    // Obtener parámetros de generación
    const parameters = context.parameters as INarrativeGenerationParameters;

    // Construir contexto RPG para la IA
    const enhancedContext = this.buildRPGContext(context, parameters);

    // Generar narrativa usando IA
    const aiResult = await this.generateNarrativeWithAI(enhancedContext, parameters);

    // Crear efectos de la narrativa
    const effects = this.createNarrativeEffects(parameters, context.character.id);

    // Registrar en el log del juego
    const logEntry = this.createNarrativeLogEntry(aiResult, parameters);

    return {
      success: true,
      commandId: this.id,
      message: `Narrativa ${parameters.tone} generada exitosamente`,
      effects,
      experienceGained: this.calculateExperience(parameters),
      logEntries: [logEntry],
      notifications: [
        {
          id: uuidv4(),
          type: 'info',
          title: 'Narrativa Generada',
          message: `Se ha generado una historia ${parameters.tone} de tamaño ${parameters.length}`,
          timestamp: new Date().toISOString(),
          duration: 5000
        }
      ]
    };
  }

  private buildRPGContext(context: IGameContext, parameters: INarrativeGenerationParameters): string {
    const {character} = context;
    const {location} = context;
    const {gameState} = context;

    let rpgContext = `
      Contexto del Juego RPG:
      - Personaje: ${character.name} (Nivel ${character.level}, Clase: ${character.class})
      - Ubicación: ${location.name} (${location.type})
      - Fase del juego: ${gameState.phase}
      - Turno actual: ${gameState.currentTurn}
      
      Estado del Personaje:
      - Salud: ${character.health.current}/${character.health.maximum}
      - Maná: ${character.mana.current}/${character.mana.maximum}
      - Experiencia: ${character.experience}
      
      Solicitud de Narrativa:
      - Contexto: ${parameters.context}
      - Tono: ${parameters.tone}
      - Longitud: ${parameters.length}
      - Incluir diálogo: ${parameters.includeDialogue ? 'Sí' : 'No'}
    `;

    if (parameters.characterFocus) {
      rpgContext += `\n- Enfoque en personaje: ${parameters.characterFocus}`;
    }

    if (parameters.locationFocus) {
      rpgContext += `\n- Enfoque en ubicación: ${parameters.locationFocus}`;
    }

    // Agregar estado de combate si está activo
    if (gameState.combat) {
      rpgContext += `
      
      Estado de Combate:
      - Participantes: ${gameState.combat.participants.length}
      - Ronda: ${gameState.combat.round}
      `;
    }

    return rpgContext;
  }

  private async generateNarrativeWithAI(rpgContext: string, parameters: INarrativeGenerationParameters): Promise<string> {
    const prompt = this.buildPrompt(rpgContext, parameters);

    try {
      const result = await this.aiService.generateText({
        prompt,
        model: AIModel.GEMINI_2_5_FLASH,
        temperature: this.getTemperatureForTone(parameters.tone),
        maxTokens: this.getMaxTokensForLength(parameters.length),
        context: {
          sessionId: 'narrative-session',
          gameState: {
            currentLocation: 'narrative-location',
            characterLevel: 1,
            characterClass: 'Unknown'
          }
        }
      });

      return result.text;
    } catch (error) {
      throw new GameError(
        'Error al generar narrativa con IA',
        ErrorCode.AI_PROVIDER_ERROR,
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private buildPrompt(rpgContext: string, parameters: INarrativeGenerationParameters): string {
    const lengthInstructions = this.getLengthInstructions(parameters.length);
    const toneInstructions = this.getToneInstructions(parameters.tone);
    const dialogueInstructions = parameters.includeDialogue ? 'Incluye diálogos entre personajes cuando sea apropiado.' : '';

    return `
    ${rpgContext}
    
    INSTRUCCIONES PARA GENERAR NARRATIVA RPG:
    
    ${lengthInstructions}
    ${toneInstructions}
    ${dialogueInstructions}
    
    La narrativa debe:
    1. Ser coherente con el mundo del juego
    2. Reflejar el nivel y habilidades del personaje
    3. Mantener el tono ${parameters.tone} consistente
    4. Ser apropiada para un juego RPG de fantasía
    5. Incluir detalles sensoriales (vista, sonido, olor, etc.)
    6. Crear tensión narrativa cuando sea apropiado
    
    Genera la narrativa ahora:
    `;
  }

  private getLengthInstructions(length: string): string {
    switch (length) {
      case 'short': {
        return 'Genera una narrativa corta de 2-3 párrafos (100-200 palabras).';
      }
      case 'medium': {
        return 'Genera una narrativa media de 4-6 párrafos (200-400 palabras).';
      }
      case 'long': {
        return 'Genera una narrativa larga de 7-10 párrafos (400-600 palabras).';
      }
      default: {
        return 'Genera una narrativa de longitud media.';
      }
    }
  }

  private getToneInstructions(tone: string): string {
    switch (tone) {
      case 'epic': {
        return 'Usa un tono épico y heroico, con lenguaje grandilocuente y descripciones de gran escala.';
      }
      case 'dark': {
        return 'Usa un tono oscuro y sombrío, con elementos de horror y suspenso.';
      }
      case 'mysterious': {
        return 'Usa un tono misterioso y enigmático, con preguntas sin responder y ambigüedad.';
      }
      case 'heroic': {
        return 'Usa un tono heroico y valiente, enfocándote en el coraje y la determinación.';
      }
      case 'tragic': {
        return 'Usa un tono trágico y melancólico, con elementos de pérdida y tristeza.';
      }
      default: {
        return 'Usa un tono neutro y descriptivo.';
      }
    }
  }

  private getTemperatureForTone(tone: string): number {
    switch (tone) {
      case 'epic': { return 0.8;
      }
      case 'dark': { return 0.6;
      }
      case 'mysterious': { return 0.7;
      }
      case 'heroic': { return 0.8;
      }
      case 'tragic': { return 0.5;
      }
      default: { return 0.7;
      }
    }
  }

  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'short': { return 300;
      }
      case 'medium': { return 600;
      }
      case 'long': { return 1000;
      }
      default: { return 600;
      }
    }
  }

  private createNarrativeEffects(parameters: INarrativeGenerationParameters, characterId: string): Array<IGameEffect> {
    const effects: Array<IGameEffect> = [];

    // Efecto de inspiración (buff temporal)
    effects.push({
      id: uuidv4(),
      type: EffectType.BUFF,
      name: 'Inspiración Narrativa',
      description: `La historia ${parameters.tone} te ha inspirado, otorgándote una sensación de ${this.getInspirationType(parameters.tone)}`,
      duration: 300, // 5 minutos
      remainingDuration: 300,
      magnitude: 1,
      statModifiers: {
        intelligence: 2,
        wisdom: 1
      },
      sourceId: characterId,
      targetId: characterId,
      isStackable: false,
      maxStacks: 1,
      currentStacks: 1
    });

    // Efecto de fatiga mental (ligero debuff)
    if (parameters.length === 'long') {
      effects.push({
        id: uuidv4(),
        type: EffectType.DEBUFF,
        name: 'Fatiga Mental',
        description: 'La concentración en la narrativa larga te ha dejado mentalmente fatigado',
        duration: 60, // 1 minuto
        remainingDuration: 60,
        magnitude: 1,
        statModifiers: {
          mana: -5
        },
        sourceId: characterId,
        targetId: characterId,
        isStackable: false,
        maxStacks: 1,
        currentStacks: 1
      });
    }

    return effects;
  }

  private getInspirationType(tone: string): string {
    switch (tone) {
      case 'epic': { return 'heroísmo y grandeza';
      }
      case 'dark': { return 'precaución y astucia';
      }
      case 'mysterious': { return 'curiosidad y perspicacia';
      }
      case 'heroic': { return 'valor y determinación';
      }
      case 'tragic': { return 'empatía y sabiduría';
      }
      default: { return 'reflexión y pensamiento';
      }
    }
  }

  private createNarrativeLogEntry(aiResult: string, parameters: INarrativeGenerationParameters): IGameLogEntry {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'narrative',
      message: `Narrativa generada: "${aiResult.slice(0, 100)}..."`,
      data: {
        tone: parameters.tone,
        length: parameters.length,
        hasDialogue: parameters.includeDialogue,
        characterFocus: parameters.characterFocus,
        locationFocus: parameters.locationFocus
      }
    };
  }

  private calculateExperience(parameters: INarrativeGenerationParameters): number {
    const baseExp = 10;
    const lengthMultiplier = parameters.length === 'long' ? 3 : parameters.length === 'medium' ? 2 : 1;
    const complexityMultiplier = parameters.includeDialogue ? 1.5 : 1;

    return Math.floor(baseExp * lengthMultiplier * complexityMultiplier);
  }

  private isCombatAllowed(context: IGameContext): boolean {
    // Permitir narrativa en combate solo si es una habilidad especial de ciertas clases
    return context.character.class === 'Bard' ||
      context.character.class === 'Wizard' ||
      context.character.class === 'Sorcerer';
  }
}