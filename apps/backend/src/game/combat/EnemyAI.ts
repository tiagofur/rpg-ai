/**
 * EnemyAI - Sistema de inteligencia artificial para enemigos en combate
 * 
 * Define comportamientos y patrones de ataque para diferentes tipos de enemigos
 */

import {
    ICombatant,
    IEnemyIntention,
    ICombatAction,
} from './CombatInterfaces.js';

/**
 * Tipos de comportamiento de IA
 */
export type AIBehaviorType =
    | 'aggressive'   // Siempre ataca
    | 'defensive'    // Prioriza defensa cuando HP bajo
    | 'tactical'     // Usa skills estratégicamente
    | 'coward'       // Huye cuando HP bajo
    | 'berserker'    // Más agresivo cuando HP bajo
    | 'support';     // Cura/buffea aliados

/**
 * Configuración de comportamiento de IA
 */
export interface IAIBehaviorConfig {
    type: AIBehaviorType;
    /** % HP para considerar "bajo" */
    lowHpThreshold: number;
    /** Probabilidad de huir cuando HP bajo (0-1) */
    fleeChance: number;
    /** Probabilidad de defender cuando HP bajo (0-1) */
    defendChance: number;
    /** Skills disponibles */
    skills: string[];
    /** Probabilidad de usar skill vs ataque básico (0-1) */
    skillUseChance: number;
}

/**
 * Comportamientos predefinidos por tipo de enemigo
 */
export const ENEMY_BEHAVIORS: Record<string, IAIBehaviorConfig> = {
    // Bestias
    'enemy_giant_rat': {
        type: 'coward',
        lowHpThreshold: 0.3,
        fleeChance: 0.4,
        defendChance: 0.1,
        skills: [],
        skillUseChance: 0,
    },
    'enemy_wolf': {
        type: 'aggressive',
        lowHpThreshold: 0.2,
        fleeChance: 0.1,
        defendChance: 0.05,
        skills: ['skill_bite', 'skill_howl'],
        skillUseChance: 0.3,
    },

    // Humanoides
    'enemy_bandit': {
        type: 'tactical',
        lowHpThreshold: 0.25,
        fleeChance: 0.3,
        defendChance: 0.2,
        skills: ['skill_dirty_trick', 'skill_backstab'],
        skillUseChance: 0.4,
    },
    'enemy_goblin': {
        type: 'coward',
        lowHpThreshold: 0.4,
        fleeChance: 0.5,
        defendChance: 0.15,
        skills: ['skill_throw_rock'],
        skillUseChance: 0.25,
    },

    // No-muertos
    'enemy_skeleton': {
        type: 'aggressive',
        lowHpThreshold: 0.1,
        fleeChance: 0,
        defendChance: 0.1,
        skills: ['skill_bone_strike'],
        skillUseChance: 0.2,
    },

    // Default para enemigos no configurados
    'default': {
        type: 'aggressive',
        lowHpThreshold: 0.25,
        fleeChance: 0.15,
        defendChance: 0.1,
        skills: [],
        skillUseChance: 0,
    },
};

/**
 * Sistema de IA para enemigos
 */
