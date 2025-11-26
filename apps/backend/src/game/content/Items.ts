import { v4 as uuidv4 } from 'uuid';
import { IItem, Rarity, IGameEffect, EffectType } from '../interfaces.js';

export const ITEMS: Record<string, Partial<IItem>> = {
    // ============================================
    // ARMAS
    // ============================================
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
    'weapon_bandit_dagger': {
        name: 'Bandit Dagger',
        description: 'A curved blade favored by highway robbers.',
        type: 'weapon',
        rarity: Rarity.UNCOMMON,
        value: 25,
        weight: 1,
        stackable: false,
        stats: {
            attack: 7,
            criticalChance: 15
        }
    },
    'weapon_bandit_cutlass': {
        name: 'Bandit Cutlass',
        description: 'A notched but deadly blade.',
        type: 'weapon',
        rarity: Rarity.UNCOMMON,
        value: 40,
        weight: 2.5,
        stackable: false,
        stats: {
            attack: 10,
            criticalChance: 8
        }
    },
    'weapon_goblin_shiv': {
        name: 'Goblin Shiv',
        description: 'A crude but effective stabbing weapon.',
        type: 'weapon',
        rarity: Rarity.COMMON,
        value: 8,
        weight: 0.5,
        stackable: false,
        stats: {
            attack: 3,
            criticalChance: 12
        }
    },
    'weapon_bone_club': {
        name: 'Bone Club',
        description: 'A heavy club made from ancient bones.',
        type: 'weapon',
        rarity: Rarity.UNCOMMON,
        value: 30,
        weight: 3,
        stackable: false,
        stats: {
            attack: 12,
            criticalChance: 3
        }
    },

    // ============================================
    // ARMADURAS
    // ============================================
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
    },
    'armor_bandit_cloak': {
        name: 'Bandit Cloak',
        description: 'A worn cloak that helps blend into shadows.',
        type: 'armor',
        rarity: Rarity.UNCOMMON,
        value: 35,
        weight: 2,
        stackable: false,
        stats: {
            defense: 2,
            dodgeChance: 5
        }
    },
    'armor_wolf_hide': {
        name: 'Wolf Hide Armor',
        description: 'Armor crafted from wolf pelts.',
        type: 'armor',
        rarity: Rarity.UNCOMMON,
        value: 50,
        weight: 5,
        stackable: false,
        stats: {
            defense: 5
        }
    },
    'armor_goblin_rags': {
        name: 'Goblin Rags',
        description: 'Smelly but surprisingly resilient cloth.',
        type: 'armor',
        rarity: Rarity.COMMON,
        value: 5,
        weight: 1,
        stackable: false,
        stats: {
            defense: 1
        }
    },

    // ============================================
    // CONSUMIBLES
    // ============================================
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
    'potion_health_medium': {
        name: 'Health Potion',
        description: 'Restores a moderate amount of health.',
        type: 'consumable',
        rarity: Rarity.UNCOMMON,
        value: 40,
        weight: 0.5,
        stackable: true,
        effects: [
            {
                id: 'effect_heal_medium',
                name: 'Healing',
                description: 'Restores 50 HP',
                type: EffectType.HEAL,
                duration: 0,
                remainingDuration: 0,
                magnitude: 50,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },
    'potion_stamina_minor': {
        name: 'Minor Stamina Potion',
        description: 'Restores a small amount of stamina.',
        type: 'consumable',
        rarity: Rarity.COMMON,
        value: 12,
        weight: 0.5,
        stackable: true,
        effects: [
            {
                id: 'effect_stamina_minor',
                name: 'Minor Vigor',
                description: 'Restores 15 Stamina',
                type: EffectType.BUFF,
                duration: 0,
                remainingDuration: 0,
                magnitude: 15,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },
    'food_bread': {
        name: 'Bread',
        description: 'Simple but filling bread.',
        type: 'consumable',
        rarity: Rarity.COMMON,
        value: 2,
        weight: 0.3,
        stackable: true,
        effects: [
            {
                id: 'effect_food_bread',
                name: 'Satiated',
                description: 'Restores 5 HP',
                type: EffectType.HEAL,
                duration: 0,
                remainingDuration: 0,
                magnitude: 5,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },
    'food_cheese': {
        name: 'Cheese Wheel',
        description: 'A wheel of aged cheese.',
        type: 'consumable',
        rarity: Rarity.COMMON,
        value: 5,
        weight: 0.5,
        stackable: true,
        effects: [
            {
                id: 'effect_food_cheese',
                name: 'Well Fed',
                description: 'Restores 10 HP',
                type: EffectType.HEAL,
                duration: 0,
                remainingDuration: 0,
                magnitude: 10,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },
    'food_meat_cooked': {
        name: 'Cooked Meat',
        description: 'Tender, well-cooked meat.',
        type: 'consumable',
        rarity: Rarity.COMMON,
        value: 8,
        weight: 0.4,
        stackable: true,
        effects: [
            {
                id: 'effect_food_meat',
                name: 'Hearty Meal',
                description: 'Restores 15 HP',
                type: EffectType.HEAL,
                duration: 0,
                remainingDuration: 0,
                magnitude: 15,
                isStackable: false,
                maxStacks: 1,
                currentStacks: 1,
                sourceId: 'system',
                targetId: 'target'
            } as unknown as IGameEffect
        ]
    },

    // ============================================
    // MATERIALES
    // ============================================
    'material_rat_tail': {
        name: 'Rat Tail',
        description: 'A rat tail. Some alchemists buy these.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 2,
        weight: 0.1,
        stackable: true
    },
    'material_small_cheese': {
        name: 'Small Cheese',
        description: 'A nibbled piece of cheese.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 1,
        weight: 0.1,
        stackable: true
    },
    'material_wolf_pelt': {
        name: 'Wolf Pelt',
        description: 'A wolf pelt in good condition.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 15,
        weight: 2,
        stackable: true
    },
    'material_wolf_fang': {
        name: 'Wolf Fang',
        description: 'A sharp wolf fang.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 5,
        weight: 0.1,
        stackable: true
    },
    'material_pristine_pelt': {
        name: 'Pristine Pelt',
        description: 'A perfect wolf pelt, very valuable.',
        type: 'material',
        rarity: Rarity.RARE,
        value: 50,
        weight: 2,
        stackable: true
    },
    'material_stolen_goods': {
        name: 'Stolen Goods',
        description: 'Items of dubious origin.',
        type: 'material',
        rarity: Rarity.UNCOMMON,
        value: 10,
        weight: 1,
        stackable: true
    },
    'material_goblin_ear': {
        name: 'Goblin Ear',
        description: 'Proof of a defeated goblin.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 3,
        weight: 0.1,
        stackable: true
    },
    'material_shiny_stone': {
        name: 'Shiny Stone',
        description: 'A gleaming stone. Goblins love these.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 1,
        weight: 0.2,
        stackable: true
    },
    'material_bone': {
        name: 'Bone',
        description: 'An ancient bone.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 1,
        weight: 0.3,
        stackable: true
    },
    'material_ancient_coin': {
        name: 'Ancient Coin',
        description: 'A coin from a forgotten era.',
        type: 'material',
        rarity: Rarity.UNCOMMON,
        value: 8,
        weight: 0.05,
        stackable: true
    },
    'material_wolf_raw_meat': {
        name: 'Raw Wolf Meat',
        description: 'Fresh meat from a wolf. Can be cooked.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 3,
        weight: 0.5,
        stackable: true
    },
    'material_herb_healing': {
        name: 'Healing Herb',
        description: 'A medicinal herb used in potion crafting.',
        type: 'material',
        rarity: Rarity.COMMON,
        value: 5,
        weight: 0.1,
        stackable: true
    },

    // ============================================
    // LLAVES Y OBJETOS ESPECIALES
    // ============================================
    'key_cellar': {
        name: 'Cellar Key',
        description: 'A rusty key to the tavern cellar.',
        type: 'key',
        rarity: Rarity.COMMON,
        value: 0,
        weight: 0.1,
        stackable: false
    },
    'key_forest_chest': {
        name: 'Forest Chest Key',
        description: 'A key found on a bandit. Opens a hidden chest.',
        type: 'key',
        rarity: Rarity.UNCOMMON,
        value: 0,
        weight: 0.1,
        stackable: false
    },

    // ============================================
    // ACCESORIOS
    // ============================================
    'accessory_lucky_charm': {
        name: 'Lucky Charm',
        description: 'A small trinket that brings good fortune.',
        type: 'accessory',
        rarity: Rarity.UNCOMMON,
        value: 30,
        weight: 0.1,
        stackable: false,
        stats: {
            criticalChance: 3
        }
    },
    'accessory_wolf_tooth_necklace': {
        name: 'Wolf Tooth Necklace',
        description: 'A necklace made of wolf fangs. Intimidating.',
        type: 'accessory',
        rarity: Rarity.UNCOMMON,
        value: 25,
        weight: 0.2,
        stackable: false,
        stats: {
            attack: 2
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
