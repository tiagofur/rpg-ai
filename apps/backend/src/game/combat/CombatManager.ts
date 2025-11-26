/**
 * CombatManager - Sistema principal de combate por turnos
 * 
 * Gestiona el flujo completo del combate: iniciativa, turnos, acciones y resolución
 */

import { v4 as uuidv4 } from 'uuid';
import {
    ICombatSession,
    ICombatant,
    ICombatAction,
    ICombatActionResult,
    ICombatLogEntry,
    ICombatResult,
    ICombatOptions,
    ICombatUIState,
    ICombatantUI,
    CombatActionType,
    IStatusEffect,
} from './CombatInterfaces.js';
import { InitiativeSystem } from './InitiativeSystem.js';
import { EnemyAI } from './EnemyAI.js';
import { ICharacter } from '../interfaces.js';
import { ENEMIES, createEnemy } from '../content/Enemies.js';
import { LootManager } from '../loot/LootManager.js';

/**
 * Gestor principal de combate
 */
export class CombatManager {
    private activeCombats: Map<string, ICombatSession> = new Map();

    /**
     * Inicia un nuevo combate
     */
    startCombat(
        player: ICharacter,
        options: ICombatOptions
    ): ICombatSession {
        const combatId = uuidv4();

        // Crear combatiente del jugador
        const playerCombatant = this.characterToCombatant(player, true);

        // Crear combatientes enemigos
        const enemies = options.enemyIds.map(id => this.createEnemyCombatant(id));

        // Combinar todos los participantes
        const allCombatants = [playerCombatant, ...enemies];

        // Calcular orden de iniciativa
        const turnOrder = InitiativeSystem.calculateInitiative(
            allCombatants,
            options.isAmbush || false
        );

        // Determinar intenciones iniciales de enemigos
        for (const combatant of turnOrder) {
            if (!combatant.isPlayer) {
                combatant.intention = EnemyAI.determineIntention(
                    combatant,
                    playerCombatant,
                    enemies.filter(e => e.id !== combatant.id)
                );
            }
        }

        // Crear sesión de combate
        const session: ICombatSession = {
            id: combatId,
            round: 1,
            phase: 'INITIATIVE',
            turnOrder,
            currentTurnIndex: 0,
            actionsRemaining: 1,
            combatLog: [],
            startedAt: new Date(),
            isActive: true,
        };

        // Agregar entrada inicial al log
        this.addLogEntry(session, {
            actorId: 'system',
            actorName: 'Sistema',
            action: 'WAIT',
            message: `¡Comienza el combate! Ronda ${session.round}`,
            result: { success: true, action: { type: 'WAIT', actorId: 'system' }, message: '' },
        });

        // Determinar primera fase según quién tiene el turno
        const firstCombatant = turnOrder[0];
        if (firstCombatant) {
            session.phase = firstCombatant.isPlayer ? 'PLAYER_TURN' : 'ENEMY_TURN';
        }

        this.activeCombats.set(combatId, session);
        return session;
    }

    /**
     * Ejecuta una acción del jugador
     */
    executePlayerAction(
        combatId: string,
        action: ICombatAction
    ): { result: ICombatActionResult; session: ICombatSession } {
        const session = this.activeCombats.get(combatId);
        if (!session || !session.isActive) {
            throw new Error('Combate no encontrado o inactivo');
        }

        if (session.phase !== 'PLAYER_TURN') {
            throw new Error('No es el turno del jugador');
        }

        const player = session.turnOrder.find(c => c.isPlayer);
        if (!player) {
            throw new Error('Jugador no encontrado en combate');
        }

        // Ejecutar la acción
        const result = this.resolveAction(session, action, player);

        // Preparar datos de log
        const targetName = action.targetId ? this.getCombatantName(session, action.targetId) : undefined;

        // Agregar al log
        this.addLogEntry(session, {
            actorId: player.id,
            actorName: player.name,
            action: action.type,
            ...(action.targetId && targetName ? { targetId: action.targetId, targetName } : {}),
            message: result.message,
            result,
        });

        // Reducir acciones restantes
        session.actionsRemaining--;

        // Si se acabaron las acciones, pasar al siguiente turno
        if (session.actionsRemaining <= 0) {
            this.advanceTurn(session);
        }

        // Verificar victoria/derrota
        this.checkCombatEnd(session);

        return { result, session };
    }

