/**
 * CombatInterfaces - Interfaces específicas para el sistema de combate por turnos
 */

import { UUID } from '../interfaces.js';

/**
 * Fases del combate
 */
export type CombatPhaseType =
    | 'INITIATIVE'      // Calculando orden de turnos
    | 'PLAYER_TURN'     // Turno del jugador
    | 'ENEMY_TURN'      // Turno del enemigo
    | 'END_ROUND'       // Fin de ronda (aplicar efectos)
    | 'VICTORY'         // Jugador ganó
    | 'DEFEAT'          // Jugador perdió
    | 'FLED';           // Alguien huyó

/**
 * Estado completo del combate
 */
export interface ICombatSession {
    /** ID único del combate */
    id: UUID;
    /** Ronda actual */
    round: number;
    /** Fase actual del combate */
    phase: CombatPhaseType;
    /** Lista ordenada de participantes por iniciativa */
    turnOrder: ICombatant[];
    /** Índice del participante actual en turnOrder */
    currentTurnIndex: number;
    /** Acciones restantes del participante actual */
    actionsRemaining: number;
    /** Log de eventos del combate */
    combatLog: ICombatLogEntry[];
    /** Timestamp de inicio */
    startedAt: Date;
    /** Si el combate está activo */
    isActive: boolean;
}

/**
 * Participante en el combate (puede ser jugador o enemigo)
 */
export interface ICombatant {
    /** ID único */
    id: UUID;
    /** Nombre para mostrar */
    name: string;
    /** Si es el jugador */
    isPlayer: boolean;
    /** Template ID del enemigo (si aplica) */
    templateId?: string;
    /** Valor de iniciativa calculado */
    initiative: number;
    /** HP actual */
    currentHp: number;
    /** HP máximo */
    maxHp: number;
    /** Stamina actual */
    currentStamina: number;
    /** Stamina máxima */
    maxStamina: number;
    /** Mana actual */
    currentMana: number;
    /** Mana máximo */
    maxMana: number;
    /** Atributos base */
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
        luck: number;
    };
    /** Nivel */
    level: number;
    /** Efectos de estado activos */
    statusEffects: IStatusEffect[];
    /** Si está defendiendo */
    isDefending: boolean;
    /** Si puede actuar este turno */
    canAct: boolean;
    /** Intención del enemigo (solo para IA) */
    intention?: IEnemyIntention;
}

/**
 * Efecto de estado en combate
 */
export interface IStatusEffect {
    id: string;
    name: string;
    type: 'buff' | 'debuff' | 'dot' | 'hot' | 'cc';
    /** Turnos restantes */
    duration: number;
    /** Valor del efecto (daño/curación por turno, etc.) */
    magnitude: number;
    /** Stat afectado (si aplica) */
    affectedStat?: string;
    /** Icono para UI */
    icon?: string;
}

/**
 * Intención del enemigo (mostrada al jugador)
 */
export interface IEnemyIntention {
    type: 'attack' | 'defend' | 'skill' | 'flee' | 'buff' | 'heal';
    /** ID del objetivo (si aplica) */
    targetId?: UUID | undefined;
    /** ID de la habilidad (si aplica) */
    skillId?: string | undefined;
    /** Descripción para mostrar */
    description: string;
    /** Icono para UI */
    icon: string;
}

/**
 * Acciones disponibles en combate
 */
export type CombatActionType =
    | 'ATTACK'      // Ataque básico
    | 'DEFEND'      // Postura defensiva
    | 'SKILL'       // Usar habilidad
    | 'ITEM'        // Usar item
    | 'FLEE'        // Intentar huir
    | 'WAIT';       // Pasar turno

/**
 * Acción de combate
 */
export interface ICombatAction {
    type: CombatActionType;
    actorId: UUID;
    targetId?: UUID | undefined;
    skillId?: string | undefined;
    itemId?: string | undefined;
}

/**
 * Resultado de una acción de combate
 */
export interface ICombatActionResult {
    success: boolean;
    action: ICombatAction;
    damage?: number;
    healing?: number;
    isCritical?: boolean;
    isMiss?: boolean;
    statusEffectsApplied?: IStatusEffect[];
    statusEffectsRemoved?: string[];
    message: string;
    /** Si el objetivo murió */
    targetKilled?: boolean;
    /** Si el actor huyó exitosamente */
    fled?: boolean;
}

/**
 * Entrada en el log de combate
 */
export interface ICombatLogEntry {
    id: UUID;
    round: number;
    timestamp: Date;
    actorId: UUID;
    actorName: string;
    action: CombatActionType;
    targetId?: UUID;
    targetName?: string;
    result: ICombatActionResult;
    message: string;
}

/**
 * Resultado final del combate
 */
export interface ICombatResult {
    outcome: 'victory' | 'defeat' | 'fled';
    rounds: number;
    duration: number; // en milisegundos
    experienceGained: number;
    goldGained: number;
    itemsLooted: Array<{ itemId: string; quantity: number }>;
    enemiesDefeated: Array<{ id: UUID; name: string; level: number }>;
}

/**
 * Opciones para iniciar un combate
 */
export interface ICombatOptions {
    /** Lista de IDs de enemigos a enfrentar */
    enemyIds: string[];
    /** Si es un combate de emboscada (enemigos actúan primero) */
    isAmbush?: boolean;
    /** Si el jugador puede huir */
    canFlee?: boolean;
    /** Terreno del combate (afecta bonuses) */
    terrain?: 'normal' | 'forest' | 'cave' | 'water' | 'fire';
    /** ID de la ubicación donde ocurre */
    locationId?: string;
}

/**
 * Estado de UI del combate para enviar al frontend
 */
export interface ICombatUIState {
    combatId: UUID;
    round: number;
    phase: CombatPhaseType;
    isPlayerTurn: boolean;
    player: ICombatantUI;
    enemies: ICombatantUI[];
    turnOrder: Array<{ id: UUID; name: string; isPlayer: boolean }>;
    currentTurnId: UUID;
    availableActions: CombatActionType[];
    combatLog: Array<{ message: string; timestamp: string }>;
}

/**
 * Info de combatiente para UI
 */
export interface ICombatantUI {
    id: UUID;
    name: string;
    level: number;
    currentHp: number;
    maxHp: number;
    hpPercent: number;
    currentStamina: number;
    maxStamina: number;
    staminaPercent: number;
    currentMana: number;
    maxMana: number;
    manaPercent: number;
    statusEffects: Array<{ name: string; icon: string; duration: number }>;
    isDefending: boolean;
    intention?: { description: string; icon: string };
}
