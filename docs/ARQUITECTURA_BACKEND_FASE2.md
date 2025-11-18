# ARQUITECTURA BACKEND MODULAR - FASE 2

## Diseño de Microservicios para RPG AI

**Fecha:** Noviembre 2025  
**Versión:** 2.0  
**Estado:** Diseño Completo

---

## 🎯 VISIÓN GENERAL

Transformar la arquitectura monolítica actual en un sistema de microservicios escalable, manteniendo la compatibilidad con el frontend existente mientras mejoramos el rendimiento 10x y reduciendo costos 40%.

### Objetivos Clave

- **Escalabilidad:** Soportar 100,000+ usuarios concurrentes
- **Performance:** Latencia p99 <150ms para todas las operaciones
- **Disponibilidad:** 99.9% uptime con failover automático
- **Costo:** Reducir costos de IA e infraestructura 40%
- **Mantenibilidad:** Despliegue independiente por servicio

---

## 🏗️ ARQUITECTURA DE MICROSERVICIOS

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        API GATEWAY                          │
│                 (GraphQL + REST Hybrid)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                     │                                       │
│  ┌──────────────┐  │  ┌──────────────┐  ┌──────────────┐  │
│  │AUTH SERVICE  │  │  │GAME ENGINE   │  │AI GATEWAY    │  │
│  │(JWT+OAuth2)  │  │  │(Core Logic)  │  │(LLM+Images)  │  │
│  └──────┬───────┘  │  └──────┬───────┘  └──────┬───────┘  │
│         │          │         │          │         │       │
│  ┌──────┴───────┐  │  ┌──────┴───────┐  ┌──────┴───────┐  │
│  │USER SERVICE  │  │  │SESSION MGMT  │  │ANALYTICS     │  │
│  │(Profiles)    │  │  │(Game State)  │  │(Metrics)     │  │
│  └──────────────┘  │  └──────────────┘  └──────────────┘  │
│                     │                                       │
│  ┌──────────────┐  │  ┌──────────────┐  ┌──────────────┐  │
│  │NOTIFICATION  │  │  │QUEUE SERVICE   │  │CDN/ASSETS    │  │
│  │(WebSocket)   │  │  │(BullMQ)        │  │(R2/S3)       │  │
│  └──────────────┘  │  └──────────────┘  └──────────────┘  │
│                     │                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│  INFRAESTRUCTURA    │                                       │
│  ┌──────────────┐  │  ┌──────────────┐  ┌──────────────┐  │
│  │REDIS CLUSTER │  │  │POSTGRESQL    │  │MONGODB       │  │
│  │(Cache+Queue) │  │  │(Critical)    │  │(Game Data)   │  │
│  └──────────────┘  │  └──────────────┘  └──────────────┘  │
│                     │                                       │
│  ┌──────────────┐  │  ┌──────────────┐  ┌──────────────┐  │
│  │PROMETHEUS    │  │  │GRAFANA       │  │  │JAEGER       │  │
│  │(Metrics)     │  │  │(Dashboards)  │  │  │(Tracing)    │  │
│  └──────────────┘  │  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 SERVICIOS DETALLADOS

### 1. API GATEWAY

**Responsabilidad:** Punto de entrada único, routing, rate limiting, auth

```typescript
// Tecnología: GraphQL + Fastify
// Puerto: 4000
// Escalabilidad: 10+ nodos con load balancer

interface APIGatewayConfig {
  port: number;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  auth: AuthConfig;
  services: ServiceRegistry;
}

// Rate limiting inteligente
const rateLimitConfig = {
  windowMs: 60000, // 1 minuto
  max: 100, // requests por minuto
  keyGenerator: (req) => req.user?.id || req.ip,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
};
```

**Stack:**

- GraphQL (Apollo Server)
- Fastify + Mercurius
- Redis para rate limiting
- JWT validation
- Circuit breakers

### 2. AUTH SERVICE

**Responsabilidad:** Autenticación, autorización, gestión de tokens

