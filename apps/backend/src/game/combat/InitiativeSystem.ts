/**
 * InitiativeSystem - Calcula el orden de turnos en combate
 * 
 * Fórmula base: 1d20 + modificador de destreza + bonuses
 */

import { ICombatant } from './CombatInterfaces.js';

/**
 * Resultado del cálculo de iniciativa
 */
export interface IInitiativeRoll {
    combatantId: string;
    baseRoll: number;      // 1d20
    dexModifier: number;   // (DEX - 10) / 2
    bonuses: number;       // Otros bonuses
    total: number;         // Suma total
}

/**
 * Sistema de iniciativa para combate
 * Implementado como objeto con métodos estáticos
 */
export const InitiativeSystem = {
    /**
     * Calcula la iniciativa para todos los combatientes
     * @param combatants Lista de participantes
     * @param isAmbush Si es emboscada (enemigos obtienen +5)
     * @returns Lista ordenada por iniciativa (mayor primero)
     */
    calculateInitiative(
        combatants: ICombatant[],
        isAmbush: boolean = false
    ): ICombatant[] {
        const rolls: Array<{ combatant: ICombatant; roll: IInitiativeRoll }> = [];

        for (const combatant of combatants) {
            const roll = this.rollInitiative(combatant, isAmbush);
            rolls.push({ combatant: { ...combatant, initiative: roll.total }, roll });
        }

        // Ordenar por iniciativa descendente
        rolls.sort((a, b) => {
            // Primero por total de iniciativa
            if (b.roll.total !== a.roll.total) {
                return b.roll.total - a.roll.total;
            }
            // Empate: gana el de mayor destreza
            if (b.combatant.attributes.dexterity !== a.combatant.attributes.dexterity) {
                return b.combatant.attributes.dexterity - a.combatant.attributes.dexterity;
            }
            // Empate total: aleatorio
            return Math.random() - 0.5;
        });

        return rolls.map(r => r.combatant);
    },

    /**
     * Calcula la iniciativa individual de un combatiente
     */
    rollInitiative(combatant: ICombatant, isAmbush: boolean = false): IInitiativeRoll {
        // Tirada base 1d20
        const baseRoll = Math.floor(Math.random() * 20) + 1;

        // Modificador de destreza: (DEX - 10) / 2, redondeado hacia abajo
        const dexModifier = Math.floor((combatant.attributes.dexterity - 10) / 2);

        // Bonuses adicionales
        let bonuses = 0;

        // Si es emboscada y es enemigo, +5
        if (isAmbush && !combatant.isPlayer) {
            bonuses += 5;
        }

        // Si tiene efecto de "alerta" o similar
        const alertEffect = combatant.statusEffects.find(e => e.name === 'alert');
        if (alertEffect) {
            bonuses += 5;
        }

        // Si está "ralentizado"
        const slowEffect = combatant.statusEffects.find(e => e.name === 'slow');
        if (slowEffect) {
            bonuses -= 4;
        }

        // Bonus por nivel de suerte (muy pequeño)
        bonuses += Math.floor((combatant.attributes.luck - 10) / 5);

        const total = baseRoll + dexModifier + bonuses;

        return {
            combatantId: combatant.id,
            baseRoll,
            dexModifier,
            bonuses,
            total: Math.max(1, total), // Mínimo 1
        };
    },

    /**
     * Determina si un combatiente puede actuar primero (sorpresa)
     */
    checkSurprise(
        attacker: ICombatant,
        defender: ICombatant
    ): { surprised: boolean; attackerBonus: number } {
        // Tirada de sigilo vs percepción
        const stealthRoll = Math.floor(Math.random() * 20) + 1 +
            Math.floor((attacker.attributes.dexterity - 10) / 2);

        const perceptionRoll = Math.floor(Math.random() * 20) + 1 +
            Math.floor((defender.attributes.wisdom - 10) / 2);

        const surprised = stealthRoll > perceptionRoll + 5;

        return {
            surprised,
            attackerBonus: surprised ? 10 : 0, // +10 a iniciativa si sorprende
        };
    },

    /**
     * Formatea el orden de turnos para mostrar
     */
    formatTurnOrder(combatants: ICombatant[], currentIndex: number): string {
        const parts = combatants.map((c, i) => {
            const marker = i === currentIndex ? '►' : ' ';
            const playerMarker = c.isPlayer ? '👤' : '👾';
            return `${marker}${playerMarker} ${c.name} (${c.initiative})`;
        });

        return parts.join(' → ');
    },

    /**
     * Obtiene el siguiente combatiente en el orden
     */
    getNextTurn(
        combatants: ICombatant[],
        currentIndex: number
    ): { nextIndex: number; isNewRound: boolean } {
        // Filtrar combatientes que pueden actuar (vivos y no stunneados)
        const aliveCombatants = combatants.filter(c =>
            c.currentHp > 0 &&
            c.canAct &&
            !c.statusEffects.some(e => e.type === 'cc')
        );

        if (aliveCombatants.length === 0) {
            return { nextIndex: -1, isNewRound: false };
        }

        let nextIndex = currentIndex + 1;
        let isNewRound = false;
        const maxIterations = combatants.length + 1;
        let iterations = 0;

        // Buscar el siguiente que pueda actuar
        while (iterations < maxIterations) {
            if (nextIndex >= combatants.length) {
                nextIndex = 0;
                isNewRound = true;
            }

            const next = combatants[nextIndex];
            if (next && next.currentHp > 0 && next.canAct) {
                break;
            }

            nextIndex++;
            iterations++;

            // Llegamos al punto de partida
            if (nextIndex === currentIndex) {
                break;
            }
        }

        return { nextIndex, isNewRound };
    },
};

export default InitiativeSystem;
