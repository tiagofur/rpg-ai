export interface ICharacter {
  id: string;
  userId: string;
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attributes: ICharacterAttributes;
  position: IPosition;
  inventory: IInventory;
  equipment: IEquipment;
  status: ICharacterStatus;
  class: CharacterClass;
  race: CharacterRace;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICharacterAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  luck: number;
  baseStrength: number;
  baseDexterity: number;
  baseIntelligence: number;
  baseVitality: number;
  baseLuck: number;
}

export interface IPosition {
  x: number;
  y: number;
  z: number;
  mapId: string;
  region: string;
}

export interface IInventory {
  id: string;
  characterId: string;
  maxSlots: number;
  items: Array<IInventoryItem>;
  weight: number;
  maxWeight: number;
}

export interface IInventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  slot: number;
  equipped: boolean;
  durability: number;
  maxDurability: number;
  enchantments: Array<IEnchantment>;
  metadata?: Record<string, any>;
}

export interface IItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  weight: number;
  value: number;
  requirements?: IItemRequirements;
  stats?: IItemStats;
  effects?: Array<IItemEffect>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IItemRequirements {
  level: number;
  class?: Array<CharacterClass>;
  attributes?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    vitality?: number;
  };
}

export interface IItemStats {
  attack?: number;
  defense?: number;
  magicAttack?: number;
  magicDefense?: number;
  health?: number;
  mana?: number;
  criticalChance?: number;
  dodgeChance?: number;
}

export interface IItemEffect {
  type: EffectType;
  value: number;
  duration?: number;
  chance?: number;
}

export interface IEnchantment {
  id: string;
  type: EnchantmentType;
  level: number;
  value: number;
}

export interface IEquipment {
  helmet?: IInventoryItem;
  armor?: IInventoryItem;
  weapon?: IInventoryItem;
  shield?: IInventoryItem;
  gloves?: IInventoryItem;
  boots?: IInventoryItem;
  ring1?: IInventoryItem;
  ring2?: IInventoryItem;
  necklace?: IInventoryItem;
}

export interface ICharacterStatus {
  isAlive: boolean;
  isInCombat: boolean;
  isResting: boolean;
  isMounted: boolean;
  isInvisible: boolean;
  effects: Array<IActiveEffect>;
  cooldowns: Array<ICooldown>;
}

export interface IActiveEffect {
  id: string;
  type: EffectType;
  value: number;
  duration: number;
  remainingDuration: number;
  source: string;
  stackable: boolean;
  stacks: number;
}

export interface ICooldown {
  skillId: string;
  remainingTime: number;
  totalTime: number;
}

export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ROGUE = 'rogue',
  CLERIC = 'cleric',
  RANGER = 'ranger',
  PALADIN = 'paladin'
}

export enum CharacterRace {
  HUMAN = 'human',
  ELF = 'elf',
  DWARF = 'dwarf',
  ORC = 'orc',
  UNDEAD = 'undead',
  DRAGONBORN = 'dragonborn'
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CONSUMABLE = 'consumable',
  QUEST = 'quest',
  MATERIAL = 'material',
  MISC = 'misc'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

export enum EffectType {
  HEAL = 'heal',
  DAMAGE = 'damage',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  POISON = 'poison',
  STUN = 'stun',
  SLOW = 'slow',
  HASTE = 'haste',
  INVISIBLE = 'invisible'
}

export enum EnchantmentType {
  SHARPNESS = 'sharpness',
  PROTECTION = 'protection',
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning',
  LUCK = 'luck'
}