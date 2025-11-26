/**
 * M2: Sistema de Arco Narrativo - NarrativeManager
 *
 * Orquestador principal del sistema narrativo. Gestiona:
 * - Generación y transición de capítulos
 * - Progreso de fases narrativas
 * - Hilos narrativos y tensión dramática
 * - Integración con otros sistemas (quests, combat, loot)
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';

import type {
    INarrativeState,
    IChapterState,
    INarrativeThread,
    IChapterHook,
    IChapterTemplate,
    INarrativeContext,
    NarrativePhase,
    ChapterOutcome,
    NarrativeEventType,
    NarrativeImpact,
    IPhaseChangeEvent,
    IChapterCompleteEvent,
    ITensionChangeEvent,
} from './NarrativeInterfaces.js';

import { PhaseTracker, getPhaseName } from './PhaseTracker.js';
import {
    ALL_CHAPTER_TEMPLATES,
    CHAPTER_TEMPLATES_BY_ID,
    getEligibleTemplates,
    selectWeightedTemplate,
    selectTemplateVariables,
    interpolateTemplate,
} from './ChapterTemplates.js';

// ============================================================================
// TIPOS DE EVENTOS
// ============================================================================

export interface NarrativeManagerEvents {
    'phase:changed': (event: IPhaseChangeEvent) => void;
    'chapter:started': (chapter: IChapterState) => void;
    'chapter:completed': (event: IChapterCompleteEvent) => void;
    'tension:changed': (event: ITensionChangeEvent) => void;
    'thread:introduced': (thread: INarrativeThread) => void;
    'thread:resolved': (thread: INarrativeThread) => void;
    'complication:triggered': (description: string) => void;
    'hook:created': (hook: IChapterHook) => void;
}

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

/**
 * NarrativeManager - Orquestador del sistema de arco narrativo
 */
export class NarrativeManager extends EventEmitter {
    private state: INarrativeState;

    private phaseTracker: PhaseTracker;

    private currentTemplate: IChapterTemplate | null = null;

    private templateVariables: Record<string, string> = {};

    private sessionStartTime: number;

    // Datos del jugador (para evaluar elegibilidad de plantillas)
    private playerLevel: number = 1;

    private completedChapterIds: string[] = [];

    private currentLocation?: string;

    private playerInventory: string[] = [];

    constructor() {
        super();
        this.phaseTracker = new PhaseTracker();
        this.sessionStartTime = Date.now();
        this.state = this.createInitialState();
    }

    // ==========================================================================
    // GETTERS PÚBLICOS
    // ==========================================================================

    /**
     * Obtiene el estado narrativo actual
     */
    getState(): Readonly<INarrativeState> {
        return { ...this.state };
    }

    /**
     * Obtiene la fase actual
     */
    getCurrentPhase(): NarrativePhase {
        return this.state.phase;
    }

    /**
     * Obtiene el capítulo actual
     */
    getCurrentChapter(): Readonly<IChapterState> | null {
        return this.state.chapter ? { ...this.state.chapter } : null;
    }

    /**
     * Obtiene el nivel de tensión actual (0-100)
     */
    getTensionLevel(): number {
        return this.state.tensionLevel;
    }

    /**
     * Obtiene los hilos narrativos activos
     */
    getActiveThreads(): INarrativeThread[] {
        return this.state.threads.filter((t) => t.status !== 'RESOLVED');
    }

    /**
     * Obtiene la plantilla actual
     */
    getCurrentTemplate(): IChapterTemplate | null {
        return this.currentTemplate;
    }

    // ==========================================================================
    // CONFIGURACIÓN DEL JUGADOR
    // ==========================================================================

    /**
     * Actualiza los datos del jugador para elegibilidad de plantillas
     */
    updatePlayerContext(context: {
        level?: number;
        completedChapters?: string[];
        location?: string;
        inventory?: string[];
    }): void {
        if (context.level !== undefined) this.playerLevel = context.level;
        if (context.completedChapters) this.completedChapterIds = context.completedChapters;
        if (context.location !== undefined) this.currentLocation = context.location;
        if (context.inventory) this.playerInventory = context.inventory;
    }

    // ==========================================================================
    // GESTIÓN DE CAPÍTULOS
    // ==========================================================================

