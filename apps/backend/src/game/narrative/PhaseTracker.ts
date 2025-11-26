/**
 * M2: Sistema de Arco Narrativo - PhaseTracker
 *
 * Gestiona las transiciones entre fases narrativas (HOOK → DEVELOPMENT → CLIMAX → RESOLUTION)
 * y evalúa las condiciones para avanzar en el arco narrativo.
 */

import type {
    NarrativePhase,
    IPhaseTransition,
    IPhaseTransitionCondition,
    INarrativeState,
    INarrativeProgress,
    IComplication,
    IChapterTemplate,
    INarrativeEvent,
    NarrativeImpact,
} from './NarrativeInterfaces.js';

// ============================================================================
// CONFIGURACIÓN DE TRANSICIONES
// ============================================================================

/**
 * Configuración por defecto de transiciones entre fases
 */
export const DEFAULT_PHASE_TRANSITIONS: IPhaseTransition[] = [
    {
        from: 'HOOK',
        to: 'DEVELOPMENT',
        conditions: [
            { type: 'time_elapsed', min: 2, max: 5 },
            { type: 'event_triggered', event: 'hook_resolved' },
            { type: 'player_action', action: 'accepted_quest' },
        ],
        requireAll: false,
        minConditions: 1,
    },
    {
        from: 'DEVELOPMENT',
        to: 'CLIMAX',
        conditions: [
            { type: 'progress', min: 60 },
            { type: 'time_elapsed', min: 15 },
            { type: 'narrative_threads_ready', count: 2 },
        ],
        requireAll: false,
        minConditions: 2,
    },
    {
        from: 'CLIMAX',
        to: 'RESOLUTION',
        conditions: [
            { type: 'boss_defeated', required: true },
            { type: 'main_objective_complete', required: true },
        ],
        requireAll: false,
        minConditions: 1,
    },
];

/**
 * Porcentaje de progreso típico por fase
 */
export const PHASE_PROGRESS_RANGES: Record<NarrativePhase, { min: number; max: number }> = {
    HOOK: { min: 0, max: 15 },
    DEVELOPMENT: { min: 15, max: 65 },
    CLIMAX: { min: 65, max: 85 },
    RESOLUTION: { min: 85, max: 100 },
};

/**
 * Tensión base por fase
 */
export const PHASE_BASE_TENSION: Record<NarrativePhase, { min: number; target: number; max: number }> = {
    HOOK: { min: 20, target: 35, max: 50 },
    DEVELOPMENT: { min: 30, target: 50, max: 70 },
    CLIMAX: { min: 60, target: 80, max: 100 },
    RESOLUTION: { min: 10, target: 30, max: 50 },
};

// ============================================================================
// PHASE TRACKER CLASS
// ============================================================================

/**
 * PhaseTracker - Gestiona transiciones y progreso de fases narrativas
 */
export class PhaseTracker {
    private transitions: IPhaseTransition[];

    private triggeredEvents: Set<string> = new Set();

    private playerActions: string[] = [];

    private phaseStartTime: number = Date.now();

    private bossDefeated: boolean = false;

    private mainObjectiveComplete: boolean = false;

    constructor(customTransitions?: IPhaseTransition[]) {
        this.transitions = customTransitions ?? DEFAULT_PHASE_TRANSITIONS;
    }

    // ==========================================================================
    // MÉTODOS PÚBLICOS
    // ==========================================================================

    /**
     * Evalúa si debería ocurrir una transición de fase
     */
    evaluateTransition(
        state: INarrativeState,
        template: IChapterTemplate,
    ): INarrativeProgress {
        const currentPhase = state.phase;
        const transition = this.getTransitionForPhase(currentPhase);

        if (!transition) {
            return {
                shouldTransition: false,
                triggeredComplications: [],
                tensionDelta: 0,
                reason: 'No hay transición definida para esta fase',
            };
        }

        // Evaluar condiciones
        const { met, total, details } = this.evaluateConditions(
            transition.conditions,
            state,
        );

        // Determinar si se cumple el criterio
        const threshold = transition.requireAll
            ? total
            : (transition.minConditions ?? 1);
        const shouldTransition = met >= threshold;

        // Evaluar complicaciones si estamos en DEVELOPMENT
        const triggeredComplications =
            currentPhase === 'DEVELOPMENT'
                ? this.evaluateComplications(state, template)
                : [];

        // Calcular delta de tensión
        const tensionDelta = this.calculateTensionDelta(
            state,
            shouldTransition ? transition.to : currentPhase,
            triggeredComplications,
        );

        return {
            shouldTransition,
            nextPhase: shouldTransition ? transition.to : undefined,
            triggeredComplications,
            tensionDelta,
            reason: shouldTransition
                ? `Transición a ${transition.to}: ${details.join(', ')}`
                : `Condiciones: ${met}/${threshold} cumplidas`,
        };
    }

