import { v4 as uuidv4 } from 'uuid';
import { IItem, Rarity, IGameEffect, EffectType } from '../interfaces.js';

export const ITEMS: Record<string, Partial<IItem>> = {
    'weapon_rusty_sword': {
        name: 'Rusty Sword',
        description: 'An old, chipped blade. Better than nothing.',
        type: 'weapon',
        rarity: Rarity.COMMON,
        value: 5,
        weight: 2,
        stackable: false,
        stats: {
            attack: 5,
            criticalChance: 2
        }
    },
    'weapon_iron_dagger': {
        name: 'Iron Dagger',
        description: 'A simple but sharp dagger.',
        type: 'weapon',
        rarity: Rarity.COMMON,
        value: 10,
        weight: 1,
        stackable: false,
        stats: {
            attack: 4,
            criticalChance: 10
        }
    },
    'weapon_oak_staff': {
        name: 'Oak Staff',
        description: 'A sturdy staff made of oak.',
        type: 'weapon',
        rarity: Rarity.COMMON,
        value: 8,
        weight: 3,
        stackable: false,
        stats: {
            attack: 3,
            magicAttack: 5
        }
    },
    'potion_health_minor': {
        name: 'Minor Health Potion',
        description: 'Restores a small amount of health.',
        type: 'consumable',
        rarity: Rarity.COMMON,
        value: 15,
        weight: 0.5,
        stackable: true,
        effects: [
            {
                id: 'effect_heal_minor',
                name: 'Minor Healing',
                description: 'Restores 20 HP',
                type: EffectType.HEAL,
                duration: 0,
                remainingDuration: 0,
                magnitude: 20,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },
    'armor_leather_vest': {
        name: 'Leather Vest',
        description: 'Basic protection for adventurers.',
        type: 'armor',
        rarity: Rarity.COMMON,
        value: 20,
        weight: 4,
        stackable: false,
        stats: {
            defense: 3
        }
    }
};

export const createItem = (id: string): IItem => {
    const template = ITEMS[id];
    if (!template) throw new Error(`Item template ${id} not found`);

    return {
        id: uuidv4(),
        name: template.name || 'Unknown Item',
        description: template.description || '',
        type: template.type || 'misc',
        isInteractable: true,
        isCollectible: true,
        rarity: template.rarity || Rarity.COMMON,
        value: template.value || 0,
        weight: template.weight || 0,
        stackable: template.stackable || false,
        quantity: 1,
        stats: template.stats,
        effects: template.effects ? template.effects.map(e => ({ ...e, id: uuidv4() })) : []
    } as IItem;
};
