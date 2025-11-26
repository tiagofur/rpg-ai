/**
 * M2: Sistema de Arco Narrativo
 *
 * Exportaciones del módulo de narrativa que convierte sesiones de juego
 * en capítulos con estructura de 3 actos (Hook → Development → Climax → Resolution).
 */

// Interfaces y tipos
export type {
    // Tipos base
    NarrativePhase,
    ChapterType,
    ChapterOutcome,
    ThreadImportance,
    ThreadStatus,
    HookType,
    HookUrgency,
    AntagonistType,
    NarrativeImpact,
    NarrativeEventType,
    // Interfaces principales
    INarrativeState,
    IChapterState,
    IAntagonist,
    INarrativeThread,
    IChapterHook,
    INarrativeEvent,
    // Configuración y plantillas
    IChapterTemplate,
    IChapterRequirements,
    IHookConfig,
    IComplication,
    IComplicationTrigger,
    IClimaxConfig,
    IResolutionCondition,
    IResolutionConfig,
    IChapterReward,
    // Transiciones
    IPhaseTransitionCondition,
    IPhaseTransition,
    // Contexto IA
    INarrativeContext,
    INarrativeProgress,
    // Eventos
    IPhaseChangeEvent,
    IChapterCompleteEvent,
    ITensionChangeEvent,
} from './NarrativeInterfaces.js';

// PhaseTracker
export {
    PhaseTracker,
    DEFAULT_PHASE_TRANSITIONS,
    PHASE_PROGRESS_RANGES,
    PHASE_BASE_TENSION,
    getNextPhase,
    isPhaseAfter,
    getPhaseName,
} from './PhaseTracker.js';

// ChapterTemplates
export {
    // Plantillas individuales
    CHAPTER_TUTORIAL,
    CHAPTER_HIDDEN_THREAT,
    CHAPTER_INCOMING_HORDE,
    CHAPTER_BEYOND_THE_MAP,
    CHAPTER_LURKING_DARKNESS,
    // Colecciones
    ALL_CHAPTER_TEMPLATES,
    CHAPTER_TEMPLATES_BY_ID,
    CHAPTER_TEMPLATES_BY_TYPE,
    // Funciones
    getEligibleTemplates,
    selectWeightedTemplate,
    interpolateTemplate,
    selectTemplateVariables,
} from './ChapterTemplates.js';

// NarrativeManager
export {
    NarrativeManager,
    createNarrativeManager,
    type NarrativeManagerEvents,
} from './NarrativeManager.js';