export const EnemyAI = {
    /**
     * Obtiene la configuración de comportamiento para un enemigo
     */
    getBehavior(templateId: string): IAIBehaviorConfig {
        const behavior = ENEMY_BEHAVIORS[templateId];
        if (behavior) return behavior;
        return ENEMY_BEHAVIORS['default'] as IAIBehaviorConfig;
    },

    /**
     * Determina la intención del enemigo para mostrar al jugador
     */
    determineIntention(
        enemy: ICombatant,
        player: ICombatant,
        allies: ICombatant[] = []
    ): IEnemyIntention {
        const behavior = this.getBehavior(enemy.templateId || 'default');
        const hpPercent = enemy.currentHp / enemy.maxHp;
        const isLowHp = hpPercent <= behavior.lowHpThreshold;

        // Decisión basada en HP y comportamiento
        if (isLowHp) {
            // Cowards intentan huir
            if (behavior.type === 'coward' && Math.random() < behavior.fleeChance) {
                return {
                    type: 'flee',
                    description: 'Preparándose para huir...',
                    icon: '🏃',
                };
            }

            // Defensive enemies defienden
            if (behavior.type === 'defensive' && Math.random() < behavior.defendChance) {
                return {
                    type: 'defend',
                    description: 'Tomando postura defensiva',
                    icon: '🛡️',
                };
            }

            // Berserkers se vuelven más agresivos
            if (behavior.type === 'berserker') {
                return {
                    type: 'attack',
                    targetId: player.id,
                    description: '¡Atacará con furia!',
                    icon: '💢',
                };
            }
        }

        // Support enemies intentan curar/buffear
        if (behavior.type === 'support' && allies.length > 0) {
            const woundedAlly = allies.find(a => a.currentHp / a.maxHp < 0.5);
            if (woundedAlly) {
                return {
                    type: 'heal',
                    targetId: woundedAlly.id,
                    description: 'Preparando curación...',
                    icon: '💚',
                };
            }
        }

        // Usar skill si disponible y tiene suerte
        if (behavior.skills.length > 0 && Math.random() < behavior.skillUseChance) {
            const skillIndex = Math.floor(Math.random() * behavior.skills.length);
            const skill = behavior.skills[skillIndex] ?? 'skill_attack';
            return {
                type: 'skill',
                targetId: player.id,
                skillId: skill,
                description: this.getSkillDescription(skill),
                icon: '✨',
            };
        }

        // Default: ataque básico
        return {
            type: 'attack',
            targetId: player.id,
            description: 'Preparando ataque...',
            icon: '⚔️',
        };
    },

    /**
     * Convierte una intención en una acción de combate
     */
    intentionToAction(enemy: ICombatant, intention: IEnemyIntention): ICombatAction {
        switch (intention.type) {
            case 'attack':
                return {
                    type: 'ATTACK',
                    actorId: enemy.id,
                    targetId: intention.targetId,
                };
            case 'defend':
                return {
                    type: 'DEFEND',
                    actorId: enemy.id,
                };
            case 'skill':
                return {
                    type: 'SKILL',
                    actorId: enemy.id,
                    targetId: intention.targetId,
                    skillId: intention.skillId,
                };
            case 'flee':
                return {
                    type: 'FLEE',
                    actorId: enemy.id,
                };
            case 'heal':
            case 'buff':
                return {
                    type: 'SKILL',
                    actorId: enemy.id,
                    targetId: intention.targetId,
                    skillId: intention.type === 'heal' ? 'skill_heal' : 'skill_buff',
                };
            default:
                return {
                    type: 'ATTACK',
                    actorId: enemy.id,
                    targetId: intention.targetId,
                };
        }
    },

    /**
     * Obtiene descripción de skill para UI
     */
    getSkillDescription(skillId: string): string {
        const descriptions: Record<string, string> = {
            'skill_bite': 'Preparando mordisco...',
            'skill_howl': 'Preparando aullido...',
            'skill_dirty_trick': 'Planeando truco sucio...',
            'skill_backstab': 'Buscando punto débil...',
            'skill_throw_rock': 'Recogiendo piedra...',
            'skill_bone_strike': 'Levantando hueso...',
            'skill_heal': 'Canalizando curación...',
            'skill_buff': 'Preparando mejora...',
        };

        return descriptions[skillId] || 'Preparando habilidad...';
    },

    /**
     * Calcula el daño base del enemigo
     */
    calculateBaseDamage(enemy: ICombatant): number {
        const baseAttack = enemy.attributes.strength * 1.5;
        const levelBonus = enemy.level * 2;
        const variation = (Math.random() - 0.5) * 0.3; // ±15%

        return Math.max(1, Math.floor((baseAttack + levelBonus) * (1 + variation)));
    },

    /**
     * Calcula probabilidad de huida exitosa del enemigo
     */
    calculateFleeChance(enemy: ICombatant, player: ICombatant): number {
        const dexDiff = enemy.attributes.dexterity - player.attributes.dexterity;
        const baseChance = 0.3 + (dexDiff * 0.02);

        // Más fácil huir con menos HP
        const hpBonus = (1 - enemy.currentHp / enemy.maxHp) * 0.2;

        return Math.min(0.8, Math.max(0.1, baseChance + hpBonus));
    },

    /**
     * Selecciona el objetivo más débil (para enemigos tácticos)
     */
    selectWeakestTarget(targets: ICombatant[]): ICombatant | null {
        if (targets.length === 0) return null;

        return targets.reduce((weakest, current) => {
            const weakestHpPercent = weakest.currentHp / weakest.maxHp;
            const currentHpPercent = current.currentHp / current.maxHp;
            return currentHpPercent < weakestHpPercent ? current : weakest;
        });
    },

    /**
     * Determina si el enemigo debe entrar en modo berserker
     */
    shouldBerserk(enemy: ICombatant): boolean {
        const behavior = this.getBehavior(enemy.templateId || 'default');
        if (behavior.type !== 'berserker') return false;

        const hpPercent = enemy.currentHp / enemy.maxHp;
        return hpPercent <= behavior.lowHpThreshold;
    },
};

export default EnemyAI;
