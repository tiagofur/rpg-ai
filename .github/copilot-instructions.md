# RPG-AI Supreme - Copilot Instructions

## Project Overview

AI-powered text RPG with React Native (Expo) frontend and Fastify backend. The AI acts as Game Master (IA-DJ) generating
narrative and resolving actions. **The server is the source of truth** - clients only render state. The app is
multilingual (i18n configured in frontend).

## Architecture

```
apps/
├── backend/         # Fastify + Socket.io (authoritative game server)
│   ├── src/game/    # GameEngine (1300+ lines) - Command pattern with undo/redo
│   ├── src/ai/      # AIGatewayService - Gemini 2.5 Flash (GPT-4 fallback)
│   ├── src/services/ # Business logic (PremiumFeaturesService, AuthenticationService)
│   ├── src/routes/  # REST endpoints (auth, character, game, stripe)
│   └── prisma/      # MongoDB schema
├── frontend/        # React Native + Expo (rendering only)
│   └── src/
│       ├── context/ # AuthContext, SettingsContext (global state)
│       ├── hooks/   # useGameEffects (audio/haptics), useSocket
│       ├── screens/ # GameScreen, HomeScreen, CharacterCreationScreen
│       └── i18n/    # Internationalization (en, es)
└── packages/shared/ # @rpg-ai/shared - Zod schemas, types, RNG utils
```

## Essential Commands

```bash
# Setup (pnpm required - v9.12.0)
corepack enable && pnpm install && pnpm prisma:generate

# Development
pnpm dev:backend          # Backend on :3333
pnpm dev:frontend:web     # Web frontend on :8081

# Testing (requires MongoDB + Redis)
pnpm --filter backend test          # Vitest unit tests
pnpm --filter backend test:e2e      # E2E tests (53+ tests)
docker-compose -f docker-compose.test.yml up  # Full test environment

# Type checking
pnpm --filter backend typecheck
```

## GameEngine Command System (Backend)

The GameEngine uses Command pattern with full undo/redo support. All commands inherit from `IGameCommand`:

**Available Commands** (`src/game/commands/`):

| Command                    | Type               | Description                    |
| -------------------------- | ------------------ | ------------------------------ |
| `AttackCommand`            | ATTACK             | Combat attack with damage calc |
| `MoveCommand`              | MOVE               | Location/room transitions      |
| `UseItemCommand`           | USE_ITEM           | Inventory item usage           |
| `CastSpellCommand`         | CAST_SPELL         | Magic abilities                |
| `DefendCommand`            | DEFEND             | Defensive stance               |
| `InteractCommand`          | INTERACT           | NPC/object interaction         |
| `LootCommand`              | LOOT               | Collect items/gold             |
| `RespawnCommand`           | RESPAWN            | Character death handling       |
| `GenerateNarrativeCommand` | GENERATE_NARRATIVE | AI-generated story text        |
| `GenerateImageCommand`     | GENERATE_IMAGE     | AI-generated scene images      |
| `ProcessInputCommand`      | CUSTOM             | Free-text player input → AI    |

**Creating a new command:**

```typescript
// apps/backend/src/game/commands/MyCommand.ts
import { BaseGameCommand } from './BaseGameCommand.js';
import { IGameContext, ICommandResult, CommandType } from '../interfaces.js';

export class MyCommand extends BaseGameCommand {
  readonly type = CommandType.MY_ACTION;

  async execute(context: IGameContext): Promise<ICommandResult> {
    const { character, gameState } = context;
    // 1. Validate action is possible
    // 2. Apply state changes
    // 3. Return result with narration
    return {
      success: true,
      narration: 'Action completed',
      stateChanges: { hp: character.hp - 10 },
    };
  }

  async undo(context: IGameContext): Promise<void> {
    // Reverse the state changes
  }
}

// Register in GameCommandFactory.ts:
this.commands.set(CommandType.MY_ACTION, () => new MyCommand());
```

## WebSocket Events (Complete Reference)

**Client → Server:**

```typescript
'join_game'; // gameSessionId: string - Join a game room
'player:action'; // { action: string, params?: object } - Send player action
'chat:message'; // { locationId: string, message: string } - Chat in location
'join_location'; // locationId: string - Join location-based room
```

**Server → Client:**

```typescript
'player:resolution'; // { success, narration, stateChanges, diceRoll?, imageTrigger? }
'game:event'; // { type, data } - Game engine events
'game:image'; // { url, prompt } - Generated image ready
'game:error'; // { code, message } - Error occurred
'chat:message'; // { userId, message, timestamp } - Chat broadcast
```

**Engine Events (internal):**

```typescript
engine.on('command:executed', (data) => {
  /* broadcast to room */
});
engine.on('engine:initialized', () => {
  /* setup complete */
});
```

## Monetization (Stripe Integration)

**Subscription Plans** (`src/types/premium.ts`):

| Plan    | Features                                          |
| ------- | ------------------------------------------------- |
| FREE    | 10 AI requests/day, 3 saved games, basic features |
| BASIC   | 50 AI requests/day, 10 saved games, HD images     |
| PREMIUM | 200 AI requests/day, unlimited saves, priority AI |
| SUPREME | Unlimited everything, early access, custom AI     |