    /**
     * Inicia un nuevo capítulo seleccionando una plantilla elegible
     */
    startNewChapter(forceTemplateId?: string): IChapterState {
        // Limpiar estado anterior
        this.phaseTracker.resetForNewChapter();

        // Seleccionar plantilla
        let template: IChapterTemplate | undefined;

        if (forceTemplateId) {
            template = CHAPTER_TEMPLATES_BY_ID[forceTemplateId];
        }

        if (!template) {
            const eligible = getEligibleTemplates(
                this.playerLevel,
                this.completedChapterIds,
                this.currentLocation,
                this.playerInventory,
            );

            if (eligible.length === 0) {
                // Fallback al tutorial si no hay plantillas elegibles
                template = CHAPTER_TEMPLATES_BY_ID['chapter_tutorial'] ?? ALL_CHAPTER_TEMPLATES[0];
            } else {
                template = selectWeightedTemplate(eligible);
            }
        }

        if (!template) {
            throw new Error('No se pudo seleccionar ninguna plantilla de capítulo');
        }

        this.currentTemplate = template;
        this.templateVariables = selectTemplateVariables(template);

        // Crear el capítulo
        const chapterNumber = this.completedChapterIds.length + 1;
        const chapter = this.createChapterFromTemplate(template, chapterNumber);

        // Configurar estado inicial
        this.state = {
            chapter,
            phase: 'HOOK',
            phaseProgress: 0,
            tensionLevel: template.hookConfig.tensionBoost,
            threads: [],
            nextChapterHooks: [],
            sessionTime: 0,
            narrativeLog: [],
        };

        // Registrar evento de inicio
        this.addNarrativeEvent('HOOK_TRIGGERED', `Capítulo iniciado: ${chapter.title}`, 'MAJOR');

        // Emitir evento
        this.emit('chapter:started', chapter);

        return chapter;
    }

    /**
     * Completa el capítulo actual con un resultado específico
     */
    completeChapter(outcome: ChapterOutcome): IChapterCompleteEvent {
        if (!this.state.chapter || !this.currentTemplate) {
            throw new Error('No hay capítulo activo para completar');
        }

        // Buscar la resolución correspondiente
        const resolution = this.currentTemplate.resolutions.find((r) => r.outcome === outcome);

        if (!resolution) {
            throw new Error(`No se encontró resolución para outcome: ${outcome}`);
        }

        // Actualizar capítulo
        this.state.chapter.completed = true;
        this.state.chapter.outcome = outcome;

        // Calcular duración
        const duration = Date.now() - this.state.chapter.startedAt.getTime();

        // Crear ganchos para el próximo capítulo
        const nextHooks: IChapterHook[] = resolution.nextHooks.map((partial) => ({
            id: partial.id ?? uuidv4(),
            type: partial.type ?? 'MYSTERY',
            description: this.interpolate(partial.description ?? ''),
            urgency: partial.urgency ?? 'MEDIUM',
            expiresIn: partial.expiresIn,
        }));

        this.state.nextChapterHooks = nextHooks;

        // Registrar evento
        this.addNarrativeEvent('RESOLUTION', `Capítulo completado: ${outcome}`, 'PIVOTAL');

        // Guardar ID del capítulo completado
        this.completedChapterIds.push(this.state.chapter.id);

        const event: IChapterCompleteEvent = {
            chapter: this.state.chapter,
            outcome,
            rewards: resolution.rewards,
            nextHooks,
            duration,
        };

        this.emit('chapter:completed', event);

        // Emitir hooks
        for (const hook of nextHooks) {
            this.emit('hook:created', hook);
        }

        return event;
    }

    // ==========================================================================
    // GESTIÓN DE FASES
    // ==========================================================================

    /**
     * Evalúa y procesa el progreso narrativo
     * Llamar periódicamente o después de acciones significativas
     */
    evaluateProgress(): void {
        if (!this.currentTemplate) return;

        // Actualizar tiempo de sesión
        this.state.sessionTime = Date.now() - this.sessionStartTime;

        // Evaluar transición
        const progress = this.phaseTracker.evaluateTransition(this.state, this.currentTemplate);

        // Procesar complicaciones
        for (const complication of progress.triggeredComplications) {
            this.triggerComplication(complication);
        }

        // Aplicar delta de tensión
        if (progress.tensionDelta !== 0) {
            this.adjustTension(progress.tensionDelta, progress.reason);
        }

        // Transicionar si es necesario
        if (progress.shouldTransition && progress.nextPhase) {
            this.transitionToPhase(progress.nextPhase);
        }
    }