    /**
     * Ejecuta el turno de un enemigo
     */
    executeEnemyTurn(combatId: string): { result: ICombatActionResult; session: ICombatSession } {
        const session = this.activeCombats.get(combatId);
        if (!session || !session.isActive) {
            throw new Error('Combate no encontrado o inactivo');
        }

        if (session.phase !== 'ENEMY_TURN') {
            throw new Error('No es el turno del enemigo');
        }

        const currentEnemy = session.turnOrder[session.currentTurnIndex];
        if (!currentEnemy || currentEnemy.isPlayer) {
            throw new Error('No hay enemigo en el turno actual');
        }

        const player = session.turnOrder.find(c => c.isPlayer);
        if (!player) {
            throw new Error('Jugador no encontrado');
        }

        // Convertir intención a acción
        const intention = currentEnemy.intention || EnemyAI.determineIntention(currentEnemy, player, []);
        const action = EnemyAI.intentionToAction(currentEnemy, intention);

        // Ejecutar la acción
        const result = this.resolveAction(session, action, currentEnemy);

        // Preparar datos de log
        const enemyTargetName = action.targetId ? this.getCombatantName(session, action.targetId) : undefined;

        // Agregar al log
        this.addLogEntry(session, {
            actorId: currentEnemy.id,
            actorName: currentEnemy.name,
            action: action.type,
            ...(action.targetId && enemyTargetName ? { targetId: action.targetId, targetName: enemyTargetName } : {}),
            message: result.message,
            result,
        });

        // Avanzar turno
        this.advanceTurn(session);

        // Verificar victoria/derrota
        this.checkCombatEnd(session);

        return { result, session };
    }

    /**
     * Resuelve una acción de combate
     */
    private resolveAction(
        session: ICombatSession,
        action: ICombatAction,
        actor: ICombatant
    ): ICombatActionResult {
        switch (action.type) {
            case 'ATTACK':
                return this.resolveAttack(session, action, actor);
            case 'DEFEND':
                return this.resolveDefend(actor);
            case 'SKILL':
                return this.resolveSkill(session, action, actor);
            case 'ITEM':
                return this.resolveItem(session, action, actor);
            case 'FLEE':
                return this.resolveFlee(session, actor);
            case 'WAIT':
                return { success: true, action, message: `${actor.name} espera.` };
            default:
                return { success: false, action, message: 'Acción desconocida' };
        }
    }

    /**
     * Resuelve un ataque
     */
    private resolveAttack(
        session: ICombatSession,
        action: ICombatAction,
        attacker: ICombatant
    ): ICombatActionResult {
        const target = session.turnOrder.find(c => c.id === action.targetId);
        if (!target) {
            return { success: false, action, message: 'Objetivo no encontrado' };
        }

        // Calcular hit chance
        const hitChance = this.calculateHitChance(attacker, target);
        const hitRoll = Math.random() * 100;

        if (hitRoll > hitChance) {
            return {
                success: true,
                action,
                isMiss: true,
                message: `${attacker.name} falla su ataque contra ${target.name}!`,
            };
        }

        // Calcular daño
        let damage = this.calculateDamage(attacker, target);

        // Verificar crítico
        const critChance = this.calculateCritChance(attacker);
        const isCritical = Math.random() * 100 < critChance;
        if (isCritical) {
            damage = Math.floor(damage * 2);
        }

        // Reducir daño si el objetivo está defendiendo
        if (target.isDefending) {
            damage = Math.floor(damage * 0.5);
        }

        // Aplicar daño
        target.currentHp = Math.max(0, target.currentHp - damage);
        const targetKilled = target.currentHp <= 0;

        if (targetKilled) {
            target.canAct = false;
        }

        const critText = isCritical ? ' ¡CRÍTICO!' : '';
        const defendText = target.isDefending ? ' (defendiendo)' : '';

        return {
            success: true,
            action,
            damage,
            isCritical,
            targetKilled,
            message: `${attacker.name} golpea a ${target.name} por ${damage} de daño!${critText}${defendText}`,
        };
    }

