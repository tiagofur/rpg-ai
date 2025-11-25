export type UUID = string;
export type ISOTimestamp = string;

// ===== INTERFACES BASE DEL COMMAND PATTERN =====

/**
 * Interfaz base para todos los comandos del juego
 * Implementa el patrón Command para desacoplar acciones del juego
 */
export interface IGameCommand {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly type: CommandType;
  readonly cooldownMs: number;
  readonly requiredLevel: number;
  readonly requiredItems?: Array<UUID>;
  readonly requiredSkills?: Array<string>;

  /**
   * Ejecuta el comando en el contexto proporcionado
   */
  execute(context: IGameContext): Promise<ICommandResult>;

  /**
   * Valida si el comando puede ser ejecutado
   */
  validate(context: IGameContext): IValidationResult;

  /**
   * Calcula el coste de ejecutar el comando
   */
  calculateCost(context: IGameContext): ICommandCost;

  /**
   * Determina si el comando puede ser deshecho
   */
  canUndo(): boolean;

  /**
   * Deshace el comando si es posible
   */
  undo(context: IGameContext): Promise<IUndoResult>;
}

/**
 * Contexto del juego que contiene toda la información necesaria para ejecutar comandos
 */
export interface IGameContext {
  readonly sessionId: UUID;
  readonly userId: UUID;
  readonly characterId: UUID;
  readonly gameState: IGameState;
  readonly character: ICharacter;
  readonly target?: ICharacter | IGameObject;
  readonly location: ILocation;
  readonly party?: IParty;
  readonly timestamp: ISOTimestamp;
  readonly metadata: Record<string, unknown>;
  readonly parameters?: Record<string, any>;
  readonly services?: {
    worldService?: any;
  };
  readonly session?: {
    character: ICharacter;
  };
}

/**
 * Estado del juego
 */
export interface IGameState {
  readonly sessionId: UUID;
  readonly currentTurn: number;
  readonly phase: GamePhase;
  readonly activeEffects: Array<IGameEffect>;
  readonly history: Array<IGameEvent>;
  readonly entities: Record<UUID, IGameEntity>;
  readonly combat?: ICombatState;
  readonly dialogue?: IDialogueState;
  readonly trade?: ITradeState;
}

/**
 * Resultado de la ejecución de un comando
 */
export interface ICommandResult {
  readonly success: boolean;
  readonly commandId: UUID;
  readonly message: string;
  readonly effects: Array<IGameEffect>;
  readonly rewards?: Array<IReward>;
  readonly experienceGained?: number;
  readonly newState?: Partial<IGameState>;
  readonly logEntries: Array<IGameLogEntry>;
  readonly notifications: Array<INotification>;
}

/**
 * Resultado de la validación de un comando
 */
export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: Array<string>;
  readonly warnings: Array<string>;
  readonly requirements: Array<IRequirementCheck>;
}

/**
 * Coste de ejecutar un comando
 */
export interface ICommandCost {
  readonly mana?: number;
  readonly stamina?: number;
  readonly health?: number;
  readonly gold?: number;
  readonly items?: Array<IItemCost>;
  readonly cooldownMs?: number;
}

/**
 * Resultado de deshacer un comando
 */
export interface IUndoResult {
  readonly success: boolean;
  readonly message: string;
  readonly restoredState?: Partial<IGameState>;
  readonly logEntries: Array<IGameLogEntry>;
}

/**
 * Verificación de requisitos
 */
export interface IRequirementCheck {
  readonly type: 'level' | 'skill' | 'item' | 'quest' | 'reputation';
  readonly requirement: string;
  readonly hasRequirement: boolean;
  readonly details?: string;
}

// ===== ENTIDADES DEL JUEGO =====

/**
 * Personaje del juego
 */
