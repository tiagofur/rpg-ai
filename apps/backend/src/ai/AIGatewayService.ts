import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  IAIService,
  ITextGenerationParams,
  ITextGenerationResult,
  IImageGenerationParams,
  IImageGenerationResult,
  IImageAnalysisParams,
  IImageAnalysisResult,
  IServiceStatus,
  AIModel,
  ImageModel,
  IUsageMetrics,
  IAIContext
} from './interfaces/IAIService';
import { GameError, ErrorCode } from '../errors/GameError';

/**
 * AI Gateway Service - Implementación con Google AI SDK
 * Proporciona acceso a Gemini 2.5 Flash para texto y Nano Banana para imágenes
 */
export class AIGatewayService implements IAIService {
  private readonly textModel: AIModel = AIModel.GEMINI_2_5_FLASH;
  private readonly imageModel: ImageModel = ImageModel.NANO_BANANA;
  private readonly genAI: GoogleGenerativeAI;
  private readonly redis: Redis;
  private readonly config: IAIConfig;
  private readonly metrics: IAIMetrics;
  private readonly startTime: number;

  constructor(apiKey: string, redis?: Redis) {
    this.startTime = Date.now();
    
    // Configuración por defecto
    this.config = {
      apiKey,
      cacheTtl: 3600,
      maxRetries: 3,
      timeoutMs: 30000,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      safetySettings: {
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        categories: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
      }
    };
    
    this.redis = redis || new Redis();

    // Inicializar Google AI SDK
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Inicializar métricas
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      averageLatency: 0,
      lastError: null,
      errorRate: 0
    };
  }

  /**
   * Genera contenido de texto con Gemini 2.5 Flash
   */
  async generateText(params: ITextGenerationParams): Promise<ITextGenerationResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Obtener modelo
      const model = this.genAI.getGenerativeModel({
        model: params.model || this.textModel,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          topP: params.topP ?? 0.9,
          topK: params.topK ?? 40,
          maxOutputTokens: params.maxTokens ?? 2048,
          stopSequences: params.stopSequences || []
        },
        safetySettings: params.safetySettings || this.getDefaultSafetySettings()
      });

      // Construir prompt con contexto
      const enhancedPrompt = this.buildEnhancedPrompt(params);

      // Generar contenido
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      // Procesar uso
      const usage = this.extractUsageMetrics(response);

      // Guardar en caché si es necesario
      if (this.config.enableCaching) {
        await this.cacheResult(requestId, params, text);
      }

      // Actualizar métricas
      const latency = Date.now() - startTime;
      this.updateMetrics(true, latency, usage);

      // Guardar interacción en contexto
      if (params.context) {
        await this.saveInteraction(params.context, params.prompt, text, params.model || this.textModel);
      }

      return {
        text,
        usage,
        model: params.model || this.textModel,
        finishReason: this.extractFinishReason(response),
        safetyRatings: this.extractSafetyRatings(response),
        candidates: this.extractCandidates(response)
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);

      throw new GameError(
        `Error generating text: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_GENERATION_FAILED,
        500,
        { requestId, params: { prompt: params.prompt.substring(0, 100) + '...' } }
      );
    }
  }

  /**
   * Genera imagen con Nano Banana (Imagen-3)
   */
  async generateImage(params: IImageGenerationParams): Promise<IImageGenerationResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Por ahora, usamos un modelo de texto para generar descripciones detalladas
      // En producción, esto se conectaría al servicio de Imagen-3 de Google
      const imagePrompt = this.buildImagePrompt(params);

      // Generar descripción detallada de la imagen
      const textResult = await this.generateText({
        prompt: imagePrompt,
        temperature: 0.3,
        maxTokens: 500
      });

      // Crear imagen placeholder (en producción usaríamos el servicio real)
      const generatedImages: IGeneratedImage[] = [];
      const numberOfImages = params.numberOfImages || 1;

      for (let i = 0; i < numberOfImages; i++) {
        // En producción, aquí llamaríamos al servicio de Imagen-3
        // Por ahora, creamos una representación base64 placeholder
        const placeholderImage = this.createPlaceholderImage(
          params.aspectRatio || '1:1',
          textResult.text,
          params.seed || Math.floor(Math.random() * 1000000)
        );

        generatedImages.push({
          base64: placeholderImage,
          mimeType: 'image/png',
          width: this.getWidthFromAspectRatio(params.aspectRatio || '1:1'),
          height: this.getHeightFromAspectRatio(params.aspectRatio || '1:1'),
          seed: params.seed || Math.floor(Math.random() * 1000000)
        });
      }

      // Actualizar métricas
      const latency = Date.now() - startTime;
      const usage: IUsageMetrics = {
        promptTokens: textResult.usage.promptTokens,
        completionTokens: 0,
        totalTokens: textResult.usage.totalTokens,
        estimatedCost: 0.05 * numberOfImages // Costo estimado por imagen
      };

      this.updateMetrics(true, latency, usage);

      return {
        images: generatedImages,
        usage,
        model: params.model || this.imageModel
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);

      throw new GameError(
        `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_GENERATION_FAILED,
        500,
        { requestId, params }
      );
    }
  }

  /**
   * Analiza una imagen existente
   */
  async analyzeImage(params: IImageAnalysisParams): Promise<IImageAnalysisResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Obtener modelo de visión
      const model = this.genAI.getGenerativeModel({
        model: params.model || this.textModel
      });

      // Preparar imagen y prompt
      const imagePart = await this.prepareImagePart(params.image);
      const prompt = params.prompt || 'Describe this image in detail for an RPG game.';

      // Generar contenido
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Extraer entidades y análisis
      const entities = this.extractEntitiesFromImageDescription(text);
      const sentiment = this.extractSentiment(text);

      // Procesar uso
      const usage = this.extractUsageMetrics(response);

      // Actualizar métricas
      const latency = Date.now() - startTime;
      this.updateMetrics(true, latency, usage);

      return {
        description: text,
        entities,
        sentiment,
        usage,
        model: params.model || this.textModel
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);

      throw new GameError(
        `Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_ANALYSIS_FAILED,
        500,
        { requestId }
      );
    }
  }

  /**
   * Genera contenido con streaming
   */
  async generateTextStream(params: ITextGenerationParams): Promise<ReadableStream> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: params.model || this.textModel,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          topP: params.topP ?? 0.9,
          topK: params.topK ?? 40,
          maxOutputTokens: params.maxTokens ?? 2048
        }
      });

      const enhancedPrompt = this.buildEnhancedPrompt(params);
      const result = await model.generateContentStream(enhancedPrompt);

      // Convertir el stream de Google a ReadableStream estándar
      return this.convertGoogleStreamToReadableStream(result.stream);

    } catch (error) {
      throw new GameError(
        `Error creating text stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_STREAM_FAILED,
        500
      );
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getServiceStatus(): IServiceStatus {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.metrics.totalRequests > 0
      ? this.metrics.failedRequests / this.metrics.totalRequests
      : 0;

    return {
      isHealthy: this.metrics.lastError === null ||
        (Date.now() - (this.metrics.lastError?.timestamp || 0)) > 60000, // Healthy si no hay errores en 1 minuto
      latency: this.metrics.averageLatency,
      lastError: this.metrics.lastError?.message,
      uptime,
      requestsCount: this.metrics.totalRequests,
      errorRate
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Construye prompt mejorado con contexto del juego
   */
  private buildEnhancedPrompt(params: ITextGenerationParams): string {
    let enhancedPrompt = params.prompt;

    if (params.context) {
      const context = params.context;

      // Agregar contexto del juego
      if (context.gameState) {
        const gameContext = this.buildGameContextString(context.gameState);
        enhancedPrompt = `${gameContext}\n\n${enhancedPrompt}`;
      }

      // Agregar preferencias del usuario
      if (context.preferences) {
        const preferences = this.buildPreferencesString(context.preferences);
        enhancedPrompt = `${preferences}\n\n${enhancedPrompt}`;
      }

      // Agregar interacciones previas relevantes
      if (context.previousInteractions && context.previousInteractions.length > 0) {
        const recentContext = this.buildRecentContext(context.previousInteractions);
        enhancedPrompt = `${recentContext}\n\n${enhancedPrompt}`;
      }
    }

    // Agregar instrucciones de formato RPG
    enhancedPrompt += `\n\n[IMPORTANTE: Mantén consistencia con el mundo del RPG, usa tono épico y descriptivo, evita romper la inmersión]`;

    return enhancedPrompt;
  }

  /**
   * Construye string de contexto del juego
   */
  private buildGameContextString(gameState: IGameStateSnapshot): string {
    let context = `[CONTEXTO DEL JUEGO]`;
    context += `\nUbicación: ${gameState.currentLocation}`;
    context += `\nPersonaje: Nivel ${gameState.characterLevel} ${gameState.characterClass}`;

    if (gameState.currentQuest) {
      context += `\nMisión actual: ${gameState.currentQuest}`;
    }

    if (gameState.partyMembers && gameState.partyMembers.length > 0) {
      context += `\nGrupo: ${gameState.partyMembers.join(', ')}`;
    }

    if (gameState.recentEvents && gameState.recentEvents.length > 0) {
      context += `\nEventos recientes: ${gameState.recentEvents.join('; ')}`;
    }

    if (gameState.worldState) {
      const world = gameState.worldState;
      context += `\nMundo: ${world.timeOfDay}, ${world.weather}, ${world.season}`;
      if (world.worldEvents.length > 0) {
        context += `\nEventos mundiales: ${world.worldEvents.join('; ')}`;
      }
    }

    return context;
  }

  /**
   * Construye string de preferencias
   */
  private buildPreferencesString(preferences: IUserPreferences): string {
    let prefs = `[PREFERENCIAS DEL JUGADOR]`;
    prefs += `\nTono: ${preferences.tone}`;
    prefs += `\nNivel de detalle: ${preferences.detailLevel}`;
    prefs += `\nIdioma: ${preferences.language}`;
    prefs += `\nEstilo narrativo: ${preferences.narrativeStyle}`;

    if (preferences.contentFilters.length > 0) {
      prefs += `\nFiltros: ${preferences.contentFilters.join(', ')}`;
    }

    return prefs;
  }

  /**
   * Construye contexto de interacciones recientes
   */
  private buildRecentContext(interactions: IInteraction[]): string {
    const recent = interactions.slice(-3); // Últimas 3 interacciones
    let context = `[CONTEXTO RECIENTE]`;

    recent.forEach((interaction, index) => {
      context += `\n${index + 1}. ${interaction.type}: ${interaction.prompt.substring(0, 50)}...`;
    });

    return context;
  }

  /**
   * Configuración de seguridad por defecto
   */
  private getDefaultSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Extrae métricas de uso de la respuesta
   */
  private extractUsageMetrics(response: any): IUsageMetrics {
    // En producción, extraerías las métricas reales de la respuesta
    // Por ahora, estimamos basándonos en el texto
    const text = response.text();
    const promptTokens = Math.ceil(text.length * 0.75); // Estimación
    const completionTokens = Math.ceil(text.length * 1.25);

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: (promptTokens + completionTokens) * 0.000001 // Costo estimado
    };
  }

  /**
   * Extrae razón de finalización
   */
  private extractFinishReason(response: any): string {
    // En producción, extraerías la razón real
    return 'STOP';
  }

  /**
   * Extrae calificaciones de seguridad
   */
  private extractSafetyRatings(response: any): any[] {
    // En producción, extraerías las calificaciones reales
    return [];
  }

  /**
   * Extrae candidatos
   */
  private extractCandidates(response: any): any[] {
    // En producción, extraerías los candidatos reales
    return [];
  }

  /**
   * Guarda resultado en caché
   */
  private async cacheResult(requestId: string, params: ITextGenerationParams, result: string): Promise<void> {
    const cacheKey = `ai:cache:${this.generateCacheHash(params)}`;
    const cacheData = {
      requestId,
      result,
      timestamp: Date.now(),
      params
    };

    await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(cacheData));
  }

  /**
   * Genera hash para caché
   */
  private generateCacheHash(params: ITextGenerationParams): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify({
      prompt: params.prompt,
      model: params.model,
      temperature: params.temperature,
      maxTokens: params.maxTokens
    }));
    return hash.digest('hex');
  }

  /**
   * Guarda interacción en contexto
   */
  private async saveInteraction(context: IAIContext, prompt: string, result: string, model: string): Promise<void> {
    const interaction = {
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      prompt: prompt.substring(0, 500), // Limitar tamaño
      result: result.substring(0, 1000), // Limitar tamaño
      model
    };

    const contextKey = `ai:context:${context.sessionId}`;
    const existingContext = await this.redis.get(contextKey);

    if (existingContext) {
      const parsedContext = JSON.parse(existingContext);
      parsedContext.previousInteractions = parsedContext.previousInteractions || [];
      parsedContext.previousInteractions.push(interaction);

      // Mantener solo las últimas 10 interacciones
      if (parsedContext.previousInteractions.length > 10) {
        parsedContext.previousInteractions = parsedContext.previousInteractions.slice(-10);
      }

      await this.redis.setex(contextKey, 3600, JSON.stringify(parsedContext)); // 1 hora TTL
    }
  }

  /**
   * Actualiza métricas del servicio
   */
  private updateMetrics(success: boolean, latency: number, usage?: IUsageMetrics): void {
    if (success) {
      this.metrics.successfulRequests++;
      if (usage) {
        this.metrics.totalTokens += usage.totalTokens;
      }
    } else {
      this.metrics.failedRequests++;
      this.metrics.lastError = {
        timestamp: Date.now(),
        message: 'Request failed'
      };
    }

    // Actualizar latencia promedio
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (totalRequests - 1) + latency) / totalRequests;

    // Actualizar tasa de error
    this.metrics.errorRate = this.metrics.failedRequests / totalRequests;
  }

  /**
   * Construye prompt para generación de imagen
   */
  private buildImagePrompt(params: IImageGenerationParams): string {
    return `Create a detailed description for an RPG game image based on this prompt: "${params.prompt}"` +
      `${params.negativePrompt ? ` Avoid: ${params.negativePrompt}` : ''}` +
      ` Style: ${params.style || 'fantasy RPG'}` +
      ` Aspect ratio: ${params.aspectRatio || '1:1'}`;
  }

  /**
   * Crea imagen placeholder (para desarrollo)
   */
  private createPlaceholderImage(aspectRatio: string, description: string, seed: number): string {
    // En producción, aquí generaríamos la imagen real
    // Por ahora, retornamos un SVG placeholder codificado en base64
    const width = this.getWidthFromAspectRatio(aspectRatio);
    const height = this.getHeightFromAspectRatio(aspectRatio);

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="100%" height="100%" fill="#2a2a2a"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ffffff" font-family="Arial" font-size="16">` +
      `AI Generated Image\n${description.substring(0, 50)}...\nSeed: ${seed}` +
      `</text></svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Obtiene ancho desde proporción
   */
  private getWidthFromAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case '1:1': return 512;
      case '4:3': return 512;
      case '16:9': return 512;
      case '3:4': return 384;
      case '9:16': return 288;
      default: return 512;
    }
  }

  /**
   * Obtiene alto desde proporción
   */
  private getHeightFromAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case '1:1': return 512;
      case '4:3': return 384;
      case '16:9': return 288;
      case '3:4': return 512;
      case '9:16': return 512;
      default: return 512;
    }
  }

  /**
   * Prepara parte de imagen para análisis
   */
  private async prepareImagePart(image: Buffer | string): Promise<any> {
    if (Buffer.isBuffer(image)) {
      return {
        inlineData: {
          data: image.toString('base64'),
          mimeType: 'image/png'
        }
      };
    } else if (typeof image === 'string' && image.startsWith('data:')) {
      const [metadata, data] = image.split(',');
      const mimeType = metadata.split(':')[1].split(';')[0];
      return {
        inlineData: {
          data,
          mimeType
        }
      };
    }

    throw new Error('Invalid image format');
  }

  /**
   * Extrae entidades de descripción de imagen
   */
  private extractEntitiesFromImageDescription(description: string): any[] {
    // Implementar extracción de entidades con regex o NLP
    // Por ahora, retornar array vacío
    return [];
  }

  /**
   * Extrae sentimiento de texto
   */
  private extractSentiment(text: string): string {
    // Implementar análisis de sentimiento
    // Por ahora, retornar neutral
    return 'neutral';
  }

  /**
   * Convierte stream de Google a ReadableStream estándar
   */
  private convertGoogleStreamToReadableStream(googleStream: any): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of googleStream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
}

// ===== INTERFACES DE CONFIGURACIÓN =====

export interface IAIConfig {
  apiKey: string;
  enableCaching: boolean;
  cacheTTL: number; // segundos
  maxRetries: number;
  timeout: number; // milisegundos
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface IAIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageLatency: number;
  lastError?: {
    timestamp: number;
    message: string;
  };
  errorRate: number;
}

export interface IUserPreferences {
  tone: 'serious' | 'humorous' | 'dark' | 'epic' | 'casual';
  detailLevel: 'minimal' | 'normal' | 'detailed' | 'extensive';
  language: string;
  contentFilters: string[];
  narrativeStyle: 'first-person' | 'third-person' | 'omniscient';
}