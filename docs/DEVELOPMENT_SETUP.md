# Development Setup Guide

This guide will help you set up the RPG AI project for local development or in GitHub Codespaces.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [GitHub Codespaces Setup](#github-codespaces-setup)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Local Development

- **Node.js**: Version 20 or higher
- **Package Manager**: pnpm (recommended) or yarn
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: For version control

### Optional

- **Expo Go App**: For testing on physical devices (iOS/Android)
- **OpenAI API Key**: For AI features (get from https://platform.openai.com/api-keys)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tiagofur/rpg-ai.git
cd rpg-ai
```

### 2. Install Dependencies

#### Using pnpm (Recommended)

```bash
# Enable corepack to use the correct pnpm version
corepack enable

# Install all dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate
```

#### Using yarn

```bash
# Enable corepack
corepack enable

# Install all dependencies
yarn install

# Generate Prisma client
yarn prisma:generate
```

> **Note**: The project is configured to use pnpm by default. Yarn should also work, but pnpm is recommended.

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp apps/backend/.env.example apps/backend/.env

# Edit the .env file with your configuration
# At minimum, set DATABASE_URL to your MongoDB instance
```

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed configuration.

### 4. Set Up Database

If using local MongoDB:

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb

# Push Prisma schema to database
pnpm prisma:push
```

Or use MongoDB Atlas (cloud):
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string
3. Update `DATABASE_URL` in `apps/backend/.env`

## GitHub Codespaces Setup

### 1. Create a Codespace

1. Go to the repository on GitHub
2. Click the **Code** button
3. Select **Codespaces** tab
4. Click **Create codespace on main**

The devcontainer will automatically:
- Install Node.js 20
- Enable corepack
- Install all dependencies with pnpm
- Generate Prisma client
- Configure VS Code with recommended extensions

### 2. Configure Secrets (Optional)

For AI features and cloud database:

1. Go to repository **Settings** → **Secrets and variables** → **Codespaces**
2. Add secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `DATABASE_URL`: MongoDB connection string (if using cloud)

### 3. Access the Application

Codespaces will automatically forward these ports:
- **3333**: Backend API
- **8081**: Expo Metro bundler
- **19000**: Expo Dev Tools

## Running the Application

### Start Backend Server

```bash
# From root directory
pnpm dev:backend

# Or from backend directory
cd apps/backend
pnpm dev
```

The backend will start on http://localhost:3333

### Start Frontend

#### Web (Recommended for Codespaces)

```bash
# From root directory
pnpm dev:frontend:web

# Or from frontend directory
cd apps/frontend
pnpm web
```

Access the web app at http://localhost:8081

#### Mobile (Physical Device)

```bash
# Start Expo with tunnel for Codespaces/remote access
pnpm dev:frontend

# Scan the QR code with:
# - Expo Go app (iOS/Android)
# - Camera app (iOS only)
```

#### iOS Simulator (macOS only)

```bash
pnpm dev:frontend:ios
```

#### Android Emulator

```bash
pnpm dev:frontend:android
```

### Run Both (Development Mode)

Open two terminal windows:

```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Frontend
pnpm dev:frontend:web
```

## Available Scripts

All scripts can be run from the root directory:

### Installation & Setup

- `pnpm install` - Install all dependencies
- `pnpm setup` - Install dependencies and generate Prisma client
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:push` - Push Prisma schema to database

### Development

- `pnpm dev` - Start backend only
- `pnpm dev:backend` - Start backend server
- `pnpm dev:frontend` - Start Expo (interactive mode)
- `pnpm dev:frontend:web` - Start frontend web version
- `pnpm dev:frontend:ios` - Start iOS simulator
- `pnpm dev:frontend:android` - Start Android emulator

### Build & Quality

- `pnpm build` - Build all packages
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all packages
- `pnpm test` - Run tests (not configured yet)

## Project Structure

```
rpg-ai/
├── .devcontainer/          # GitHub Codespaces configuration
├── apps/
│   ├── backend/           # Fastify + Node.js backend
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── .env.example
│   │   └── package.json
│   └── frontend/          # React Native + Expo app
│       ├── src/
│       ├── App.tsx
│       └── package.json
├── packages/
│   └── shared/            # Shared TypeScript types
├── docs/                  # Documentation
├── package.json           # Root workspace config
└── pnpm-workspace.yaml    # Workspace definition
```

## Troubleshooting

### pnpm command not found

```bash
# Enable corepack
corepack enable

# Or install pnpm globally
npm install -g pnpm@9.12.0
```

### Prisma Client errors

```bash
# Regenerate Prisma client
pnpm prisma:generate

# Or from backend directory
cd apps/backend
pnpm prisma:generate
```

### MongoDB connection errors

- Verify MongoDB is running: `sudo systemctl status mongodb`
- Check `DATABASE_URL` in `apps/backend/.env`
- For cloud MongoDB, verify IP whitelist and credentials

### Port already in use

```bash
# Kill process on port 3333 (backend)
lsof -ti:3333 | xargs kill -9

# Kill process on port 8081 (Expo)
lsof -ti:8081 | xargs kill -9
```

### Build errors after pulling changes

```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm prisma:generate
pnpm build
```

### Expo QR code not working in Codespaces

Use Expo web instead:
```bash
pnpm dev:frontend:web
```

Or use tunnel mode (slower):
```bash
cd apps/frontend
pnpm start --tunnel
```

## Next Steps

- Read the [Game Design Document](./GDD.md)
- Review [Architecture Documentation](./ARCHITECTURE.md)
- Check [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- See [Contributing Guidelines](../CONTRIBUTING.md)

## Getting Help

- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review closed issues for similar problems
