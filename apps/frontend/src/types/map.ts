/**
 * Map System Types
 * Tipos para el sistema de mini-mapa
 */

export type LocationType =
    | 'town'
    | 'forest'
    | 'cave'
    | 'shop'
    | 'tavern'
    | 'dungeon'
    | 'castle'
    | 'road'
    | 'unknown';

export type ExplorationStatus = 'unexplored' | 'visited' | 'current' | 'locked';

export interface IMapLocation {
    id: string;
    name: string;
    type: LocationType;
    status: ExplorationStatus;
    description?: string;
    connectedTo: string[]; // IDs of connected locations
    position: {
        x: number; // 0-100 percentage
        y: number; // 0-100 percentage
    };
    icon?: string;
    dangerLevel?: 'safe' | 'low' | 'medium' | 'high' | 'deadly';
}

export interface IMapState {
    currentLocationId: string;
    locations: IMapLocation[];
    regionName: string;
    fogOfWar: boolean; // If true, unexplored locations are hidden
}

/**
 * Get icon for location type
 */
export function getLocationIcon(type: LocationType): string {
    switch (type) {
        case 'town':
            return '🏠';
        case 'forest':
            return '🌲';
        case 'cave':
            return '🕳️';
        case 'shop':
            return '⚒️';
        case 'tavern':
            return '🍺';
        case 'dungeon':
            return '💀';
        case 'castle':
            return '🏰';
        case 'road':
            return '🛤️';
        default:
            return '❓';
    }
}

/**
 * Get danger level color
 */
export function getDangerColor(level?: string): string {
    switch (level) {
        case 'safe':
            return '#4CAF50';
        case 'low':
            return '#8BC34A';
        case 'medium':
            return '#FFC107';
        case 'high':
            return '#FF5722';
        case 'deadly':
            return '#F44336';
        default:
            return '#666666';
    }
}

/**
 * Get status color for location
 */
export function getStatusColor(status: ExplorationStatus): string {
    switch (status) {
        case 'current':
            return '#f7cf46'; // Gold - current position
        case 'visited':
            return '#4a9eff'; // Blue - explored
        case 'unexplored':
            return '#888888'; // Gray - unknown
        case 'locked':
            return '#444444'; // Dark gray - locked
        default:
            return '#666666';
    }
}

/**
 * Sample map data for testing
 */
export const SAMPLE_MAP_DATA: IMapState = {
    currentLocationId: 'plaza',
    regionName: 'Valle de Inicio',
    fogOfWar: true,
    locations: [
        {
            id: 'tavern',
            name: 'Taberna',
            type: 'tavern',
            status: 'visited',
            position: { x: 50, y: 80 },
            connectedTo: ['plaza'],
            dangerLevel: 'safe',
        },
        {
            id: 'plaza',
            name: 'Plaza del Pueblo',
            type: 'town',
            status: 'current',
            position: { x: 50, y: 60 },
            connectedTo: ['tavern', 'smithy', 'forest_entrance', 'unknown_east'],
            dangerLevel: 'safe',
        },
        {
            id: 'smithy',
            name: 'Herrería',
            type: 'shop',
            status: 'visited',
            position: { x: 25, y: 45 },
            connectedTo: ['plaza'],
            dangerLevel: 'safe',
        },
        {
            id: 'unknown_east',
            name: '???',
            type: 'unknown',
            status: 'unexplored',
            position: { x: 75, y: 45 },
            connectedTo: ['plaza'],
        },
        {
            id: 'forest_entrance',
            name: 'Entrada del Bosque',
            type: 'forest',
            status: 'visited',
            position: { x: 50, y: 40 },
            connectedTo: ['plaza', 'forest_clearing'],
            dangerLevel: 'low',
        },
        {
            id: 'forest_clearing',
            name: 'Claro del Bosque',
            type: 'forest',
            status: 'visited',
            position: { x: 50, y: 25 },
            connectedTo: ['forest_entrance', 'deep_forest'],
            dangerLevel: 'medium',
        },
        {
            id: 'deep_forest',
            name: 'Bosque Profundo',
            type: 'forest',
            status: 'unexplored',
            position: { x: 50, y: 10 },
            connectedTo: ['forest_clearing'],
            dangerLevel: 'high',
        },
    ],
};
