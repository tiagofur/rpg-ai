/**
 * Map Components
 * Sistema de mini-mapa visual con locaciones conectadas
 */

export { MapNode } from './MapNode';
export { MiniMap } from './MiniMap';

// Re-export types
export type {
    LocationType,
    ExplorationStatus,
    IMapLocation,
    IMapState,
} from '../../types/map';

export {
    getLocationIcon,
    getDangerColor,
    getStatusColor,
    SAMPLE_MAP_DATA,
} from '../../types/map';