    /**
     * Avanza manualmente el progreso de la fase actual
     */
    advancePhaseProgress(amount: number): void {
        this.state.phaseProgress = Math.min(100, Math.max(0, this.state.phaseProgress + amount));
        this.evaluateProgress();
    }

    /**
     * Fuerza una transición de fase (para pruebas o narrativas especiales)
     */
    forcePhaseTransition(targetPhase: NarrativePhase): void {
        this.transitionToPhase(targetPhase);
    }

    // ==========================================================================
    // GESTIÓN DE HILOS NARRATIVOS
    // ==========================================================================

    /**
     * Introduce un nuevo hilo narrativo
     */
    introduceThread(thread: Omit<INarrativeThread, 'id' | 'status'>): INarrativeThread {
        const newThread: INarrativeThread = {
            id: uuidv4(),
            status: 'INTRODUCED',
            ...thread,
        };

        this.state.threads.push(newThread);
        this.emit('thread:introduced', newThread);

        return newThread;
    }

    /**
     * Avanza el estado de un hilo narrativo
     */
    advanceThread(
        threadId: string,
        newStatus: INarrativeThread['status'],
        additionalForeshadowing?: string,
    ): void {
        const thread = this.state.threads.find((t) => t.id === threadId);
        if (!thread) return;

        thread.status = newStatus;

        if (additionalForeshadowing) {
            thread.foreshadowing.push(additionalForeshadowing);
        }

        if (newStatus === 'RESOLVED') {
            this.emit('thread:resolved', thread);
        }
    }

    /**
     * Resuelve un hilo narrativo
     */
    resolveThread(threadId: string): void {
        this.advanceThread(threadId, 'RESOLVED');
    }

    // ==========================================================================
    // GESTIÓN DE TENSIÓN
    // ==========================================================================

    /**
     * Ajusta el nivel de tensión dramática
     */
    adjustTension(delta: number, reason: string): void {
        const previousTension = this.state.tensionLevel;
        this.state.tensionLevel = Math.max(0, Math.min(100, this.state.tensionLevel + delta));

        if (this.state.tensionLevel !== previousTension) {
            const event: ITensionChangeEvent = {
                previousTension,
                newTension: this.state.tensionLevel,
                reason,
                phase: this.state.phase,
            };

            this.emit('tension:changed', event);
        }
    }

    /**
     * Establece la tensión a un valor específico
     */
    setTension(value: number, reason: string): void {
        const delta = value - this.state.tensionLevel;
        this.adjustTension(delta, reason);
    }

    // ==========================================================================
    // REGISTRO DE EVENTOS
    // ==========================================================================

    /**
     * Registra una acción del jugador (para evaluación de transiciones)
     */
    registerPlayerAction(action: string): void {
        this.phaseTracker.registerPlayerAction(action);

        // Algunas acciones tienen efectos narrativos directos
        switch (action) {
            case 'accepted_quest':
                this.advancePhaseProgress(10);
                break;
            case 'completed_quest':
                this.advancePhaseProgress(15);
                break;
            case 'defeated_enemy':
                this.advancePhaseProgress(5);
                this.adjustTension(3, 'Enemigo derrotado');
                break;
        }
    }

    /**
     * Registra que el boss fue derrotado
     */
    registerBossDefeated(): void {
        this.phaseTracker.markBossDefeated();
        this.addNarrativeEvent('CONFRONTATION', 'Boss derrotado', 'PIVOTAL');
        this.evaluateProgress();
    }

    /**
     * Registra que el objetivo principal fue completado
     */
    registerMainObjectiveComplete(): void {
        this.phaseTracker.markMainObjectiveComplete();
        this.addNarrativeEvent('BREAKTHROUGH', 'Objetivo principal completado', 'MAJOR');
        this.evaluateProgress();
    }

    // ==========================================================================
    // CONTEXTO PARA IA
    // ==========================================================================

    /**
     * Genera el contexto narrativo para enviar a la IA
     */
    generateNarrativeContext(): INarrativeContext {
        const phaseInstructions = this.getPhaseInstructions();
        const tensionGuidance = this.getTensionGuidance();
        const threadsSummary = this.formatThreadsSummary();
        const recentEvents = this.state.narrativeLog.slice(-5);

        return {
            state: this.state,
            phaseInstructions,
            tensionGuidance,
            threadsSummary,
            recentEvents,
        };
    }

