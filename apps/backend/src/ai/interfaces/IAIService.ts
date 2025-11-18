/**
 * Interfaz base para servicios de IA
 * Define el contrato común para todos los servicios de inteligencia artificial
 */
export interface IAIService {
  /**
   * Genera contenido de texto basado en un prompt
   */
  generateText(params: ITextGenerationParams): Promise<ITextGenerationResult>;

  /**
   * Genera una imagen basada en un prompt
   */
  generateImage(params: IImageGenerationParams): Promise<IImageGenerationResult>;

  /**
   * Procesa y analiza una imagen existente
   */
  analyzeImage(params: IImageAnalysisParams): Promise<IImageAnalysisResult>;

  /**
   * Genera contenido de forma asíncrona con streaming
   */
  generateTextStream(params: ITextGenerationParams): Promise<ReadableStream>;

  /**
   * Obtiene el estado del servicio
   */
  getServiceStatus(): IServiceStatus;
}

/**
 * Parámetros para generación de texto
 */
export interface ITextGenerationParams {
  prompt: string;
  context?: IAIContext;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  safetySettings?: ISafetySetting[];
  generationConfig?: IGenerationConfig;
}

/**
 * Resultado de generación de texto
 */
export interface ITextGenerationResult {
  text: string;
  usage: IUsageMetrics;
  model: string;
  finishReason: string;
  safetyRatings?: ISafetyRating[];
  candidates?: ICandidate[];
}

/**
 * Parámetros para generación de imagen
 */
export interface IImageGenerationParams {
  prompt: string;
  model?: ImageModel;
  aspectRatio?: AspectRatio;
  numberOfImages?: number;
  negativePrompt?: string;
  seed?: number;
  style?: ImageStyle;
}

/**
 * Resultado de generación de imagen
 */
export interface IImageGenerationResult {
  images: IGeneratedImage[];
  usage: IUsageMetrics;
  model: string;
}

/**
 * Parámetros para análisis de imagen
 */
export interface IImageAnalysisParams {
  image: Buffer | string; // Buffer o URL base64
  prompt?: string;
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Resultado de análisis de imagen
 */
export interface IImageAnalysisResult {
  description: string;
  entities?: IEntity[];
  sentiment?: string;
  usage: IUsageMetrics;
  model: string;
}

/**
 * Contexto de IA para mantener coherencia entre generaciones
 */
export interface IAIContext {
  sessionId: string;
  userId?: string;
  characterId?: string;
  gameState?: IGameStateSnapshot;
  previousInteractions?: IInteraction[];
  preferences?: IUserPreferences;
}

/**
 * Instantánea del estado del juego para contexto
 */
export interface IGameStateSnapshot {
  currentLocation: string;
  characterLevel: number;
  characterClass: string;
  currentQuest?: string;
  partyMembers?: string[];
  recentEvents?: string[];
  worldState?: IWorldState;
}

/**
 * Estado del mundo para narrativa coherente
 */
export interface IWorldState {
  timeOfDay: string;
  weather: string;
  season: string;
  worldEvents: string[];
  factionRelations: Record<string, number>;
}

/**
 * Interacción previa para contexto
 */
export interface IInteraction {
  timestamp: string;
  type: 'text' | 'image' | 'analysis';
  prompt: string;
  result: string;
  model: string;
}

/**
 * Preferencias del usuario
 */
export interface IUserPreferences {
  tone: 'serious' | 'humorous' | 'dark' | 'epic' | 'casual';
  detailLevel: 'minimal' | 'normal' | 'detailed' | 'extensive';
  language: string;
  contentFilters: string[];
  narrativeStyle: 'first-person' | 'third-person' | 'omniscient';
}

/**
 * Configuración de seguridad
 */
export interface ISafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

/**
 * Configuración de generación
 */
export interface IGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * Métricas de uso
 */
export interface IUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

/**
 * Calificación de seguridad
 */
export interface ISafetyRating {
  category: HarmCategory;
  probability: HarmProbability;
  blocked: boolean;
}

/**
 * Candidato de generación
 */
export interface ICandidate {
  text: string;
  index: number;
  finishReason: string;
  safetyRatings?: ISafetyRating[];
}

/**
 * Imagen generada
 */
export interface IGeneratedImage {
  url?: string;
  base64?: string;
  mimeType: string;
  width: number;
  height: number;
  seed: number;
}

/**
 * Entidad detectada en imagen
 */
export interface IEntity {
  name: string;
  type: string;
  confidence: number;
  boundingBox?: IBoundingBox;
}

/**
 * Caja delimitadora
 */
export interface IBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Estado del servicio
 */
export interface IServiceStatus {
  isHealthy: boolean;
  latency: number;
  lastError?: string;
  uptime: number;
  requestsCount: number;
  errorRate: number;
}

// ===== ENUMS =====

/**
 * Modelos de IA disponibles
 */
export enum AIModel {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_0_FLASH = 'gemini-2.0-flash',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_0_PRO = 'gemini-1.0-pro'
}

/**
 * Modelos de imagen
 */
export enum ImageModel {
  NANO_BANANA = 'imagen-3',
  IMAGEN_3 = 'imagen-3',
  IMAGEN_2 = 'imagen-2'
}

/**
 * Categorías de daño
 */
export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
  HARM_CATEGORY_DEROGATORY = 'HARM_CATEGORY_DEROGATORY',
  HARM_CATEGORY_TOXICITY = 'HARM_CATEGORY_TOXICITY',
  HARM_CATEGORY_VIOLENCE = 'HARM_CATEGORY_VIOLENCE',
  HARM_CATEGORY_SEXUAL = 'HARM_CATEGORY_SEXUAL',
  HARM_CATEGORY_MEDICAL = 'HARM_CATEGORY_MEDICAL',
  HARM_CATEGORY_DANGEROUS = 'HARM_CATEGORY_DANGEROUS'
}

/**
 * Umbrales de bloqueo
 */
export enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  BLOCK_NONE = 'BLOCK_NONE'
}

/**
 * Probabilidad de daño
 */
export enum HarmProbability {
  HARM_PROBABILITY_UNSPECIFIED = 'HARM_PROBABILITY_UNSPECIFIED',
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
 * Razones de finalización
 */
export enum FinishReason {
  FINISH_REASON_UNSPECIFIED = 'FINISH_REASON_UNSPECIFIED',
  STOP = 'STOP',
  MAX_TOKENS = 'MAX_TOKENS',
  SAFETY = 'SAFETY',
  RECITATION = 'RECITATION',
  OTHER = 'OTHER'
}

/**
 * Proporciones de aspecto para imágenes
 */
export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_4_3 = '4:3',
  PORTRAIT_16_9 = '16:9',
  LANDSCAPE_4_3 = '3:4',
  LANDSCAPE_16_9 = '9:16'
}

/**
 * Estilos de imagen
 */
export enum ImageStyle {
  PHOTOGRAPHIC = 'photographic',
  DIGITAL_ART = 'digital_art',
  HAND_DRAWN = 'hand_drawn',
  CLIP_ART = 'clip_art',
  CINEMATIC = 'cinematic',
  VINTAGE = 'vintage',
  MINIMALIST = 'minimalist',
  ABSTRACT = 'abstract'
}