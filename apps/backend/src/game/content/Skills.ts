import { v4 as uuidv4 } from 'uuid';
import { ISpell, ISkill } from '../interfaces.js';

export const SPELLS: Record<string, Partial<ISpell>> = {
    'spell_fireball': {
        name: 'Fireball',
        description: 'Hurls a ball of fire at the target.',
        level: 1,
        school: 'fire',
        manaCost: 15,
        cooldown: 5,
        requiredLevel: 1,
        requiresTarget: true,
        targetType: 'enemy',
        effects: [
            {
                type: 'damage',
                damageType: 'fire',
                baseValue: 20,
                duration: 0
            }
        ]
    },
    'spell_minor_heal': {
        name: 'Minor Heal',
        description: 'Restores a small amount of health.',
        level: 1,
        school: 'healing',
        manaCost: 10,
        cooldown: 10,
        requiredLevel: 1,
        requiresTarget: true,
        targetType: 'ally', // Can target self
        effects: [
            {
                type: 'heal',
                baseValue: 15,
                duration: 0
            }
        ]
    },
    'spell_ice_shard': {
        name: 'Ice Shard',
        description: 'Fires a shard of ice that slows the target.',
        level: 1,
        school: 'ice',
        manaCost: 12,
        cooldown: 6,
        requiredLevel: 2,
        requiresTarget: true,
        targetType: 'enemy',
        effects: [
            {
                type: 'damage',
                damageType: 'ice',
                baseValue: 12,
                duration: 0
            },
            {
                type: 'debuff',
                subtype: 'slow',
                baseValue: 10,
                duration: 5000
            }
        ]
    }
};

export const SKILLS: Record<string, Partial<ISkill>> = {
    'skill_power_strike': {
        name: 'Power Strike',
        description: 'A powerful melee attack.',
        level: 1,
        maxLevel: 5,
        experience: 0,
        category: 'combat'
    },
    'skill_stealth': {
        name: 'Stealth',
        description: 'Move silently and avoid detection.',
        level: 1,
        maxLevel: 5,
        experience: 0,
        category: 'rogue'
    }
};

export const createSpell = (id: string): ISpell => {
    const template = SPELLS[id];
    if (!template) throw new Error(`Spell template ${id} not found`);

    return {
        ...template,
        id: uuidv4(),
        effects: template.effects ? [...template.effects] : []
    } as ISpell;
};

export const createSkill = (id: string): ISkill => {
    const template = SKILLS[id];
    if (!template) throw new Error(`Skill template ${id} not found`);

    return {
        ...template
    } as ISkill;
};