export interface ICharacter {
  readonly id: UUID;
  readonly name: string;
  readonly level: number;
  readonly class: string;
  readonly experience: number;
  readonly health: IAttribute;
  readonly mana: IAttribute;
  readonly stamina: IAttribute;
  readonly attributes: ICharacterAttributes;
  readonly skills: Record<string, ISkill>;
  readonly spells?: Array<ISpell>;
  readonly inventory: IInventory;
  readonly equipment: IEquipment;
  readonly effects: Array<IGameEffect>;
  readonly faction?: string;
  readonly isPlayer: boolean;
  readonly isHostile: boolean;
  readonly aiBehavior?: IAIBehavior;
  readonly status?: Array<string>;
  readonly position?: IPosition;
  readonly userId?: UUID;
  readonly resistances?: Record<string, number>;
}

/**
 * Atributo de personaje
 */
export interface IAttribute {
  readonly current: number;
  readonly maximum: number;
  readonly temporaryModifier: number;
  readonly permanentModifier: number;
  readonly regenerationRate: number;
}

/**
 * Atributos base del personaje
 */
export interface ICharacterAttributes {
  readonly strength: number;
  readonly dexterity: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly constitution: number;
  readonly charisma: number;
  readonly luck: number;
}

/**
 * Habilidad del personaje
 */
export interface ISkill {
  readonly name: string;
  readonly level: number;
  readonly experience: number;
  readonly maxLevel: number;
  readonly description: string;
  readonly category: string;
}

/**
 * Hechizo
 */
export interface ISpell {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly level: number;
  readonly school: string;
  readonly manaCost: number;
  readonly cooldown: number;
  readonly lastCast?: Date;
  readonly requiredLevel: number;
  readonly requiresTarget: boolean;
  readonly targetType: 'self' | 'enemy' | 'ally' | 'area';
  readonly canTargetDead?: boolean;
  readonly components?: Array<IItemCost>;
  readonly effects?: Array<ISpellEffect>;
}

/**
 * Efecto de hechizo
 */
export interface ISpellEffect {
  readonly type: string;
  readonly subtype?: string;
  readonly damageType?: string;
  readonly baseValue: number;
  readonly duration?: number;
  readonly location?: IPosition;
}

/**
 * Inventario del personaje
 */
export interface IInventory {
  readonly maxCapacity: number;
  readonly currentWeight: number;
  readonly items: Array<IItem>;
  readonly gold: number;
}

/**
 * Equipamiento del personaje
 */
export interface IEquipment {
  readonly helmet?: IItem;
  readonly armor?: IItem;
  readonly gloves?: IItem;
  readonly boots?: IItem;
  readonly weapon?: IItem;
  readonly shield?: IItem;
  readonly ring1?: IItem;
  readonly ring2?: IItem;
  readonly amulet?: IItem;
}

/**
 * Objeto del juego
 */
export interface IGameObject {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly isInteractable: boolean;
  readonly isCollectible: boolean;
  readonly effects?: Array<IGameEffect>;
  readonly script?: string;
}

/**
 * Item del juego
 */
export interface IItem extends IGameObject {
  readonly rarity: Rarity;
  readonly value: number;
  readonly weight: number;
  readonly stackable: boolean;
  readonly quantity: number;
  readonly requirements?: Array<IRequirementCheck>;
  readonly effects?: Array<IGameEffect>;
  readonly durability?: IDurability;
  readonly stats?: IItemStats;
}

/**
 * Ubicación en el mundo del juego
 */
export interface ILocation {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly type: LocationType;
  readonly coordinates: ICoordinates;
  readonly connections: Array<UUID>;
  readonly objects: Array<IGameObject>;
  readonly characters: Array<ICharacter>;
  readonly weather?: IWeather;
  readonly timeOfDay?: string;
}

/**
 * Coordenadas
 */
export interface ICoordinates {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Grupo/party de personajes
 */
export interface IParty {
  readonly id: UUID;
  readonly name: string;
  readonly leaderId: UUID;
  readonly members: Array<UUID>;
  readonly maxSize: number;
  readonly sharedExperience: boolean;
  readonly sharedLoot: boolean;
}

/**
 * Posición en el mundo
 */
export interface IPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly mapId: UUID;
  readonly region: string;
}

// ===== SISTEMAS DE JUEGO =====

/**
 * Estado del combate
 */