    /**
     * Registra un evento narrativo
     */
    registerEvent(eventName: string): void {
        this.triggeredEvents.add(eventName);
    }

    /**
     * Registra una acción del jugador
     */
    registerPlayerAction(action: string): void {
        this.playerActions.push(action);
    }

    /**
     * Marca el boss como derrotado
     */
    markBossDefeated(): void {
        this.bossDefeated = true;
    }

    /**
     * Marca el objetivo principal como completado
     */
    markMainObjectiveComplete(): void {
        this.mainObjectiveComplete = true;
    }

    /**
     * Reinicia el tracker para una nueva fase
     */
    resetForNewPhase(): void {
        this.phaseStartTime = Date.now();
        // Mantenemos eventos y acciones para continuidad
    }

    /**
     * Reinicia completamente el tracker para un nuevo capítulo
     */
    resetForNewChapter(): void {
        this.triggeredEvents.clear();
        this.playerActions = [];
        this.phaseStartTime = Date.now();
        this.bossDefeated = false;
        this.mainObjectiveComplete = false;
    }

    /**
     * Obtiene el tiempo en la fase actual (minutos)
     */
    getTimeInPhase(): number {
        return (Date.now() - this.phaseStartTime) / 60_000;
    }

    /**
     * Calcula el progreso general del capítulo (0-100)
     */
    calculateChapterProgress(state: INarrativeState): number {
        const phaseRange = PHASE_PROGRESS_RANGES[state.phase];
        const phaseSpan = phaseRange.max - phaseRange.min;

        // El progreso dentro de la fase contribuye al progreso total
        const inPhaseProgress = (state.phaseProgress / 100) * phaseSpan;

        return Math.min(100, phaseRange.min + inPhaseProgress);
    }

    /**
     * Genera un evento narrativo basado en lo ocurrido
     */
    createNarrativeEvent(
        type: INarrativeEvent['type'],
        description: string,
        phase: NarrativePhase,
        impact: NarrativeImpact = 'MODERATE',
    ): INarrativeEvent {
        const tensionChange = this.getTensionChangeForEventType(type, impact);

        return {
            timestamp: new Date(),
            phase,
            type,
            description,
            impact,
            tensionChange,
        };
    }

    // ==========================================================================
    // MÉTODOS PRIVADOS
    // ==========================================================================

    /**
     * Obtiene la transición configurada para una fase
     */
    private getTransitionForPhase(phase: NarrativePhase): IPhaseTransition | undefined {
        return this.transitions.find((t) => t.from === phase);
    }

    /**
     * Evalúa las condiciones de transición
     */
    private evaluateConditions(
        conditions: IPhaseTransitionCondition[],
        state: INarrativeState,
    ): { met: number; total: number; details: string[] } {
        let met = 0;
        const details: string[] = [];

        for (const condition of conditions) {
            const result = this.evaluateSingleCondition(condition, state);
            if (result.met) {
                met++;
                details.push(result.reason);
            }
        }

        return { met, total: conditions.length, details };
    }

    /**
     * Evalúa una condición individual
     */
    private evaluateSingleCondition(
        condition: IPhaseTransitionCondition,
        state: INarrativeState,
    ): { met: boolean; reason: string } {
        switch (condition.type) {
            case 'time_elapsed': {
                const timeInPhase = this.getTimeInPhase();
                const met = timeInPhase >= condition.min;
                return {
                    met,
                    reason: met
                        ? `Tiempo transcurrido: ${timeInPhase.toFixed(1)} min`
                        : `Tiempo insuficiente: ${timeInPhase.toFixed(1)}/${condition.min} min`,
                };
            }

            case 'event_triggered': {
                const met = this.triggeredEvents.has(condition.event);
                return {
                    met,
                    reason: met
                        ? `Evento '${condition.event}' ocurrió`
                        : `Evento '${condition.event}' pendiente`,
                };
            }

            case 'player_action': {
                const met = this.playerActions.includes(condition.action);
                return {
                    met,
                    reason: met
                        ? `Acción '${condition.action}' realizada`
                        : `Acción '${condition.action}' pendiente`,
                };
            }

            case 'progress': {
                const progress = this.calculateChapterProgress(state);
                const met = progress >= condition.min;
                return {
                    met,
                    reason: met
                        ? `Progreso: ${progress.toFixed(0)}%`
                        : `Progreso insuficiente: ${progress.toFixed(0)}/${condition.min}%`,
                };
            }

            case 'narrative_threads_ready': {
                const readyThreads = state.threads.filter(
                    (t) => t.status === 'READY_FOR_RESOLUTION',
                ).length;
                const met = readyThreads >= condition.count;
                return {
                    met,
                    reason: met
                        ? `${readyThreads} hilos listos para resolución`
                        : `Hilos listos: ${readyThreads}/${condition.count}`,
                };
            }

            case 'boss_defeated': {
                return {
                    met: this.bossDefeated,
                    reason: this.bossDefeated ? 'Boss derrotado' : 'Boss pendiente',
                };
            }

            case 'main_objective_complete': {
                return {
                    met: this.mainObjectiveComplete,
                    reason: this.mainObjectiveComplete
                        ? 'Objetivo principal completado'
                        : 'Objetivo principal pendiente',
                };
            }

            default:
                return { met: false, reason: 'Condición desconocida' };
        }
    }

