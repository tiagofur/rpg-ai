import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  IAIService,
  ITextGenerationParameters,
  ITextGenerationResult,
  IImageGenerationParameters,
  IImageGenerationResult,
  IImageAnalysisParameters,
  IImageAnalysisResult,
  IServiceStatus,
  AIModel,
  ImageModel,
  IUsageMetrics,
  IAIContext,
  IGeneratedImage,
  IGameActionResult,
  IGameStateSnapshot,
  IInteraction,
  IUserPreferences,
  ISafetySetting,
  IEntity,
  HarmCategory,
  HarmBlockThreshold
} from './interfaces/IAIService.js';
import { GameError, ErrorCode } from '../errors/GameError.js';
import { InMemoryRedisClient } from '../utils/redis.js';
import type { IRedisClient } from '../cache/interfaces/IRedisClient.js';

/**
 * AI Gateway Service - Implementación con Google AI SDK
 * Proporciona acceso a Gemini 2.5 Flash para texto y Nano Banana para imágenes
 */
export class AIGatewayService implements IAIService {
  private readonly textModel: AIModel = AIModel.GEMINI_2_5_FLASH;

  private readonly imageModel: ImageModel = ImageModel.NANO_BANANA;

  private readonly genAI: GoogleGenerativeAI;

  private readonly redis: IRedisClient;

  private readonly config: IAIConfig;

  private readonly metrics: IAIMetrics;

  private readonly startTime: number;

  constructor(apiKey: string, redis?: IRedisClient) {
    this.startTime = Date.now();

    // Configuración por defecto
    this.config = {
      apiKey,
      enableCaching: true,
      cacheTTL: 3600,
      maxRetries: 3,
      timeout: 30_000,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 10_000
      },
      safetySettings: this.getDefaultSafetySettings()
    };

    this.redis = redis || new InMemoryRedisClient();