```typescript
// Tecnología: Fastify + JWT + OAuth2
// Puerto: 4001
// Base de datos: PostgreSQL (usuarios críticos)

interface AuthService {
  // JWT con refresh tokens
  login(email: string, password: string): Promise<AuthTokens>;
  register(userData: UserRegistration): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;

  // OAuth2 providers
  oauthLogin(provider: "google" | "apple" | "discord"): Promise<string>;
  oauthCallback(provider: string, code: string): Promise<AuthTokens>;

  // Authorization
  validateToken(token: string): Promise<UserPayload>;
  checkPermissions(userId: string, resource: string): Promise<boolean>;
}

// Seguridad avanzada
interface SecurityConfig {
  bcryptRounds: 12;
  jwtSecret: string;
  accessTokenExpiry: "15m";
  refreshTokenExpiry: "7d";
  passwordPolicy: {
    minLength: 8;
    requireUppercase: true;
    requireNumbers: true;
    requireSpecialChars: true;
  };
}
```

**Stack:**

- Fastify + TypeScript
- PostgreSQL (users table)
- Redis (session cache)
- bcrypt + JWT
- OAuth2 libraries

### 3. GAME ENGINE

**Responsabilidad:** Lógica del juego, reglas, estado, validación

```typescript
// Tecnología: Fastify + State Machine
// Puerto: 4002
// Base de datos: MongoDB (game state)

interface GameEngine {
  // Core game mechanics
  processAction(action: PlayerAction): Promise<GameResolution>;
  calculateProbability(context: GameContext): number;
  applyRules(result: DiceResult, action: Action): GameEffect;

  // State management
  getGameState(sessionId: string): Promise<GameState>;
  updateGameState(
    sessionId: string,
    changes: Partial<GameState>
  ): Promise<void>;

  // Combat system
  resolveCombat(attacker: Character, defender: Character): CombatResult;
  calculateDamage(attacker: Character, weapon: Weapon): number;

  // Character progression
  levelUp(character: Character): Character;
  learnSkill(character: Character, skill: Skill): Character;
}

// Sistema de eventos para replay/debug
interface GameEvent {
  id: string;
  sessionId: string;
  type: "action" | "combat" | "level_up" | "item_found";
  timestamp: Date;
  payload: any;
  previousState: GameState;
  newState: GameState;
}
```

**Stack:**

- Fastify + TypeScript
- MongoDB (game events)
- Redis (current state cache)
- XState (state machines)
- Zod validation

### 4. AI GATEWAY

**Responsabilidad:** Integración LLM, generación de contenido, caché

```typescript
// Tecnología: Fastify + AI SDKs
// Puerto: 4003
// Caché: Redis + R2 para imágenes

interface AIGateway {
  // LLM Integration
  generateNarration(prompt: string, context: GameContext): Promise<string>;
  generateDialogue(character: Character, situation: string): Promise<string>;
  generateQuest(playerLevel: number): Promise<Quest>;

  // Image Generation
  generateImage(prompt: string, style: ImageStyle): Promise<string>;
  generateCharacterPortrait(character: Character): Promise<string>;
  generateSceneImage(scene: GameScene): Promise<string>;

  // Caching & Optimization
  getCachedResponse(hash: string): Promise<CachedResponse | null>;
  cacheResponse(hash: string, response: any, ttl: number): Promise<void>;

  // Cost control
  estimateCost(provider: string, model: string, tokens: number): number;
  checkRateLimit(userId: string): Promise<boolean>;
}

// Multi-provider support
interface AIProvider {
  name: "openai" | "anthropic" | "google";
  models: Model[];
  costPerToken: CostStructure;
  rateLimit: RateLimit;
  fallback?: string;
}
```

**Stack:**

- Fastify + TypeScript
- OpenAI SDK
- Anthropic SDK
- Stable Diffusion
- Redis (caché)
- Cloudflare R2 (images)

