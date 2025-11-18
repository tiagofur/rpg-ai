# Available Scripts

This document lists all available scripts in the RPG AI monorepo.

## Root Level Scripts

Run from the project root directory:

### Setup & Installation

```bash
# Install all dependencies and generate Prisma client
pnpm setup

# Install dependencies only
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Push Prisma schema to database
pnpm prisma:push
```

### Development

```bash
# Start backend server only (default)
pnpm dev

# Start backend server
pnpm dev:backend

# Start frontend (interactive mode - choose platform)
pnpm dev:frontend

# Start frontend web version
pnpm dev:frontend:web

# Start frontend on iOS simulator (macOS only)
pnpm dev:frontend:ios

# Start frontend on Android emulator
pnpm dev:frontend:android
```

### Build & Quality Checks

```bash
# Build all packages
pnpm build

# Type check all packages
pnpm typecheck

# Lint all packages (when configured)
pnpm lint

# Format all packages (when configured)
pnpm format

# Run tests (when configured)
pnpm test
```

## Backend Scripts

Navigate to `apps/backend/` first, or use `pnpm --filter backend <script>`:

```bash
# Development server with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Type check without emitting files
pnpm typecheck

# Generate Prisma client
pnpm prisma:generate

# Push schema changes to database
pnpm db:push

# Seed database with initial data
pnpm db:seed
```

## Frontend Scripts

Navigate to `apps/frontend/` first, or use `pnpm --filter frontend <script>`:

```bash
# Start Expo (interactive mode)
pnpm start

# Start Expo web version
pnpm web

# Start on iOS simulator
pnpm ios

# Start on Android emulator
pnpm android
```

## Shared Package Scripts

Navigate to `packages/shared/` first:

```bash
# Build TypeScript types
pnpm build

# Type check
pnpm typecheck
```

## Common Workflows

### First Time Setup

```bash
# Clone and setup
git clone https://github.com/tiagofur/rpg-ai.git
cd rpg-ai
corepack enable
pnpm setup
```

### Daily Development

```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Frontend (web)
pnpm dev:frontend:web
```

### Before Committing

```bash
# Run type checks
pnpm typecheck

# Build to ensure no errors
pnpm build

# Run linter (when configured)
pnpm lint
```

### After Pulling Changes

```bash
# Update dependencies if package.json changed
pnpm install

# Regenerate Prisma client if schema changed
pnpm prisma:generate

# Rebuild
pnpm build
```

### Database Management

```bash
# Update database schema
pnpm prisma:push

# Generate Prisma client after schema changes
pnpm prisma:generate

# Seed database with test data
cd apps/backend
pnpm db:seed
```

## Tips

- Use `pnpm` for faster installation and better disk space usage
- Scripts run in parallel where possible (e.g., `pnpm build` builds all packages)
- Frontend scripts require Expo CLI (installed automatically with dependencies)
- Backend scripts require valid `.env` file (copy from `.env.example`)
- For Codespaces, use `pnpm dev:frontend:web` instead of native platforms
