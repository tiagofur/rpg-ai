# IMPLEMENTACIÓN CORE - FASE 3

## TypeScript, Testing y Funciones Atómicas

**Fecha:** Noviembre 2025  
**Versión:** 3.0  
**Estado:** Plan de Implementación

---

## 🎯 VISIÓN GENERAL

Implementar el núcleo funcional del sistema con TypeScript strict, funciones atómicas, testing exhaustivo y principios SOLID. Esta fase transforma la arquitectura modular en código de producción con 95% de cobertura de tests.

### Objetivos Clave

- **TypeScript Strict:** 100% tipado sin `any`
- **Testing:** 95% cobertura con tests unitarios + E2E
- **SOLID:** Principios aplicados en todo el código
- **Performance:** Funciones atómicas <100ms
- **Documentación:** JSDoc completo + Swagger

---

## 🏗️ ESTRUCTURA DE IMPLEMENTACIÓN

### Organización por Servicios

```
services/
├── api-gateway/           # GraphQL + REST Gateway
│   ├── src/
│   │   ├── graphql/        # Schema y resolvers
│   │   ├── rest/          # REST endpoints
│   │   ├── middleware/    # Auth, rate limiting
│   │   └── plugins/       # Fastify plugins
│   ├── tests/
│   │   ├── unit/          # Unit tests
│   │   ├── integration/   # Integration tests
│   │   └── e2e/          # End-to-end tests
│   └── docs/             # API documentation
├── auth-service/
├── game-engine/
├── ai-gateway/
├── session-service/
└── analytics-service/
```

### Stack de Testing

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.0",
    "cypress": "^13.6.0",
    "k6": "^0.49.0",
    "@faker-js/faker": "^8.4.0",
    "mongodb-memory-server": "^9.1.0"
  }
}
```

---

## 🔧 IMPLEMENTACIÓN POR SERVICIO

### 1. API GATEWAY - GraphQL + REST

#### Schema GraphQL (Type-Safe)

```typescript
// src/graphql/schema/types/game.types.ts
import { z } from "zod";