### 5. SESSION MANAGEMENT

**Responsabilidad:** Gestión de sesiones, jugadores, estado real-time

```typescript
// Tecnología: Socket.io + Redis
// Puerto: 4004
// Pub/Sub: Redis para multi-nodo

interface SessionService {
  // Session lifecycle
  createSession(ownerId: string, config: SessionConfig): Promise<Session>;
  joinSession(sessionId: string, playerId: string): Promise<void>;
  leaveSession(sessionId: string, playerId: string): Promise<void>;

  // Real-time updates
  broadcastToSession(sessionId: string, event: string, data: any): void;
  broadcastToPlayer(playerId: string, event: string, data: any): void;

  // State synchronization
  getSessionState(sessionId: string): Promise<SessionState>;
  syncPlayerState(playerId: string, state: PlayerState): Promise<void>;
}

// WebSocket con rooms y namespaces
interface WebSocketConfig {
  adapter: RedisAdapter;
  cors: { origin: string[] };
  pingTimeout: 20000;
  pingInterval: 25000;
  maxHttpBufferSize: 1_000_000;
}
```

**Stack:**

- Socket.io
- Redis (pub/sub)
- JWT validation
- Room management

### 6. ANALYTICS SERVICE

**Responsabilidad:** Métricas, tracking, análisis de comportamiento

```typescript
// Tecnología: Fastify + ClickHouse
// Puerto: 4005
// Base de datos: ClickHouse (analytics)

interface AnalyticsService {
  // Event tracking
  trackEvent(userId: string, event: string, properties: any): Promise<void>;
  trackGameEvent(sessionId: string, event: GameEvent): Promise<void>;

  // Metrics
  getPlayerMetrics(userId: string): Promise<PlayerMetrics>;
  getSessionMetrics(sessionId: string): Promise<SessionMetrics>;
  getGameMetrics(timeRange: TimeRange): Promise<GameMetrics>;

  // Real-time analytics
  getActiveUsers(): Promise<number>;
  getRetentionRate(days: number): Promise<number>;
  getConversionRate(): Promise<number>;
}

// Eventos de negocio
interface BusinessEvent {
  userId: string;
  sessionId: string;
  eventType: "session_started" | "action_taken" | "combat_won" | "item_found";
  timestamp: Date;
  properties: Record<string, any>;
}
```

**Stack:**

- Fastify + TypeScript
- ClickHouse (analytics DB)
- Kafka (event streaming)
- Grafana (dashboards)

---

## 🗄️ BASES DE DATOS ESPECIALIZADAS

### PostgreSQL - Datos Críticos

```sql
-- Usuarios y autenticación
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suscripciones y pagos
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP
);
```

### MongoDB - Estado del Juego

```javascript
// Game sessions
db.sessions.createIndex({ ownerId: 1 });
db.sessions.createIndex({ createdAt: -1 });

// Game events (event sourcing)
db.events.createIndex({ sessionId: 1, timestamp: 1 });
db.events.createIndex({ playerId: 1 });
```

### Redis - Caché y Real-time

```
# Session state cache
SET session:{sessionId}:state {jsonState} EX 3600

# Rate limiting
INCR rate_limit:{userId}:{window}
EXPIRE rate_limit:{userId}:{window} 60

# WebSocket rooms
SADD rooms:{sessionId} {playerId}
```

### ClickHouse - Analytics

```sql
-- Event table
CREATE TABLE events (
  timestamp DateTime,
  user_id UUID,
  session_id UUID,
  event_type String,
  properties String -- JSON
) ENGINE = MergeTree()
ORDER BY (timestamp, user_id)
```

---

## 🔄 SISTEMA DE COLAS Y EVENTOS

### BullMQ - Tareas Asíncronas

```typescript
// Image generation queue
const imageQueue = new Queue("image-generation", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: "exponential",
  },
});

// AI processing queue
const aiQueue = new Queue("ai-processing", {
  redis: redisConfig,
  defaultJobOptions: {
    priority: 1,
    delay: 0,
    attempts: 2,
  },
});
```

