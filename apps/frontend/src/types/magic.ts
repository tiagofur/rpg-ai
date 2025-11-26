/**
 * Magic System Types
 * Tipos para el sistema de magia y hechizos
 */

export type SpellSchool =
    | 'fire'
    | 'ice'
    | 'lightning'
    | 'earth'
    | 'light'
    | 'dark'
    | 'arcane'
    | 'nature';

export type SpellTargetType =
    | 'self'
    | 'single_enemy'
    | 'all_enemies'
    | 'single_ally'
    | 'all_allies'
    | 'area';

export type SpellEffectType =
    | 'damage'
    | 'heal'
    | 'buff'
    | 'debuff'
    | 'summon'
    | 'teleport'
    | 'shield'
    | 'dot' // Damage over time
    | 'hot'; // Heal over time

export interface ISpellEffect {
    type: SpellEffectType;
    value: number;
    duration?: number; // In turns, for buffs/debuffs/dots
    stat?: string; // For buffs/debuffs - which stat to affect
    chance?: number; // Probability 0-1 for proc effects
}

export interface ISpell {
    id: string;
    name: string;
    description: string;
    school: SpellSchool;
    icon: string; // Emoji or icon name

    // Costs
    manaCost: number;
    staminaCost?: number;

    // Combat info
    targetType: SpellTargetType;
    range: 'melee' | 'short' | 'medium' | 'long';
    castTime?: number; // 0 = instant, >0 = channeled

    // Damage/healing
    baseDamage?: { min: number; max: number };
    baseHealing?: { min: number; max: number };
    effects?: ISpellEffect[];

    // Cooldown
    cooldown: number; // In turns
    currentCooldown?: number;

    // Requirements
    levelRequired: number;
    classRequired?: string[];
    prerequisiteSpell?: string;

    // Visual
    animation?: string;
    soundEffect?: string;
}

export interface ISpellState {
    learnedSpells: string[]; // Spell IDs
    activeSpells: IActiveSpell[]; // Currently equipped/ready spells
    cooldowns: Record<string, number>; // spellId -> turns remaining
    currentMana: number;
    maxMana: number;
}

export interface IActiveSpell {
    spellId: string;
    slotIndex: number; // 0-3 for quick slots
}

export interface ISpellCastResult {
    success: boolean;
    spellId: string;
    targetIds: string[];
    damage?: number;
    healing?: number;
    effects?: ISpellEffect[];
    message: string;
    isCritical?: boolean;
    manaSpent: number;
}

/**
 * Get school color for UI
 */
export function getSchoolColor(school: SpellSchool): string {
    switch (school) {
        case 'fire':
            return '#FF6B35';
        case 'ice':
            return '#4ECDC4';
        case 'lightning':
            return '#FFE66D';
        case 'earth':
            return '#8B7355';
        case 'light':
            return '#F7DC6F';
        case 'dark':
            return '#8E44AD';
        case 'arcane':
            return '#3498DB';
        case 'nature':
            return '#2ECC71';
        default:
            return '#FFFFFF';
    }
}

/**
 * Get school icon emoji
 */
export function getSchoolIcon(school: SpellSchool): string {
    switch (school) {
        case 'fire':
            return '🔥';
        case 'ice':
            return '❄️';
        case 'lightning':
            return '⚡';
        case 'earth':
            return '🪨';
        case 'light':
            return '✨';
        case 'dark':
            return '🌑';
        case 'arcane':
            return '💫';
        case 'nature':
            return '🌿';
        default:
            return '✦';
    }
}

/**
 * Get target type description
 */
export function getTargetDescription(targetType: SpellTargetType): string {
    switch (targetType) {
        case 'self':
            return 'Self';
        case 'single_enemy':
            return 'Single Enemy';
        case 'all_enemies':
            return 'All Enemies';
        case 'single_ally':
            return 'Single Ally';
        case 'all_allies':
            return 'All Allies';
        case 'area':
            return 'Area';
        default:
            return 'Unknown';
    }
}

/**
 * Check if spell can be cast
 */
export function canCastSpell(
    spell: ISpell,
    state: ISpellState,
    _inCombat: boolean = true
): { canCast: boolean; reason?: string | undefined } {
    // Check mana
    if (state.currentMana < spell.manaCost) {
        return { canCast: false, reason: 'Not enough mana' };
    }

    // Check cooldown
    const cooldownRemaining = state.cooldowns[spell.id] || 0;
    if (cooldownRemaining > 0) {
        return { canCast: false, reason: `On cooldown (${cooldownRemaining} turns)` };
    }

    // Check if learned
    if (!state.learnedSpells.includes(spell.id)) {
        return { canCast: false, reason: 'Spell not learned' };
    }

    return { canCast: true };
}

/**
 * Format mana cost display
 */
export function formatManaCost(cost: number): string {
    return `${cost} MP`;
}

/**
 * Format cooldown display
 */
export function formatCooldown(turns: number): string {
    if (turns === 0) return 'No cooldown';
    if (turns === 1) return '1 turn';
    return `${turns} turns`;
}

/**
 * Sample spells for testing
 */
export const SAMPLE_SPELLS: ISpell[] = [
    {
        id: 'fireball',
        name: 'Fireball',
        description: 'Hurls a ball of fire at the enemy, dealing fire damage.',
        school: 'fire',
        icon: '🔥',
        manaCost: 15,
        targetType: 'single_enemy',
        range: 'medium',
        baseDamage: { min: 20, max: 30 },
        cooldown: 0,
        levelRequired: 1,
    },
    {
        id: 'ice_shard',
        name: 'Ice Shard',
        description: 'Launches a sharp ice crystal that slows the target.',
        school: 'ice',
        icon: '❄️',
        manaCost: 12,
        targetType: 'single_enemy',
        range: 'medium',
        baseDamage: { min: 12, max: 18 },
        effects: [{ type: 'debuff', value: -2, stat: 'speed', duration: 2 }],
        cooldown: 2,
        levelRequired: 1,
    },
    {
        id: 'heal',
        name: 'Minor Heal',
        description: 'Restores a small amount of health.',
        school: 'light',
        icon: '💚',
        manaCost: 10,
        targetType: 'self',
        range: 'melee',
        baseHealing: { min: 15, max: 25 },
        cooldown: 0,
        levelRequired: 1,
    },
    {
        id: 'arcane_shield',
        name: 'Arcane Shield',
        description: 'Creates a magical barrier that absorbs damage.',
        school: 'arcane',
        icon: '🛡️',
        manaCost: 20,
        targetType: 'self',
        range: 'melee',
        effects: [{ type: 'shield', value: 30, duration: 3 }],
        cooldown: 4,
        levelRequired: 2,
    },
    {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        description: 'Strikes an enemy with a bolt of lightning.',
        school: 'lightning',
        icon: '⚡',
        manaCost: 18,
        targetType: 'single_enemy',
        range: 'long',
        baseDamage: { min: 25, max: 35 },
        effects: [{ type: 'debuff', value: 0, stat: 'stun', duration: 1, chance: 0.25 }],
        cooldown: 1,
        levelRequired: 3,
    },
    {
        id: 'poison_cloud',
        name: 'Poison Cloud',
        description: 'Creates a toxic cloud that damages enemies over time.',
        school: 'nature',
        icon: '☁️',
        manaCost: 25,
        targetType: 'all_enemies',
        range: 'medium',
        effects: [{ type: 'dot', value: 5, duration: 4 }],
        cooldown: 3,
        levelRequired: 4,
    },
];
