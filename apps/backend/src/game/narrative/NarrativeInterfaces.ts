/**
 * M2: Sistema de Arco Narrativo - Interfaces y Tipos
 *
 * Define todas las estructuras de datos para el sistema narrativo
 * que convierte sesiones en capítulos con inicio, desarrollo, clímax y cierre.
 */

// ============================================================================
// ENUMS Y TIPOS BASE
// ============================================================================

/**
 * Fases del arco narrativo dentro de un capítulo
 */
export type NarrativePhase = 'HOOK' | 'DEVELOPMENT' | 'CLIMAX' | 'RESOLUTION';

/**
 * Tipos de capítulos disponibles (determinan tono y estructura)
 */
export type ChapterType =
    | 'ACTION' // Combate intenso, persecución, supervivencia
    | 'MYSTERY' // Investigación, pistas, revelación
    | 'SOCIAL' // Diplomacia, alianzas, intriga
    | 'EXPLORATION' // Descubrimiento, viaje, maravillas
    | 'HORROR' // Tensión, terror, escape
    | 'HEIST'; // Planificación, infiltración, escape

/**
 * Resultado posible de un capítulo
 */
export type ChapterOutcome =
    | 'VICTORY' // Éxito completo
    | 'PYRRHIC_VICTORY' // Éxito con costo significativo
    | 'PARTIAL_SUCCESS' // Objetivo principal logrado, secundarios no
    | 'ESCAPE' // Supervivencia sin resolver conflicto
    | 'DEFEAT'; // Fallo (raro, permite retry)

/**
 * Importancia de un hilo narrativo
 */
export type ThreadImportance = 'MAIN' | 'SIDE' | 'BACKGROUND';

/**
 * Estado de un hilo narrativo
 */
export type ThreadStatus = 'INTRODUCED' | 'DEVELOPING' | 'READY_FOR_RESOLUTION' | 'RESOLVED';

/**
 * Tipos de gancho para el próximo capítulo
 */
export type HookType = 'CLIFFHANGER' | 'MYSTERY' | 'THREAT' | 'OPPORTUNITY' | 'RELATIONSHIP';

/**
 * Urgencia de un gancho narrativo
 */
export type HookUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Tipo de antagonista
 */
export type AntagonistType = 'CREATURE' | 'NPC' | 'FACTION' | 'FORCE' | 'SELF';

/**
 * Impacto de un evento narrativo
 */
export type NarrativeImpact = 'MINOR' | 'MODERATE' | 'MAJOR' | 'PIVOTAL';

/**
 * Tipos de eventos narrativos
 */
export type NarrativeEventType =
    | 'HOOK_TRIGGERED'
    | 'COMPLICATION_ADDED'
    | 'ALLY_GAINED'
    | 'ALLY_LOST'
    | 'REVELATION'
    | 'SETBACK'
    | 'BREAKTHROUGH'
    | 'CONFRONTATION'
    | 'RESOLUTION'
    | 'CLIFFHANGER';

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Estado completo del arco narrativo de la sesión
 */
export interface INarrativeState {
    /** Información del capítulo actual */
    chapter: IChapterState;

    /** Fase actual dentro del capítulo */
    phase: NarrativePhase;

    /** Progreso dentro de la fase actual (0-100) */
    phaseProgress: number;

    /** Nivel de tensión dramática (0-100) */
    tensionLevel: number;

    /** Hilos narrativos activos */
    threads: INarrativeThread[];

    /** Ganchos para el próximo capítulo */
    nextChapterHooks: IChapterHook[];

    /** Tiempo en sesión actual (ms) */
    sessionTime: number;

    /** Eventos narrativos ocurridos en este capítulo */
    narrativeLog: INarrativeEvent[];
}

/**
 * Estado del capítulo actual
 */
export interface IChapterState {
    /** ID único del capítulo */
    id: string;

    /** Número de capítulo en la historia del jugador (1, 2, 3...) */
    number: number;

    /** Tipo de capítulo (determina tono y estructura) */
    type: ChapterType;

    /** Título del capítulo */
    title: string;

    /** Conflicto principal a resolver */
    mainConflict: string;

    /** Escenario principal */
    setting: string;

    /** Antagonista o fuerza opositora (opcional) */
    antagonist?: IAntagonist;

    /** Timestamp de inicio del capítulo */
    startedAt: Date;

    /** Si el capítulo fue completado */
    completed: boolean;

    /** Resultado del capítulo (solo si completed=true) */
    outcome?: ChapterOutcome;

    /** ID de la plantilla usada para generar este capítulo */
    templateId: string;
}

/**
 * Antagonista del capítulo
 */
export interface IAntagonist {
    /** ID único del antagonista */
    id: string;

    /** Nombre del antagonista */
    name: string;

    /** Tipo de antagonista */
    type: AntagonistType;

