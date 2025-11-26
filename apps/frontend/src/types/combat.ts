/**
 * Combat Types for Frontend
 * Based on backend CombatInterfaces.ts
 */

export type CombatPhaseType =
    | 'INITIATIVE'
    | 'PLAYER_TURN'
    | 'ENEMY_TURN'
    | 'END_ROUND'
    | 'VICTORY'
    | 'DEFEAT'
    | 'FLED';

export type CombatActionType = 'ATTACK' | 'DEFEND' | 'SKILL' | 'ITEM' | 'FLEE' | 'WAIT';

export interface IStatusEffectUI {
    name: string;
    icon: string;
    duration: number;
    type?: 'buff' | 'debuff' | 'dot' | 'hot' | 'cc';
}

export interface ICombatantUI {
    id: string;
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
    statusEffects: IStatusEffectUI[];
    isDefending: boolean;
    intention?: {
        description: string;
        icon: string;
    };
}

export interface ITurnOrderEntry {
    id: string;
    name: string;
    isPlayer: boolean;
}

export interface ICombatUIState {
    combatId: string;
    round: number;
    phase: CombatPhaseType;
    isPlayerTurn: boolean;
    player: ICombatantUI;
    enemies: ICombatantUI[];
    turnOrder: ITurnOrderEntry[];
    currentTurnId: string;
    availableActions: CombatActionType[];
    combatLog: Array<{ message: string; timestamp: string }>;
}

export interface ICombatResult {
    outcome: 'victory' | 'defeat' | 'fled';
    rounds: number;
    duration: number;
    experienceGained: number;
    goldGained: number;
    itemsLooted: Array<{ itemId: string; itemName: string; quantity: number; rarity?: string }>;
    enemiesDefeated: Array<{ id: string; name: string; level: number }>;
}

export interface ICombatAction {
    type: CombatActionType;
    targetId?: string;
    skillId?: string;
    itemId?: string;
}
