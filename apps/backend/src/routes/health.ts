/**
 * B-033: Health Check Detallado
 * Proporciona información sobre el estado de salud de los servicios
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";

// Schema para la respuesta de health check
const serviceHealthSchema = z.object({
    status: z.enum(["healthy", "unhealthy", "degraded"]),
    latencyMs: z.number().optional(),
    message: z.string().optional(),
});

const healthResponseSchema = z.object({
    status: z.enum(["healthy", "unhealthy", "degraded"]),
    timestamp: z.string().datetime(),
    version: z.string(),
    uptime: z.number(),
    services: z.object({
        database: serviceHealthSchema,
        redis: serviceHealthSchema.optional(),
    }),
    memory: z.object({
        heapUsed: z.number(),
        heapTotal: z.number(),
        external: z.number(),
        rss: z.number(),
    }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

interface HealthRouteOptions {
    redis?: {
        ping: () => Promise<string>;
        isConnected: () => boolean;
    } | null;
}

export async function registerHealthRoutes(
    fastify: FastifyInstance,
    options: HealthRouteOptions = {}
) {
    /**
     * GET /api/health
     * Basic health check (para load balancers)
     */
    fastify.get("/api/health", async () => ({ status: "ok" }));

    /**
     * GET /api/health/detailed
     * Health check detallado con estado de todos los servicios
     */
    fastify.get("/api/health/detailed", async (_request, reply) => {
        const services: HealthResponse["services"] = {
            database: { status: "unhealthy" },
        };

        // Check Database (MongoDB via Prisma)
        try {
            const dbStart = Date.now();
            // Use a lightweight query to check database connectivity
            await fastify.prisma.user.findFirst({ select: { id: true } });
            services.database = {
                status: "healthy",
                latencyMs: Date.now() - dbStart,
            };
        } catch (error) {
            services.database = {
                status: "unhealthy",
                message: error instanceof Error ? error.message : "Database connection failed",
            };
        }

        // Check Redis (if available)
        if (options.redis) {
            try {
                const redisStart = Date.now();
                if (options.redis.isConnected()) {
                    await options.redis.ping();
                    services.redis = {
                        status: "healthy",
                        latencyMs: Date.now() - redisStart,
                    };
                } else {
                    services.redis = {
                        status: "degraded",
                        message: "Redis not connected, using in-memory fallback",
                    };
                }
            } catch (error) {
                services.redis = {
                    status: "unhealthy",
                    message: error instanceof Error ? error.message : "Redis check failed",
                };
            }
        }

        // Determine overall status
        const allStatuses = Object.values(services)
            .filter((s): s is NonNullable<typeof s> => s !== undefined)
            .map((s) => s.status);
        let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

        if (allStatuses.includes("unhealthy")) {
            // Database unhealthy = system unhealthy
            if (services.database.status === "unhealthy") {
                overallStatus = "unhealthy";
            } else {
                overallStatus = "degraded";
            }
        } else if (allStatuses.includes("degraded")) {
            overallStatus = "degraded";
        }

        // Get memory usage
        const memoryUsage = process.memoryUsage();

        const response: HealthResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env["npm_package_version"] || "0.0.1",
            uptime: process.uptime(),
            services,
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            },
        };

        // Return appropriate status code
        const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;
        return reply.status(statusCode).send(response);
    });

    /**
     * GET /api/health/ready
     * Readiness check (para Kubernetes)
     * Indica si la aplicación está lista para recibir tráfico
     */
    fastify.get("/api/health/ready", async (_request, reply) => {
        try {
            // Check database connectivity with a lightweight query
            await fastify.prisma.user.findFirst({ select: { id: true } });
            return { ready: true };
        } catch {
            return reply.status(503).send({ ready: false, reason: "Database not ready" });
        }
    });

    /**
     * GET /api/health/live
     * Liveness check (para Kubernetes)
     * Indica si la aplicación está viva (no bloqueada)
     */
    fastify.get("/api/health/live", async () => ({
        alive: true,
        timestamp: Date.now(),
    }));
}