    /**
     * Evalúa qué complicaciones deberían activarse
     */
    private evaluateComplications(
        state: INarrativeState,
        template: IChapterTemplate,
    ): IComplication[] {
        const triggered: IComplication[] = [];
        const progress = this.calculateChapterProgress(state);
        const timeInPhase = this.getTimeInPhase();

        for (const complication of template.complications) {
            // Verificar si ya fue activada (por ID en el log de eventos)
            const alreadyTriggered = state.narrativeLog.some(
                (e) => e.description.includes(complication.id),
            );

            if (alreadyTriggered) continue;

            const shouldTrigger = this.shouldTriggerComplication(
                complication,
                progress,
                timeInPhase,
            );

            if (shouldTrigger) {
                triggered.push(complication);
            }
        }

        return triggered;
    }

    /**
     * Evalúa si una complicación específica debería activarse
     */
    private shouldTriggerComplication(
        complication: IComplication,
        progress: number,
        timeInPhase: number,
    ): boolean {
        const { trigger } = complication;

        switch (trigger.type) {
            case 'time':
                return timeInPhase >= trigger.afterMinutes;

            case 'progress':
                return progress >= trigger.atPercent;

            case 'action':
                return this.playerActions.includes(trigger.playerAction);

            case 'random':
                return Math.random() < trigger.chance;

            default:
                return false;
        }
    }

    /**
     * Calcula el cambio de tensión basado en la situación
     */
    private calculateTensionDelta(
        state: INarrativeState,
        targetPhase: NarrativePhase,
        complications: IComplication[],
    ): number {
        let delta = 0;

        // Tensión por complicaciones
        for (const comp of complications) {
            delta += comp.tensionChange;
        }

        // Ajuste hacia tensión objetivo de la fase
        const targetRange = PHASE_BASE_TENSION[targetPhase];
        const currentTension = state.tensionLevel;

        if (currentTension < targetRange.min) {
            delta += 5; // Subir gradualmente
        } else if (currentTension > targetRange.max) {
            delta -= 5; // Bajar gradualmente
        } else if (currentTension < targetRange.target) {
            delta += 2; // Acercarse al objetivo
        } else if (currentTension > targetRange.target) {
            delta -= 2;
        }

        return delta;
    }

    /**
     * Obtiene el cambio de tensión para un tipo de evento
     */
    private getTensionChangeForEventType(
        type: INarrativeEvent['type'],
        impact: NarrativeImpact,
    ): number {
        const impactMultiplier: Record<NarrativeImpact, number> = {
            MINOR: 0.5,
            MODERATE: 1,
            MAJOR: 1.5,
            PIVOTAL: 2,
        };

        const baseTension: Record<INarrativeEvent['type'], number> = {
            HOOK_TRIGGERED: 15,
            COMPLICATION_ADDED: 10,
            ALLY_GAINED: -5,
            ALLY_LOST: 12,
            REVELATION: 8,
            SETBACK: 10,
            BREAKTHROUGH: -8,
            CONFRONTATION: 15,
            RESOLUTION: -15,
            CLIFFHANGER: 5,
        };

        const base = baseTension[type] ?? 0;
        return Math.round(base * impactMultiplier[impact]);
    }
}

// ============================================================================
// FUNCIONES AUXILIARES EXPORTADAS
// ============================================================================

/**
 * Obtiene la fase siguiente en el orden natural
 */
export function getNextPhase(current: NarrativePhase): NarrativePhase | null | undefined {
    const order: NarrativePhase[] = ['HOOK', 'DEVELOPMENT', 'CLIMAX', 'RESOLUTION'];
    const currentIndex = order.indexOf(current);

    if (currentIndex === -1 || currentIndex === order.length - 1) {
        return null;
    }

    return order[currentIndex + 1];
}

/**
 * Verifica si una fase viene después de otra
 */
export function isPhaseAfter(phase: NarrativePhase, afterPhase: NarrativePhase): boolean {
    const order: NarrativePhase[] = ['HOOK', 'DEVELOPMENT', 'CLIMAX', 'RESOLUTION'];
    return order.indexOf(phase) > order.indexOf(afterPhase);
}

/**
 * Obtiene el nombre amigable de una fase
 */
export function getPhaseName(phase: NarrativePhase): string {
    const names: Record<NarrativePhase, string> = {
        HOOK: 'Gancho Inicial',
        DEVELOPMENT: 'Desarrollo',
        CLIMAX: 'Clímax',
        RESOLUTION: 'Resolución',
    };
    return names[phase];
}
