export interface IChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username?: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  reactions: Record<string, Array<string>>;
  metadata?: Record<string, any>;
}

export interface IChatRoom {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  ownerId: string;
  moderators: Array<string>;
  members: Array<string>;
  maxMembers: number;
  memberCount: number;
  isPrivate: boolean;
  password?: string;
  lastActivity: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatService {
  createRoom(roomData: Partial<IChatRoom>): Promise<IChatRoom>;
  joinRoom(roomId: string, userId: string, password?: string): Promise<IChatRoom>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  sendMessage(roomId: string, userId: string, content: string, messageType?: MessageType): Promise<IChatMessage>;
  getRoomMessages(roomId: string, limit?: number, before?: Date): Promise<Array<IChatMessage>>;
  deleteMessage(roomId: string, messageId: string, userId: string): Promise<void>;
  editMessage(roomId: string, messageId: string, userId: string, newContent: string): Promise<IChatMessage>;
  addReaction(roomId: string, messageId: string, userId: string, reaction: string): Promise<void>;
  removeReaction(roomId: string, messageId: string, userId: string, reaction: string): Promise<void>;
  getUserRooms(userId: string): Promise<Array<IChatRoom>>;
  searchRooms(query: string): Promise<Array<IChatRoom>>;
}

export interface IGuild {
  id: string;
  name: string;
  tag: string;
  description?: string;
  ownerId: string;
  officers: Array<string>;
  members: Array<string>;
  maxMembers: number;
  level: number;
  experience: number;
  reputation: number;
  resources: IGuildResources;
  technologies: Array<IGuildTechnology>;
  requirements?: IGuildRequirements;
  isRecruiting: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuildResources {
  gold: number;
  wood: number;
  stone: number;
  iron: number;
  food: number;
}

export interface IGuildTechnology {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  cost: IGuildResources;
  effects: Array<IGuildTechnologyEffect>;
  unlocked: boolean;
}

export interface IGuildTechnologyEffect {
  type: TechnologyEffectType;
  value: number;
  target: string;
}

export interface IGuildRequirements {
  minLevel: number;
  minReputation: number;
  classRequirements?: Array<CharacterClass>;
  raceRequirements?: Array<CharacterRace>;
}

export interface IGuildService {
  createGuild(guildData: Partial<IGuild>): Promise<IGuild>;
  disbandGuild(guildId: string, userId: string): Promise<void>;
  joinGuild(guildId: string, userId: string): Promise<IGuild>;
  leaveGuild(guildId: string, userId: string): Promise<void>;
  kickMember(guildId: string, ownerId: string, targetUserId: string): Promise<void>;
  promoteToOfficer(guildId: string, ownerId: string, targetUserId: string): Promise<void>;
  demoteFromOfficer(guildId: string, ownerId: string, targetUserId: string): Promise<void>;
  transferOwnership(guildId: string, ownerId: string, newOwnerId: string): Promise<void>;
  updateGuildInfo(guildId: string, ownerId: string, updates: Partial<IGuild>): Promise<IGuild>;
  contributeResources(guildId: string, userId: string, resources: Partial<IGuildResources>): Promise<void>;
  upgradeTechnology(guildId: string, userId: string, technologyId: string): Promise<void>;
  searchGuilds(query: string): Promise<Array<IGuild>>;
  getGuildRankings(category: GuildRankingCategory): Promise<Array<IGuild>>;
}

export interface ITournament {
  id: string;
  name: string;
  description?: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  minParticipants: number;
  participants: Array<string>;
  brackets: Array<ITournamentBracket>;
  prizes: Array<ITournamentPrize>;
  rules: Array<ITournamentRule>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITournamentBracket {
  id: string;
  round: number;
  matches: Array<ITournamentMatch>;
}

export interface ITournamentMatch {
  id: string;
  participant1Id?: string;
  participant2Id?: string;
  winnerId?: string;
  loserId?: string;
  score?: string;
  status: MatchStatus;
  scheduledTime?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ITournamentPrize {
  position: number;
  type: PrizeType;
  itemId?: string;
  quantity?: number;
  experience?: number;
  gold?: number;
  reputation?: number;
  metadata?: Record<string, any>;
}

export interface ITournamentRule {
  id: string;
  name: string;
  description: string;
  enforce: boolean;
  metadata?: Record<string, any>;
}

export interface ITournamentService {
  createTournament(tournamentData: Partial<ITournament>): Promise<ITournament>;
  joinTournament(tournamentId: string, userId: string): Promise<ITournament>;
  leaveTournament(tournamentId: string, userId: string): Promise<void>;
  startTournament(tournamentId: string, userId: string): Promise<ITournament>;
  endTournament(tournamentId: string, userId: string): Promise<ITournament>;
  updateMatchResult(tournamentId: string, matchId: string, winnerId: string, score?: string): Promise<ITournament>;
  getTournament(tournamentId: string): Promise<ITournament>;
  getActiveTournaments(): Promise<Array<ITournament>>;
  getUpcomingTournaments(): Promise<Array<ITournament>>;
  getUserTournaments(userId: string): Promise<Array<ITournament>>;
  searchTournaments(query: string): Promise<Array<ITournament>>;
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  WHISPER = 'whisper',
  GUILD = 'guild',
  PARTY = 'party',
  TRADE = 'trade',
  EMOTE = 'emote'
}

export enum RoomType {
  GLOBAL = 'global',
  GUILD = 'guild',
  PARTY = 'party',
  TRADE = 'trade',
  PRIVATE = 'private',
  CUSTOM = 'custom'
}

export enum TechnologyEffectType {
  RESOURCE_PRODUCTION = 'resource_production',
  COMBAT_BONUS = 'combat_bonus',
  EXPERIENCE_BONUS = 'experience_bonus',
  REPUTATION_BONUS = 'reputation_bonus',
  MEMBER_CAPACITY = 'member_capacity'
}

export enum GuildRankingCategory {
  LEVEL = 'level',
  REPUTATION = 'reputation',
  MEMBERS = 'members',
  RESOURCES = 'resources',
  TECHNOLOGY = 'technology'
}

export enum TournamentType {
  PVP = 'pvp',
  PVE = 'pve',
  MIXED = 'mixed',
  SPECIAL = 'special'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss',
  CUSTOM = 'custom'
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  REGISTRATION = 'registration',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FORFEIT = 'forfeit'
}

export enum PrizeType {
  ITEM = 'item',
  EXPERIENCE = 'experience',
  GOLD = 'gold',
  REPUTATION = 'reputation',
  TITLE = 'title',
  SPECIAL = 'special'
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