    /** Motivación del antagonista */
    motivation: string;

    /** Nivel de amenaza (1-10) */
    threatLevel: number;

    /** Si es un antagonista recurrente */
    isRecurring: boolean;
}

/**
 * Hilo narrativo (subplot)
 */
export interface INarrativeThread {
    /** ID único del hilo */
    id: string;

    /** Descripción del hilo narrativo */
    description: string;

    /** Importancia del hilo */
    importance: ThreadImportance;

    /** Estado actual del hilo */
    status: ThreadStatus;

    /** IDs de misiones relacionadas con este hilo */
    relatedQuests: string[];

    /** Nombres de personajes involucrados */
    characters: string[];

    /** Pistas sembradas (foreshadowing) */
    foreshadowing: string[];
}

/**
 * Gancho para el próximo capítulo
 */
export interface IChapterHook {
    /** ID único del gancho */
    id: string;

    /** Tipo de gancho */
    type: HookType;

    /** Descripción del gancho */
    description: string;

    /** Urgencia del gancho */
    urgency: HookUrgency;

    /** Capítulos antes de que expire (opcional) */
    expiresIn?: number | undefined;
}

/**
 * Evento narrativo registrado
 */
export interface INarrativeEvent {
    /** Timestamp del evento */
    timestamp: Date;

    /** Fase en la que ocurrió */
    phase: NarrativePhase;

    /** Tipo de evento */
    type: NarrativeEventType;

    /** Descripción del evento */
    description: string;

    /** Impacto del evento */
    impact: NarrativeImpact;

    /** Cambio en tensión (-20 a +20) */
    tensionChange: number;
}

// ============================================================================
// INTERFACES DE CONFIGURACIÓN Y PLANTILLAS
// ============================================================================

/**
 * Plantilla para generar capítulos
 */
export interface IChapterTemplate {
    /** ID único de la plantilla */
    id: string;

    /** Tipo de capítulo que genera */
    type: ChapterType;

    /** Nombre de la plantilla */
    name: string;

    /** Descripción breve */
    description: string;

    /** Requisitos para que esta plantilla sea elegible */
    requirements?: IChapterRequirements;

    /** Configuración del gancho inicial */
    hookConfig: IHookConfig;

    /** Complicaciones posibles durante desarrollo */
    complications: IComplication[];

    /** Configuración del clímax */
    climaxConfig: IClimaxConfig;

    /** Posibles resoluciones */
    resolutions: IResolutionConfig[];

    /** Peso para selección aleatoria (mayor = más probable) */
    weight: number;

    /** Variables de la plantilla para reemplazo dinámico */
    variables?: Record<string, string[]>;
}

/**
 * Requisitos para elegibilidad de una plantilla
 */
export interface IChapterRequirements {
    /** Nivel mínimo del jugador */
    minLevel?: number;

    /** Nivel máximo del jugador */
    maxLevel?: number;

    /** IDs de capítulos que deben estar completados */
    completedChapters?: string[];

    /** Items que el jugador debe tener */
    hasItem?: string[];

    /** Locaciones donde el jugador debe estar */
    inLocation?: string[];

    /** Reputación mínima con facciones */
    minReputation?: Record<string, number>;
}

/**
 * Configuración del gancho inicial
 */
export interface IHookConfig {
    /** Tipo de gancho inicial */
    type: 'ATTACK' | 'DISCOVERY' | 'REQUEST' | 'OMEN' | 'ARRIVAL';

    /** Boost de tensión al iniciar */
    tensionBoost: number;

    /** Template de prompt para la IA */
    promptTemplate: string;

    /** IDs de misiones que pueden activarse */
    possibleQuests: string[];
}

/**
 * Complicación durante el desarrollo
 */
export interface IComplication {
    /** ID único de la complicación */
    id: string;

    /** Condición que dispara la complicación */
    trigger: IComplicationTrigger;

    /** Descripción de la complicación */
    description: string;

    /** Cambio en tensión */
    tensionChange: number;

    /** Nuevo hilo narrativo que introduce (opcional) */
    newThread?: Partial<INarrativeThread>;
}

/**
 * Tipos de trigger para complicaciones
 */
export type IComplicationTrigger =
    | { type: 'time'; afterMinutes: number }
    | { type: 'progress'; atPercent: number }
    | { type: 'action'; playerAction: string }
    | { type: 'random'; chance: number };

/**
 * Configuración del clímax
 */
export interface IClimaxConfig {
    /** Tipo de clímax */
    type: 'BOSS_FIGHT' | 'FINAL_CHOICE' | 'REVELATION' | 'ESCAPE' | 'SHOWDOWN';

    /** Multiplicador de dificultad de enemigos */
    enemyScaling: number;

    /** Hilos que deben estar resueltos antes */
    requiredThreadsResolved: number;

