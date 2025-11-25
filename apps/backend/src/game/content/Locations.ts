import { v4 as uuidv4 } from 'uuid';
import { ILocation, LocationType, ICharacter, IGameObject } from '../interfaces.js';
import { createItem } from './Items.js';

interface LocationTemplate extends Omit<Partial<ILocation>, 'type'> {
    type: LocationType;
    exits?: string[];
    enemyIds?: string[];
    npcIds?: string[];
    itemIds?: string[];
}

export const LOCATIONS: Record<string, LocationTemplate> = {
    'loc_town_square': {
        name: 'Town Square',
        description: 'The bustling center of the town. Merchants and adventurers gather here.',
        type: LocationType.TOWN,
        coordinates: { x: 0, y: 0, z: 0 },
        exits: ['loc_forest_entrance', 'loc_blacksmith', 'loc_inn'],
        npcIds: [],
        enemyIds: [],
        itemIds: []
    },
    'loc_forest_entrance': {
        name: 'Forest Entrance',
        description: 'The edge of the dark forest. It looks dangerous.',
        type: LocationType.WILDERNESS,
        coordinates: { x: 0, y: 1, z: 0 },
        exits: ['loc_town_square', 'loc_forest_clearing'],
        npcIds: [],
        enemyIds: ['enemy_giant_rat'],
        itemIds: []
    },
    'loc_forest_clearing': {
        name: 'Forest Clearing',
        description: 'A small clearing in the forest. Sunlight filters through the trees.',
        type: LocationType.WILDERNESS,
        coordinates: { x: 0, y: 2, z: 0 },
        exits: ['loc_forest_entrance'],
        npcIds: [],
        enemyIds: ['enemy_wolf', 'enemy_bandit'],
        itemIds: ['item_herb_healing']
    },
    'loc_blacksmith': {
        name: 'Blacksmith',
        description: 'The sound of hammering fills the air. Weapons and armor are made here.',
        type: LocationType.TOWN,
        coordinates: { x: 1, y: 0, z: 0 },
        exits: ['loc_town_square'],
        npcIds: ['npc_blacksmith'],
        enemyIds: [],
        itemIds: []
    },
    'loc_inn': {
        name: 'The Rusty Tankard Inn',
        description: 'A warm and cozy inn. A good place to rest.',
        type: LocationType.INTERIOR,
        coordinates: { x: -1, y: 0, z: 0 },
        exits: ['loc_town_square'],
        npcIds: ['npc_innkeeper'],
        enemyIds: [],
        itemIds: []
    }
};

export const createLocation = (id: string): ILocation => {
    const template = LOCATIONS[id];
    if (!template) throw new Error(`Location template ${id} not found`);

    const objects: IGameObject[] = [];
    if (template.itemIds) {
        for (const itemId of template.itemIds) {
            try {
                const item = createItem(itemId);
                objects.push(item);
            } catch (e) {
                console.warn(`Failed to create item ${itemId} for location ${id}`, e);
            }
        }
    }

    return {
        id: uuidv4(),
        name: template.name || 'Unknown Location',
        description: template.description || '',
        type: template.type,
        coordinates: template.coordinates || { x: 0, y: 0, z: 0 },
        connections: [],
        objects,
        characters: [] as ICharacter[],
        timeOfDay: 'day'
    };
};