### Kafka - Event Streaming

```typescript
// Game events topic
interface GameEvent {
  topic: "game-events";
  partition: number;
  key: string; // sessionId
  value: {
    eventType: string;
    timestamp: number;
    data: any;
  };
}
```

---

## 🔒 SEGURIDAD Y GOBERNANZA

### API Gateway Security

```typescript
// JWT validation middleware
const validateJWT = async (req: FastifyRequest, reply: FastifyReply) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return reply.code(401).send({ error: "NO_TOKEN" });
  }

  try {
    const payload = await authService.validateToken(token);
    req.user = payload;
  } catch (error) {
    return reply.code(401).send({ error: "INVALID_TOKEN" });
  }
};

// Rate limiting by user tier
const rateLimitByTier = {
  free: { max: 60, windowMs: 60000 },
  premium: { max: 300, windowMs: 60000 },
  admin: { max: 1000, windowMs: 60000 },
};
```

### Circuit Breakers

```typescript
// Prevent cascading failures
const circuitBreaker = new CircuitBreaker({
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,
});

// Usage
const result = await circuitBreaker.fire(() =>
  aiGateway.generateNarration(prompt, context)
);
```

---

## 📊 MONITOREO Y OBSERVABILIDAD

### Prometheus Metrics

```typescript
// Custom metrics
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

const activeConnections = new Gauge({
  name: "websocket_active_connections",
  help: "Number of active WebSocket connections",
  labelNames: ["service"],
});

const aiRequests = new Counter({
  name: "ai_requests_total",
  help: "Total AI requests by provider and model",
  labelNames: ["provider", "model", "status"],
});
```

### Distributed Tracing

```typescript
// Jaeger tracing
const tracer = initTracer({
  serviceName: "rpg-ai-gateway",
  sampler: { type: "const", param: 1 },
});

// Trace HTTP requests
app.addHook("onRequest", async (req, reply) => {
  const span = tracer.startSpan("http_request");
  req.span = span;
  span.setTag("http.method", req.method);
  span.setTag("http.url", req.url);
});
```

### Health Checks

```typescript
// Comprehensive health check
const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    ai_provider: await checkAIProvider(),
    memory: checkMemoryUsage(),
    disk: checkDiskSpace(),
  };

  const isHealthy = Object.values(checks).every(
    (check) => check.status === "healthy"
  );

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
  };
};
```

---

## 🚀 IMPLEMENTACIÓN POR FASES

### Fase 2.1 - Infraestructura Base (Semanas 1-2)

- [ ] Configurar Redis cluster
- [ ] Implementar API Gateway
- [ ] Configurar PostgreSQL
- [ ] Implementar Auth Service
- [ ] Configurar monitoring (Prometheus/Grafana)

**Criterios de Aceptación:**

- API Gateway manejando 1,000 RPS
- Auth Service con <100ms latencia
- Redis con 99.9% uptime

### Fase 2.2 - Game Engine (Semanas 3-4)

- [ ] Migrar lógica actual a Game Engine
- [ ] Implementar sistema de eventos
- [ ] Añadir caché Redis para estado
- [ ] Optimizar queries MongoDB
- [ ] Implementar circuit breakers

**Criterios de Aceptación:**

- Game resolution <200ms
- Soporte 5,000 partidas simultáneas
- Event sourcing funcional

### Fase 2.3 - AI Gateway (Semanas 5-6)

- [ ] Implementar integración multi-provider
- [ ] Añadir sistema de caché
- [ ] Implementar rate limiting por usuario
- [ ] Configurar colas para procesamiento
- [ ] Optimizar costos de IA

**Criterios de Aceptación:**

- Respuesta IA <1,200ms
- 50% caché hit rate
- Costos IA reducidos 30%

### Fase 2.4 - Optimización (Semanas 7-8)

