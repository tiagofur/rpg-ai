/**
 * Combat Components - Main export file
 */

export { CombatUI } from './CombatUI';
export { TurnOrderDisplay } from './TurnOrderDisplay';
export { EnemyStatusPanel } from './EnemyStatusPanel';
export { CombatActions } from './CombatActions';
export { VictoryScreen } from './VictoryScreen';

// Re-export types
export type {
    ICombatUIState,
    ICombatResult,
    ICombatantUI,
    ITurnOrderEntry,
    CombatActionType,
    CombatPhaseType,
    ICombatAction,
    IStatusEffectUI,
} from '../../types/combat';