// Zod schemas for runtime validation
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  race: z.enum(["HUMAN", "ELF", "DWARF", "HALFLING", "TIEFLING"]),
  class: z.enum(["WARRIOR", "MAGE", "ROGUE", "BARD", "RANGER", "CLERIC"]),
  attributes: z.object({
    strength: z.number().int().min(1).max(20),
    dexterity: z.number().int().min(1).max(20),
    constitution: z.number().int().min(1).max(20),
    intelligence: z.number().int().min(1).max(20),
    wisdom: z.number().int().min(1).max(20),
    charisma: z.number().int().min(1).max(20),
  }),
  level: z.number().int().min(1).max(20),
  health: z.number().int().min(1),
  mana: z.number().int().min(0),
  inventory: z.array(z.string()).max(50),
  skills: z.array(z.string()).max(20),
  status: z.enum(["HEALTHY", "INJURED", "UNCONSCIOUS", "DEAD"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Character = z.infer<typeof CharacterSchema>;

// GraphQL Type Definitions
export const typeDefs = gql`
  type Character {
    id: ID!
    name: String!
    race: Race!
    class: Class!
    attributes: Attributes!
    level: Int!
    health: Int!
    mana: Int!
    inventory: [String!]!
    skills: [String!]!
    status: CharacterStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Attributes {
    strength: Int!
    dexterity: Int!
    constitution: Int!
    intelligence: Int!
    wisdom: Int!
    charisma: Int!
  }

  enum Race {
    HUMAN
    ELF
    DWARF
    HALFLING
    TIEFLING
  }

  enum Class {
    WARRIOR
    MAGE
    ROGUE
    BARD
    RANGER
    CLERIC
  }

  enum CharacterStatus {
    HEALTHY
    INJURED
    UNCONSCIOUS
    DEAD
  }
`;
```

#### Resolvers con SOLID

```typescript
// src/graphql/resolvers/character.resolver.ts
import { ICharacterRepository } from "../../interfaces/repositories/character.interface";
import { ILogger } from "../../interfaces/services/logger.interface";
import { CharacterNotFoundError, ValidationError } from "../../errors";

interface CharacterResolverDeps {
  characterRepository: ICharacterRepository;
  logger: ILogger;
}

export class CharacterResolver {
  constructor(private readonly deps: CharacterResolverDeps) {}

  /**
   * Get character by ID with validation and error handling
   * @param id - Character UUID
   * @returns Character data or null if not found
   * @throws CharacterNotFoundError if character doesn't exist
   */
  async getCharacter(id: string): Promise<Character | null> {
    try {
      // Validate UUID format
      const validatedId = this.validateUUID(id);

      this.deps.logger.info("Getting character", { characterId: validatedId });

      const character = await this.deps.characterRepository.findById(
        validatedId
      );

      if (!character) {
        throw new CharacterNotFoundError(
          `Character with ID ${validatedId} not found`
        );
      }

      this.deps.logger.info("Character retrieved successfully", {
        characterId: validatedId,
        characterName: character.name,
      });

      return character;
    } catch (error) {
      this.deps.logger.error("Error getting character", {
        characterId: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create new character with business rules validation
   * @param input - Character creation data
   * @returns Created character
   * @throws ValidationError if input is invalid
   */
  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    try {
      this.deps.logger.info("Creating character", { input });

      // Validate input using Zod schema
      const validatedInput = CharacterSchema.parse(input);

      // Apply business rules
      const processedInput = this.applyBusinessRules(validatedInput);

      const character = await this.deps.characterRepository.create(
        processedInput
      );

      this.deps.logger.info("Character created successfully", {
        characterId: character.id,
        characterName: character.name,
      });

      return character;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid character data", error.errors);
      }

      this.deps.logger.error("Error creating character", {
        input,
        error: error.message,
      });
      throw error;
    }
  }

  private validateUUID(id: string): string {
    const uuidSchema = z.string().uuid();
    return uuidSchema.parse(id);
  }

  private applyBusinessRules(input: Character): Character {
    // Apply default values and business logic
    const now = new Date();

    return {
      ...input,
      id: input.id || crypto.randomUUID(),
      level: input.level || 1,
      health:
        input.health ||
        this.calculateInitialHealth(input.attributes.constitution),
      mana:
        input.mana || this.calculateInitialMana(input.attributes.intelligence),
      status: input.status || "HEALTHY",
      createdAt: now,
      updatedAt: now,
    };
  }

  private calculateInitialHealth(constitution: number): number {
    return constitution * 10 + 20;
  }

  private calculateInitialMana(intelligence: number): number {
    return intelligence * 5 + 10;
  }
}
```

#### Middleware con Principios SOLID

```typescript
// src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { IAuthService } from "../interfaces/services/auth.interface";
import { UnauthorizedError, TokenExpiredError } from "../errors";

export interface AuthMiddlewareDeps {
  authService: IAuthService;
}

/**
 * Authentication middleware following Single Responsibility Principle
 * Only handles authentication, not authorization or business logic
 */
export class AuthMiddleware {
  constructor(private readonly deps: AuthMiddlewareDeps) {}

  async authenticate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const token = this.extractToken(request);

      if (!token) {
        throw new UnauthorizedError("No authentication token provided");
      }

      const user = await this.deps.authService.validateToken(token);

      // Attach user to request for downstream use
      request.user = user;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return reply.status(401).send({
          error: "TOKEN_EXPIRED",
          message: "Authentication token has expired",
        });
      }

      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "Invalid authentication token",
      });
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}

// Dependency injection container
export const createAuthMiddleware = (deps: AuthMiddlewareDeps) => {
  const middleware = new AuthMiddleware(deps);
  return middleware.authenticate.bind(middleware);
};
```

### 2. GAME ENGINE - Motor de Juego

#### Sistema de Acciones (Command Pattern)

```typescript
// src/game/commands/action.command.ts
import { IGameState, ICharacter, IActionResult } from "../interfaces";

/**
 * Command pattern for game actions
 * Allows undo/redo and easy extension of new actions
 */
export interface IGameAction {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  execute(context: ActionContext): Promise<IActionResult>;
  validate(context: ActionContext): ValidationResult;
  canUndo(): boolean;
  undo(context: ActionContext): IGameState;
}

export interface ActionContext {
  gameState: IGameState;
  character: ICharacter;
  target?: ICharacter;
  parameters: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Attack action implementation
 */
export class AttackAction implements IGameAction {
  readonly id = "attack";
  readonly name = "Attack";
  readonly description = "Perform a physical attack on target";

  constructor(
    private readonly randomService: IRandomService,
    private readonly combatService: ICombatService
  ) {}

  async execute(context: ActionContext): Promise<IActionResult> {
    const validation = this.validate(context);
    if (!validation.isValid) {
      throw new InvalidActionError(validation.errors.join(", "));
    }

    const { gameState, character, target } = context;

    if (!target) {
      throw new InvalidActionError("Attack requires a target");
    }

    // Calculate attack success
    const hitChance = this.calculateHitChance(character, target);
    const roll = await this.randomService.rollDice(100);
    const isHit = roll <= hitChance;

    if (isHit) {
      const damage = await this.combatService.calculateDamage(
        character,
        target
      );
      const newHealth = Math.max(0, target.health - damage);

      return {
        success: true,
        message: `${character.name} hits ${target.name} for ${damage} damage!`,
        effects: [
          {
            type: "damage",
            targetId: target.id,
            value: damage,
            newValue: newHealth,
          },
        ],
        stateChanges: {
          characters: {
            [target.id]: { health: newHealth },
          },
        },
      };
    }

    return {
      success: true,
      message: `${character.name} misses ${target.name}!`,
      effects: [],
      stateChanges: {},
    };
  }

  validate(context: ActionContext): ValidationResult {
    const errors: string[] = [];
    const { character, target } = context;

    if (!target) {
      errors.push("No target specified for attack");
    }

    if (character.health <= 0) {
      errors.push("Character is unconscious and cannot attack");
    }

    if (target && target.health <= 0) {
      errors.push("Target is already defeated");
    }

    // Check if target is in range (simplified)
    if (target && !this.isInRange(character, target)) {
      errors.push("Target is out of attack range");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  canUndo(): boolean {
    return true;
  }

  undo(context: ActionContext): IGameState {
    // Implementation for undo functionality
    // This would restore the previous state
    return context.gameState;
  }

  private calculateHitChance(attacker: ICharacter, target: ICharacter): number {
    const baseChance = 70;
    const dexterityBonus = (attacker.attributes.dexterity - 10) * 2;
    const targetBonus = (target.attributes.dexterity - 10) * -1;

    return Math.max(5, Math.min(95, baseChance + dexterityBonus + targetBonus));
  }

  private isInRange(attacker: ICharacter, target: ICharacter): boolean {
    // Simplified range calculation
    // In a real implementation, this would consider position and weapon range
    return true;
  }
}
```

#### Motor de Juego Principal

```typescript
// src/game/engine/game-engine.ts
import { IGameState, IGameAction, IActionResult } from "../interfaces";
import { EventEmitter } from "events";

/**
 * Main game engine implementing State pattern and Observer pattern
 * Handles game state transitions and action processing
 */
export interface IGameEngine {
  processAction(
    action: IGameAction,
    context: ActionContext
  ): Promise<IActionResult>;
  getState(): IGameState;
  setState(state: IGameState): void;
  subscribe(event: string, listener: Function): void;
  undo(): boolean;
  redo(): boolean;
}

export class GameEngine extends EventEmitter implements IGameEngine {
  private currentState: IGameState;
  private stateHistory: IGameState[] = [];
  private actionHistory: IGameAction[] = [];
  private historyIndex = -1;
  private readonly maxHistorySize = 100;

  constructor(
    initialState: IGameState,
    private readonly randomService: IRandomService,
    private readonly logger: ILogger
  ) {
    super();
    this.currentState = this.deepClone(initialState);
    this.saveState(initialState);
  }

  /**
   * Process a game action with full validation and state management
   */
  async processAction(
    action: IGameAction,
    context: ActionContext
  ): Promise<IActionResult> {
    try {
      this.logger.info("Processing game action", {
        actionId: action.id,
        actionName: action.name,
        characterId: context.character.id,
      });

      // Validate action
      const validation = action.validate(context);
      if (!validation.isValid) {
        throw new InvalidActionError(validation.errors.join(", "));
      }

      // Execute action
      const result = await action.execute(context);

      // Apply state changes
      if (result.stateChanges) {
        this.applyStateChanges(result.stateChanges);
      }

      // Save to history
      this.recordAction(action, this.currentState);

      // Emit events for real-time updates
      this.emit("action:processed", {
        action: action.id,
        result,
        state: this.currentState,
      });

      this.logger.info("Game action processed successfully", {
        actionId: action.id,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error("Error processing game action", {
        actionId: action.id,
        error: error.message,
        context,
      });
      throw error;
    }
  }

  /**
   * Apply state changes atomically
   */
  private applyStateChanges(changes: StateChanges): void {
    const newState = this.deepClone(this.currentState);

    // Apply character changes
    if (changes.characters) {
      Object.entries(changes.characters).forEach(([characterId, updates]) => {
        const character = newState.characters.find((c) => c.id === characterId);
        if (character) {
          Object.assign(character, updates);
          character.updatedAt = new Date();
        }
      });
    }

    // Apply session changes
    if (changes.session) {
      Object.assign(newState.session, changes.session);
      newState.session.updatedAt = new Date();
    }

    // Apply game world changes
    if (changes.world) {
      Object.assign(newState.world, changes.world);
    }

    this.currentState = newState;
    this.saveState(newState);
  }

  /**
   * Undo last action if possible
   */
  undo(): boolean {
    if (this.historyIndex <= 0) {
      return false;
    }

    this.historyIndex--;
    this.currentState = this.deepClone(this.stateHistory[this.historyIndex]);

    this.emit("state:changed", {
      type: "undo",
      state: this.currentState,
    });

    return true;
  }

  /**
   * Redo last undone action if possible
   */
  redo(): boolean {
    if (this.historyIndex >= this.stateHistory.length - 1) {
      return false;
    }

    this.historyIndex++;
    this.currentState = this.deepClone(this.stateHistory[this.historyIndex]);

    this.emit("state:changed", {
      type: "redo",
      state: this.currentState,
    });

    return true;
  }

  private saveState(state: IGameState): void {
    this.stateHistory.push(this.deepClone(state));

    // Maintain history size limit
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    } else {
      this.historyIndex++;
    }
  }

  private recordAction(action: IGameAction, state: IGameState): void {
    this.actionHistory.push(action);

    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  getState(): IGameState {
    return this.deepClone(this.currentState);
  }

  setState(state: IGameState): void {
    this.currentState = this.deepClone(state);
    this.saveState(state);
  }
}
```

### 3. AI GATEWAY - Integración Inteligente

#### Sistema de Caché Inteligente

```typescript
// src/ai/cache/ai-cache.ts
import { createHash } from "crypto";

/**
 * Intelligent caching system for AI responses
 * Reduces costs and improves latency
 */
export interface IAICache {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, response: CachedResponse, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  getStats(): Promise<CacheStats>;
}

export interface CachedResponse {
  content: string;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    timestamp: Date;
    similarity?: number;
  };
}

export class IntelligentAICache implements IAICache {
  private readonly redis: Redis;
  private readonly similarityThreshold = 0.85;
  private readonly defaultTTL = 3600; // 1 hour

  constructor(
    private readonly redis: Redis,
    private readonly logger: ILogger
  ) {}

  /**
   * Generate cache key with semantic understanding
   */
  generateCacheKey(prompt: string, context: AIContext): string {
    // Normalize and hash the prompt
    const normalizedPrompt = this.normalizePrompt(prompt);
    const contextHash = this.hashContext(context);

    return `ai:${contextHash}:${this.hashString(normalizedPrompt)}`;
  }

  /**
   * Intelligent get with similarity matching
   */
  async getSimilar(
    key: string,
    similarity: number = this.similarityThreshold
  ): Promise<CachedResponse | null> {
    // Try exact match first
    const exactMatch = await this.get(key);
    if (exactMatch) {
      this.logger.info("AI cache hit (exact)", { key });
      return exactMatch;
    }

    // Look for similar responses using semantic search
    const similarKeys = await this.findSimilarKeys(key);

    for (const similarKey of similarKeys) {
      const cached = await this.get(similarKey);
      if (
        cached &&
        cached.metadata.similarity &&
        cached.metadata.similarity >= similarity
      ) {
        this.logger.info("AI cache hit (similar)", {
          key,
          similarKey,
          similarity: cached.metadata.similarity,
        });
        return cached;
      }
    }

    this.logger.info("AI cache miss", { key });
    return null;
  }

  /**
   * Cache with intelligent TTL based on content type
   */
  async set(
    key: string,
    response: CachedResponse,
    contentType: string
  ): Promise<void> {
    const ttl = this.calculateTTL(contentType, response);

    await this.redis.setex(key, ttl, JSON.stringify(response));

    this.logger.info("AI response cached", {
      key,
      ttl,
      contentType,
      cost: response.metadata.cost,
    });
  }

  /**
   * Calculate TTL based on content type and usage patterns
   */
  private calculateTTL(contentType: string, response: CachedResponse): number {
    switch (contentType) {
      case "narration":
        return 7200; // 2 hours - story content
      case "dialogue":
        return 3600; // 1 hour - character specific
      case "image":
        return 86400; // 24 hours - expensive to generate
      case "quest":
        return 10800; // 3 hours - semi-permanent
      default:
        return this.defaultTTL;
    }
  }

  /**
   * Normalize prompt for better cache matching
   */
  private normalizePrompt(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.,!?;:]/g, "")
      .trim();
  }

  /**
   * Hash context for cache key generation
   */
  private hashContext(context: AIContext): string {
    const contextString = JSON.stringify({
      gameId: context.gameId,
      characterId: context.characterId,
      sessionId: context.sessionId,
      gameState: context.gameState,
    });

    return this.hashString(contextString);
  }

  private hashString(str: string): string {
    return createHash("sha256").update(str).digest("hex").substring(0, 16);
  }

  private async findSimilarKeys(key: string): Promise<string[]> {
    // Implementation would use Redis search or similar
    // For now, return empty array
    return [];
  }

  async getStats(): Promise<CacheStats> {
    // Implementation for cache statistics
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSavings: 0,
    };
  }
}
```

#### Multi-Provider AI Integration

```typescript
// src/ai/providers/ai-provider.factory.ts
/**
 * Factory pattern for AI providers
 * Allows switching between providers and fallback mechanisms
 */
export interface IAIProvider {
  readonly name: string;
  readonly models: AIModel[];

  generateText(
    prompt: string,
    options: TextGenerationOptions
  ): Promise<TextResponse>;
  generateImage(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageResponse>;
  getCostEstimate(prompt: string, model: string): Promise<CostEstimate>;
  isAvailable(): Promise<boolean>;
}

export interface AIModel {
  name: string;
  type: "text" | "image" | "audio";
  maxTokens: number;
  costPerToken: number;
  capabilities: string[];
}

export class AIProviderFactory {
  private providers: Map<string, IAIProvider> = new Map();

  constructor(
    private readonly config: AIConfig,
    private readonly logger: ILogger
  ) {
    this.initializeProviders();
  }

  /**
   * Get provider with automatic fallback
   */
  async getProvider(
    type: "text" | "image",
    preferred?: string
  ): Promise<IAIProvider> {
    // Try preferred provider first
    if (preferred) {
      const provider = this.providers.get(preferred);
      if (provider && (await provider.isAvailable())) {
        return provider;
      }
    }

    // Find available provider by type
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        const hasSuitableModel = provider.models.some(
          (m) => m.type === type && this.isModelSuitable(m, type)
        );

        if (hasSuitableModel) {
          this.logger.info("AI provider selected", { provider: name, type });
          return provider;
        }
      }
    }

    throw new Error(`No available AI provider found for type: ${type}`);
  }

  private initializeProviders(): void {
    // OpenAI Provider
    if (this.config.openai?.apiKey) {
      this.providers.set("openai", new OpenAIProvider(this.config.openai));
    }

    // Anthropic Provider
    if (this.config.anthropic?.apiKey) {
      this.providers.set(
        "anthropic",
        new AnthropicProvider(this.config.anthropic)
      );
    }

    // Google Provider
    if (this.config.google?.apiKey) {
      this.providers.set("google", new GoogleAIProvider(this.config.google));
    }

    // Stability AI for images
    if (this.config.stability?.apiKey) {
      this.providers.set(
        "stability",
        new StabilityAIProvider(this.config.stability)
      );
    }
  }

  private isModelSuitable(model: AIModel, type: string): boolean {
    return model.type === type && model.costPerToken > 0;
  }
}

/**
 * OpenAI Provider implementation
 */
export class OpenAIProvider implements IAIProvider {
  readonly name = "openai";

  readonly models: AIModel[] = [
    {
      name: "gpt-4",
      type: "text",
      maxTokens: 8192,
      costPerToken: 0.00003,
      capabilities: ["narration", "dialogue", "quest_generation"],
    },
    {
      name: "gpt-3.5-turbo",
      type: "text",
      maxTokens: 4096,
      costPerToken: 0.000002,
      capabilities: ["narration", "dialogue"],
    },
    {
      name: "dall-e-3",
      type: "image",
      maxTokens: 0,
      costPerToken: 0.04, // per image
      capabilities: ["character_portrait", "scene_generation"],
    },
  ];

  constructor(private readonly config: OpenAIConfig) {}

  async generateText(
    prompt: string,
    options: TextGenerationOptions
  ): Promise<TextResponse> {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  options.systemPrompt || "You are a fantasy RPG narrator.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      const tokens = data.usage?.total_tokens || 0;

      return {
        content,
        metadata: {
          model: data.model,
          tokens,
          cost: this.calculateCost(tokens, data.model),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      this.logger.error("OpenAI text generation failed", {
        error: error.message,
      });
      throw error;
    }
  }

  async generateImage(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<ImageResponse> {
    // Implementation for DALL-E image generation
    // Similar pattern to text generation
    return {
      url: "generated-image-url",
      metadata: {
        model: "dall-e-3",
        cost: 0.04,
        timestamp: new Date(),
      },
    };
  }

  private calculateCost(tokens: number, model: string): number {
    const modelInfo = this.models.find((m) => m.name === model);
    return tokens * (modelInfo?.costPerToken || 0);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## 🧪 SISTEMA DE TESTING COMPLETO

### Tests Unitarios con Jest

```typescript
// tests/unit/game-engine.test.ts
import { GameEngine } from "../../../src/game/engine/game-engine";
import { AttackAction } from "../../../src/game/commands/attack.command";
import {
  createMockCharacter,
  createMockGameState,
} from "../../fixtures/game.fixtures";

describe("GameEngine", () => {
  let engine: GameEngine;
  let mockRandomService: jest.Mocked<IRandomService>;
  let mockCombatService: jest.Mocked<ICombatService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Create mock services
    mockRandomService = {
      rollDice: jest.fn(),
      generateSeed: jest.fn(),
    };

    mockCombatService = {
      calculateDamage: jest.fn(),
      resolveCombat: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    // Create initial game state
    const initialState = createMockGameState();

    engine = new GameEngine(initialState, mockRandomService, mockLogger);
  });

  describe("processAction", () => {
    it("should successfully process a valid attack action", async () => {
      // Arrange
      const attacker = createMockCharacter({
        id: "attacker-1",
        name: "Hero",
        attributes: { dexterity: 15 },
      });

      const target = createMockCharacter({
        id: "target-1",
        name: "Goblin",
        health: 50,
        attributes: { dexterity: 10 },
      });

      const action = new AttackAction(mockRandomService, mockCombatService);

      mockRandomService.rollDice.mockResolvedValue(75); // Hit
      mockCombatService.calculateDamage.mockResolvedValue(15);

      const context: ActionContext = {
        gameState: engine.getState(),
        character: attacker,
        target,
        parameters: {},
      };

      // Act
      const result = await engine.processAction(action, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain("hits");
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].value).toBe(15);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Game action processed successfully",
        expect.objectContaining({
          actionId: "attack",
          success: true,
        })
      );
    });

    it("should handle failed attack (miss)", async () => {
      // Arrange
      const attacker = createMockCharacter({
        attributes: { dexterity: 10 },
      });

      const target = createMockCharacter({
        attributes: { dexterity: 15 },
      });

      const action = new AttackAction(mockRandomService, mockCombatService);

      mockRandomService.rollDice.mockResolvedValue(95); // Miss

      const context: ActionContext = {
        gameState: engine.getState(),
        character: attacker,
        target,
        parameters: {},
      };

      // Act
      const result = await engine.processAction(action, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain("misses");
      expect(result.effects).toHaveLength(0);
    });

    it("should throw error for invalid action", async () => {
      // Arrange
      const unconsciousCharacter = createMockCharacter({
        health: 0,
        status: "UNCONSCIOUS",
      });

      const action = new AttackAction(mockRandomService, mockCombatService);

      const context: ActionContext = {
        gameState: engine.getState(),
        character: unconsciousCharacter,
        parameters: {},
      };

      // Act & Assert
      await expect(engine.processAction(action, context)).rejects.toThrow(
        "Character is unconscious and cannot attack"
      );
    });

    it("should emit events on successful action", async () => {
      // Arrange
      const actionProcessedSpy = jest.fn();
      engine.on("action:processed", actionProcessedSpy);

      const attacker = createMockCharacter();
      const target = createMockCharacter();
      const action = new AttackAction(mockRandomService, mockCombatService);

      mockRandomService.rollDice.mockResolvedValue(80);
      mockCombatService.calculateDamage.mockResolvedValue(10);

      const context: ActionContext = {
        gameState: engine.getState(),
        character: attacker,
        target,
        parameters: {},
      };

      // Act
      await engine.processAction(action, context);

      // Assert
      expect(actionProcessedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "attack",
          success: true,
          state: expect.any(Object),
        })
      );
    });
  });

  describe("undo/redo functionality", () => {
    it("should undo last action", () => {
      // Arrange
      const initialState = engine.getState();
      const modifiedState = { ...initialState, turn: initialState.turn + 1 };
      engine.setState(modifiedState);

      // Act
      const undone = engine.undo();

      // Assert
      expect(undone).toBe(true);
      expect(engine.getState().turn).toBe(initialState.turn);
    });

    it("should redo last undone action", () => {
      // Arrange
      const initialState = engine.getState();
      const modifiedState = { ...initialState, turn: initialState.turn + 1 };
      engine.setState(modifiedState);
      engine.undo();

      // Act
      const redone = engine.redo();

      // Assert
      expect(redone).toBe(true);
      expect(engine.getState().turn).toBe(modifiedState.turn);
    });

    it("should return false when no actions to undo", () => {
      // Act
      const undone = engine.undo();

      // Assert
      expect(undone).toBe(false);
    });
  });
});
```

### Tests de Integración

```typescript
// tests/integration/api-gateway.test.ts
import request from "supertest";
import { createApp } from "../../../src/api-gateway/app";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("API Gateway Integration Tests", () => {
  let app: FastifyInstance;
  let mongoServer: MongoMemoryServer;
  let authToken: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Create app with test configuration
    app = await createApp({
      database: { url: mongoUri },
      redis: { url: process.env.REDIS_URL || "redis://localhost:6379" },
      auth: { jwtSecret: "test-secret" },
    });

    // Create test user and get auth token
    const userResponse = await request(app.server)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "TestPassword123!",
        name: "Test User",
      });

    authToken = userResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe("Character API", () => {
    it("should create a new character", async () => {
      // Arrange
      const characterData = {
        name: "Test Hero",
        race: "HUMAN",
        class: "WARRIOR",
        attributes: {
          strength: 16,
          dexterity: 12,
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 8,
        },
      };

      // Act
      const response = await request(app.server)
        .post("/api/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send(characterData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.character).toMatchObject({
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        level: 1,
        health: 160, // constitution * 10 + 20
      });
    });

    it("should validate character data", async () => {
      // Arrange
      const invalidCharacterData = {
        name: "", // Empty name
        race: "INVALID_RACE",
        class: "WARRIOR",
        attributes: {
          strength: 25, // Too high
          dexterity: 0, // Too low
          constitution: 14,
          intelligence: 10,
          wisdom: 10,
          charisma: 8,
        },
      };

      // Act
      const response = await request(app.server)
        .post("/api/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidCharacterData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: "name",
          message: expect.stringContaining("required"),
        })
      );
    });

    it("should get character by ID", async () => {
      // Arrange - Create a character first
      const createResponse = await request(app.server)
        .post("/api/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Get Test Character",
          race: "ELF",
          class: "MAGE",
          attributes: {
            strength: 8,
            dexterity: 14,
            constitution: 10,
            intelligence: 16,
            wisdom: 12,
            charisma: 10,
          },
        });

      const characterId = createResponse.body.data.character.id;

      // Act
      const getResponse = await request(app.server)
        .get(`/api/characters/${characterId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Assert
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.character.id).toBe(characterId);
      expect(getResponse.body.data.character.name).toBe("Get Test Character");
    });

    it("should return 404 for non-existent character", async () => {
      // Act
      const response = await request(app.server)
        .get("/api/characters/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });
  });

  describe("Game Session API", () => {
    it("should create and start a game session", async () => {
      // Arrange - Create characters first
      const character1Response = await request(app.server)
        .post("/api/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Player 1",
          race: "HUMAN",
          class: "WARRIOR",
          attributes: {
            strength: 16,
            dexterity: 12,
            constitution: 14,
            intelligence: 10,
            wisdom: 10,
            charisma: 8,
          },
        });

      const character2Response = await request(app.server)
        .post("/api/characters")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Player 2",
          race: "ELF",
          class: "MAGE",
          attributes: {
            strength: 8,
            dexterity: 14,
            constitution: 10,
            intelligence: 16,
            wisdom: 12,
            charisma: 10,
          },
        });

      // Act - Create game session
      const sessionResponse = await request(app.server)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Campaign",
          description: "Integration test campaign",
          characterIds: [
            character1Response.body.data.character.id,
            character2Response.body.data.character.id,
          ],
          settings: {
            maxPlayers: 4,
            difficulty: "NORMAL",
            gameMode: "COOPERATIVE",
          },
        });

      // Assert
      expect(sessionResponse.status).toBe(201);
      expect(sessionResponse.body.success).toBe(true);
      expect(sessionResponse.body.data.session).toMatchObject({
        name: "Test Campaign",
        status: "WAITING",
        playerCount: 2,
        maxPlayers: 4,
      });
    });
  });
});
```

### Tests de Performance con k6

```javascript
// tests/performance/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "2m", target: 100 }, // Stay at 100 users
    { duration: "30s", target: 200 }, // Ramp up to 200 users
    { duration: "2m", target: 200 }, // Stay at 200 users
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(99)<150"], // 99% of requests must complete below 150ms
    errors: ["rate<0.1"], // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  // Test character creation endpoint
  const characterData = {
    name: `Test Character ${__VU}-${__ITER}`,
    race: "HUMAN",
    class: "WARRIOR",
    attributes: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 8,
    },
  };

  const createResponse = http.post(
    `${BASE_URL}/api/characters`,
    JSON.stringify(characterData),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    }
  );

  const createSuccess = check(createResponse, {
    "character created successfully": (r) => r.status === 201,
    "response time OK": (r) => r.timings.duration < 200,
    "no errors": (r) => !r.json("error"),
  });

  errorRate.add(!createSuccess);

  if (createSuccess) {
    const characterId = createResponse.json("data.character.id");

    // Test getting character by ID
    const getResponse = http.get(`${BASE_URL}/api/characters/${characterId}`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });

    const getSuccess = check(getResponse, {
      "character retrieved successfully": (r) => r.status === 200,
      "response time OK": (r) => r.timings.duration < 100,
      "correct character": (r) => r.json("data.character.id") === characterId,
    });

    errorRate.add(!getSuccess);
  }

  sleep(1); // Wait 1 second between requests
}