    /**
     * Resuelve una defensa
     */
    private resolveDefend(actor: ICombatant): ICombatActionResult {
        actor.isDefending = true;
        return {
            success: true,
            action: { type: 'DEFEND', actorId: actor.id },
            message: `${actor.name} toma una postura defensiva!`,
        };
    }

    /**
     * Resuelve el uso de una habilidad
     */
    private resolveSkill(
        session: ICombatSession,
        action: ICombatAction,
        actor: ICombatant
    ): ICombatActionResult {
        // Por ahora, las skills funcionan como ataques mejorados
        const skillDamageMultiplier: Record<string, number> = {
            'skill_bite': 1.3,
            'skill_howl': 0, // Buff, no daño
            'skill_dirty_trick': 0.8, // Menos daño pero aplica debuff
            'skill_backstab': 2,
            'skill_throw_rock': 0.6,
            'skill_bone_strike': 1.5,
        };

        const multiplier = skillDamageMultiplier[action.skillId || ''] ?? 1;

        if (multiplier === 0) {
            // Skill de buff/debuff
            return this.resolveBuffSkill(session, action, actor);
        }

        const target = session.turnOrder.find(c => c.id === action.targetId);
        if (!target) {
            return { success: false, action, message: 'Objetivo no encontrado' };
        }

        const damage = Math.floor(this.calculateDamage(actor, target) * multiplier);
        target.currentHp = Math.max(0, target.currentHp - damage);
        const targetKilled = target.currentHp <= 0;

        if (targetKilled) {
            target.canAct = false;
        }

        const skillName = this.getSkillName(action.skillId || '');

        return {
            success: true,
            action,
            damage,
            targetKilled,
            message: `${actor.name} usa ${skillName} contra ${target.name} por ${damage} de daño!`,
        };
    }

    /**
     * Resuelve una skill de buff/debuff
     */
    private resolveBuffSkill(
        _session: ICombatSession,
        action: ICombatAction,
        actor: ICombatant
    ): ICombatActionResult {
        // Howl: buff de ataque
        if (action.skillId === 'skill_howl') {
            const buff: IStatusEffect = {
                id: uuidv4(),
                name: 'Aullido',
                type: 'buff',
                duration: 3,
                magnitude: 5,
                affectedStat: 'strength',
                icon: '🐺',
            };
            actor.statusEffects.push(buff);
            return {
                success: true,
                action,
                statusEffectsApplied: [buff],
                message: `${actor.name} aulla ferozmente! (+5 Fuerza por 3 turnos)`,
            };
        }

        // Dirty trick: debuff al enemigo
        if (action.skillId === 'skill_dirty_trick') {
            // Aplicar al jugador
            return {
                success: true,
                action,
                message: `${actor.name} usa un truco sucio!`,
            };
        }

        return { success: false, action, message: 'Skill no reconocida' };
    }

    /**
     * Resuelve el uso de un item
     */
    private resolveItem(
        _session: ICombatSession,
        action: ICombatAction,
        actor: ICombatant
    ): ICombatActionResult {
        // Simplificado por ahora - pociones de vida
        if (action.itemId?.includes('health')) {
            const healing = 20;
            actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healing);
            return {
                success: true,
                action,
                healing,
                message: `${actor.name} usa una poción y recupera ${healing} HP!`,
            };
        }

