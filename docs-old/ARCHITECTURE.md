# 🏗️ RPG-AI SUPREME - Arquitectura del Sistema

> **Documento técnico de arquitectura**  
> **Versión:** 2.0  
> **Actualizado:** 25 de Noviembre 2025

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Diagrama de Alto Nivel](#diagrama-de-alto-nivel)
3. [Componentes Principales](#componentes-principales)
4. [Flujo Completo del Juego](#flujo-completo-del-juego)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Patrones de Diseño](#patrones-de-diseño)
7. [Seguridad](#seguridad)
8. [Escalabilidad](#escalabilidad)

---

## 🎯 Visión General

RPG-AI Supreme es un sistema distribuido que combina:

- **Frontend móvil** (React Native/Expo) para la interfaz de usuario
- **Backend autoritativo** (Node.js/Fastify) para lógica de juego
- **IA Generativa** (Gemini/GPT) como Game Master
- **Generación de imágenes** (DALL-E/Stable Diffusion) para visuales dinámicos
- **Real-time communication** (Socket.io) para multijugador

**Principio fundamental:** El servidor es la fuente de verdad. El cliente solo renderiza.

---

## 🗺️ Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS                                    │
│                         📱 iOS / Android / Web                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTPS / WSS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           LOAD BALANCER                                  │
│                         (Nginx / Cloudflare)                            │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│      API GATEWAY          │     │     WEBSOCKET SERVER      │
│   (Fastify + Plugins)     │     │      (Socket.io)          │
│                           │     │                           │
│  • Rate Limiting          │     │  • Autenticación JWT      │
│  • Circuit Breaker        │     │  • Salas de juego         │
│  • Request Validation     │     │  • Broadcasting           │
│  • Auth Middleware        │     │  • Eventos real-time      │
└───────────────┬───────────┘     └───────────────┬───────────┘
                │                                 │
                └─────────────┬───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GAME ENGINE                                      │
│                     (GameEngine.ts - 968 líneas)                        │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Command    │  │   State     │  │   Session   │  │    Rules    │    │
│  │  System     │  │   Manager   │  │   Lock      │  │    Engine   │    │
│  │             │  │             │  │   Manager   │  │             │    │
│  │ • Execute   │  │ • Save      │  │             │  │ • Combat    │    │
│  │ • Undo      │  │ • Load      │  │ • Redis     │  │ • Skills    │    │
│  │ • Redo      │  │ • Validate  │  │ • Atomic    │  │ • Dice      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
│    AI GATEWAY         │ │    POSTGRESQL     │ │       REDIS           │
│  (AIGatewayService)   │ │    (Prisma ORM)   │ │                       │
│                       │ │                   │ │  • Session cache      │
│  • Gemini 2.5 Flash   │ │  • Users          │ │  • Rate limiting      │
│  • Fallback GPT-4     │ │  • Characters     │ │  • Pub/Sub            │
│  • Response parsing   │ │  • Sessions       │ │  • Lock management    │
│  • Prompt templates   │ │  • Game States    │ │                       │
└───────────┬───────────┘ └───────────────────┘ └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│   IMAGE GENERATION    │
│                       │
│  • DALL-E 3           │
│  • Stable Diffusion   │
│  • Cloudflare R2 CDN  │
└───────────────────────┘
```

---

## 🧩 Componentes Principales

### 1. Frontend (React Native + Expo)

```
apps/frontend/
├── App.tsx                    # Entry point
├── src/
│   ├── screens/               # Pantallas principales
│   │   ├── GameScreen.tsx     # 🎮 Pantalla de juego
│   │   ├── HomeScreen.tsx     # 🏠 Menú principal
│   │   ├── LoginScreen.tsx    # 🔐 Autenticación
│   │   └── ...
│   ├── components/            # Componentes reutilizables
│   │   ├── game/
│   │   │   ├── NarrativePanel.tsx
│   │   │   ├── ActionInput.tsx
│   │   │   ├── CharacterHUD.tsx
│   │   │   └── ImageViewer.tsx
│   │   └── ui/
│   ├── context/               # Estado global
│   │   ├── AuthContext.tsx
│   │   └── SocketContext.tsx
│   ├── hooks/                 # Custom hooks
│   │   ├── useSocket.ts
│   │   └── useGameEffects.ts
│   └── api/                   # Comunicación con backend
│       ├── client.ts          # HTTP client
│       └── socket.ts          # WebSocket client
```

**Responsabilidades:**

- Renderizar UI responsive
- Gestionar estado local (React Context)
- Comunicación WebSocket con backend
- Feedback sensorial (haptics, audio)
- Almacenamiento seguro de tokens

### 2. Backend (Node.js + Fastify)

```
apps/backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── game/
│   │   ├── GameEngine.ts      # 🧠 Motor principal
│   │   ├── GameService.ts     # Lógica de negocio
│   │   └── SessionLockManager.ts
│   ├── ai/
│   │   └── AIGatewayService.ts # 🤖 Integración IA
│   ├── gateway/
│   │   └── ApiGateway.ts      # 🚪 Gateway con protecciones
│   ├── services/
│   │   ├── AuthenticationService.ts
│   │   ├── StripeService.ts
│   │   └── PremiumService.ts
│   ├── routes/                # Endpoints REST
│   └── websocket/             # Handlers Socket.io
```

**Responsabilidades:**

- Lógica de juego autoritativa
- Autenticación y autorización
- Comunicación con servicios de IA
- Persistencia de datos
- Gestión de sesiones real-time

### 3. AI Gateway

```typescript
// Estructura de respuesta de la IA
interface AIResponse {
  narration: string; // Texto narrativo
  stateChanges: {
    hp?: number;
    mana?: number;
    inventory?: InventoryChange[];
    location?: string;
    status?: string;
    xp?: number;
  };
  imageTrigger?: {
    generate: boolean;
    prompt: string;
    style: 'fantasy' | 'dark' | 'epic';
  };
  diceRoll?: {
    type: 'd20' | 'd6' | 'd100';
    value: number;
    modifier: number;
    success: boolean;
    criticalHit?: boolean;
    criticalFail?: boolean;
  };
}
```

### 4. Base de Datos (PostgreSQL + Prisma)

```prisma
// Modelos principales
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  role          Role      @default(FREE)
  characters    Character[]
  sessions      Session[]
  subscription  Subscription?
}

model Character {
  id          String    @id @default(uuid())
  name        String
  race        String
  class       String
  level       Int       @default(1)
  xp          Int       @default(0)
  hp          Int
  maxHp       Int
  mana        Int
  maxMana     Int
  attributes  Json      // {strength, dexterity, etc.}
  skills      Json
  inventory   Inventory[]
  userId      String
  user        User      @relation(fields: [userId], references: [id])
}

model Session {
  id          String      @id @default(uuid())
  status      SessionStatus
  gameState   Json
  history     Json        // Array de eventos
  userId      String
  characterId String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

---

## 🔄 Flujo Completo del Juego

### Diagrama de Secuencia: Acción del Jugador

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  USUARIO │     │ FRONTEND │     │ WEBSOCKET│     │  GAME    │     │    IA    │
│          │     │          │     │  SERVER  │     │  ENGINE  │     │  GEMINI  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ 1. Escribe     │                │                │                │
     │ "Ataco al      │                │                │                │
     │  dragón"       │                │                │                │
     │───────────────▶│                │                │                │
     │                │                │                │                │
     │                │ 2. emit        │                │                │
     │                │ 'game:action'  │                │                │
     │                │───────────────▶│                │                │
     │                │                │                │                │
     │                │                │ 3. Validar     │                │
     │                │                │ sesión + auth  │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │                │                │                │ 4. Construir   │
     │                │                │                │ contexto +     │
     │                │                │                │ prompt         │
     │                │                │                │───────────────▶│
     │                │                │                │                │
     │                │                │                │ 5. Generar     │
     │                │                │                │◀───────────────│
     │                │                │                │ respuesta JSON │
     │                │                │                │                │
     │                │                │                │ 6. Procesar    │
     │                │                │                │ stateChanges   │
     │                │                │                │ + diceRoll     │
     │                │                │                │                │
     │                │                │ 7. Persistir   │                │
     │                │                │◀───────────────│                │
     │                │                │ estado         │                │
     │                │                │                │                │
     │                │ 8. emit        │                │                │
     │                │ 'game:response'│                │                │
     │                │◀───────────────│                │                │
     │                │                │                │                │
     │ 9. Renderizar  │                │                │                │
     │ narración +    │                │                │                │
     │ actualizar HUD │                │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
     │ 10. Haptic     │                │                │                │
     │ feedback       │                │                │                │
     │◀───────────────│                │                │                │
```

### Eventos WebSocket

```typescript
// Cliente → Servidor
socket.emit('game:action', {
  sessionId: 'uuid',
  action: 'Ataco al dragón con mi espada de fuego',
  quickAction?: 'attack' | 'defend' | 'flee' | 'talk'
});

socket.emit('game:undo', { sessionId: 'uuid' });
socket.emit('game:redo', { sessionId: 'uuid' });
socket.emit('session:join', { sessionId: 'uuid' });
socket.emit('session:leave', { sessionId: 'uuid' });

// Servidor → Cliente
socket.emit('game:response', {
  narration: 'Tu espada de fuego brilla intensamente...',
  stateChanges: { hp: -15, xp: +50 },
  diceRoll: { type: 'd20', value: 18, success: true },
  imageTrigger: { generate: true, prompt: '...' }
});

socket.emit('game:image', {
  url: 'https://cdn.rpgai.com/images/xxx.png',
  prompt: 'Dragon battle scene...'
});

socket.emit('game:error', {
  code: 'INVALID_ACTION',
  message: 'No puedes atacar mientras estás paralizado'
});

socket.emit('session:playerJoined', { player: {...} });
socket.emit('session:playerLeft', { playerId: 'uuid' });
```

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología       | Propósito       | Justificación                   |
| ---------------- | --------------- | ------------------------------- |
| React Native     | Framework móvil | Cross-platform, gran ecosistema |
| Expo             | Tooling         | Desarrollo rápido, OTA updates  |
| TypeScript       | Lenguaje        | Type safety, mejor DX           |
| Socket.io-client | Real-time       | Reconexión automática           |
| React Navigation | Navegación      | Estándar de industria           |
| Reanimated       | Animaciones     | 60fps nativo                    |
| RevenueCat       | IAP             | Simplifica monetización         |

### Backend

| Tecnología | Propósito     | Justificación                    |
| ---------- | ------------- | -------------------------------- |
| Node.js    | Runtime       | Non-blocking I/O para real-time  |
| Fastify    | Framework     | 2x más rápido que Express        |
| TypeScript | Lenguaje      | Consistencia con frontend        |
| Socket.io  | WebSocket     | Fallbacks, rooms, namespaces     |
| Prisma     | ORM           | Type-safe queries, migraciones   |
| PostgreSQL | Base de datos | ACID, JSON support, escalable    |
| Redis      | Cache         | Sessions, rate limiting, pub/sub |

### IA y Media

| Tecnología       | Propósito     | Justificación                 |
| ---------------- | ------------- | ----------------------------- |
| Gemini 2.5 Flash | LLM principal | Costo/calidad óptimo          |
| GPT-4            | LLM fallback  | Mayor calidad si falla Gemini |
| DALL-E 3         | Imágenes      | Mejor calidad texto-a-imagen  |
| Cloudflare R2    | CDN           | S3 compatible, económico      |

---

## 🔐 Seguridad

### Autenticación

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO DE AUTH                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Login (email + password)                            │
│     └─▶ bcrypt.compare (12 rounds)                      │
│     └─▶ Generar JWT (15min) + Refresh Token (7d)        │
│                                                          │
│  2. Request con JWT                                      │
│     └─▶ Verificar firma                                 │
│     └─▶ Verificar expiración                            │
│     └─▶ Extraer userId del payload                      │
│                                                          │
│  3. Token expirado                                       │
│     └─▶ Usar Refresh Token                              │
│     └─▶ Generar nuevo par de tokens                     │
│     └─▶ Invalidar refresh token usado                   │
│                                                          │
│  4. MFA (opcional)                                       │
│     └─▶ TOTP con speakeasy                              │
│     └─▶ 6 dígitos, 30 segundos                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Protecciones API Gateway

- **Rate Limiting:** 100 req/min por IP, 1000 req/min por usuario
- **Circuit Breaker:** Corta conexión a servicios caídos
- **Input Validation:** Sanitización de todas las entradas
- **SQL Injection:** Prevenido por Prisma ORM
- **XSS:** Headers de seguridad, escape de output

---

## 📈 Escalabilidad

### Fase 1: MVP (1-1,000 usuarios)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│   (Expo)     │     │  (1 instancia)│    │  (1 instancia)│
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │  (1 instancia)│
                     └──────────────┘
```

### Fase 2: Crecimiento (1,000-100,000 usuarios)

```
                     ┌──────────────┐
                     │ Load Balancer │
                     └──────┬───────┘
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Backend  │  │ Backend  │  │ Backend  │
       │    #1    │  │    #2    │  │    #3    │
       └────┬─────┘  └────┬─────┘  └────┬─────┘
            └─────────────┼─────────────┘
                          ▼
       ┌──────────────────────────────────────┐
       │           Redis Cluster              │
       │  (Pub/Sub para WebSocket sync)       │
       └──────────────────────────────────────┘
                          │
                          ▼
       ┌──────────────────────────────────────┐
       │      PostgreSQL (Read Replicas)      │
       └──────────────────────────────────────┘
```

### Fase 3: Escala (100,000+ usuarios)

- Kubernetes para orquestación
- Auto-scaling basado en carga
- CDN global para assets
- Database sharding si necesario
- Multi-region deployment

---

## 🎨 Patrones de Diseño Utilizados

### 1. Command Pattern (GameEngine)

```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

class AttackCommand implements Command {
  constructor(
    private target: Enemy,
    private character: Character
  ) {}

  async execute() {
    // Ejecutar ataque
  }

  async undo() {
    // Revertir ataque
  }
}
```

### 2. Repository Pattern (Data Access)

```typescript
class CharacterRepository {
  async findById(id: string): Promise<Character | null>;
  async save(character: Character): Promise<Character>;
  async delete(id: string): Promise<void>;
}
```

### 3. Gateway Pattern (AI Services)

```typescript
class AIGateway {
  async generateResponse(prompt: string): Promise<AIResponse> {
    try {
      return await this.gemini.generate(prompt);
    } catch (error) {
      return await this.gpt4.generate(prompt); // Fallback
    }
  }
}
```

### 4. Observer Pattern (WebSocket Events)

```typescript
socket.on('game:action', (data) => {
  gameEngine.process(data);
});

gameEngine.on('stateChanged', (newState) => {
  socket.emit('game:response', newState);
});
```

---

## 📝 Decisiones de Diseño

### ¿Por qué WebSocket y no solo REST?

- Latencia crítica para juego real-time
- Servidor puede pushear eventos (imágenes generadas)
- Multiplayer requiere sincronización instantánea

### ¿Por qué servidor autoritativo?

- Previene trampas (el cliente no puede modificar HP)
- Estado consistente entre jugadores
- IA siempre tiene contexto completo

### ¿Por qué Gemini como LLM principal?

- Mejor relación costo/calidad para volumen alto
- Respuestas estructuradas JSON nativas
- Contexto largo (1M tokens)
- Fallback a GPT-4 para casos edge

### ¿Por qué Event Sourcing para partidas?

- Replay completo de partidas
- Undo/Redo trivial
- Debug y análisis de comportamiento
- Consistencia garantizada

---

## 🔗 Referencias

- [GDD - Game Design Document](./GDD.md)
- [Tech Stack Detallado](./TECH_STACK.md)
- [Estado del Proyecto](./ESTADO_PROYECTO.md)
- [Tareas Pendientes](./TAREAS_PENDIENTES.md)
