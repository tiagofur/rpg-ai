/**
 * Equipment System Types
 * Tipos para el sistema de equipamiento del personaje
 */

export type EquipmentSlotType =
    | 'helmet'
    | 'armor'
    | 'gloves'
    | 'boots'
    | 'weapon'
    | 'shield'
    | 'amulet'
    | 'ring1'
    | 'ring2';

export interface IEquipmentSlot {
    type: EquipmentSlotType;
    label: string;
    icon: string;
    emptyIcon: string;
}

export interface IEquippedItem {
    id: string;
    name: string;
    type: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    description?: string;
    value: number;
    stats?: IItemStats;
}

export interface IItemStats {
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    wisdom?: number;
    constitution?: number;
    charisma?: number;
    luck?: number;
    criticalChance?: number;
    criticalDamage?: number;
}

export interface IEquipmentState {
    helmet?: IEquippedItem | undefined;
    armor?: IEquippedItem | undefined;
    gloves?: IEquippedItem | undefined;
    boots?: IEquippedItem | undefined;
    weapon?: IEquippedItem | undefined;
    shield?: IEquippedItem | undefined;
    amulet?: IEquippedItem | undefined;
    ring1?: IEquippedItem | undefined;
    ring2?: IEquippedItem | undefined;
}

export interface ITotalStats {
    attack: number;
    defense: number;
    health: number;
    mana: number;
    bonusAttack: number;
    bonusDefense: number;
    bonusHealth: number;
    bonusMana: number;
}

/**
 * Slot configuration with labels and icons
 */
export const EQUIPMENT_SLOTS: IEquipmentSlot[] = [
    { type: 'helmet', label: 'Helmet', icon: '🎩', emptyIcon: '○' },
    { type: 'amulet', label: 'Amulet', icon: '📿', emptyIcon: '○' },
    { type: 'armor', label: 'Armor', icon: '🛡️', emptyIcon: '○' },
    { type: 'weapon', label: 'Weapon', icon: '⚔️', emptyIcon: '○' },
    { type: 'shield', label: 'Shield', icon: '🛡️', emptyIcon: '○' },
    { type: 'gloves', label: 'Gloves', icon: '🧤', emptyIcon: '○' },
    { type: 'boots', label: 'Boots', icon: '👢', emptyIcon: '○' },
    { type: 'ring1', label: 'Ring', icon: '💍', emptyIcon: '○' },
    { type: 'ring2', label: 'Ring', icon: '💍', emptyIcon: '○' },
];

/**
 * Get rarity color for equipment items
 */
export function getRarityColor(rarity?: string): string {
    switch (rarity?.toLowerCase()) {
        case 'common':
            return '#b0b0b0';
        case 'uncommon':
            return '#1eff00';
        case 'rare':
            return '#0070dd';
        case 'epic':
            return '#a335ee';
        case 'legendary':
            return '#ff8000';
        default:
            return '#666666';
    }
}

/**
 * Get slot icon based on item type
 */
export function getSlotIcon(type: EquipmentSlotType): string {
    const slot = EQUIPMENT_SLOTS.find((s) => s.type === type);
    return slot?.icon || '○';
}

/**
 * Calculate total stats from equipment
 */
export function calculateEquipmentStats(equipment: IEquipmentState): ITotalStats {
    const totals: ITotalStats = {
        attack: 0,
        defense: 0,
        health: 0,
        mana: 0,
        bonusAttack: 0,
        bonusDefense: 0,
        bonusHealth: 0,
        bonusMana: 0,
    };

    const slots = Object.values(equipment).filter(Boolean) as IEquippedItem[];

    for (const item of slots) {
        if (item.stats) {
            totals.bonusAttack += item.stats.attack || 0;
            totals.bonusDefense += item.stats.defense || 0;
            totals.bonusHealth += item.stats.health || 0;
            totals.bonusMana += item.stats.mana || 0;
        }
    }

    return totals;
}