export function handleSummary(data) {
  return {
    "performance-summary.json": JSON.stringify(data),
    stdout: `
    Performance Test Summary
    ========================
    
    Total Requests: ${data.metrics.http_reqs.count}
    Failed Requests: ${data.metrics.http_req_failed.count}
    Error Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%
    
    Response Times:
    - Min: ${data.metrics.http_req_duration.min.toFixed(2)}ms
    - Avg: ${data.metrics.http_req_duration.avg.toFixed(2)}ms
    - Max: ${data.metrics.http_req_duration.max.toFixed(2)}ms
    - p95: ${data.metrics.http_req_duration["p(95)"].toFixed(2)}ms
    - p99: ${data.metrics.http_req_duration["p(99)"].toFixed(2)}ms
    
    Throughput: ${(data.metrics.http_reqs.rate * 60).toFixed(0)} requests/minute
    
    Status: ${
      data.metrics.http_req_failed.rate < 0.1 ? "✅ PASSED" : "❌ FAILED"
    }
    `,
  };
}
```

---

## 📊 COBERTURA DE TESTING Y METRICAS

### Objetivos de Cobertura

| Tipo de Test      | Objetivo       | Actual | Timeline  |
| ----------------- | -------------- | ------ | --------- |
| Unit Tests        | 95%            | 0%     | 4 semanas |
| Integration Tests | 90%            | 0%     | 6 semanas |
| E2E Tests         | 85%            | 0%     | 8 semanas |
| Performance Tests | 100% endpoints | 0%     | 6 semanas |
| Load Tests        | 3,000 RPS      | 0%     | 8 semanas |

### Estrategia de Testing

#### Pirámide de Testing

```
    /\
   /  \  E2E Tests (10%)
  /____\ Integration Tests (30%)
 /______\ Unit Tests (60%)