    // Inicializar Google AI SDK
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Inicializar métricas
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      averageLatency: 0,
      errorRate: 0
    };
  }

  /**
   * Genera contenido de texto con Gemini 2.5 Flash
   */
  async generateText(parameters: ITextGenerationParameters): Promise<ITextGenerationResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Obtener modelo
      const model = this.genAI.getGenerativeModel({
        model: parameters.model || this.textModel,
        generationConfig: {
          temperature: parameters.temperature ?? 0.7,
          topP: parameters.topP ?? 0.9,
          topK: parameters.topK ?? 40,
          maxOutputTokens: parameters.maxTokens ?? 2048,
          stopSequences: parameters.stopSequences || []
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        safetySettings: (parameters.safetySettings || this.getDefaultSafetySettings()) as any
      });

      // Construir prompt con contexto
      const enhancedPrompt = this.buildEnhancedPrompt(parameters);

      // Generar contenido
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      // Procesar uso
      const usage = this.extractUsageMetrics(response);

      // Guardar en caché si es necesario
      if (this.config.enableCaching) {
        await this.cacheResult(requestId, parameters, text);
      }

      // Actualizar métricas
      const latency = Date.now() - startTime;
      this.updateMetrics(true, latency, usage);

      // Guardar interacción en contexto
      if (parameters.context) {
        await this.saveInteraction(parameters.context, parameters.prompt, text, parameters.model || this.textModel);
        if (parameters.context.userId) {
          await this.trackUserUsage(parameters.context.userId, 'text', usage);
        }
      }

      return {
        text,
        usage,
        model: parameters.model || this.textModel,
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
        { requestId, params: { prompt: `${parameters.prompt.slice(0, 100)}...` } }
      );
    }
  }

  /**
   * Genera imagen con Nano Banana (Imagen-3)
   */
  async generateImage(parameters: IImageGenerationParameters): Promise<IImageGenerationResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Por ahora, usamos un modelo de texto para generar descripciones detalladas
      // En producción, esto se conectaría al servicio de Imagen-3 de Google
      const imagePrompt = this.buildImagePrompt(parameters);

      // Generar descripción detallada de la imagen
      const textResult = await this.generateText({
        prompt: imagePrompt,
        temperature: 0.3,
        maxTokens: 500
      });

      // Crear imagen placeholder (en producción usaríamos el servicio real)
      const generatedImages: Array<IGeneratedImage> = [];
      const numberOfImages = parameters.numberOfImages || 1;

      for (let index = 0; index < numberOfImages; index++) {
        // Usamos Pollinations.ai para generar imágenes reales impresionantes sin API Key por ahora
        // Esto da el factor "WoW" inmediato
        const encodedPrompt = encodeURIComponent(`${imagePrompt} ${parameters.style || 'fantasy RPG, 8k, masterpiece, detailed'}`);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${this.getWidthFromAspectRatio(parameters.aspectRatio || '1:1')}&height=${this.getHeightFromAspectRatio(parameters.aspectRatio || '1:1')}&nologo=true`;

        // Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = 'image/jpeg';

        generatedImages.push({
          base64: `data:${mimeType};base64,${base64Image}`,
          mimeType,
          width: this.getWidthFromAspectRatio(parameters.aspectRatio || '1:1'),
          height: this.getHeightFromAspectRatio(parameters.aspectRatio || '1:1'),
          seed: parameters.seed || Math.floor(Math.random() * 1_000_000)
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

      if (parameters.userId) {
        await this.trackUserUsage(parameters.userId, 'image', usage);
      }

      return {
        images: generatedImages,
        usage,
        model: parameters.model || this.imageModel
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);

      throw new GameError(
        `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_GENERATION_FAILED,
        500,
        { requestId, params: parameters }
      );
    }
  }

  /**
   * Analiza una imagen existente
   */
  async analyzeImage(parameters: IImageAnalysisParameters): Promise<IImageAnalysisResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Obtener modelo de visión
      const model = this.genAI.getGenerativeModel({
        model: parameters.model || this.textModel
      });

      // Preparar imagen y prompt
      const imagePart = await this.prepareImagePart(parameters.image);
      const prompt = parameters.prompt || 'Describe this image in detail for an RPG game.';

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
        model: parameters.model || this.textModel
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
   * Genera una acción de juego estructurada
   */
  async generateGameAction(parameters: ITextGenerationParameters): Promise<IGameActionResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      this.metrics.totalRequests++;

      // Obtener modelo
      const model = this.genAI.getGenerativeModel({
        model: parameters.model || this.textModel,
        generationConfig: {
          temperature: parameters.temperature ?? 0.7,
          topP: parameters.topP ?? 0.9,
          topK: parameters.topK ?? 40,
          maxOutputTokens: parameters.maxTokens ?? 2048,
          responseMimeType: 'application/json'
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        safetySettings: (parameters.safetySettings || this.getDefaultSafetySettings()) as any
      });

      // Construir prompt con contexto y forzar JSON
      const systemPrompt = `Eres la IA-DJ — Director de Juego para un RPG narrativo guiado por IA.
Mandatos principales:
- Mantén una personalidad de DJ: justo, descriptivo, evocador y consistente con la ambientación.
- No respondas con "No". Si una acción es imposible, describe la consecuencia.
- VISUAL DIRECTOR: Debes decidir cuándo generar una imagen ("imageTrigger": true).
  - SÍ generar imagen cuando: El jugador entra a una nueva ubicación, encuentra un enemigo nuevo, ocurre un evento climático, o hay un momento narrativo épico/dramático.
  - NO generar imagen para: Acciones triviales, diálogos simples, o cuando la escena no ha cambiado visualmente.
  - "imagePrompt": Debe ser una descripción visual detallada en inglés, optimizada para generación de arte (ej: "Dark damp cave entrance, ominous lighting, fantasy style, 8k").

- Siempre devuelve un JSON válido con esta estructura:
{
  "narration": "texto narrativo",
  "stateChanges": {},
  "imageTrigger": boolean,
  "imagePrompt": "prompt para imagen",
  "metadata": { "diceRoll": number, "probability": number, "resolution": "success|partial|failure" }
}`;

      const enhancedPrompt = `${systemPrompt}\n\n${this.buildEnhancedPrompt(parameters)}`;

      // Generar contenido
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      // Parsear JSON
      let parsedResult: Record<string, unknown>;
      try {
        // Intentar limpiar bloques de código markdown si existen
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        parsedResult = JSON.parse(cleanText);
      } catch (error) {
        // Fallback simple
        parsedResult = {
          narration: text,
          stateChanges: {},
          imageTrigger: false,
          imagePrompt: '',
          metadata: { diceRoll: 0, probability: 0, resolution: 'unknown' }
        };
      }

      // Procesar uso
      const usage = this.extractUsageMetrics(response);

      // Actualizar métricas
      const latency = Date.now() - startTime;
      this.updateMetrics(true, latency, usage);

      return {
        narration: (parsedResult['narration'] as string) || text,
        stateChanges: (parsedResult['stateChanges'] as Record<string, unknown>) || {},
        imageTrigger: (parsedResult['imageTrigger'] as boolean) || false,
        imagePrompt: (parsedResult['imagePrompt'] as string) || '',
        metadata: (parsedResult['metadata'] as { diceRoll: number; probability: number; resolution: string }) || { diceRoll: 0, probability: 0, resolution: 'unknown' },
        usage
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);

      throw new GameError(
        `Error generating game action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.AI_GENERATION_FAILED,
        500,
        { requestId }
      );
    }
  }

  /**
   * Genera contenido con streaming
   */
  async generateTextStream(parameters: ITextGenerationParameters): Promise<ReadableStream> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: parameters.model || this.textModel,
        generationConfig: {
          temperature: parameters.temperature ?? 0.7,
          topP: parameters.topP ?? 0.9,
          topK: parameters.topK ?? 40,
          maxOutputTokens: parameters.maxTokens ?? 2048
        }
      });

      const enhancedPrompt = this.buildEnhancedPrompt(parameters);
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
        (Date.now() - (this.metrics.lastError?.timestamp || 0)) > 60_000, // Healthy si no hay errores en 1 minuto
      latency: this.metrics.averageLatency,
      ...(this.metrics.lastError?.message ? { lastError: this.metrics.lastError.message } : {}),
      uptime,
      requestsCount: this.metrics.totalRequests,
      errorRate
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Construye prompt mejorado con contexto del juego
   */
  private buildEnhancedPrompt(parameters: ITextGenerationParameters): string {
    let enhancedPrompt = parameters.prompt;

    if (parameters.context) {
      const { context } = parameters;

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
  private buildRecentContext(interactions: Array<IInteraction>): string {
    const recent = interactions.slice(-3); // Últimas 3 interacciones
    let context = `[CONTEXTO RECIENTE]`;

    for (const [index, interaction] of recent.entries()) {
      context += `\n${index + 1}. ${interaction.type}: ${interaction.prompt.slice(0, 50)}...`;
    }

    return context;
  }

  /**
   * Configuración de seguridad por defecto
   */
  private getDefaultSafetySettings(): Array<ISafetySetting> {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_DEROGATORY,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_TOXICITY,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUAL,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Extrae métricas de uso de la respuesta
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      estimatedCost: (promptTokens + completionTokens) * 0.000_001 // Costo estimado
    };
  }

  /**
   * Extrae razón de finalización
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractFinishReason(_response: any): string {
    // En producción, extraerías la razón real
    return 'STOP';
  }

  /**
   * Extrae calificaciones de seguridad
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractSafetyRatings(_response: any): Array<any> {
    // En producción, extraerías las calificaciones reales
    return [];
  }

  /**
   * Extrae candidatos
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractCandidates(_response: any): Array<any> {
    // En producción, extraerías los candidatos reales
    return [];
  }

  /**
   * Guarda resultado en caché
   */
  private async cacheResult(requestId: string, parameters: ITextGenerationParameters, result: string): Promise<void> {
    const cacheKey = `ai:cache:${this.generateCacheHash(parameters)}`;
    const cacheData = {
      requestId,
      result,
      timestamp: Date.now(),
      params: parameters
    };

    await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(cacheData));
  }

  /**
   * Genera hash para caché
   */
  private generateCacheHash(parameters: ITextGenerationParameters): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify({
      prompt: parameters.prompt,
      model: parameters.model,
      temperature: parameters.temperature,
      maxTokens: parameters.maxTokens
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
      prompt: prompt.slice(0, 500), // Limitar tamaño
      result: result.slice(0, 1000), // Limitar tamaño
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
   * Rastrea el uso por usuario en Redis
   */
  private async trackUserUsage(userId: string, type: 'text' | 'image', usage?: IUsageMetrics): Promise<void> {
    try {
      const key = `usage:ai:${userId}`;
      const pipeline = this.redis.pipeline();

      // Incrementar contador de peticiones
      pipeline.hincrby(key, 'requests', 1);

      if (type === 'image') {
        pipeline.hincrby(key, 'images', 1);
      }

      if (usage) {
        pipeline.hincrby(key, 'tokens', usage.totalTokens);
        if (usage.estimatedCost) {
          // Redis no soporta floats en incrby, guardamos como string o multiplicamos
          // Aquí simplemente no lo guardamos en Redis por ahora para simplificar
        }
      }

      // Expirar en 30 días (mensual)
      pipeline.expire(key, 60 * 60 * 24 * 30);

      await pipeline.exec();
    } catch (error) {
      // Silently fail for metrics
    }
  }  /**
   * Construye prompt para generación de imagen
   */
  private buildImagePrompt(parameters: IImageGenerationParameters): string {
    return `Create a detailed description for an RPG game image based on this prompt: "${parameters.prompt}"` +
      `${parameters.negativePrompt ? ` Avoid: ${parameters.negativePrompt}` : ''}` +
      ` Style: ${parameters.style || 'fantasy RPG'}` +
      ` Aspect ratio: ${parameters.aspectRatio || '1:1'}`;
  }



  /**
   * Obtiene ancho desde proporción
   */
  private getWidthFromAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case '1:1': {
        return 512;
      }
      case '4:3': {
        return 512;
      }
      case '16:9': {
        return 512;
      }
      case '3:4': {
        return 384;
      }
      case '9:16': {
        return 288;
      }
      default: {
        return 512;
      }
    }
  }

  /**
   * Obtiene alto desde proporción
   */
  private getHeightFromAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case '1:1': {
        return 512;
      }
      case '4:3': {
        return 384;
      }
      case '16:9': {
        return 288;
      }
      case '3:4': {
        return 512;
      }
      case '9:16': {
        return 512;
      }
      default: {
        return 512;
      }
    }
  }

  /**
   * Prepara parte de imagen para análisis
   */
  private async prepareImagePart(image: Buffer | string): Promise<{ inlineData: { data: string; mimeType: string } }> {
    if (Buffer.isBuffer(image)) {
      return {
        inlineData: {
          data: image.toString('base64'),
          mimeType: 'image/png'
        }
      };
    } if (typeof image === 'string' && image.startsWith('data:')) {
      const [metadata, data] = image.split(',');
      if (!metadata || !data) throw new Error('Invalid image format');
      const mimeType = metadata.split(':')[1]?.split(';')[0];
      if (!mimeType) throw new Error('Invalid image mime type');
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
  private extractEntitiesFromImageDescription(_description: string): IEntity[] {
    // Implementar extracción de entidades con regex o NLP
    // Por ahora, retornar array vacío
    return [];
  }

  /**
   * Extrae sentimiento de texto
   */
  private extractSentiment(_text: string): string {
    // Implementar análisis de sentimiento
    // Por ahora, retornar neutral
    return 'neutral';
  }

  /**
   * Convierte stream de Google a ReadableStream estándar
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertGoogleStreamToReadableStream(googleStream: AsyncIterable<any>): ReadableStream {
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
  cacheTTL: number; // seconds
  maxRetries: number;
  timeout: number; // milisegundos
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  safetySettings?: ISafetySetting[];
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

