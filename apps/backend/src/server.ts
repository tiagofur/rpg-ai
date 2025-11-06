import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Server as SocketIOServer, type Socket } from "socket.io";
import {
  actionResolutionSchema,
  playerActionSchema
} from "@rpg-ai/shared";

import { env } from "./env";
import prismaPlugin from "./plugins/prisma";
import { registerSessionRoutes } from "./routes/session";
import { registerCharacterRoutes } from "./routes/character";

const isProduction = process.env.NODE_ENV === "production";

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

await fastify.register(registerSessionRoutes);
await fastify.register(registerCharacterRoutes);

const io = new SocketIOServer(fastify.server, {
  cors: {
    origin: true,
    credentials: true
  }
});

type AckResponse = (response: { ok?: boolean; error?: unknown }) => void;

io.on("connection", (socket: Socket) => {
  socket.on("player:action", async (rawPayload: unknown, ack?: AckResponse) => {
    const parsed = playerActionSchema.safeParse(rawPayload);

    if (!parsed.success) {
      if (ack) {
        ack({ error: parsed.error.flatten() });
      }
      return;
    }

    const resolution = actionResolutionSchema.parse({
      narration: "La IA-DJ aún no está conectada, pero recibimos tu acción.",
      stateChanges: {},
      imageTrigger: false,
      version: "1.0"
    });

    socket.emit("player:resolution", resolution);

    if (ack) {
      ack({ ok: true });
    }
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    fastify.log.info(`Backend listening on port ${env.PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

void start();
