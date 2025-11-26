# Quick Start Cheat Sheet

## 🚀 First Time Setup

```bash
git clone https://github.com/tiagofur/rpg-ai.git
cd rpg-ai
corepack enable
pnpm setup
```

## 📦 Installation

```bash
pnpm install              # Install dependencies
pnpm prisma:generate     # Generate Prisma client
```

## 🔧 Development

```bash
# Start backend (Terminal 1)
pnpm dev:backend

# Start frontend web (Terminal 2)
pnpm dev:frontend:web
```

## 🏗️ Build & Check

```bash
pnpm build               # Build all packages
pnpm typecheck          # Type check
pnpm lint               # Lint (when configured)
```

## 📍 Ports

- **3333**: Backend API
- **8081**: Expo Metro bundler
- **19000**: Expo Dev Tools

## 📝 Environment Variables

```bash
# Backend only
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env
```

## 🗄️ Database

```bash
pnpm prisma:push        # Push schema to DB
pnpm prisma:generate    # Generate client
```

## 🔍 Useful Commands

```bash
pnpm setup              # Full setup (install + prisma)
pnpm dev                # Start backend only
pnpm dev:frontend       # Start Expo (interactive)
pnpm dev:frontend:ios   # Start iOS simulator
pnpm dev:frontend:android # Start Android
```

## 📚 Documentation

- [Full Setup Guide](./DEVELOPMENT_SETUP.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Available Scripts](./SCRIPTS.md)
- [Architecture](./ARCHITECTURE.md)

## 🆘 Troubleshooting

```bash
# pnpm not found
corepack enable

# Build errors
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm prisma:generate
pnpm build

# Port already in use
lsof -ti:3333 | xargs kill -9  # Backend
lsof -ti:8081 | xargs kill -9  # Expo
```

## 🌐 Codespaces

1. GitHub → Code → Codespaces → Create
2. Auto-configured ✨
3. Run: `pnpm dev:backend` and `pnpm dev:frontend:web`

## 📂 Project Structure

```
rpg-ai/
├── apps/
│   ├── backend/         # Node.js + Fastify API
│   └── frontend/        # React Native + Expo app
├── packages/
│   └── shared/          # Shared TypeScript types
└── docs/               # Documentation
```
