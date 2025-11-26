/**
 * LootManager - Sistema de generación de loot
 * 
 * Genera drops aleatorios basados en las tablas de loot
 */

import { v4 as uuidv4 } from 'uuid';
import { IItem, IReward, Rarity } from '../interfaces.js';
import { getLootTable, ILootDrop } from './LootTables.js';
import { ITEMS, createItem } from '../content/Items.js';

/**
 * Resultado de generación de loot
 */
export interface ILootResult {
    /** Oro obtenido */
    gold: number;
    /** Items obtenidos con cantidad */
    items: Array<{ item: IItem; quantity: number }>;
    /** XP ganada (del enemigo) */
    experienceGained: number;
    /** Mensaje descriptivo del loot */
    description: string;
}

/**
 * Opciones para modificar la generación de loot
 */
export interface ILootOptions {
    /** Multiplicador de probabilidad de drop (1.0 = normal) */
    dropChanceMultiplier?: number;
    /** Multiplicador de oro (1.0 = normal) */
    goldMultiplier?: number;
    /** Multiplicador de cantidad (1.0 = normal) */
    quantityMultiplier?: number;
    /** Stat de suerte del personaje */
    luck?: number;
}

/**
 * Clase que gestiona la generación de loot
 */
export class LootManager {
    private static readonly DEFAULT_OPTIONS: Required<ILootOptions> = {
        dropChanceMultiplier: 1,
        goldMultiplier: 1,
        quantityMultiplier: 1,
        luck: 10, // Valor base de suerte
    };

    /**
     * Genera loot para un enemigo derrotado
     * @param enemyId ID del template del enemigo
     * @param enemyExperience XP que otorga el enemigo
     * @param options Opciones de modificación de loot
     * @returns Resultado del loot generado
     */
    static generateLoot(
        enemyId: string,
        enemyExperience: number = 0,
        options: ILootOptions = {}
    ): ILootResult {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const lootTable = getLootTable(enemyId);

        // Si no hay tabla de loot, retornar loot vacío
        if (!lootTable) {
            return {
                gold: 0,
                items: [],
                experienceGained: enemyExperience,
                description: 'No se encontró nada de valor.',
            };
        }

        // Generar oro
        const gold = this.rollGold(lootTable.guaranteedGold, opts);

        // Generar items
        const items = this.rollItems(lootTable.drops, opts);

        // Generar descripción
        const description = this.generateDescription(gold, items, enemyExperience);

        return {
            gold,
            items,
            experienceGained: enemyExperience,
            description,
        };
    }

    /**
     * Genera la cantidad de oro basada en el rango
     */
    private static rollGold(
        goldRange: { min: number; max: number },
        options: Required<ILootOptions>
    ): number {
        if (goldRange.max <= 0) return 0;

        const baseGold = Math.floor(
            Math.random() * (goldRange.max - goldRange.min + 1) + goldRange.min
        );

        // Aplicar multiplicador de oro
        let finalGold = Math.floor(baseGold * options.goldMultiplier);

        // Bonus por suerte (cada punto de suerte sobre 10 = +1% oro)
        const luckBonus = Math.max(0, options.luck - 10) * 0.01;
        finalGold = Math.floor(finalGold * (1 + luckBonus));

        return finalGold;
    }

    /**
     * Genera los items basados en la tabla de drops
     */
    private static rollItems(
        drops: ILootDrop[],
        options: Required<ILootOptions>
    ): Array<{ item: IItem; quantity: number }> {
        const result: Array<{ item: IItem; quantity: number }> = [];

        for (const drop of drops) {
            // Calcular probabilidad ajustada
            let adjustedChance = drop.chance * options.dropChanceMultiplier;

            // Bonus por suerte (cada punto de suerte sobre 10 = +0.5% al chance)
            const luckBonus = Math.max(0, options.luck - 10) * 0.005;
            adjustedChance = Math.min(1, adjustedChance * (1 + luckBonus));

            // Tirar el dado
            if (Math.random() <= adjustedChance) {
                // Calcular cantidad
                const baseQuantity = Math.floor(
                    Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
                );
                const quantity = Math.max(1, Math.floor(baseQuantity * options.quantityMultiplier));

                // Crear el item
                const item = this.createItemFromDrop(drop.itemId);
                if (item) {
                    result.push({ item, quantity });
                }
            }
        }

        return result;
    }

