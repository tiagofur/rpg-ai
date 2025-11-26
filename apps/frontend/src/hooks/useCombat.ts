/**
 * useCombat - Hook for managing combat state and WebSocket communication
 */

import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../api/socket';
import type {
    ICombatUIState,
    ICombatResult,
    CombatActionType,
    ICombatantUI,
} from '../types/combat';

interface UseCombatOptions {
    sessionId: string;
    onCombatStart?: () => void;
    onCombatEnd?: (result: ICombatResult) => void;
}

interface UseCombatReturn {
    /** Whether in combat */
    inCombat: boolean;
    /** Current combat state */
    combatState: ICombatUIState | null;
    /** Combat result (when combat ends) */
    combatResult: ICombatResult | null;
    /** Execute a combat action */
    executeAction: (action: CombatActionType, targetId?: string) => void;
    /** End combat and clear state */
    endCombat: () => void;
    /** Whether an action is being processed */
    isProcessing: boolean;
}

export function useCombat({
    sessionId,
    onCombatStart,
    onCombatEnd,
}: UseCombatOptions): UseCombatReturn {
    const [inCombat, setInCombat] = useState(false);
    const [combatState, setCombatState] = useState<ICombatUIState | null>(null);
    const [combatResult, setCombatResult] = useState<ICombatResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Handle combat start event
    const handleCombatStart = useCallback(
        (data: { combatState: ICombatUIState }) => {
            setInCombat(true);
            setCombatState(data.combatState);
            setCombatResult(null);
            onCombatStart?.();
        },
        [onCombatStart]
    );

    // Handle combat state update
    const handleCombatUpdate = useCallback((data: { combatState: ICombatUIState }) => {
        setCombatState(data.combatState);
        setIsProcessing(false);
    }, []);

    // Handle combat end event
    const handleCombatEnd = useCallback(
        (data: { result: ICombatResult }) => {
            setCombatResult(data.result);
            // Update phase in combat state to trigger victory/defeat screen
            setCombatState((prev) => {
                if (!prev) return null;
                const newPhase =
                    data.result.outcome === 'victory'
                        ? 'VICTORY'
                        : data.result.outcome === 'fled'
                            ? 'FLED'
                            : 'DEFEAT';
                return { ...prev, phase: newPhase };
            });
            onCombatEnd?.(data.result);
        },
        [onCombatEnd]
    );

    // Handle action result
    const handleActionResult = useCallback(
        (data: { success: boolean; combatState?: ICombatUIState; error?: string }) => {
            setIsProcessing(false);
            if (data.success && data.combatState) {
                setCombatState(data.combatState);
            }
        },
        []
    );

    // Setup socket listeners
    useEffect(() => {
        // Listen for combat events
        socketService.on('game:event', (event) => {
            const { type, payload } = event;

            switch (type) {
                case 'combat:start':
                    handleCombatStart(payload as { combatState: ICombatUIState });
                    break;
                case 'combat:update':
                    handleCombatUpdate(payload as { combatState: ICombatUIState });
                    break;
                case 'combat:end':
                    handleCombatEnd(payload as { result: ICombatResult });
                    break;
                case 'combat:action_result':
                    handleActionResult(
                        payload as { success: boolean; combatState?: ICombatUIState; error?: string }
                    );
                    break;
                default:
                    break;
            }
        });

        return () => {
            socketService.off('game:event');
        };
    }, [sessionId, handleCombatStart, handleCombatUpdate, handleCombatEnd, handleActionResult]);

    // Execute a combat action
    const executeAction = useCallback(
        (action: CombatActionType, targetId?: string) => {
            if (!combatState || isProcessing) return;

            setIsProcessing(true);

            // Send action to backend
            socketService.emitRaw('player:action', {
                action: 'combat_action',
                params: {
                    combatId: combatState.combatId,
                    action: {
                        type: action,
                        actorId: combatState.player.id,
                        targetId,
                    },
                },
            });
        },
        [combatState, isProcessing]
    );

    // Clear combat state
    const endCombat = useCallback(() => {
        setInCombat(false);
        setCombatState(null);
        setCombatResult(null);
        setIsProcessing(false);
    }, []);

    return {
        inCombat,
        combatState,
        combatResult,
        executeAction,
        endCombat,
        isProcessing,
    };
}

// Helper to check if combat state indicates player's turn
export function isPlayerTurn(state: ICombatUIState | null): boolean {
    return state?.isPlayerTurn ?? false;
}

// Helper to get alive enemies
export function getAliveEnemies(state: ICombatUIState | null): ICombatantUI[] {
    if (!state) return [];
    return state.enemies.filter((e) => e.currentHp > 0);
}

// Mock combat state for testing UI
export function createMockCombatState(): ICombatUIState {
    return {
        combatId: 'mock-combat-1',
        round: 1,
        phase: 'PLAYER_TURN',
        isPlayerTurn: true,
        player: {
            id: 'player-1',
            name: 'Thorin',
            level: 3,
            currentHp: 85,
            maxHp: 100,
            hpPercent: 85,
            currentStamina: 40,
            maxStamina: 50,
            staminaPercent: 80,
            currentMana: 30,
            maxMana: 45,
            manaPercent: 66,
            statusEffects: [],
            isDefending: false,
        },
        enemies: [
            {
                id: 'enemy-1',
                name: 'Lobo Terrible',
                level: 2,
                currentHp: 45,
                maxHp: 80,
                hpPercent: 56,
                currentStamina: 30,
                maxStamina: 30,
                staminaPercent: 100,
                currentMana: 0,
                maxMana: 0,
                manaPercent: 0,
                statusEffects: [],
                isDefending: false,
                intention: {
                    icon: '⚔️',
                    description: 'Preparando ataque...',
                },
            },
            {
                id: 'enemy-2',
                name: 'Rata Gigante',
                level: 1,
                currentHp: 5,
                maxHp: 20,
                hpPercent: 25,
                currentStamina: 15,
                maxStamina: 15,
                staminaPercent: 100,
                currentMana: 0,
                maxMana: 0,
                manaPercent: 0,
                statusEffects: [{ name: 'Envenenado', icon: '☠️', duration: 2 }],
                isDefending: false,
                intention: {
                    icon: '🏃',
                    description: 'Intentará huir...',
                },
            },
        ],
        turnOrder: [
            { id: 'player-1', name: 'Thorin', isPlayer: true },
            { id: 'enemy-1', name: 'Lobo Terrible', isPlayer: false },
            { id: 'enemy-2', name: 'Rata Gigante', isPlayer: false },
        ],
        currentTurnId: 'player-1',
        availableActions: ['ATTACK', 'DEFEND', 'SKILL', 'ITEM', 'FLEE'],
        combatLog: [
            { message: '¡Comienza el combate! Ronda 1', timestamp: new Date().toISOString() },
        ],
    };
}

// Mock combat result for testing
export function createMockCombatResult(): ICombatResult {
    return {
        outcome: 'victory',
        rounds: 3,
        duration: 45_000,
        experienceGained: 75,
        goldGained: 25,
        itemsLooted: [
            { itemId: 'wolf_pelt', itemName: 'Piel de Lobo', quantity: 1, rarity: 'common' },
            { itemId: 'wolf_fang', itemName: 'Colmillo de Lobo', quantity: 2 },
        ],
        enemiesDefeated: [
            { id: 'enemy-1', name: 'Lobo Terrible', level: 2 },
            { id: 'enemy-2', name: 'Rata Gigante', level: 1 },
        ],
    };
}
