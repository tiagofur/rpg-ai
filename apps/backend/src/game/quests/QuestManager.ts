/**
 * QuestManager - Sistema de gestión de misiones
 * 
 * Maneja la asignación, progreso y completado de misiones
 */

import { v4 as uuidv4 } from 'uuid';
import {
    getQuestTemplate,
    getQuestsForLevel,
    IQuestTemplate,
    QuestStatus,
    QuestObjectiveType,
} from './QuestTemplates.js';
import { IReward } from '../interfaces.js';

/**
 * Progreso de un objetivo individual
 */
export interface IQuestObjectiveProgress {
    /** ID del objetivo (índice) */
    objectiveIndex: number;
    /** Tipo de objetivo */
    type: QuestObjectiveType;
    /** ID del target */
    targetId: string;
    /** Progreso actual */
    currentCount: number;
    /** Cantidad requerida */
    requiredCount: number;
    /** Si está completado */
    completed: boolean;
}

/**
 * Instancia de una misión activa
 */
export interface IQuestInstance {
    /** ID único de la instancia */
    id: string;
    /** ID de la plantilla de misión */
    questId: string;
    /** ID del personaje */
    characterId: string;
    /** Estado de la misión */
    status: QuestStatus;
    /** Progreso de cada objetivo */
    objectives: IQuestObjectiveProgress[];
    /** Cuándo se inició */
    startedAt: Date;
    /** Cuándo se completó (si aplica) */
    completedAt?: Date;
    /** Límite de tiempo (si aplica) */
    expiresAt?: Date;
}

/**
 * Evento de progreso de misión
 */
export interface IQuestProgressEvent {
    questId: string;
    objectiveIndex: number;
    previousCount: number;
    newCount: number;
    completed: boolean;
    questCompleted: boolean;
}

/**
 * Clase que gestiona las misiones
 */
export class QuestManager {
    /** Misiones activas por personaje */
    private activeQuests: Map<string, IQuestInstance[]> = new Map();

    /** Misiones completadas por personaje */
    private completedQuests: Map<string, Set<string>> = new Map();

    /**
     * Obtiene las misiones activas de un personaje
     */
    getActiveQuests(characterId: string): IQuestInstance[] {
        return this.activeQuests.get(characterId) || [];
    }

    /**
     * Obtiene las misiones completadas de un personaje
     */
    getCompletedQuests(characterId: string): string[] {
        return Array.from(this.completedQuests.get(characterId) || []);
    }

    /**
     * Verifica si una misión está disponible para un personaje
     */
    isQuestAvailable(characterId: string, questId: string, characterLevel: number): boolean {
        const template = getQuestTemplate(questId);
        if (!template) return false;

        // Verificar nivel
        if (characterLevel < template.minLevel) return false;

        // Verificar si ya está activa
        const activeQuests = this.getActiveQuests(characterId);
        if (activeQuests.some((q) => q.questId === questId)) return false;

        // Verificar si ya está completada (y no es repetible)
        const completed = this.completedQuests.get(characterId);
        if (completed?.has(questId) && !template.repeatable) return false;

        // Verificar prerequisites
        if (template.prerequisites) {
            for (const prereqId of template.prerequisites) {
                if (!completed?.has(prereqId)) return false;
            }
        }

        return true;
    }

    /**
     * Obtiene misiones disponibles para un personaje
     */
    getAvailableQuests(characterId: string, characterLevel: number): IQuestTemplate[] {
        const allQuests = getQuestsForLevel(characterLevel);
        return allQuests.filter((q) => this.isQuestAvailable(characterId, q.id, characterLevel));
    }