    /**
     * Crea un item a partir de su ID
     */
    private static createItemFromDrop(itemId: string): IItem | null {
        // Primero buscar en items definidos
        if (ITEMS[itemId]) {
            return createItem(itemId);
        }

        // Si no existe, crear un placeholder para materiales
        if (itemId.startsWith('material_')) {
            return this.createMaterialItem(itemId);
        }

        // Si no existe, retornar null (item no definido)
        return null;
    }

    /**
     * Crea un item de material genérico
     */
    private static createMaterialItem(itemId: string): IItem {
        const materialNames: Record<string, { name: string; description: string; value: number }> = {
            'material_rat_tail': {
                name: 'Cola de Rata',
                description: 'Una cola de rata. Algunos alquimistas la compran.',
                value: 2,
            },
            'material_small_cheese': {
                name: 'Queso Pequeño',
                description: 'Un trozo de queso mordisqueado.',
                value: 1,
            },
            'material_wolf_pelt': {
                name: 'Piel de Lobo',
                description: 'Una piel de lobo en buen estado.',
                value: 15,
            },
            'material_wolf_fang': {
                name: 'Colmillo de Lobo',
                description: 'Un colmillo afilado de lobo.',
                value: 5,
            },
            'material_pristine_pelt': {
                name: 'Piel Prístina',
                description: 'Una piel de lobo perfecta, muy valiosa.',
                value: 50,
            },
            'material_stolen_goods': {
                name: 'Bienes Robados',
                description: 'Objetos robados de dudosa procedencia.',
                value: 10,
            },
            'material_goblin_ear': {
                name: 'Oreja de Goblin',
                description: 'Prueba de goblin derrotado.',
                value: 3,
            },
            'material_shiny_stone': {
                name: 'Piedra Brillante',
                description: 'Una piedra que brilla. A los goblins les gustan.',
                value: 1,
            },
            'material_bone': {
                name: 'Hueso',
                description: 'Un hueso antiguo.',
                value: 1,
            },
            'material_ancient_coin': {
                name: 'Moneda Antigua',
                description: 'Una moneda de una era olvidada.',
                value: 8,
            },
        };

        const materialInfo = materialNames[itemId] || {
            name: itemId.replace('material_', '').replace(/_/g, ' '),
            description: 'Un material de utilidad desconocida.',
            value: 1,
        };

        return {
            id: uuidv4(),
            name: materialInfo.name,
            description: materialInfo.description,
            type: 'material',
            rarity: Rarity.COMMON,
            value: materialInfo.value,
            weight: 0.1,
            stackable: true,
            quantity: 1,
            isInteractable: true,
            isCollectible: true,
        } as IItem;
    }

    /**
     * Genera una descripción legible del loot obtenido
     */
    private static generateDescription(
        gold: number,
        items: Array<{ item: IItem; quantity: number }>,
        xp: number
    ): string {
        const parts: string[] = [];

        if (xp > 0) {
            parts.push(`⭐ +${xp} XP`);
        }

        if (gold > 0) {
            parts.push(`🪙 +${gold} Oro`);
        }

        if (items.length > 0) {
            const itemDescriptions = items.map((i) => {
                const quantityStr = i.quantity > 1 ? ` ×${i.quantity}` : '';
                return `${i.item.name}${quantityStr}`;
            });
            parts.push(`📦 ${itemDescriptions.join(', ')}`);
        }

        if (parts.length === 0) {
            return 'No se encontró nada de valor.';
        }

        return parts.join('\n');
    }

    /**
     * Convierte el resultado de loot en recompensas para el sistema de comandos
     */
    static lootToRewards(lootResult: ILootResult): IReward[] {
        const rewards: IReward[] = [];

        // XP
        if (lootResult.experienceGained > 0) {
            rewards.push({
                type: 'experience',
                amount: lootResult.experienceGained,
                description: `Ganaste ${lootResult.experienceGained} puntos de experiencia`,
            });
        }

        // Oro
        if (lootResult.gold > 0) {
            rewards.push({
                type: 'gold',
                amount: lootResult.gold,
                description: `Encontraste ${lootResult.gold} monedas de oro`,
            });
        }

        // Items
        for (const { item, quantity } of lootResult.items) {
            rewards.push({
                type: 'item',
                amount: quantity,
                itemId: item.id,
                item,
                description: quantity > 1
                    ? `Obtuviste ${quantity}x ${item.name}`
                    : `Obtuviste ${item.name}`,
            });
        }

        return rewards;
    }
}

export default LootManager;