```

#### Principios de Testing

1. **Test First:** Escribir tests antes del código
2. **Isolation:** Cada test debe ser independiente
3. **Deterministic:** Mismos inputs = mismos outputs
4. **Fast:** Unit tests < 1 segundo
5. **Readable:** Tests como documentación

### Herramientas de Calidad

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:all": "npm run test:coverage && npm run test:integration && npm run test:e2e",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "typecheck": "tsc --noEmit",
    "audit": "npm audit --audit-level=moderate"
  }
}
```

---

## 📈 METRICAS DE CALIDAD

### Code Quality Metrics

| Métrica               | Objetivo | Herramienta       |
| --------------------- | -------- | ----------------- |
| Cyclomatic Complexity | < 10     | ESLint complexity |
| Code Duplication      | < 3%     | jscpd             |
| Technical Debt        | < 5 days | SonarQube         |
| Security Issues       | 0        | npm audit         |
| Dependencies          | Mínimas  | npm-check-updates |

### Performance Benchmarks

| Operación        | Objetivo  | Actual | Mejora |
| ---------------- | --------- | ------ | ------ |
| JWT Validation   | < 10ms    | -      | Target |
| Database Query   | < 50ms    | -      | Target |
| AI Response      | < 1,200ms | -      | Target |
| Image Generation | < 3,000ms | -      | Target |
| WebSocket Emit   | < 100ms   | -      | Target |