- [ ] Implementar todos los circuit breakers
- [ ] Añadir CDN para assets
- [ ] Optimizar WebSocket scaling
- [ ] Implementar auto-scaling
- [ ] Load testing con k6

**Criterios de Aceptación:**

- 20,000 conexiones WS simultáneas
- 3,000 RPS sostenidos
- 99.9% uptime medido

---

## 📈 METRICAS Y KPIs

### Performance Metrics

| Métrica          | Objetivo  | Actual  | Timeline  |
| ---------------- | --------- | ------- | --------- |
| API Latency p99  | <150ms    | 200ms   | 2 semanas |
| WS Latency p99   | <200ms    | 500ms   | 3 semanas |
| Throughput       | 3,000 RPS | 100 RPS | 4 semanas |
| WS Connections   | 20,000    | 1,000   | 6 semanas |
| IA Response Time | <1,200ms  | N/A     | 5 semanas |
| Availability     | 99.9%     | ?       | 8 semanas |

### Cost Metrics

| Servicio        | Costo Actual | Objetivo     | Ahorro  |
| --------------- | ------------ | ------------ | ------- |
| OpenAI GPT-4    | $300/mes     | $200/mes     | 33%     |
| OpenAI DALL-E   | $200/mes     | $120/mes     | 40%     |
| Infraestructura | $65/mes      | $45/mes      | 30%     |
| **Total**       | **$565/mes** | **$365/mes** | **35%** |

---

## 🔧 STACK TECNOLÓGICO FINAL

### Backend Services

- **Lenguaje:** TypeScript 5.6+
- **Framework:** Fastify 4.28+
- **Validación:** Zod 3.23+
- **Testing:** Jest + Supertest
- **Documentación:** Swagger/OpenAPI

### Bases de Datos

- **PostgreSQL:** Usuarios, suscripciones (críticos)
- **MongoDB:** Estado del juego, eventos
- **Redis:** Caché, sesiones, colas
- **ClickHouse:** Analytics, métricas

### Infraestructura

- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes (futuro)
- **CDN:** Cloudflare R2
- **Monitoring:** Prometheus + Grafana
- **Tracing:** Jaeger
- **Load Testing:** k6

### IA y ML

- **LLM:** OpenAI GPT-4, Anthropic Claude
- **Imágenes:** DALL-E 3, Stable Diffusion
- **Caché:** Redis con TTL inteligente
- **Queue:** BullMQ + Redis

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Pre-requisitos

- [ ] Infraestructura cloud configurada
- [ ] Dominios y SSL certificates
- [ ] Cuentas de IA providers configuradas
- [ ] CI/CD pipelines preparados
- [ ] Monitoring stack desplegado

### Configuración por Servicio

- [ ] Environment variables documentadas
- [ ] Secrets management implementado
- [ ] Health checks configurados
- [ ] Circuit breakers implementados
- [ ] Rate limiting configurado
- [ ] CORS apropiadamente configurado

### Testing

- [ ] Unit tests >80% cobertura
- [ ] Integration tests para APIs
- [ ] Load tests con k6
- [ ] Chaos engineering tests
- [ ] Penetration testing

### Documentación

- [ ] API documentation (Swagger)
- [ ] Arquitectura diagrams
- [ ] Deployment guides
- [ ] Troubleshooting guides
- [ ] Runbooks de operación

---

## 🎯 CONCLUSIONES

Esta arquitectura modular nos permitirá:

1. **Escalar horizontalmente** cada servicio independientemente
2. **Reducir costos** mediante caché inteligente y multi-provider IA
3. **Mejorar performance** con optimizaciones específicas por servicio
4. **Aumentar disponibilidad** con failover y circuit breakers
5. **Facilitar mantenimiento** con despliegues independientes

**Próximos pasos:** Implementar Fase 2.1 (Infraestructura Base) inmediatamente para establecer los cimientos de la arquitectura modular.

---

_Documento preparado para Fase 3: Implementación Core con TypeScript y Testing_
