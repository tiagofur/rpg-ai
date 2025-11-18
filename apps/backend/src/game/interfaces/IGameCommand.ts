export interface IGameCommand {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: CommandType;
  readonly cooldownMs: number;
  readonly requiredLevel: number;
  readonly requiredItems?: string[];
  readonly requiredSkills?: string[];
  
  execute(context: IGameContext): Promise<ICommandResult>;
  validate(context: IGameContext): IValidationResult;
  calculateCost(context: IGameContext): ICommandCost;
  canUndo(): boolean;
  undo(context: IGameContext): Promise<IUndoResult>;
}

export interface ICommandResult {
  readonly success: boolean;
  readonly commandId: string;
  readonly message: string;
  readonly effects: IGameEffect[];
  readonly rewards?: IReward[];
  readonly experienceGained?: number;
  readonly newState?: Partial<IGameState>;
  readonly logEntries: IGameLogEntry[];
  readonly notifications: INotification[];
}

export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly requirements: IRequirementCheck[];
}

export interface ICommandCost {
  readonly mana?: number;
  readonly stamina?: number;
  readonly health?: number;
  readonly gold?: number;
  readonly items?: IItemCost[];
  readonly cooldownMs?: number;
}

export interface IUndoResult {
  readonly success: boolean;
  readonly message: string;
  readonly restoredState?: Partial<IGameState>;
  readonly logEntries: IGameLogEntry[];
}

export interface IRequirementCheck {
  readonly type: 'level' | 'skill' | 'item' | 'quest' | 'reputation';
  readonly requirement: string;
  readonly hasRequirement: boolean;
  readonly details?: string;
}

export interface IGameEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly duration: number;
  readonly remainingDuration: number;
  readonly magnitude: number;
  readonly isStackable: boolean;
  readonly maxStacks: number;
  readonly currentStacks: number;
  readonly sourceId: string;
  readonly targetId: string;
}

export interface IReward {
  readonly type: 'experience' | 'gold' | 'item' | 'skill' | 'reputation';
  readonly amount: number;
  readonly itemId?: string;
  readonly description: string;
}

export interface INotification {
  readonly id: string;
  readonly type: 'info' | 'warning' | 'error' | 'success';
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly duration: number;
}

export interface IGameLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly category: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

export interface IGameState {
  readonly sessionId: string;
  readonly currentTurn: number;
  readonly phase: GamePhase;
  readonly activeEffects: IGameEffect[];
  readonly history: IGameEvent[];
  readonly entities: Map<string, IGameEntity>;
  readonly combat?: ICombatState;
  readonly dialogue?: IDialogueState;
  readonly trade?: ITradeState;
}

export interface IGameEntity {
  readonly id: string;
  readonly type: string;
  readonly data: Record<string, unknown>;
}

export interface ICombatState {
  readonly combatId: string;
  readonly participants: ICombatParticipant[];
  readonly turnOrder: string[];
  readonly currentTurn: number;
  readonly currentParticipant: string;
  readonly round: number;
  readonly phase: CombatPhase;
  readonly log: ICombatLogEntry[];
}

export interface ICombatParticipant {
  readonly characterId: string;
  readonly initiative: number;
  readonly position: IPosition;
  readonly isActive: boolean;
  readonly actionsThisTurn: number;
  readonly reactionsAvailable: number;
}

export interface ITradeState {
  readonly tradeId: string;
  readonly merchantId: string;
  readonly playerItems: ITradeItem[];
  readonly merchantItems: ITradeItem[];
  readonly totalCost: number;
  readonly currency: string;
}

export interface ITradeItem {
  readonly itemId: string;
  readonly quantity: number;
  readonly price: number;
}

export interface IDialogueState {
  readonly dialogueId: string;
  readonly npcId: string;
  readonly availableResponses: IDialogueResponse[];
  readonly dialogueHistory: IDialogueEntry[];
  readonly currentNode: string;
}

export interface IDialogueResponse {
  readonly id: string;
  readonly text: string;
  readonly nextNode?: string;
  readonly requirements?: IRequirementCheck[];
  readonly effects?: IGameEffect[];
}

export interface IDialogueEntry {
  readonly id: string;
  readonly speakerId: string;
  readonly text: string;
  readonly timestamp: string;
}

export interface ICombatLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly attackerId: string;
  readonly targetId: string;
  readonly action: string;
  readonly damage?: number;
  readonly hitChance?: number;
  readonly critical?: boolean;
  readonly effects?: IGameEffect[];
}

export interface IPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly mapId: string;
  readonly region: string;
}