### Documentación

- **JSDoc:** 100% funciones públicas documentadas
- **Swagger:** API completa documentada
- **README:** Setup y arquitectura
- **Guías:** Deployment y troubleshooting

---

## 🚀 IMPLEMENTACIÓN POR FASES

### Semana 1-2: Infraestructura Testing

- [ ] Configurar Jest con TypeScript
- [ ] Configurar Cypress para E2E
- [ ] Configurar k6 para performance
- [ ] Crear fixtures y factories
- [ ] Implementar mocks y stubs

### Semana 3-4: Core Services

- [ ] Implementar API Gateway con tests
- [ ] Implementar Auth Service con tests
- [ ] Implementar Game Engine con tests
- [ ] Alcanzar 95% cobertura unitaria

### Semana 5-6: AI Gateway

- [ ] Implementar AI Gateway con tests
- [ ] Tests de integración multi-provider
- [ ] Tests de caché inteligente
- [ ] Performance tests de IA

### Semana 7-8: Integration & E2E

- [ ] Tests de integración completos
- [ ] Tests E2E de flujos críticos
- [ ] Load tests a 3,000 RPS
- [ ] Documentación final

---

## 🎯 CONCLUSIONES

Esta implementación core establece:

1. **Código de Producción:** TypeScript strict + 95% cobertura
2. **Arquitectura SOLID:** Principios aplicados consistentemente
3. **Performance Optimizada:** Funciones atómicas <100ms
4. **Testing Exhaustivo:** Unit + Integration + E2E + Performance
5. **Documentación Completa:** JSDoc + Swagger + Guías
6. **Calidad Asegurada:** Métricas de código + seguridad

**Próximos pasos:** Implementar Fase 4 - Features Premium con sistema de logros, chat en tiempo real y analytics avanzado.

---

_Documento preparado para Fase 4: Features Premium y Roadmap Final_
