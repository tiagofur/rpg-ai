# Environment Variables

This document describes the environment variables used in the RPG AI project.

## Backend (apps/backend/.env)

Create a `.env` file in `apps/backend/` based on `.env.example`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### Required Variables

- **`PORT`**: Port for the backend server (default: 3333)
  - Example: `PORT=3333`

- **`DATABASE_URL`**: MongoDB connection string
  - Example: `DATABASE_URL="mongodb://127.0.0.1:27017/rpg-ai"`
  - For production: `DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/rpg-ai"`

### Optional Variables

- **`OPENAI_API_KEY`**: OpenAI API key for AI-DJ functionality
  - Required for AI features (character generation, narrative)
  - Get your key from: https://platform.openai.com/api-keys
  - Example: `OPENAI_API_KEY="sk-..."`

## Frontend (apps/frontend)

The frontend currently uses Expo default configuration. No environment variables are required for basic development.

### Future Environment Variables (when API integration is added)

- **`EXPO_PUBLIC_API_URL`**: Backend API URL
  - Example: `EXPO_PUBLIC_API_URL="http://localhost:3333"`

## Local Development

For local development, you can use the default values in `.env.example`. Make sure to:

1. Install MongoDB locally or use a cloud instance (MongoDB Atlas)
2. Copy `.env.example` to `.env` in the backend directory
3. Update `DATABASE_URL` if using a different MongoDB instance
4. Add your `OPENAI_API_KEY` when testing AI features

## GitHub Codespaces

When using GitHub Codespaces:

1. The devcontainer will forward ports automatically (3333, 8081, 19000-19002)
2. MongoDB needs to be installed or use a cloud instance
3. Set secrets in your Codespace settings for sensitive values like `OPENAI_API_KEY`

### Setting Codespace Secrets

1. Go to your repository settings
2. Navigate to Secrets and variables → Codespaces
3. Add repository secrets:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (if using cloud MongoDB)

## Production

For production deployments:

- Never commit `.env` files to version control
- Use environment variables provided by your hosting platform
- Always use secure, randomly generated values for secrets
- Use MongoDB Atlas or similar managed database service
