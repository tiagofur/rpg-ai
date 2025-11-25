import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, IGameLogEntry, INotification, CommandType, IValidationResult, ICommandCost, LogLevel } from '../interfaces.js';
import { IAIService } from '../../ai/interfaces/IAIService.js';
import { GameError } from '../../errors/GameError.js';
import { ErrorCode } from '../../types/index.js';

export class GenerateImageCommand extends BaseGameCommand {
    private readonly aiService: IAIService;

    constructor(aiService: IAIService) {
        super(
            'generate_image',
            'Genera una imagen de la escena actual o basada en un prompt',
            CommandType.GENERATE_IMAGE,
            10000, // cooldownMs (10s)
            0 // requiredLevel
        );
        this.aiService = aiService;
    }

    protected get commandType(): string {
        return 'generate_image';
    }

    protected get requiredParameters(): Array<string> {
        return []; // prompt is optional
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
        return {
            mana: 5 // Costo simbólico de mana para "visión lejana"
        };
    }

    protected async executeSpecificCommand(
        context: IGameContext,
        _logEntries: Array<IGameLogEntry>,
        _notifications: Array<INotification>
    ): Promise<ICommandResult> {
        const customPrompt = context.parameters?.['prompt'] as string;
        const { character, location } = context;

        // Construir prompt visual
        let visualPrompt = customPrompt;

        if (!visualPrompt) {
            // Si no hay prompt, describir la escena actual
            visualPrompt = `Fantasy RPG scene. Location: ${location?.name || 'Unknown place'}. ${location?.description || ''}. Character: ${character.name}, ${character.class}. Atmosphere: Epic, detailed, 8k.`;
        }

        try {
            const imageResult = await this.aiService.generateImage({
                prompt: visualPrompt,
                numberOfImages: 1,
                aspectRatio: '16:9',
                style: 'fantasy masterpiece, 8k, detailed, epic lighting'
            });

            const logEntries: IGameLogEntry[] = [];

            if (imageResult.images && imageResult.images.length > 0) {
                logEntries.push({
                    id: uuidv4(),
                    timestamp: new Date().toISOString(),
                    level: LogLevel.INFO,
                    category: 'scene_image',
                    message: 'Visualizing scene...',
                    data: {
                        imageUrl: imageResult.images[0].base64,
                        prompt: visualPrompt
                    }
                });
            }

            return {
                success: true,
                commandId: this.id,
                message: 'Imagen generada exitosamente',
                effects: [],
                logEntries: logEntries,
                notifications: []
            };

        } catch (error) {
            throw new GameError(
                'Error al generar imagen',
                ErrorCode.AI_GENERATION_FAILED,
                500,
                { originalError: error instanceof Error ? error.message : String(error) }
            );
        }
    }
}
