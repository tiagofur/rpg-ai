import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, IGameLogEntry, INotification, CommandType, IValidationResult, ICommandCost, LogLevel, EffectType, IGameEffect, IReward } from '../interfaces.js';
import { IAIService, AIModel } from '../../ai/interfaces/IAIService.js';
import { GameError } from '../../errors/GameError.js';
import { ErrorCode } from '../../types/index.js';

export class ProcessInputCommand extends BaseGameCommand {
    private readonly aiService: IAIService;

    constructor(aiService: IAIService) {
        super(
            'process_input',
            'Procesa una entrada de texto libre del jugador usando IA',
            CommandType.CUSTOM,
            0, // cooldownMs
            0 // requiredLevel
        );
        this.aiService = aiService;
    }

    protected get commandType(): string {
        return 'process_input';
    }

    protected get requiredParameters(): Array<string> {
        return ['input'];
    }

    protected validateSpecificRequirements(_context: IGameContext): IValidationResult {
        return {
            isValid: true,
            errors: [],
            warnings: [],
            requirements: []
        };
    }

    protected calculateBaseCost(_context: IGameContext): ICommandCost {
        return {};
    }

    protected async executeSpecificCommand(
        context: IGameContext,
        _logEntries: Array<IGameLogEntry>,
        _notifications: Array<INotification>
    ): Promise<ICommandResult> {
        const input = context.parameters?.['input'] as string;

        // Construir prompt para el GM AI
        const prompt = this.buildGMPrompt(context, input);

        try {
            // Usar generateGameAction para obtener JSON estructurado
            const aiResult = await this.aiService.generateGameAction({
                prompt,
                model: AIModel.GEMINI_2_5_FLASH,
                temperature: 0.7,
                maxTokens: 1000,
                context: {
                    sessionId: context.sessionId,
                    gameState: {
                        currentLocation: context.location?.name || 'Unknown',
                        characterLevel: context.character.level,
                        characterClass: context.character.class
                    }
                }
            });

            const logEntries: IGameLogEntry[] = [];

            // Generar imagen si el AI lo sugiere
            if (aiResult.imageTrigger || aiResult.imagePrompt) {
                try {
                    const imageResult = await this.aiService.generateImage({
                        prompt: aiResult.imagePrompt || `Fantasy RPG scene: ${aiResult.narration.slice(0, 100)}...`,
                        numberOfImages: 1,
                        aspectRatio: '16:9',
                        style: 'fantasy masterpiece, 8k, detailed, epic lighting'
                    });

                    if (imageResult.images && imageResult.images.length > 0) {
                        logEntries.push({
                            id: uuidv4(),
                            timestamp: new Date().toISOString(),
                            level: LogLevel.INFO,
                            category: 'scene_image',
                            message: 'Visualizing scene...',
                            data: {
                                imageUrl: imageResult.images[0].base64
                            }
                        });
                    }
                } catch (imgError) {
                    // No fallamos el comando si la imagen falla
                }
            }

            // Mapear cambios de estado a efectos y recompensas
            const effects = this.mapStateChangesToEffects(aiResult.stateChanges, context.character.id);
            const rewards = this.mapStateChangesToRewards(aiResult.stateChanges);

            return {
                success: true,
                commandId: this.id,
                message: aiResult.narration,
                effects: effects,
                rewards: rewards,
                newState: aiResult.stateChanges, // Para cambios genéricos que el motor pueda manejar
                logEntries: logEntries,
                notifications: []
            };

        } catch (error) {
            throw new GameError(
                'Error al procesar entrada con IA',
                ErrorCode.AI_PROVIDER_ERROR,
                500,
                { originalError: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    private buildGMPrompt(context: IGameContext, input: string): string {
        const { character, location, gameState } = context;

        return `
      ESTADO ACTUAL:
      - Personaje: ${character.name} (Nivel ${character.level} ${character.class})
      - Salud: ${character.health.current}/${character.health.maximum}
      - Ubicación: ${location?.name || 'Desconocida'} (${location?.description || ''})
      - Inventario: ${character.inventory.items.map(i => i.name).join(', ') || 'Vacío'}
      
      HISTORIAL RECIENTE:
      ${gameState.history.slice(-3).map(h => `- ${JSON.stringify(h.data)}`).join('\n')}
      
      ACCIÓN DEL JUGADOR:
      "${input}"
      
      TU TAREA:
      1. Interpreta la intención del jugador.
      2. Determina el resultado (éxito/fallo) usando probabilidades lógicas.
      3. Genera la narración y los cambios de estado (daño, items, etc.).
    `;
    }

    private mapStateChangesToEffects(stateChanges: Record<string, any>, characterId: string): IGameEffect[] {
        const effects: IGameEffect[] = [];

        if (stateChanges.hp) {
            const amount = Number(stateChanges.hp);
            if (amount !== 0) {
                effects.push({
                    id: uuidv4(),
                    type: amount > 0 ? EffectType.HEAL : EffectType.DAMAGE,
                    name: amount > 0 ? 'Healing' : 'Damage',
                    description: 'Effect from AI narration',
                    duration: 0,
                    remainingDuration: 0,
                    magnitude: Math.abs(amount),
                    sourceId: 'system',
                    targetId: characterId,
                    isStackable: false,
                    maxStacks: 1,
                    currentStacks: 1
                });
            }
        }

        return effects;
    }

    private mapStateChangesToRewards(stateChanges: Record<string, any>): IReward[] {
        const rewards: IReward[] = [];

        if (stateChanges.gold) {
            rewards.push({ type: 'gold', amount: Number(stateChanges.gold), description: 'Gold found' });
        }
        if (stateChanges.xp) {
            rewards.push({ type: 'experience', amount: Number(stateChanges.xp), description: 'XP gained' });
        }

        return rewards;
    }
}