export interface IGameEvent {
  readonly id: string;
  readonly type: string;
  readonly timestamp: string;
  readonly sourceId: string;
  readonly targetId?: string;
  readonly data: Record<string, unknown>;
}

export interface IItemCost {
  readonly itemId: string;
  readonly quantity: number;
}

export interface IGameContext {
  readonly sessionId: string;
  readonly userId: string;
  readonly characterId: string;
  readonly gameState: IGameState;
  readonly character: ICharacter;
  readonly target?: ICharacter | IGameObject;
  readonly location: ILocation;
  readonly party?: IParty;
  readonly timestamp: string;
  readonly metadata: Record<string, unknown>;
  readonly parameters?: Record<string, any>;
  readonly services?: {
    worldService?: any;
  };
  readonly session?: {
    character: ICharacter;
  };
}

export interface ICharacter {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly health: IAttribute;
  readonly mana: IAttribute;
  readonly stamina: IAttribute;
  readonly attributes: ICharacterAttributes;
  readonly skills: Map<string, ISkill>;
  readonly inventory: IInventory;
  readonly equipment: IEquipment;
  readonly effects: IGameEffect[];
  readonly faction?: string;
  readonly isPlayer: boolean;
  readonly isHostile: boolean;
  readonly aiBehavior?: IAIBehavior;
  readonly status?: string[];
  readonly position?: IPosition;
}

export interface IAttribute {
  readonly current: number;
  readonly maximum: number;
  readonly temporaryModifier: number;
  readonly permanentModifier: number;
  readonly regenerationRate: number;
}

export interface ICharacterAttributes {
  readonly strength: number;
  readonly dexterity: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly constitution: number;
  readonly charisma: number;
  readonly luck: number;
}

export interface ISkill {
  readonly name: string;
  readonly level: number;
  readonly experience: number;
  readonly maxLevel: number;
  readonly description: string;
  readonly category: string;
}

export interface IInventory {
  readonly maxCapacity: number;
  readonly currentWeight: number;
  readonly items: IItem[];
  readonly gold: number;
}

export interface IItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly rarity: string;
  readonly value: number;
  readonly weight: number;
  readonly stackable: boolean;
  readonly quantity: number;
  readonly requirements?: IRequirementCheck[];
  readonly effects?: IGameEffect[];
  readonly durability?: IDurability;
  readonly stats?: IItemStats;
}

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

export interface IDurability {
  readonly current: number;
  readonly maximum: number;
  readonly isBroken: boolean;
}

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

export interface IAIBehavior {
  readonly type: 'aggressive' | 'defensive' | 'neutral' | 'friendly';
  readonly difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  readonly preferredActions: CommandType[];
  readonly reactionRadius: number;
  readonly combatStrategy: string;
}

export interface ILocation {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly coordinates: IPosition;
  readonly connections: string[];
  readonly objects: IGameObject[];
  readonly characters: ICharacter[];
  readonly weather?: IWeather;
  readonly timeOfDay?: string;
}

export interface IGameObject {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
  readonly isInteractable: boolean;
  readonly isCollectible: boolean;
  readonly effects?: IGameEffect[];
  readonly script?: string;
}

export interface IParty {
  readonly id: string;
  readonly name: string;
  readonly leaderId: string;
  readonly members: string[];
  readonly maxSize: number;
  readonly sharedExperience: boolean;
  readonly sharedLoot: boolean;
}

export interface IWeather {
  readonly type: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  readonly intensity: number;
  readonly temperature: number;
  readonly windSpeed: number;
  readonly duration: number;
}

export enum CommandType {
  ATTACK = 'attack',
  DEFEND = 'defend',
  CAST_SPELL = 'cast_spell',
  USE_ITEM = 'use_item',
  FLEE = 'flee',
  MOVE = 'move',
  EXPLORE = 'explore',
  SEARCH = 'search',
  INTERACT = 'interact',
  TALK = 'talk',
  TRADE = 'trade',
  JOIN_PARTY = 'join_party',
  LEAVE_PARTY = 'leave_party',
  REST = 'rest',
  INVENTORY = 'inventory',
  EQUIP = 'equip',
  UNEQUIP = 'unequip',
  CUSTOM = 'custom',
  SYSTEM = 'system'
}

export enum GamePhase {
  EXPLORATION = 'exploration',
  COMBAT = 'combat',
  DIALOGUE = 'dialogue',
  TRADE = 'trade',
  REST = 'rest',
  CUTSCENE = 'cutscene'
}

export enum CombatPhase {
  INITIATIVE = 'initiative',
  ACTIVE = 'active',
  RESOLUTION = 'resolution',
  ENDED = 'ended'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}