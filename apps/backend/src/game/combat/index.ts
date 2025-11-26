/**
 * Combat System Module
 * 
 * Sistema de combate por turnos para RPG-AI Supreme.
 * 
 * Exporta:
 * - CombatManager: Gestión principal del combate
 * - InitiativeSystem: Cálculo de iniciativa
 * - EnemyAI: IA para comportamiento de enemigos
 * - Interfaces de combate
 */

// Main manager
export { CombatManager } from './CombatManager.js';

// Subsystems
export { InitiativeSystem } from './InitiativeSystem.js';
export { EnemyAI } from './EnemyAI.js';

// Types and interfaces
export type {
    ICombatSession,
    ICombatant,
    ICombatAction,
    ICombatActionResult,
    ICombatLogEntry,
    ICombatResult,
    ICombatOptions,
    ICombatUIState,
    ICombatantUI,
    IStatusEffect,
    IEnemyIntention,
    CombatPhaseType,
    CombatActionType,
} from './CombatInterfaces.js';