export interface ICombatState {
  readonly combatId: UUID;
  readonly participants: Array<ICombatParticipant>;
  readonly turnOrder: Array<UUID>;
  readonly currentTurn: number;
  readonly currentParticipant: UUID;
  readonly round: number;
  readonly phase: CombatPhase;
  readonly log: Array<ICombatLogEntry>;
}

/**
 * Participante en combate
 */
export interface ICombatParticipant {
  readonly characterId: UUID;
  readonly initiative: number;
  readonly position: IPosition;
  readonly isActive: boolean;
  readonly actionsThisTurn: number;
  readonly reactionsAvailable: number;
}

/**
 * Estado del diálogo
 */
export interface IDialogueState {
  readonly dialogueId: UUID;
  readonly npcId: UUID;
  readonly availableResponses: Array<IDialogueResponse>;
  readonly dialogueHistory: Array<IDialogueEntry>;
  readonly currentNode: string;
}

/**
 * Estado del comercio
 */
export interface ITradeState {
  readonly tradeId: UUID;
  readonly merchantId: UUID;
  readonly playerItems: Array<ITradeItem>;
  readonly merchantItems: Array<ITradeItem>;
  readonly totalCost: number;
  readonly currency: string;
}

/**
 * Efecto del juego
 */
export interface IGameEffect {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly type: EffectType;
  readonly duration: number; // en milisegundos
  readonly remainingDuration: number;
  readonly magnitude: number;
  readonly isStackable: boolean;
  readonly maxStacks: number;
  readonly currentStacks: number;
  readonly sourceId: UUID;
  readonly targetId: UUID;
  readonly statModifiers?: Record<string, number>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Recompensa
 */
export interface IReward {
  readonly type: 'experience' | 'gold' | 'item' | 'skill' | 'reputation';
  readonly amount: number;
  readonly itemId?: UUID;
  readonly item?: IItem;
  readonly description: string;
}

/**
 * Notificación
 */
export interface INotification {
  readonly id: UUID;
  readonly type: 'info' | 'warning' | 'error' | 'success';
  readonly title: string;
  readonly message: string;
  readonly timestamp: ISOTimestamp;
  readonly duration: number;
}

/**
 * Entrada del log del juego
 */
export interface IGameLogEntry {
  readonly id: UUID;
  readonly timestamp: ISOTimestamp;
  readonly level: LogLevel;
  readonly category: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

/**
 * Evento del juego
 */
export interface IGameEvent {
  readonly id: UUID;
  readonly type: string;
  readonly timestamp: ISOTimestamp;
  readonly sourceId: UUID;
  readonly targetId?: UUID;
  readonly data: Record<string, unknown>;
}

/**
 * Entidad del juego
 */
export interface IGameEntity {
  readonly id: UUID;
  readonly type: string;
  readonly data: Record<string, unknown>;
}

/**
 * Durabilidad de item
 */
export interface IDurability {
  readonly current: number;
  readonly maximum: number;
  readonly isBroken: boolean;
}

/**
 * Estadísticas de item
 */
export interface IItemStats {
  readonly attack?: number;
  readonly defense?: number;
  readonly magicAttack?: number;
  readonly magicDefense?: number;
  readonly health?: number;
  readonly mana?: number;
  readonly criticalChance?: number;
  readonly dodgeChance?: number;
}

/**
 * Plantilla de item
 */
export interface IItemTemplate {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly rarity: Rarity;
  readonly baseValue: number;
  readonly stackable: boolean;
  readonly weight: number;
  readonly stats?: IItemStats;
  readonly requirements?: Record<string, unknown>;
  readonly effects?: Array<unknown>;
}

/**
 * Plantilla de enemigo
 */
export interface IEnemyTemplate {
  readonly id: UUID;
  readonly name: string;
  readonly description: string;
  readonly level: number;
  readonly type: string;
  readonly health: number;
  readonly mana: number;
  readonly attack: number;
  readonly defense: number;
  readonly experience: number;
  readonly aiBehavior?: Record<string, unknown>;
  readonly lootTableId?: string;
}

/**
 * Plantilla de misión
 */
export interface IQuestTemplate {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;
  readonly minLevel: number;
  readonly objectives: Array<unknown>;
  readonly rewards: Record<string, unknown>;
}

/**
 * Comportamiento AI
 */
export interface IAIBehavior {
  readonly type: 'aggressive' | 'defensive' | 'neutral' | 'friendly';
  readonly difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  readonly preferredActions: Array<CommandType>;
  readonly reactionRadius: number;
  readonly combatStrategy: string;
}

/**
 * Clima
 */
export interface IWeather {
  readonly type: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  readonly intensity: number;
  readonly temperature: number;
  readonly windSpeed: number;
  readonly duration: number;
}

/**
 * Item de comercio
 */
export interface ITradeItem {
  readonly itemId: UUID;
  readonly quantity: number;
  readonly price: number;
}

/**
 * Respuesta de diálogo
 */
export interface IDialogueResponse {
  readonly id: UUID;
  readonly text: string;
  readonly nextNode?: string;
  readonly requirements?: Array<IRequirementCheck>;
  readonly effects?: Array<IGameEffect>;
}

/**
 * Entrada de diálogo
 */
export interface IDialogueEntry {
  readonly id: UUID;
  readonly speakerId: UUID;
  readonly text: string;
  readonly timestamp: ISOTimestamp;
}

/**
 * Entrada de log de combate
 */
export interface ICombatLogEntry {
  readonly id: UUID;
  readonly timestamp: ISOTimestamp;
  readonly attackerId: UUID;
  readonly targetId: UUID;
  readonly action: string;
  readonly damage?: number;
  readonly hitChance?: number;
  readonly critical?: boolean;
  readonly effects?: Array<IGameEffect>;
}

/**
 * Costo de item
 */
export interface IItemCost {
  readonly itemId: UUID;
  readonly quantity: number;
}

// ===== ENUMS =====

/**
 * Tipos de comandos
 */
export enum CommandType {
  ATTACK = 'attack',
  DEFEND = 'defend',
  CAST_SPELL = 'cast_spell',
  USE_ITEM = 'use_item',
  FLEE = 'flee',
  MOVE = 'move',
  EXPLORE = 'explore',
  SEARCH = 'search',
  LOOT = 'loot',
  INTERACT = 'interact',
  TALK = 'talk',
  TRADE = 'trade',
  JOIN_PARTY = 'join_party',
  LEAVE_PARTY = 'leave_party',
  REST = 'rest',
  INVENTORY = 'inventory',
  EQUIP = 'equip',
  UNEQUIP = 'unequip',
  GENERATE_NARRATIVE = 'generate_narrative',
  GENERATE_IMAGE = 'generate_image',
  ANALYZE_IMAGE = 'analyze_image',
  RESPAWN = 'respawn',
  CUSTOM = 'custom',
  SYSTEM = 'system'
}

/**
 * Fases del juego
 */
export enum GamePhase {
  EXPLORATION = 'exploration',
  COMBAT = 'combat',
  DIALOGUE = 'dialogue',
  TRADE = 'trade',
  REST = 'rest',
  CUTSCENE = 'cutscene'
}

/**
 * Fases del combate
 */
export enum CombatPhase {
  INITIATIVE = 'initiative',
  ACTIVE = 'active',
  RESOLUTION = 'resolution',
  ENDED = 'ended'
}

/**
 * Nivel de log
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Tipo de efecto
 */
export enum EffectType {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  DAMAGE = 'damage',
  HEAL = 'heal',
  DAMAGE_OVER_TIME = 'damage_over_time',
  HEAL_OVER_TIME = 'heal_over_time',
  STUN = 'stun',
  SILENCE = 'silence',
  ROOT = 'root',
  INVISIBILITY = 'invisibility'
}

/**
 * Rareza de items
 */
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

/**
 * Tipos de ubicación
 */
export enum LocationType {
  TOWN = 'town',
  DUNGEON = 'dungeon',
  WILDERNESS = 'wilderness',
  INTERIOR = 'interior',
  COMBAT_ARENA = 'combat_arena'
}