    /**
     * Genera el prompt de contexto formateado para la IA
     */
    generateContextPrompt(): string {
        const context = this.generateNarrativeContext();
        const { chapter } = this.state;

        return `
═══════════════════════════════════════════════════════════
CONTEXTO NARRATIVO - CAPÍTULO ${chapter?.number ?? 1}: ${chapter?.title ?? 'Sin título'}
═══════════════════════════════════════════════════════════

FASE ACTUAL: ${getPhaseName(this.state.phase)} (${this.state.phaseProgress.toFixed(0)}% completado)
TENSIÓN DRAMÁTICA: ${this.state.tensionLevel}/100

CONFLICTO PRINCIPAL:
${chapter?.mainConflict ?? 'Sin definir'}

${chapter?.antagonist ? `ANTAGONISTA: ${chapter.antagonist.name}
Motivación: ${chapter.antagonist.motivation}
Nivel de amenaza: ${chapter.antagonist.threatLevel}/10` : ''}

${context.threadsSummary}

═══════════════════════════════════════════════════════════
INSTRUCCIONES PARA ESTA FASE (${getPhaseName(this.state.phase)})
═══════════════════════════════════════════════════════════

${context.phaseInstructions}

${context.tensionGuidance}

EVENTOS RECIENTES:
${context.recentEvents.map((e) => `- [${e.impact}] ${e.description}`).join('\n')}

REGLAS NARRATIVAS:
- Mantén consistencia con eventos previos del log
- No resuelvas hilos principales en DEVELOPMENT
- Siembra pistas para revelaciones futuras (foreshadowing)
- Cada respuesta debe avanzar al menos un hilo
- Ofrece opciones con consecuencias significativas
`.trim();
    }

    // ==========================================================================
    // INTEGRACIÓN CON OTROS SISTEMAS
    // ==========================================================================

    /**
     * Obtiene el escalado de combate según la fase narrativa
     */
    getCombatScaling(): number {
        if (!this.currentTemplate) return 1;

        const baseScaling = this.currentTemplate.climaxConfig.enemyScaling;

        switch (this.state.phase) {
            case 'HOOK':
                return baseScaling * 0.7; // Encuentros introductorios
            case 'DEVELOPMENT':
                return baseScaling * 0.9; // Desafío moderado
            case 'CLIMAX':
                return baseScaling * 1.2; // Máxima dificultad
            case 'RESOLUTION':
                return baseScaling * 0.5; // Limpieza fácil
        }
    }

    /**
     * Obtiene modificadores de loot según el momento narrativo
     */
    getLootModifiers(): { qualityBonus: number; uniqueChance: number } {
        return {
            qualityBonus: this.state.phase === 'RESOLUTION' ? 0.3 : 0,
            uniqueChance: this.state.phase === 'CLIMAX' ? 0.1 : 0.02,
        };
    }

    /**
     * Sugiere IDs de misiones apropiadas para la fase actual
     */
    getSuggestedQuests(): string[] {
        if (!this.currentTemplate) return [];

        switch (this.state.phase) {
            case 'HOOK':
                return this.currentTemplate.hookConfig.possibleQuests;
            case 'DEVELOPMENT':
                // Misiones de desarrollo podrían venir de complicaciones activadas
                return this.state.threads
                    .filter((t) => t.status !== 'RESOLVED')
                    .flatMap((t) => t.relatedQuests);
            case 'CLIMAX':
            case 'RESOLUTION':
                return []; // No nuevas misiones, cerrar las existentes
        }
    }

    // ==========================================================================
    // MÉTODOS PRIVADOS
    // ==========================================================================

    /**
     * Crea el estado inicial vacío
     */
    private createInitialState(): INarrativeState {
        return {
            chapter: this.createEmptyChapter(),
            phase: 'HOOK',
            phaseProgress: 0,
            tensionLevel: 0,
            threads: [],
            nextChapterHooks: [],
            sessionTime: 0,
            narrativeLog: [],
        };
    }

    /**
     * Crea un capítulo vacío
     */
    private createEmptyChapter(): IChapterState {
        return {
            id: uuidv4(),
            number: 1,
            type: 'ACTION',
            title: 'Capítulo sin iniciar',
            mainConflict: '',
            setting: '',
            startedAt: new Date(),
            completed: false,
            templateId: '',
        };
    }