    /**
     * Inicia una misión para un personaje
     */
    startQuest(characterId: string, questId: string, characterLevel: number): IQuestInstance | null {
        // Verificar disponibilidad
        if (!this.isQuestAvailable(characterId, questId, characterLevel)) {
            return null;
        }

        const template = getQuestTemplate(questId);
        if (!template) return null;

        // Crear progreso de objetivos
        const objectives: IQuestObjectiveProgress[] = template.objectives.map((obj, index) => ({
            objectiveIndex: index,
            type: obj.type,
            targetId: obj.targetId,
            currentCount: 0,
            requiredCount: obj.requiredCount,
            completed: false,
        }));

        // Crear instancia
        const expiresAt = template.timeLimit
            ? new Date(Date.now() + template.timeLimit * 60 * 1000)
            : undefined;

        const instance: IQuestInstance = {
            id: uuidv4(),
            questId,
            characterId,
            status: 'IN_PROGRESS',
            objectives,
            startedAt: new Date(),
            ...(expiresAt && { expiresAt }),
        };

        // Agregar a misiones activas
        const quests = this.activeQuests.get(characterId) || [];
        quests.push(instance);
        this.activeQuests.set(characterId, quests);

        return instance;
    }

    /**
     * Actualiza el progreso de una misión basado en un evento
     * @returns Eventos de progreso generados
     */
    updateProgress(
        characterId: string,
        eventType: QuestObjectiveType,
        targetId: string,
        count: number = 1
    ): IQuestProgressEvent[] {
        const quests = this.getActiveQuests(characterId);
        const events: IQuestProgressEvent[] = [];

        for (const quest of quests) {
            if (quest.status !== 'IN_PROGRESS') continue;

            for (const objective of quest.objectives) {
                // Verificar si este objetivo coincide con el evento
                if (objective.type === eventType && objective.targetId === targetId && !objective.completed) {
                    const previousCount = objective.currentCount;
                    objective.currentCount = Math.min(objective.currentCount + count, objective.requiredCount);

                    // Verificar si se completó el objetivo
                    if (objective.currentCount >= objective.requiredCount) {
                        objective.completed = true;
                    }

                    // Verificar si se completó la misión completa
                    const questCompleted = this.checkQuestCompletion(quest);

                    events.push({
                        questId: quest.questId,
                        objectiveIndex: objective.objectiveIndex,
                        previousCount,
                        newCount: objective.currentCount,
                        completed: objective.completed,
                        questCompleted,
                    });

                    if (questCompleted) {
                        quest.status = 'COMPLETED';
                        quest.completedAt = new Date();
                    }
                }
            }
        }

        return events;
    }

