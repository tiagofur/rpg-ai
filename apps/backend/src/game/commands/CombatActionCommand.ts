/**
 * CombatActionCommand - Ejecuta una acción durante el combate por turnos
 * 
 * Permite al jugador realizar acciones como atacar, defender, usar items,
 * habilidades especiales, o intentar huir durante su turno de combate.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import {
    IGameContext,
    ICommandResult,
    CommandType,
    IGameLogEntry,
    INotification,
    LogLevel,
    GamePhase,
    IValidationResult,
    ICommandCost,
    EffectType,
    CombatPhase,
} from '../interfaces.js';
import {
    ICombatAction,
    CombatActionType as CombatActionTypeEnum
} from '../combat/index.js';
import { getCombatManager } from './StartCombatCommand.js';

export class CombatActionCommand extends BaseGameCommand {
    constructor() {
        super(
            'Acción de Combate',
            'Ejecuta una acción durante el turno del jugador en combate',
            CommandType.COMBAT_ACTION,
            0,
            1
        );
    }

    protected validateSpecificRequirements(context: IGameContext): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Verificar que estamos en combate
        if (context.gameState.phase !== GamePhase.COMBAT) {
            errors.push('No hay combate activo');
        }

        // Verificar que hay un combate activo en el estado
        if (!context.gameState.combat?.combatId) {
            errors.push('No se encontró sesión de combate');
        }

        // Verificar que el personaje está vivo
        if (context.character.health.current <= 0) {
            errors.push('El personaje está muerto');
        }

        // Verificar que se especificó una acción
        const params = context.parameters;
        const actionType = params?.['actionType'] as CombatActionTypeEnum | undefined;
        if (!actionType) {
            errors.push('No se especificó tipo de acción');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            requirements: [],
        };
    }

    protected calculateBaseCost(context: IGameContext): ICommandCost {
        const params = context.parameters;
        const actionType = params?.['actionType'] as CombatActionTypeEnum | undefined;

        // Costos según el tipo de acción
        switch (actionType) {
            case 'ATTACK':
                return { mana: 0, stamina: 5, health: 0, gold: 0, items: [], cooldownMs: 0 };
            case 'DEFEND':
                return { mana: 0, stamina: 3, health: 0, gold: 0, items: [], cooldownMs: 0 };
            case 'SKILL':
                return { mana: 10, stamina: 5, health: 0, gold: 0, items: [], cooldownMs: 0 };
            case 'FLEE':
                return { mana: 0, stamina: 10, health: 0, gold: 0, items: [], cooldownMs: 0 };
            default:
                return { mana: 0, stamina: 0, health: 0, gold: 0, items: [], cooldownMs: 0 };
        }
    }

    protected async executeSpecificCommand(
        context: IGameContext,
        logEntries: IGameLogEntry[],
        notifications: INotification[]
    ): Promise<ICommandResult> {
        const { character, gameState } = context;
        const params = context.parameters;
        const combatManager = getCombatManager();

        const combatId = gameState.combat?.combatId;
        if (!combatId) {
            return this.createFailureResult(
                'No hay combate activo',
                logEntries,
                notifications
            );
        }

        // Construir la acción de combate
        const actionType = params?.['actionType'] as CombatActionTypeEnum;
        const targetId = params?.['targetId'] as string | undefined;
        const skillId = params?.['skillId'] as string | undefined;
        const itemId = params?.['itemId'] as string | undefined;

        const combatAction: ICombatAction = {
            type: actionType,
            actorId: character.id,
            ...(targetId ? { targetId } : {}),
            ...(skillId ? { skillId } : {}),
            ...(itemId ? { itemId } : {}),
        };

        // Ejecutar la acción del jugador
        let playerResult;
        try {
            playerResult = combatManager.executePlayerAction(combatId, combatAction);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return this.createFailureResult(
                `Error al ejecutar acción: ${errorMessage}`,
                logEntries,
                notifications
            );
        }

        const { result, session } = playerResult;

        // Construir narración del resultado
        let narration = result.message;

        // Si hay efectos de estado aplicados
        if (result.statusEffectsApplied && result.statusEffectsApplied.length > 0) {
            const effectNames = result.statusEffectsApplied.map(e => e.name).join(', ');
            narration = `${narration}\n\nEfectos aplicados: ${effectNames}`;
        }

        // Verificar si el combate terminó
        if (session.isActive) {
            // Si el combate continúa, procesar turnos de enemigos si es necesario
            const enemyNarrations: string[] = [];

            // Ejecutar turnos de enemigos hasta que vuelva a ser turno del jugador
            let maxEnemyTurns = 10; // Prevenir loops infinitos
            while (session.isActive && session.phase === 'ENEMY_TURN' && maxEnemyTurns > 0) {
                try {
                    const enemyTurn = combatManager.executeEnemyTurn(combatId);
                    enemyNarrations.push(`\n🎭 ${enemyTurn.result.message}`);
                    maxEnemyTurns--;
                } catch {
                    break;
                }
            }

            if (enemyNarrations.length > 0) {
                narration = `${narration}\n${enemyNarrations.join('')}`;
            }

            // Estado actual
            const uiState = combatManager.getCombatUIState(combatId);
            if (uiState && session.isActive) {
                narration = `${narration}\n\n--- Ronda ${uiState.round} ---`;
                if (uiState.isPlayerTurn) {
                    narration = `${narration}\n¡Es tu turno! Elige tu acción.`;

                    // Mostrar estado de enemigos
                    narration = `${narration}\n\nEnemigos:`;
                    for (const enemy of uiState.enemies) {
                        const hpBar = this.createHpBar(enemy.hpPercent);
                        narration = `${narration}\n  ${enemy.name}: ${hpBar} ${enemy.currentHp}/${enemy.maxHp}`;
                        if (enemy.intention) {
                            narration = `${narration} [${enemy.intention.icon} ${enemy.intention.description}]`;
                        }
                    }
                }
            }
        } else {
            // El combate terminó
            const combatResult = combatManager.getCombatResult(combatId);
            if (combatResult) {
                if (combatResult.outcome === 'victory') {
                    narration = `${narration}\n\n🎉 ¡VICTORIA!\n`;
                    narration = `${narration}Experiencia ganada: ${combatResult.experienceGained} XP\n`;
                    narration = `${narration}Oro obtenido: ${combatResult.goldGained} 🪙`;
                    if (combatResult.itemsLooted.length > 0) {
                        narration = `${narration}\nObjetos encontrados: ${combatResult.itemsLooted.length}`;
                    }
                } else if (combatResult.outcome === 'defeat') {
                    narration = `${narration}\n\n💀 ¡DERROTA!\nHas sido derrotado en combate.`;
                } else {
                    narration = `${narration}\n\n🏃 ¡Huida exitosa!`;
                }
            }
        }

        // Log de acción
        logEntries.push(this.createLogEntry(
            LogLevel.INFO,
            `Combat action: ${actionType}`,
            {
                combatId,
                action: actionType,
                success: result.success,
                damage: result.damage,
                targetKilled: result.targetKilled,
            }
        ));

        // Notificación según resultado
        if (result.targetKilled) {
            notifications.push({
                id: uuidv4(),
                type: 'success',
                title: '¡Enemigo derrotado!',
                message: 'Has eliminado a un enemigo',
                duration: 2000,
                timestamp: new Date().toISOString(),
            });
        } else if (result.isCritical) {
            notifications.push({
                id: uuidv4(),
                type: 'success',
                title: '¡Golpe crítico!',
                message: `Daño extra: ${result.damage ?? 0}`,
                duration: 1500,
                timestamp: new Date().toISOString(),
            });
        }

        // Estado de combate para el resultado
        const gameEnded = !session.isActive;

        // Construir el nuevo estado de combate
        const combatState = gameEnded ? undefined : {
            combatId: session.id,
            participants: session.turnOrder.map(c => ({
                characterId: c.id,
                initiative: c.initiative,
                position: {
                    x: 0,
                    y: 0,
                    z: 0,
                    mapId: context.location.id,
                    region: context.location.name || 'combat_arena',
                },
                isActive: c.currentHp > 0,
                actionsThisTurn: 1,
                reactionsAvailable: 1,
            })),
            turnOrder: session.turnOrder.map(c => c.id),
            currentTurn: session.currentTurnIndex,
            currentParticipant: session.turnOrder[session.currentTurnIndex]?.id || '',
            round: session.round,
            phase: CombatPhase.ACTIVE,
            log: session.combatLog.map(l => ({
                id: l.id,
                timestamp: l.timestamp.toISOString(),
                attackerId: l.actorId,
                targetId: l.targetId || l.actorId,
                action: l.action,
                ...(l.result.damage ? { damage: l.result.damage } : {}),
                ...(l.result.isCritical ? { critical: l.result.isCritical } : {}),
            })),
        };

        return {
            success: true,
            commandId: this.id,
            message: narration,
            effects: result.damage ? [
                {
                    id: uuidv4(),
                    name: 'Damage Dealt',
                    description: `${result.damage} daño infligido`,
                    type: EffectType.DAMAGE,
                    duration: 0,
                    remainingDuration: 0,
                    magnitude: result.damage,
                    isStackable: false,
                    maxStacks: 1,
                    currentStacks: 1,
                    sourceId: character.id,
                    targetId: targetId || character.id,
                },
            ] : [],
            newState: {
                phase: gameEnded ? GamePhase.EXPLORATION : GamePhase.COMBAT,
                ...(combatState ? { combat: combatState } : {}),
            },
            ...(gameEnded && session.phase === 'VICTORY' ? {
                rewards: [
                    {
                        type: 'experience' as const,
                        amount: 50, // Placeholder - se calcularía del combatResult
                        description: 'Experiencia de combate',
                    },
                ],
            } : {}),
            logEntries,
            notifications,
        };
    }

    /**
     * Crea una barra de HP visual
     */
    private createHpBar(percent: number): string {
        const filled = Math.round(percent / 10);
        const empty = 10 - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }

    override canUndo(): boolean {
        return false;
    }
}