    /** Template de prompt para la IA */
    promptTemplate: string;
}

/**
 * Condición para resolución
 */
export type IResolutionCondition =
    | { type: 'boss_defeated' }
    | { type: 'mystery_solved' }
    | { type: 'main_objective_complete' }
    | { type: 'objective_complete'; objectiveId: string }
    | { type: 'time_elapsed'; minutes: number }
    | { type: 'choice_made'; choiceId: string }
    | { type: 'antagonist_dealt' };

/**
 * Configuración de resolución
 */
export interface IResolutionConfig {
    /** Resultado de esta resolución */
    outcome: ChapterOutcome;

    /** Condiciones necesarias */
    conditions: IResolutionCondition[];

    /** Recompensas del capítulo */
    rewards: IChapterReward;

    /** Ganchos para el próximo capítulo */
    nextHooks: Partial<IChapterHook>[];

    /** Template de prompt para epílogo */
    epiloguePrompt: string;
}

/**
 * Recompensas de capítulo
 */
export interface IChapterReward {
    /** Multiplicador de XP (1.0 = normal) */
    xpMultiplier: number;

    /** Multiplicador de oro */
    goldMultiplier: number;

    /** Items bonus (opcional) */
    bonusItems?: string[];

    /** Cambios de reputación con facciones */
    reputationChanges?: Array<{ faction: string; amount: number }>;

    /** Contenido desbloqueado */
    unlockedContent?: string[];
}

// ============================================================================
// INTERFACES DE TRANSICIÓN DE FASE
// ============================================================================

/**
 * Condición para transición de fase
 */
export type IPhaseTransitionCondition =
    | { type: 'time_elapsed'; min: number; max?: number }
    | { type: 'event_triggered'; event: string }
    | { type: 'player_action'; action: string }
    | { type: 'progress'; min: number }
    | { type: 'narrative_threads_ready'; count: number }
    | { type: 'boss_defeated'; required: boolean }
    | { type: 'main_objective_complete'; required: boolean };

/**
 * Configuración de transición entre fases
 */
export interface IPhaseTransition {
    /** De qué fase */
    from: NarrativePhase;

    /** A qué fase */
    to: NarrativePhase;

    /** Condiciones necesarias */
    conditions: IPhaseTransitionCondition[];

    /** Todas deben cumplirse (true) o solo algunas (false) */
    requireAll: boolean;

    /** Mínimo de condiciones a cumplir si requireAll=false */
    minConditions?: number;
}

// ============================================================================
// INTERFACES DE CONTEXTO PARA IA
// ============================================================================

/**
 * Contexto narrativo para generar prompts de IA
 */
export interface INarrativeContext {
    /** Estado narrativo actual */
    state: INarrativeState;

    /** Instrucciones específicas de la fase */
    phaseInstructions: string;

    /** Guía de tensión */
    tensionGuidance: string;

    /** Resumen de hilos formateado */
    threadsSummary: string;

    /** Eventos recientes relevantes */
    recentEvents: INarrativeEvent[];
}

/**
 * Resultado de evaluar el progreso narrativo
 */
export interface INarrativeProgress {
    /** Debería transicionar a nueva fase */
    shouldTransition: boolean;

    /** Nueva fase si shouldTransition=true */
    nextPhase?: NarrativePhase | undefined;

    /** Complicaciones activadas */
    triggeredComplications: IComplication[];

    /** Cambio sugerido de tensión */
    tensionDelta: number;

    /** Razón del resultado */
    reason: string;
}

// ============================================================================
// INTERFACES DE EVENTOS
// ============================================================================

/**
 * Evento emitido cuando cambia la fase narrativa
 */
export interface IPhaseChangeEvent {
    /** Fase anterior */
    previousPhase: NarrativePhase;

    /** Nueva fase */
    newPhase: NarrativePhase;

    /** Tiempo en fase anterior (ms) */
    timeInPreviousPhase: number;

    /** Estado narrativo actual */
    state: INarrativeState;
}

/**
 * Evento emitido cuando se completa un capítulo
 */
export interface IChapterCompleteEvent {
    /** Capítulo completado */
    chapter: IChapterState;

    /** Resultado del capítulo */
    outcome: ChapterOutcome;

    /** Recompensas otorgadas */
    rewards: IChapterReward;

    /** Ganchos para el próximo capítulo */
    nextHooks: IChapterHook[];

    /** Duración total del capítulo (ms) */
    duration: number;
}

/**
 * Evento emitido cuando cambia la tensión dramática
 */
export interface ITensionChangeEvent {
    /** Tensión anterior */
    previousTension: number;

    /** Nueva tensión */
    newTension: number;

    /** Razón del cambio */
    reason: string;

    /** Fase actual */
    phase: NarrativePhase;
}
