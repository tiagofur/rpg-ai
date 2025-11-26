/**
 * StartCombatCommand - Inicia un combate por turnos
 * 
 * Este comando inicializa una sesión de combate cuando el jugador
 * encuentra enemigos, ya sea por encuentro aleatorio o evento de historia.
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
import { CombatManager, ICombatOptions } from '../combat/index.js';

// Singleton del CombatManager
let combatManagerInstance: CombatManager | null = null;

function getCombatManager(): CombatManager {
    if (!combatManagerInstance) {
        combatManagerInstance = new CombatManager();
    }
    return combatManagerInstance;
}

export class StartCombatCommand extends BaseGameCommand {
    constructor() {
        super(
            'Iniciar Combate',
            'Inicia un encuentro de combate por turnos',
            CommandType.START_COMBAT,
            0,
            1
        );
    }

    protected validateSpecificRequirements(context: IGameContext): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Verificar que no estemos ya en combate
        if (context.gameState.phase === GamePhase.COMBAT) {
            errors.push('Ya hay un combate activo');
        }

        // Verificar que hay enemigos especificados
        const params = context.parameters;
        const enemyIds = params?.['enemyIds'] as string[] | undefined;
        if (!enemyIds || enemyIds.length === 0) {
            errors.push('No se especificaron enemigos para el combate');
        }

        // Verificar que el personaje está vivo
        if (context.character.health.current <= 0) {
            errors.push('El personaje está muerto y no puede iniciar combate');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            requirements: [],
        };
    }

    protected calculateBaseCost(_context: IGameContext): ICommandCost {
        // Iniciar combate no tiene coste
        return {
            mana: 0,
            stamina: 0,
            health: 0,
            gold: 0,
            items: [],
            cooldownMs: 0,
        };
    }

    protected async executeSpecificCommand(
        context: IGameContext,
        logEntries: IGameLogEntry[],
        notifications: INotification[]
    ): Promise<ICommandResult> {
        const { character } = context;
        const params = context.parameters;

        // Obtener enemigos del contexto (usando bracket notation por index signature)
        const enemyIds = (params?.['enemyIds'] as string[]) || [];
        const isAmbush = (params?.['isAmbush'] as boolean) ?? false;
        const canFlee = (params?.['canFlee'] as boolean) ?? true;
        const terrain = params?.['terrain'] as ICombatOptions['terrain'];
        const locationId = params?.['locationId'] as string | undefined;

        // Crear opciones de combate
        const combatOptions: ICombatOptions = {
            enemyIds,
            isAmbush,
            canFlee,
            ...(terrain ? { terrain } : {}),
            ...(locationId ? { locationId } : {}),
        };

        // Iniciar sesión de combate
        const combatManager = getCombatManager();
        const combatSession = combatManager.startCombat(character, combatOptions);

        // Construir mensaje de inicio
        const enemyNames = combatSession.turnOrder
            .filter(c => !c.isPlayer)
            .map(c => c.name)
            .join(', ');

        const initiativeOrder = combatSession.turnOrder
            .map((c, i) => `${i + 1}. ${c.name} (${c.initiative})`)
            .join('\n');

        let narration = '';
        if (isAmbush) {
            narration = `¡${character.name} ha sido emboscado por ${enemyNames}! Los enemigos atacan primero.`;
        } else {
            narration = `¡${character.name} entra en combate contra ${enemyNames}!`;
        }

        narration += `\n\nOrden de iniciativa:\n${initiativeOrder}`;

        if (combatSession.phase === 'PLAYER_TURN') {
            narration += `\n\n¡Es tu turno! Elige tu acción.`;
        } else {
            narration += `\n\nLos enemigos actúan primero...`;
        }

        // Log de inicio de combate
        logEntries.push(this.createLogEntry(
            LogLevel.INFO,
            `Combat started: ${enemyIds.join(', ')}`,
            {
                combatId: combatSession.id,
                enemyCount: enemyIds.length,
                isAmbush,
            }
        ));

        // Notificación al jugador
        notifications.push({
            id: uuidv4(),
            type: isAmbush ? 'warning' : 'info',
            title: isAmbush ? '¡Emboscada!' : 'Combate',
            message: isAmbush ? '¡Has sido emboscado!' : '¡Combate iniciado!',
            duration: 3000,
            timestamp: new Date().toISOString(),
        });

        // Preparar participantes para el estado de combate
        const participants = combatSession.turnOrder.map(c => ({
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
        }));

        return {
            success: true,
            commandId: this.id,
            message: narration,
            effects: [
                {
                    id: uuidv4(),
                    name: 'Combat Started',
                    description: `Combate iniciado contra ${enemyNames}`,
                    type: EffectType.BUFF,
                    duration: 0,
                    remainingDuration: 0,
                    magnitude: 0,
                    isStackable: false,
                    maxStacks: 1,
                    currentStacks: 1,
                    sourceId: character.id,
                    targetId: character.id,
                },
            ],
            newState: {
                phase: GamePhase.COMBAT,
                combat: {
                    combatId: combatSession.id,
                    participants,
                    turnOrder: combatSession.turnOrder.map(c => c.id),
                    currentTurn: combatSession.currentTurnIndex,
                    currentParticipant: combatSession.turnOrder[combatSession.currentTurnIndex]?.id || '',
                    round: combatSession.round,
                    phase: CombatPhase.INITIATIVE,
                    log: [],
                },
            },
            logEntries,
            notifications,
        };
    }

    /**
     * El combate no puede deshacerse una vez iniciado
     */
    override canUndo(): boolean {
        return false;
    }
}

/**
 * Exportar acceso al CombatManager para otros comandos
 */
export { getCombatManager };
