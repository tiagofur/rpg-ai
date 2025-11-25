import { ICharacter , IPosition } from './ICharacter.js';
import { IGameState } from './IGameCommand.js';


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

export interface ILocation {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: LocationType;
  readonly coordinates: IPosition;
  readonly connections: Array<string>;
  readonly objects: Array<IGameObject>;
  readonly characters: Array<ICharacter>;
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
  readonly effects?: Array<IGameEffect>;
  readonly script?: string;
}

export interface IParty {
  readonly id: string;
  readonly name: string;
  readonly leaderId: string;
  readonly members: Array<string>;
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

export interface IGameEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: EffectType;
  readonly duration: number;
  readonly remainingDuration: number;
  readonly magnitude: number;
  readonly isStackable: boolean;
  readonly maxStacks: number;
  readonly currentStacks: number;
  readonly sourceId: string;
  readonly targetId: string;
}

export enum EffectType {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  DAMAGE_OVER_TIME = 'damage_over_time',
  HEAL_OVER_TIME = 'heal_over_time',
  STUN = 'stun',
  SILENCE = 'silence',
  ROOT = 'root',
  INVISIBILITY = 'invisibility'
}

export enum LocationType {
  TOWN = 'town',
  DUNGEON = 'dungeon',
  WILDERNESS = 'wilderness',
  INTERIOR = 'interior',
  COMBAT_ARENA = 'combat_arena'
}