    /**
     * Verifica si todos los objetivos obligatorios de una misión están completados
     */
    private checkQuestCompletion(quest: IQuestInstance): boolean {
        const template = getQuestTemplate(quest.questId);
        if (!template) return false;

        for (let i = 0; i < quest.objectives.length; i++) {
            const objective = quest.objectives[i];
            const templateObjective = template.objectives[i];

            // Si el objetivo o template es undefined, skip
            if (!objective || !templateObjective) continue;

            // Si el objetivo no es opcional y no está completado, la misión no está completa
            if (!templateObjective.optional && !objective.completed) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reclama las recompensas de una misión completada
     * @returns Recompensas o null si la misión no puede reclamarse
     */
    claimRewards(characterId: string, questId: string): IReward[] | null {
        const quests = this.getActiveQuests(characterId);
        const questIndex = quests.findIndex((q) => q.questId === questId && q.status === 'COMPLETED');

        if (questIndex === -1) return null;

        const template = getQuestTemplate(questId);
        if (!template) return null;

        // Convertir recompensas del template a IReward[]
        const rewards: IReward[] = [];

        // XP
        if (template.rewards.xp > 0) {
            rewards.push({
                type: 'experience',
                amount: template.rewards.xp,
                description: `+${template.rewards.xp} XP por completar "${template.title}"`,
            });
        }

        // Oro
        if (template.rewards.gold > 0) {
            rewards.push({
                type: 'gold',
                amount: template.rewards.gold,
                description: `+${template.rewards.gold} Oro`,
            });
        }

        // Items
        if (template.rewards.items) {
            for (const item of template.rewards.items) {
                rewards.push({
                    type: 'item',
                    amount: item.quantity,
                    itemId: item.itemId,
                    description: `${item.quantity}x ${item.itemId}`,
                });
            }
        }

        // Reputación
        if (template.rewards.reputation) {
            rewards.push({
                type: 'reputation',
                amount: template.rewards.reputation.amount,
                description: `+${template.rewards.reputation.amount} reputación con ${template.rewards.reputation.factionId}`,
            });
        }

        // Mover a completadas y remover de activas
        const completed = this.completedQuests.get(characterId) || new Set();
        completed.add(questId);
        this.completedQuests.set(characterId, completed);

        quests.splice(questIndex, 1);
        this.activeQuests.set(characterId, quests);

        return rewards;
    }

    /**
     * Abandona una misión activa
     */
    abandonQuest(characterId: string, questId: string): boolean {
        const quests = this.getActiveQuests(characterId);
        const questIndex = quests.findIndex((q) => q.questId === questId);

        if (questIndex === -1) return false;

        quests.splice(questIndex, 1);
        this.activeQuests.set(characterId, quests);

        return true;
    }

    /**
     * Obtiene información detallada de una misión activa
     */
    getQuestDetails(characterId: string, questId: string): {
        instance: IQuestInstance;
        template: IQuestTemplate;
    } | null {
        const quests = this.getActiveQuests(characterId);
        const instance = quests.find((q) => q.questId === questId);
        if (!instance) return null;

        const template = getQuestTemplate(questId);
        if (!template) return null;

        return { instance, template };
    }

    /**
     * Serializa el estado del QuestManager para persistencia
     */
    serialize(characterId: string): {
        activeQuests: IQuestInstance[];
        completedQuests: string[];
    } {
        return {
            activeQuests: this.getActiveQuests(characterId),
            completedQuests: this.getCompletedQuests(characterId),
        };
    }

    /**
     * Restaura el estado del QuestManager desde datos persistidos
     */
    deserialize(
        characterId: string,
        data: { activeQuests: IQuestInstance[]; completedQuests: string[] }
    ): void {
        this.activeQuests.set(characterId, data.activeQuests);
        this.completedQuests.set(characterId, new Set(data.completedQuests));
    }

    /**
     * Formatea una misión para mostrar al usuario
     */
    static formatQuestForDisplay(instance: IQuestInstance, template: IQuestTemplate): string {
        // Título y descripción
        const statusEmoji = {
            NOT_STARTED: '⚪',
            IN_PROGRESS: '🔵',
            COMPLETED: '✅',
            FAILED: '❌',
        };

        // Construir objetivos
        const objectiveLines: string[] = [];
        for (let i = 0; i < instance.objectives.length; i++) {
            const obj = instance.objectives[i];
            const templateObj = template.objectives[i];
            if (!obj || !templateObj) continue;

            const checkmark = obj.completed ? '☑' : '☐';
            const progress = `[${obj.currentCount}/${obj.requiredCount}]`;
            const optional = templateObj.optional ? ' (Opcional)' : '';
            objectiveLines.push(`${checkmark} ${templateObj.description} ${progress}${optional}`);
        }

        // Construir recompensas
        const rewardLines: string[] = [];
        if (template.rewards.xp) rewardLines.push(`  ⭐ ${template.rewards.xp} XP`);
        if (template.rewards.gold) rewardLines.push(`  🪙 ${template.rewards.gold} Oro`);
        if (template.rewards.items) {
            for (const item of template.rewards.items) {
                rewardLines.push(`  📦 ${item.quantity}x ${item.itemId}`);
            }
        }

        // Unir todas las líneas
        const allLines = [
            `📜 **${template.title}**`,
            template.description,
            '',
            `Estado: ${statusEmoji[instance.status]} ${instance.status}`,
            '',
            '**Objetivos:**',
            ...objectiveLines,
            '',
            '**Recompensas:**',
            ...rewardLines,
        ];

        return allLines.join('\n');
    }
}

// Instancia global del QuestManager
export const questManager = new QuestManager();

export default QuestManager;
