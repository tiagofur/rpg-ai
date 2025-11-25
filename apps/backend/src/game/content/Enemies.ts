import { v4 as uuidv4 } from 'uuid';
import { ICharacter, IAttribute } from '../interfaces.js';

const createAttribute = (current: number, max: number): IAttribute => ({
    current,
    maximum: max,
    temporaryModifier: 0,
    permanentModifier: 0,
    regenerationRate: 1
});

export const ENEMIES: Record<string, Partial<ICharacter>> = {
    'enemy_giant_rat': {
        name: 'Giant Rat',
        class: 'Beast',
        level: 1,
        experience: 10,
        health: createAttribute(20, 20),
        mana: createAttribute(0, 0),
        stamina: createAttribute(20, 20),
        attributes: {
            strength: 4,
            dexterity: 12,
            intelligence: 2,
            wisdom: 4,
            constitution: 6,
            charisma: 1,
            luck: 5
        },
        skills: {},
        inventory: {
            maxCapacity: 10,
            currentWeight: 0,
            items: [],
            gold: 2
        },
        equipment: {},
        effects: [],
        faction: 'Hostile',
        isPlayer: false,
        isHostile: true,
        status: ['active']
    },
    'enemy_bandit': {
        name: 'Roadside Bandit',
        class: 'Rogue',
        level: 2,
        experience: 25,
        health: createAttribute(40, 40),
        mana: createAttribute(10, 10),
        stamina: createAttribute(30, 30),
        attributes: {
            strength: 8,
            dexterity: 10,
            intelligence: 8,
            wisdom: 8,
            constitution: 10,
            charisma: 8,
            luck: 8
        },
        skills: {},
        inventory: {
            maxCapacity: 50,
            currentWeight: 0,
            items: [],
            gold: 15
        },
        equipment: {}, // Should equip a dagger here
        effects: [],
        faction: 'Hostile',
        isPlayer: false,
        isHostile: true,
        status: ['active']
    },
    'enemy_wolf': {
        name: 'Dire Wolf',
        class: 'Beast',
        level: 3,
        experience: 40,
        health: createAttribute(60, 60),
        mana: createAttribute(0, 0),
        stamina: createAttribute(50, 50),
        attributes: {
            strength: 12,
            dexterity: 14,
            intelligence: 4,
            wisdom: 10,
            constitution: 12,
            charisma: 2,
            luck: 5
        },
        skills: {},
        inventory: {
            maxCapacity: 20,
            currentWeight: 0,
            items: [],
            gold: 0
        },
        equipment: {},
        effects: [],
        faction: 'Hostile',
        isPlayer: false,
        isHostile: true,
        status: ['active']
    }
};

export const createEnemy = (id: string): ICharacter => {
    const template = ENEMIES[id];
    if (!template) throw new Error(`Enemy template ${id} not found`);

    return {
        ...template,
        id: uuidv4(),
        // Deep copy attributes to avoid reference issues
        health: template.health ? { ...template.health } : createAttribute(10, 10),
        mana: template.mana ? { ...template.mana } : createAttribute(0, 0),
        stamina: template.stamina ? { ...template.stamina } : createAttribute(10, 10),
        attributes: template.attributes ? { ...template.attributes } : {
            strength: 1, dexterity: 1, intelligence: 1, wisdom: 1, constitution: 1, charisma: 1, luck: 1
        },
        inventory: template.inventory ? { ...template.inventory, items: [] } : { maxCapacity: 10, currentWeight: 0, items: [], gold: 0 },
        equipment: template.equipment ? { ...template.equipment } : {},
        effects: [],
        status: ['active']
    } as ICharacter;
};