    /**
     * Crea un capítulo desde una plantilla
     */
    private createChapterFromTemplate(
        template: IChapterTemplate,
        chapterNumber: number,
    ): IChapterState {
        const chapter: IChapterState = {
            id: uuidv4(),
            number: chapterNumber,
            type: template.type,
            title: this.interpolate(template.name),
            mainConflict: this.interpolate(template.hookConfig.promptTemplate),
            setting: this.templateVariables['setting'] ?? 'un lugar misterioso',
            startedAt: new Date(),
            completed: false,
            templateId: template.id,
        };

        // Añadir antagonista si aplica
        if (this.templateVariables['antagonist']) {
            chapter.antagonist = {
                id: uuidv4(),
                name: this.templateVariables['antagonist'],
                type: 'NPC',
                motivation: this.templateVariables['motivation'] ?? 'desconocida',
                threatLevel: Math.min(10, Math.ceil(this.playerLevel * 1.5)),
                isRecurring: false,
            };
        }

        return chapter;
    }

    /**
     * Transiciona a una nueva fase narrativa
     */
    private transitionToPhase(newPhase: NarrativePhase): void {
        const previousPhase = this.state.phase;
        const timeInPrevious = this.phaseTracker.getTimeInPhase() * 60_000; // a ms

        this.state.phase = newPhase;
        this.state.phaseProgress = 0;
        this.phaseTracker.resetForNewPhase();

        // Ajustar tensión hacia el objetivo de la nueva fase
        this.adjustTensionForPhase(newPhase);

        // Registrar evento
        this.addNarrativeEvent(
            newPhase === 'RESOLUTION' ? 'RESOLUTION' : 'BREAKTHROUGH',
            `Transición a fase: ${getPhaseName(newPhase)}`,
            'MAJOR',
        );

        const event: IPhaseChangeEvent = {
            previousPhase,
            newPhase,
            timeInPreviousPhase: timeInPrevious,
            state: this.state,
        };

        this.emit('phase:changed', event);
    }

    /**
     * Ajusta la tensión al cambiar de fase
     */
    private adjustTensionForPhase(phase: NarrativePhase): void {
        const targetRanges: Record<NarrativePhase, { min: number; max: number }> = {
            HOOK: { min: 25, max: 45 },
            DEVELOPMENT: { min: 35, max: 60 },
            CLIMAX: { min: 70, max: 90 },
            RESOLUTION: { min: 20, max: 40 },
        };

        const range = targetRanges[phase];

        if (this.state.tensionLevel < range.min) {
            this.adjustTension(range.min - this.state.tensionLevel, `Ajuste para fase ${phase}`);
        } else if (this.state.tensionLevel > range.max) {
            this.adjustTension(range.max - this.state.tensionLevel, `Ajuste para fase ${phase}`);
        }
    }

    /**
     * Activa una complicación
     */
    private triggerComplication(complication: {
        id: string;
        description: string;
        tensionChange: number;
        newThread?: Partial<INarrativeThread>;
    }): void {
        // Registrar evento
        this.addNarrativeEvent(
            'COMPLICATION_ADDED',
            `${complication.id}: ${this.interpolate(complication.description)}`,
            'MODERATE',
        );

        // Aplicar tensión
        this.adjustTension(complication.tensionChange, `Complicación: ${complication.id}`);

        // Crear nuevo hilo si aplica
        if (complication.newThread) {
            const thread: INarrativeThread = {
                id: complication.newThread.id ?? uuidv4(),
                description: this.interpolate(complication.newThread.description ?? ''),
                importance: complication.newThread.importance ?? 'SIDE',
                status: 'INTRODUCED',
                relatedQuests: complication.newThread.relatedQuests ?? [],
                characters: (complication.newThread.characters ?? []).map((c) => this.interpolate(c)),
                foreshadowing: (complication.newThread.foreshadowing ?? []).map((f) =>
                    this.interpolate(f),
                ),
            };

            this.state.threads.push(thread);
            this.emit('thread:introduced', thread);
        }

        this.emit('complication:triggered', complication.description);
    }

    /**
     * Añade un evento al log narrativo
     */
    private addNarrativeEvent(
        type: NarrativeEventType,
        description: string,
        impact: NarrativeImpact,
    ): void {
        const event = this.phaseTracker.createNarrativeEvent(
            type,
            description,
            this.state.phase,
            impact,
        );

        this.state.narrativeLog.push(event);

        // Mantener solo los últimos 50 eventos
        if (this.state.narrativeLog.length > 50) {
            this.state.narrativeLog = this.state.narrativeLog.slice(-50);
        }
    }

    /**
     * Interpola variables en un texto
     */
    private interpolate(text: string): string {
        // Primero las variables de plantilla
        let result = interpolateTemplate(text, this.templateVariables);

        // Luego variables de contexto
        result = result.replace(/{{player_name}}/g, 'el héroe'); // TODO: obtener nombre real

        return result;
    }