        return { success: false, action, message: 'Item no encontrado' };
    }

    /**
     * Resuelve un intento de huida
     */
    private resolveFlee(session: ICombatSession, actor: ICombatant): ICombatActionResult {
        const fleeChance = actor.isPlayer ? 0.4 : 0.3;
        const fled = Math.random() < fleeChance;

        if (fled) {
            if (actor.isPlayer) {
                session.phase = 'FLED';
                session.isActive = false;
            } else {
                actor.currentHp = 0;
                actor.canAct = false;
            }
            return {
                success: true,
                action: { type: 'FLEE', actorId: actor.id },
                fled: true,
                message: `${actor.name} huye del combate!`,
            };
        }

        return {
            success: false,
            action: { type: 'FLEE', actorId: actor.id },
            fled: false,
            message: `${actor.name} intenta huir pero no lo consigue!`,
        };
    }

    /**
     * Avanza al siguiente turno
     */
    private advanceTurn(session: ICombatSession): void {
        // Resetear defensa del combatiente actual
        const current = session.turnOrder[session.currentTurnIndex];
        if (current) {
            current.isDefending = false;
        }

        // Obtener siguiente turno
        const { nextIndex, isNewRound } = InitiativeSystem.getNextTurn(
            session.turnOrder,
            session.currentTurnIndex
        );

        if (nextIndex === -1) {
            // No hay más combatientes que puedan actuar
            this.checkCombatEnd(session);
            return;
        }

        session.currentTurnIndex = nextIndex;
        session.actionsRemaining = 1;

        if (isNewRound) {
            session.round++;
            this.processEndOfRound(session);

            this.addLogEntry(session, {
                actorId: 'system',
                actorName: 'Sistema',
                action: 'WAIT',
                message: `--- Ronda ${session.round} ---`,
                result: { success: true, action: { type: 'WAIT', actorId: 'system' }, message: '' },
            });
        }

        // Determinar nueva fase
        const nextCombatant = session.turnOrder[nextIndex];
        if (nextCombatant) {
            session.phase = nextCombatant.isPlayer ? 'PLAYER_TURN' : 'ENEMY_TURN';

            // Actualizar intención del enemigo
            if (!nextCombatant.isPlayer) {
                const player = session.turnOrder.find(c => c.isPlayer);
                if (player) {
                    nextCombatant.intention = EnemyAI.determineIntention(
                        nextCombatant,
                        player,
                        session.turnOrder.filter(c => !c.isPlayer && c.id !== nextCombatant.id)
                    );
                }
            }
        }
    }

    /**
     * Procesa efectos de fin de ronda
     */
    private processEndOfRound(session: ICombatSession): void {
        for (const combatant of session.turnOrder) {
            if (combatant.currentHp <= 0) continue;

            // Procesar efectos de estado
            for (const effect of combatant.statusEffects) {
                if (effect.type === 'dot') {
                    combatant.currentHp = Math.max(0, combatant.currentHp - effect.magnitude);
                } else if (effect.type === 'hot') {
                    combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + effect.magnitude);
                }
                effect.duration--;
            }

            // Remover efectos expirados
            combatant.statusEffects = combatant.statusEffects.filter(e => e.duration > 0);

            // Regenerar stamina
            combatant.currentStamina = Math.min(
                combatant.maxStamina,
                combatant.currentStamina + 5
            );
        }
    }

    /**
     * Verifica si el combate ha terminado
     */
    private checkCombatEnd(session: ICombatSession): void {
        const playerCombatant = session.turnOrder.find(c => c.isPlayer);
        const aliveEnemies = session.turnOrder.filter(c => !c.isPlayer && c.currentHp > 0);

        if (!playerCombatant || playerCombatant.currentHp <= 0) {
            session.phase = 'DEFEAT';
            session.isActive = false;
        } else if (aliveEnemies.length === 0) {
            session.phase = 'VICTORY';
            session.isActive = false;
        }
    }

    /**
     * Obtiene el resultado final del combate
     */
    getCombatResult(combatId: string): ICombatResult | null {
        const session = this.activeCombats.get(combatId);
        if (!session || session.isActive) return null;

        const defeatedEnemies = session.turnOrder.filter(c => !c.isPlayer && c.currentHp <= 0);

        let outcome: 'victory' | 'defeat' | 'fled';
        if (session.phase === 'VICTORY') {
            outcome = 'victory';
        } else if (session.phase === 'FLED') {
            outcome = 'fled';
        } else {
            outcome = 'defeat';
        }

        // Calcular loot solo en victoria
        let experienceGained = 0;
        let goldGained = 0;
        const itemsLooted: Array<{ itemId: string; quantity: number }> = [];

        if (outcome === 'victory') {
            for (const enemy of defeatedEnemies) {
                experienceGained += enemy.level * 20;

                if (enemy.templateId) {
                    const loot = LootManager.generateLoot(enemy.templateId);
                    goldGained += loot.gold;
                    for (const item of loot.items) {
                        itemsLooted.push({ itemId: item.item.id, quantity: item.quantity });
                    }
                }
            }
        }

        const duration = Date.now() - session.startedAt.getTime();

        return {
            outcome,
            rounds: session.round,
            duration,
            experienceGained,
            goldGained,
            itemsLooted,
            enemiesDefeated: defeatedEnemies.map(e => ({
                id: e.id,
                name: e.name,
                level: e.level,
            })),
        };
    }

    /**
     * Obtiene el estado del combate para UI
     */
    getCombatUIState(combatId: string): ICombatUIState | null {
        const session = this.activeCombats.get(combatId);
        if (!session) return null;

        const player = session.turnOrder.find(c => c.isPlayer);
        const enemies = session.turnOrder.filter(c => !c.isPlayer);
        const current = session.turnOrder[session.currentTurnIndex];

        if (!player) return null;

        // Determinar acciones disponibles
        const availableActions: CombatActionType[] = ['ATTACK', 'DEFEND', 'ITEM', 'FLEE'];
        if (player.currentMana >= 10) {
            availableActions.splice(2, 0, 'SKILL');
        }

        return {
            combatId: session.id,
            round: session.round,
            phase: session.phase,
            isPlayerTurn: session.phase === 'PLAYER_TURN',
            player: this.combatantToUI(player),
            enemies: enemies.map(e => this.combatantToUI(e)),
            turnOrder: session.turnOrder.map(c => ({
                id: c.id,
                name: c.name,
                isPlayer: c.isPlayer,
            })),
            currentTurnId: current?.id || '',
            availableActions,
            combatLog: session.combatLog.slice(-10).map(l => ({
                message: l.message,
                timestamp: l.timestamp.toISOString(),
            })),
        };
    }

    /**
     * Convierte un ICharacter a ICombatant
     */
    private characterToCombatant(character: ICharacter, isPlayer: boolean): ICombatant {
        return {
            id: character.id,
            name: character.name,
            isPlayer,
            initiative: 0,
            currentHp: character.health.current,
            maxHp: character.health.maximum,
            currentStamina: character.stamina.current,
            maxStamina: character.stamina.maximum,
            currentMana: character.mana.current,
            maxMana: character.mana.maximum,
            attributes: {
                strength: character.attributes.strength,
                dexterity: character.attributes.dexterity,
                constitution: character.attributes.constitution,
                intelligence: character.attributes.intelligence,
                wisdom: character.attributes.wisdom,
                charisma: character.attributes.charisma,
                luck: character.attributes.luck,
            },
            level: character.level,
            statusEffects: [],
            isDefending: false,
            canAct: true,
        };
    }

    /**
     * Crea un combatiente enemigo desde un template
     */
    private createEnemyCombatant(templateId: string): ICombatant {
        const template = ENEMIES[templateId];
        if (!template) {
            // Enemigo genérico si no existe el template
            return {
                id: uuidv4(),
                name: 'Enemigo Desconocido',
                isPlayer: false,
                templateId,
                initiative: 0,
                currentHp: 30,
                maxHp: 30,
                currentStamina: 20,
                maxStamina: 20,
                currentMana: 0,
                maxMana: 0,
                attributes: {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 5,
                    wisdom: 5,
                    charisma: 5,
                    luck: 10,
                },
                level: 1,
                statusEffects: [],
                isDefending: false,
                canAct: true,
            };
        }

        const enemy = createEnemy(templateId);

        return {
            id: uuidv4(),
            name: enemy.name,
            isPlayer: false,
            templateId,
            initiative: 0,
            currentHp: enemy.health?.maximum || 30,
            maxHp: enemy.health?.maximum || 30,
            currentStamina: enemy.stamina?.maximum || 20,
            maxStamina: enemy.stamina?.maximum || 20,
            currentMana: enemy.mana?.maximum || 0,
            maxMana: enemy.mana?.maximum || 0,
            attributes: {
                strength: enemy.attributes?.strength || 10,
                dexterity: enemy.attributes?.dexterity || 10,
                constitution: enemy.attributes?.constitution || 10,
                intelligence: enemy.attributes?.intelligence || 5,
                wisdom: enemy.attributes?.wisdom || 5,
                charisma: enemy.attributes?.charisma || 5,
                luck: enemy.attributes?.luck || 10,
            },
            level: enemy.level || 1,
            statusEffects: [],
            isDefending: false,
            canAct: true,
        };
    }

    /**
     * Convierte un combatiente para UI
     */
    private combatantToUI(combatant: ICombatant): ICombatantUI {
        return {
            id: combatant.id,
            name: combatant.name,
            level: combatant.level,
            currentHp: combatant.currentHp,
            maxHp: combatant.maxHp,
            hpPercent: Math.round((combatant.currentHp / combatant.maxHp) * 100),
            currentStamina: combatant.currentStamina,
            maxStamina: combatant.maxStamina,
            staminaPercent: Math.round((combatant.currentStamina / combatant.maxStamina) * 100),
            currentMana: combatant.currentMana,
            maxMana: combatant.maxMana,
            manaPercent: combatant.maxMana > 0
                ? Math.round((combatant.currentMana / combatant.maxMana) * 100)
                : 0,
            statusEffects: combatant.statusEffects.map(e => ({
                name: e.name,
                icon: e.icon || '✨',
                duration: e.duration,
            })),
            isDefending: combatant.isDefending,
            ...(combatant.intention ? {
                intention: {
                    description: combatant.intention.description,
                    icon: combatant.intention.icon,
                },
            } : {}),
        };
    }

    /**
     * Calcula probabilidad de acierto
     */
    private calculateHitChance(attacker: ICombatant, target: ICombatant): number {
        let baseChance = 80;
        const dexBonus = (attacker.attributes.dexterity - 10) * 2;
        const targetEvasion = target.attributes.dexterity * 1.5;

        baseChance += dexBonus - targetEvasion;

        if (target.isDefending) {
            baseChance -= 15;
        }

        return Math.max(5, Math.min(95, baseChance));
    }

    /**
     * Calcula daño base
     */
    private calculateDamage(attacker: ICombatant, target: ICombatant): number {
        let baseDamage = 10 + attacker.attributes.strength * 1.5;
        baseDamage += attacker.level * 2;

        // Variación aleatoria
        const variation = (Math.random() - 0.5) * 0.3;
        baseDamage *= (1 + variation);

        // Reducción por constitución
        const defense = target.attributes.constitution * 0.8;
        baseDamage -= defense;

        return Math.max(1, Math.floor(baseDamage));
    }

    /**
     * Calcula probabilidad de crítico
     */
    private calculateCritChance(attacker: ICombatant): number {
        let critChance = 5;
        critChance += (attacker.attributes.dexterity - 10) * 0.5;
        critChance += (attacker.attributes.luck - 10) * 0.3;
        return Math.min(50, Math.max(1, critChance));
    }

    /**
     * Obtiene el nombre de un combatiente
     */
    private getCombatantName(session: ICombatSession, id?: string): string | undefined {
        if (!id) return undefined;
        return session.turnOrder.find(c => c.id === id)?.name;
    }

    /**
     * Obtiene el nombre de una skill
     */
    private getSkillName(skillId: string): string {
        const names: Record<string, string> = {
            'skill_bite': 'Mordisco',
            'skill_howl': 'Aullido',
            'skill_dirty_trick': 'Truco Sucio',
            'skill_backstab': 'Puñalada Trasera',
            'skill_throw_rock': 'Lanzar Piedra',
            'skill_bone_strike': 'Golpe de Hueso',
        };
        return names[skillId] || skillId;
    }

    /**
     * Agrega una entrada al log de combate
     */
    private addLogEntry(
        session: ICombatSession,
        entry: Omit<ICombatLogEntry, 'id' | 'round' | 'timestamp'>
    ): void {
        session.combatLog.push({
            ...entry,
            id: uuidv4(),
            round: session.round,
            timestamp: new Date(),
        });
    }

    /**
     * Limpia un combate terminado
     */
    endCombat(combatId: string): void {
        this.activeCombats.delete(combatId);
    }

    /**
     * Obtiene un combate activo
     */
    getCombat(combatId: string): ICombatSession | undefined {
        return this.activeCombats.get(combatId);
    }
}

// Instancia singleton
export const combatManager = new CombatManager();

export default CombatManager;