**Key Stripe Routes** (`src/routes/stripe.ts`):

- `GET /stripe/config` - Public config (publishableKey, plans)
- `POST /stripe/create-subscription` - Create new subscription
- `POST /stripe/cancel-subscription` - Cancel subscription
- `POST /stripe/webhook` - Stripe event handling
- `GET /stripe/subscription-status` - Current user status

**Premium Feature Check:**

```typescript
import { PremiumFeaturesService } from '../services/PremiumFeaturesService.js';

// Check if user can use a feature
const canUse = await premiumService.checkFeatureAccess(userId, PremiumFeature.UNLIMITED_AI_REQUESTS);

// Track usage
await premiumService.trackUsage(userId, 'ai_requests', 1);
```

## Frontend Patterns

- **Screens**: Full-page components in `src/screens/`, receive navigation props
- **Context**: Global state via React Context (AuthContext, SettingsContext)
- **Hooks**: Reusable logic in `src/hooks/` (useSocket, useGameEffects)
- **Animations**: Use `react-native-reanimated` for 60fps, not Animated API
- **i18n**: Use `useTranslation()` hook, keys in `src/i18n/{en,es}.json`

```typescript
// Example: Component with i18n
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();
  return <Text>{t('game.startButton')}</Text>;
};
```

## Testing Conventions

- **E2E Tests**: Use Fastify's `app.inject()` for HTTP testing
- **Location**: `apps/backend/src/test/e2e/*.e2e.test.ts`
- **Pattern**: `describe → beforeAll (buildServer) → afterAll (close) → it blocks`
- **Unique Data**: Generate unique emails/usernames with `Date.now()` suffix

```typescript
// E2E test structure
import { buildServer } from '../../server.js';

describe('E2E - Feature', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildServer(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  it('should do something', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/...', payload: {...} });
    expect(response.statusCode).toBe(200);
  });
});
```

## Database (MongoDB via Prisma)

- Schema: `apps/backend/prisma/schema.prisma`
- After schema changes: `pnpm --filter backend prisma:generate`
- Key models: User, Character, GameSession, Subscription, Transaction

## AI Service

- Primary: Gemini 2.5 Flash (`AIGatewayService.ts`)
- Fallback: GPT-4 on failure
- Always returns structured JSON, never raw text
- Response shape: `{ narration, stateChanges, imageTrigger?, diceRoll? }`

## Environment Variables

Backend config in `apps/backend/.env` (copy from `.env.example`):

| Variable                 | Required | Description                                        |
| ------------------------ | -------- | -------------------------------------------------- |
| `DATABASE_URL`           | ✅       | MongoDB connection string                          |
| `JWT_SECRET`             | ✅       | JWT signing key (generate: `openssl rand -hex 64`) |
| `JWT_REFRESH_SECRET`     | ✅       | Refresh token key                                  |
| `GEMINI_API_KEY`         | ✅       | Google AI API key for Gemini                       |
| `OPENAI_API_KEY`         | ❌       | Fallback AI (optional)                             |
| `STRIPE_SECRET_KEY`      | ❌       | Stripe secret (sk*test*... for dev)                |
| `STRIPE_PUBLISHABLE_KEY` | ❌       | Stripe public key (pk*test*...)                    |
| `STRIPE_WEBHOOK_SECRET`  | ❌       | Webhook signature verification                     |
| `REDIS_HOST`             | ❌       | Redis host (falls back to in-memory)               |
| `PORT`                   | ❌       | Server port (default: 3333)                        |

**Quick dev setup:**

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL and GEMINI_API_KEY at minimum
```

## Documentation (Spanish)

- `docs/TAREAS_PENDIENTES.md` - Task tracking (update after completing features)
- `docs/CHANGELOG.md` - Version history (add entry for each sprint)
- `docs/ARCHITECTURE.md` - System diagrams and patterns
- `docs/DEVELOPMENT_SETUP.md` - Environment setup guide

## PR/Commit Conventions

- **Commit format**: `type(scope): description` (e.g., `feat(game): add loot command`)
- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- **Scopes**: `frontend`, `backend`, `game`, `ai`, `auth`, `premium`, `shared`
- **PR title**: Same format as commits
- **After merging**: Update `docs/TAREAS_PENDIENTES.md` status, add to `docs/CHANGELOG.md`

## Common Pitfalls

1. **Don't use yarn/npm** - pnpm workspaces only
2. **Backend tests need MongoDB/Redis** - Use Docker or cloud instances
3. **Frontend audio requires physical files** - Run `scripts/generate-audio-placeholders.ps1` if missing
4. **JWT tokens use bracket notation** - Access via `process.env['JWT_SECRET']` for ESLint
5. **Prisma client regeneration** - Required after schema changes
6. **New commands need factory registration** - Add to `GameCommandFactory.ts`
7. **Stripe webhooks need signature verification** - Use `stripe.webhooks.constructEvent()`
