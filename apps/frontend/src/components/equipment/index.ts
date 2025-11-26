/**
 * Equipment Components
 * Sistema de equipamiento visual con paperdoll
 */

export { EquipmentSlot } from './EquipmentSlot';
export { CharacterPaperdoll } from './CharacterPaperdoll';
export { EquipmentScreen } from './EquipmentScreen';

// Re-export types
export type {
    EquipmentSlotType,
    IEquipmentSlot,
    IEquippedItem,
    IItemStats,
    IEquipmentState,
    ITotalStats,
} from '../../types/equipment';

export {
    EQUIPMENT_SLOTS,
    getRarityColor,
    getSlotIcon,
    calculateEquipmentStats,
} from '../../types/equipment';
