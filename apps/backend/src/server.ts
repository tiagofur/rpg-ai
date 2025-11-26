import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Server as SocketIOServer } from "socket.io";

import { env as environment } from "./env.js";
import prismaPlugin from "./plugins/prisma.js";
import { registerSessionRoutes } from "./routes/session.js";
import { registerCharacterRoutes } from "./routes/character.js";
import { registerGameRoutes } from "./routes/game.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { stripeRoutes } from "./routes/stripe.js";
import { iapRoutes } from "./routes/iap.js";
import { retentionRoutes } from "./routes/retention.js";
import { guildRoutes } from "./routes/guild.js";
import { PremiumFeaturesService } from "./services/PremiumFeaturesService.js";
import { IAPService } from "./services/IAPService.js";
import { NotificationService } from "./services/NotificationService.js";
import { DailyRewardService } from "./services/DailyRewardService.js";
import { AuthenticationService } from "./services/AuthenticationService.js";
import { createRedisClient } from "./utils/redis.js";

import { GameService } from "./game/GameService.js";
import { GuildService } from "./social/guild/GuildService.js";
import { ConsoleLogger } from "./logging/ConsoleLogger.js";
import { IRedisClient } from "./cache/interfaces/IRedisClient.js";
import { WebSocketService } from "./websocket/WebSocketService.js";

const isProduction = environment.NODE_ENV === "production";

export async function buildServer() {
  const fastify = Fastify({
    logger: isProduction
      ? true
      : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true
          }
        }
      }
  });

  await fastify.register(prismaPlugin);

  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });

  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute"
  });

  fastify.get("/api/health", async () => ({ status: "ok" }));

  // Initialize services with Redis fallback
  const redis = await createRedisClient({
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    ...(environment.REDIS_PASSWORD ? { password: environment.REDIS_PASSWORD } : {}),
    db: environment.REDIS_DB,
  });

  // Initialize Game Service
  const gameService = GameService.getInstance();

  const authConfig = {
    jwtSecret: environment.JWT_SECRET,
    jwtRefreshSecret: environment.JWT_REFRESH_SECRET,
    redis,
    bcryptRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    mfaIssuer: 'RPG-AI'
  };

  const authService = new AuthenticationService(authConfig, fastify.prisma);

  await fastify.register(registerSessionRoutes);
  await fastify.register(registerCharacterRoutes);
  await fastify.register(registerGameRoutes);
  await fastify.register(registerAuthRoutes, { authService });

  const premiumService = new PremiumFeaturesService(
    environment.STRIPE_SECRET_KEY,
    environment.STRIPE_WEBHOOK_SECRET,
    authService,
    redis,
    fastify.prisma
  );

  // Register Stripe routes
  await fastify.register(stripeRoutes, {
    premiumService,
    authService,
    redis,
  });

  const iapService = new IAPService(authService, redis, fastify.prisma);
  const notificationService = new NotificationService(fastify.prisma, redis);
  const dailyRewardService = new DailyRewardService(fastify.prisma, redis, notificationService);

  await fastify.register(iapRoutes, { iapService });
  await fastify.register(retentionRoutes, { notificationService, dailyRewardService });

  // Initialize Guild Service
  const logger = new ConsoleLogger('GuildService');
  const guildService = new GuildService(redis as unknown as IRedisClient, logger, fastify.prisma);

  // Register Guild routes
  await fastify.register(guildRoutes, {
    guildService
  });

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Initialize WebSocket Service
  const wsLogger = new ConsoleLogger('WebSocketService');
  const webSocketService = new WebSocketService(io, authService, gameService, wsLogger);
  void webSocketService;

  return fastify;
}

const start = async () => {
  const fastify = await buildServer();
  try {
    await fastify.listen({ port: environment.PORT, host: "0.0.0.0" });
    fastify.log.info(`Backend listening on port ${environment.PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

void start();