    /**
     * Obtiene las instrucciones específicas de la fase actual
     */
    private getPhaseInstructions(): string {
        const instructions: Record<NarrativePhase, string> = {
            HOOK: `
OBJETIVO: Capturar la atención del jugador inmediatamente.

HACER:
- Comenzar con acción, misterio o revelación impactante
- Establecer las stakes (qué está en juego)
- Introducir el conflicto principal rápidamente
- Dar al jugador una razón personal para involucrarse

NO HACER:
- Exposición larga o lenta
- Introducir demasiados personajes de golpe
- Dar toda la información de una vez
- Resolver el misterio inicial
      `.trim(),

            DEVELOPMENT: `
OBJETIVO: Construir tensión gradualmente mientras el jugador investiga/avanza.

HACER:
- Añadir complicaciones que aumenten las stakes
- Revelar información parcial (pistas)
- Desarrollar personajes secundarios
- Crear momentos de respiro entre tensión
- Preparar elementos para el clímax

NO HACER:
- Resolver el conflicto principal todavía
- Mantener tensión máxima constante
- Introducir demasiados hilos nuevos
- Hacer que el jugador se sienta perdido
      `.trim(),

            CLIMAX: `
OBJETIVO: Llevar la tensión al máximo con el enfrentamiento principal.

HACER:
- Convergir todos los hilos hacia el momento decisivo
- Hacer que las decisiones del jugador importen
- Crear un enfrentamiento memorable
- Subir las stakes al máximo
- Permitir que el jugador use todo lo aprendido

NO HACER:
- Resolución fácil o anticlimática
- Introducir elementos nuevos importantes
- Quitar agencia al jugador
- Extender demasiado después del pico de tensión
      `.trim(),

            RESOLUTION: `
OBJETIVO: Cerrar satisfactoriamente mientras siembras interés futuro.

HACER:
- Mostrar consecuencias de las acciones del jugador
- Resolver los hilos principales (dejar 1-2 abiertos)
- Dar recompensas tangibles y emocionales
- Plantar semillas para el próximo capítulo
- Crear un momento de cierre natural

NO HACER:
- Terminar abruptamente sin cierre
- Introducir nuevos conflictos grandes
- Resolver TODO (necesitamos ganchos)
- Extender innecesariamente
      `.trim(),
        };

        return instructions[this.state.phase];
    }

    /**
     * Obtiene la guía de tensión según el nivel actual
     */
    private getTensionGuidance(): string {
        const tension = this.state.tensionLevel;

        if (tension < 20) {
            return `
TENSIÓN BAJA - Momento de respiro
- Permite exploración tranquila
- Desarrollo de personajes
- Preparación para lo que viene
- Puede subir tensión gradualmente
      `.trim();
        }

        if (tension < 50) {
            return `
TENSIÓN MEDIA - Avance con propósito
- Mantén sensación de progreso
- Añade complicaciones menores
- Mezcla acción con investigación
- Prepara revelaciones
      `.trim();
        }

        if (tension < 80) {
            return `
TENSIÓN ALTA - Camino al clímax
- Eventos se aceleran
- Decisiones tienen peso
- Menos tiempo para descanso
- Convergencia de hilos
      `.trim();
        }

        return `
TENSIÓN MÁXIMA - Clímax inminente
- Todo converge ahora
- Cada acción es crucial
- No hay marcha atrás
- El momento definitivo
      `.trim();
    }

    /**
     * Formatea el resumen de hilos narrativos
     */
    private formatThreadsSummary(): string {
        if (this.state.threads.length === 0) {
            return 'HILOS NARRATIVOS: Ninguno introducido aún';
        }

        const threadLines = this.state.threads.map((t) => {
            const statusIcon =
                {
                    INTRODUCED: '🆕',
                    DEVELOPING: '📈',
                    READY_FOR_RESOLUTION: '⚡',
                    RESOLVED: '✅',
                }[t.status] ?? '❓';

            const importanceTag = t.importance === 'MAIN' ? '[PRINCIPAL]' : '';

            return `${statusIcon} ${importanceTag} ${t.description}`;
        });

        return `HILOS NARRATIVOS ACTIVOS:\n${threadLines.join('\n')}`;
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Crea una instancia de NarrativeManager
 */
export function createNarrativeManager(): NarrativeManager {
    return new NarrativeManager();
}
