# 🔥 RPG-AI SUPREME - Tareas Pendientes

> **Lista priorizada de todo lo que falta por hacer**  
> **Actualizado:** 25 de Noviembre 2025

---

## 🎯 Sistema de Prioridades

| Icono | Prioridad | Significado            |
| ----- | --------- | ---------------------- |
| 🔴    | CRÍTICO   | Bloquea el lanzamiento |
| 🟡    | ALTO      | Necesario para MVP     |
| 🟢    | MEDIO     | Mejora la experiencia  |
| 🔵    | BAJO      | Nice to have           |

| Icono | Complejidad | Tiempo estimado |
| ----- | ----------- | --------------- |
| ⚡    | Fácil       | < 2 horas       |
| 🔨    | Medio       | 2-8 horas       |
| 🏗️    | Difícil     | 1-3 días        |
| 🏰    | Complejo    | > 3 días        |

---

## 📱 FRONTEND

### Autenticación UI

| #     | Tarea                               | Prioridad | Complejidad | Archivos                     | Estado |
| ----- | ----------------------------------- | --------- | ----------- | ---------------------------- | ------ |
| F-001 | Crear LoginScreen                   | 🔴        | 🔨          | `screens/LoginScreen.tsx`    | ✅     |
| F-002 | Crear RegisterScreen                | 🔴        | 🔨          | `screens/RegisterScreen.tsx` | ✅     |
| F-003 | Crear AuthContext                   | 🔴        | 🔨          | `context/AuthContext.tsx`    | ✅     |
| F-004 | Implementar SecureStore para tokens | 🔴        | ⚡          | `utils/storage.ts`           | ✅     |
| F-005 | Navegación Auth vs App              | 🔴        | ⚡          | `App.tsx`                    | ✅     |

**Detalles F-001: LoginScreen**

```
Componentes:
- Input email con validación
- Input password con toggle visibilidad
- Botón "Iniciar Sesión"
- Link "¿Olvidaste tu contraseña?"
- Link "Crear cuenta"
- Indicador de carga
- Manejo de errores (toast/alert)

Conectar con:
- POST /api/auth/login
- Guardar token en SecureStore
- Navegar a HomeScreen on success
```

---

### Conexión WebSocket

| #     | Tarea                         | Prioridad | Complejidad | Archivos                          | Estado |
| ----- | ----------------------------- | --------- | ----------- | --------------------------------- | ------ |
| F-010 | Cliente Socket.io configurado | 🔴        | 🔨          | `api/socket.ts`                   | ✅     |
| F-011 | Hook useSocket                | 🔴        | 🔨          | `hooks/useSocket.ts`              | ✅     |
| F-012 | SocketContext provider        | 🟡        | 🔨          | `context/SocketContext.tsx`       | 🚧     |
| F-013 | Reconexión automática         | 🟡        | ⚡          | `api/socket.ts`                   | ✅     |
| F-014 | Indicador estado conexión     | 🟢        | ⚡          | `components/ConnectionStatus.tsx` | ❌     |

**Detalles F-010: Cliente Socket.io**

```typescript
// api/socket.ts
import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = async () => {
  const token = await getToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => socket?.disconnect();
```

---

### Game Screen (Pantalla Principal)

| #     | Tarea                       | Prioridad | Complejidad | Archivos                             | Estado |
| ----- | --------------------------- | --------- | ----------- | ------------------------------------ | ------ |
| F-020 | Componente NarrativePanel   | 🔴        | 🏗️          | `components/game/NarrativePanel.tsx` | ✅     |
| F-021 | Componente ActionInput      | 🔴        | 🔨          | `components/game/ActionInput.tsx`    | ✅     |
| F-022 | Componente CharacterHUD     | 🔴        | 🔨          | `components/game/CharacterHUD.tsx`   | ✅     |
| F-023 | Componente ImageViewer      | 🔴        | 🔨          | `components/game/ImageViewer.tsx`    | ✅     |
| F-024 | Componente AIThinking       | 🟡        | ⚡          | `components/game/AIThinking.tsx`     | ✅     |
| F-025 | Integrar todo en GameScreen | 🔴        | 🏗️          | `screens/GameScreen.tsx`             | ✅     |
| F-026 | Quick Actions buttons       | 🟢        | ⚡          | `components/game/QuickActions.tsx`   | ✅     |
| F-027 | Dice roll animation         | 🟢        | 🔨          | `components/game/DiceRoll.tsx`       | ❌     |

**Detalles F-020: NarrativePanel**

```
Features:
- ScrollView con auto-scroll al final
- Mensajes diferenciados (IA vs Sistema vs Resultado)
- Efecto "typing" para respuestas de IA
- Soporte básico markdown (bold, italic)
- Timestamps opcionales
- Copy text on long press

Props:
- messages: Message[]
- isLoading: boolean
- onMessageLongPress: (msg) => void
```

**Detalles F-022: CharacterHUD**

```
Layout:
┌─────────────────────────────────┐
│ [Avatar]  Nombre      Nivel 5   │
│ HP: ████████░░ 80/100           │
│ MP: ████░░░░░░ 40/100           │
│ Status: Saludable               │
│ XP: ████████░░░░░░ 800/1000     │
└─────────────────────────────────┘

Props:
- character: Character
- onPress: () => void (abrir sheet completo)
```

---

### Creación de Personaje

| #     | Tarea                       | Prioridad | Complejidad | Archivos                                | Estado |
| ----- | --------------------------- | --------- | ----------- | --------------------------------------- | ------ |
| F-030 | CharacterCreationScreen     | 🔴        | 🏗️          | `screens/CharacterCreationScreen.tsx`   | ✅     |
| F-031 | Selector de Raza            | 🔴        | 🔨          | `components/creation/RaceSelector.tsx`  | ✅     |
| F-032 | Selector de Clase           | 🔴        | 🔨          | `components/creation/ClassSelector.tsx` | ✅     |
| F-033 | Input de Nombre             | 🔴        | ⚡          | `components/creation/NameInput.tsx`     | ✅     |
| F-034 | Preview de Stats            | 🟡        | 🔨          | `components/creation/StatsPreview.tsx`  | ✅     |
| F-035 | Generar imagen de personaje | 🟡        | 🔨          | Integrar con backend                    | ❌     |

---

### Navegación y Estructura

| #     | Tarea                       | Prioridad | Complejidad | Archivos                   | Estado |
| ----- | --------------------------- | --------- | ----------- | -------------------------- | ------ |
| F-040 | Configurar React Navigation | 🔴        | 🔨          | `navigation/`              | ✅     |
| F-041 | Stack Navigator Auth        | 🔴        | ⚡          | `navigation/AuthStack.tsx` | ✅     |
| F-042 | Tab Navigator Principal     | 🔴        | 🔨          | `navigation/MainTabs.tsx`  | 🚧     |
| F-043 | Stack Navigator Game        | 🟡        | ⚡          | `navigation/GameStack.tsx` | ✅     |

---

### Polish y UX

| #     | Tarea                            | Prioridad | Complejidad | Archivos                            | Estado |
| ----- | -------------------------------- | --------- | ----------- | ----------------------------------- | ------ |
| F-050 | Implementar haptics contextuales | 🟢        | ⚡          | Usar `useGameEffects`               | ✅     |
| F-051 | Loading skeletons                | 🟢        | 🔨          | `components/Skeleton.tsx`           | ✅     |
| F-052 | Animaciones de transición        | 🟢        | 🔨          | Config navigation + components      | ✅     |
| F-053 | Animaciones de dados             | 🟢        | 🔨          | `components/game/DiceRoll.tsx`      | ✅     |
| F-054 | Efectos de combate visuales      | 🟢        | 🔨          | `components/game/CombatEffects.tsx` | ✅     |
| F-055 | Añadir sonidos UI                | 🟢        | ⚡          | Necesita assets `.mp3`              | ❌     |
| F-056 | Screen shake effect              | 🟢        | 🔨          | `hooks/useScreenShake.ts`           | ❌     |
| F-057 | Pull to refresh                  | 🟢        | ⚡          | En listas                           | ❌     |
| F-058 | Empty states diseñados           | 🟢        | ⚡          | `components/ui/EmptyState.tsx`      | ❌     |

---

## 🧠 BACKEND

### Integración Completa

| #     | Tarea                              | Prioridad | Complejidad | Archivos            |
| ----- | ---------------------------------- | --------- | ----------- | ------------------- |
| B-001 | Conectar rutas game con GameEngine | 🔴        | 🏗️          | `routes/game.ts`    |
| B-002 | WebSocket events para game loop    | 🔴        | 🔨          | `websocket/`        |
| B-003 | Endpoint crear nueva sesión        | 🟡        | 🔨          | `routes/session.ts` |
| B-004 | Endpoint listar sesiones usuario   | 🟡        | ⚡          | `routes/session.ts` |
| B-005 | Endpoint continuar sesión          | 🟡        | 🔨          | `routes/session.ts` |

**Detalles B-002: WebSocket Events**

```typescript
// Eventos que el frontend emite:
'game:action' -> { sessionId, action: string }
'game:undo' -> { sessionId }
'game:redo' -> { sessionId }
'session:join' -> { sessionId }
'session:leave' -> { sessionId }

// Eventos que el backend emite:
'game:response' -> { narration, stateChanges, imageTrigger, diceRoll }
'game:error' -> { message, code }
'game:state' -> { fullState } // Al unirse a sesión
'session:playerJoined' -> { player }
'session:playerLeft' -> { playerId }
```

---

### Generación de Imágenes

| #     | Tarea                                | Prioridad | Complejidad | Archivos                       |
| ----- | ------------------------------------ | --------- | ----------- | ------------------------------ |
| B-010 | Integrar DALL-E 3 o Stable Diffusion | 🟡        | 🏗️          | `ai/ImageGenerationService.ts` |
| B-011 | Configurar CDN (Cloudflare R2)       | 🟢        | 🔨          | `services/StorageService.ts`   |
| B-012 | Endpoint para obtener imagen         | 🟡        | ⚡          | `routes/images.ts`             |
| B-013 | Cache de imágenes generadas          | 🟢        | 🔨          | Redis                          |

---

### Testing

| #     | Tarea                      | Prioridad | Complejidad | Archivos                         | Estado |
| ----- | -------------------------- | --------- | ----------- | -------------------------------- | ------ |
| B-020 | Tests unitarios GameEngine | 🟡        | 🏗️          | `game/__tests__/`                | 🚧     |
| B-021 | Tests E2E Auth             | 🟡        | 🔨          | `test/e2e/auth.e2e.test.ts`      | ✅     |
| B-022 | Tests E2E Character        | 🟡        | 🔨          | `test/e2e/character.e2e.test.ts` | ✅     |
| B-023 | Tests E2E Game Flow        | 🟢        | 🏰          | `test/e2e/game-flow.e2e.test.ts` | ✅     |
| B-024 | Tests E2E Premium          | 🟢        | 🔨          | `test/e2e/premium.e2e.test.ts`   | ✅     |
| B-025 | Tests Frontend (RNTL)      | 🟡        | 🏗️          | `apps/frontend/__tests__/`       | ❌     |
| B-026 | Performance Tests (k6)     | 🟢        | 🔨          | `test/performance/`              | ❌     |
| B-027 | Setup Docker Compose Tests | 🟡        | 🔨          | `docker-compose.test.yml`        | ✅     |

**Notas B-021 a B-024:**

- ✅ Tests E2E implementados (53+ tests totales)
- ✅ Docker Compose configurado (MongoDB + Redis + Backend)
- 🚀 CI/CD GitHub Actions implementado
- 📝 Scripts: `test-local.sh` (Linux/Mac), `test-local.ps1` (Windows)

---

### Mejoras de Producción

| #     | Tarea                           | Prioridad | Complejidad | Archivos                |
| ----- | ------------------------------- | --------- | ----------- | ----------------------- |
| B-030 | Rate limiting en Redis          | 🟡        | 🔨          | `gateway/ApiGateway.ts` |
| B-031 | Logging estructurado producción | 🟢        | ⚡          | `logging/`              |
| B-032 | Documentación OpenAPI/Swagger   | 🟢        | 🏗️          | `docs/api/`             |
| B-033 | Health check detallado          | 🟢        | ⚡          | `routes/health.ts`      |
| B-034 | Métricas Prometheus             | 🔵        | 🔨          | `metrics/`              |

---

## 🗄️ BASE DE DATOS

| #     | Tarea                           | Prioridad | Complejidad | Archivos                 |
| ----- | ------------------------------- | --------- | ----------- | ------------------------ |
| D-001 | Ejecutar migraciones            | 🔴        | ⚡          | `npx prisma migrate dev` |
| D-002 | Seed de datos de prueba         | 🟡        | 🔨          | `prisma/seed.ts`         |
| D-003 | Índices para queries frecuentes | 🟢        | ⚡          | `schema.prisma`          |
| D-004 | Backup automatizado             | 🔵        | 🔨          | Infraestructura          |

---

## 🎨 ASSETS

| #     | Tarea                           | Prioridad | Complejidad | Archivos         | Estado |
| ----- | ------------------------------- | --------- | ----------- | ---------------- | ------ |
| A-001 | Sonido: click.mp3               | 🟡        | ⚡          | `assets/sounds/` | ✅     |
| A-002 | Sonido: attack.mp3              | 🟡        | ⚡          | `assets/sounds/` | ✅     |
| A-003 | Sonido: hit.mp3                 | 🟡        | ⚡          | `assets/sounds/` | ✅     |
| A-004 | Sonido: levelup.mp3             | 🟡        | ⚡          | `assets/sounds/` | ✅     |
| A-005 | Sonido: death.mp3               | 🟢        | ⚡          | `assets/sounds/` | ✅     |
| A-006 | Sonido: victory.mp3             | 🟢        | ⚡          | `assets/sounds/` | ✅     |
| A-007 | Música: ambient_exploration.mp3 | 🟢        | 🔨          | `assets/sounds/` | ❌     |
| A-008 | Música: ambient_combat.mp3      | 🟢        | 🔨          | `assets/sounds/` | ❌     |
| A-009 | Logo del juego (vectorial)      | 🟡        | 🔨          | `assets/images/` | ❌     |
| A-010 | Icono de app (1024x1024)        | 🟡        | 🔨          | `assets/`        | ❌     |
| A-011 | Splash screen                   | 🟢        | ⚡          | `assets/`        | ❌     |

**Leyenda Estado:**

- ✅ Completado
- 🚧 En progreso
- 📝 Documentado (listo para descargar)
- ❌ Pendiente

**Fuentes de assets gratuitos:**

- Sonidos: [Freesound.org](https://freesound.org), [OpenGameArt](https://opengameart.org)
- Música: [Kevin MacLeod](https://incompetech.com), [Pixabay](https://pixabay.com/music)
- Iconos: [Game-Icons.net](https://game-icons.net)

---

## 💰 MONETIZACIÓN

| #     | Tarea                                 | Prioridad | Complejidad | Archivos                         | Estado |
| ----- | ------------------------------------- | --------- | ----------- | -------------------------------- | ------ |
| M-001 | UI Suscripción conectada a Stripe     | 🟡        | 🏗️          | `screens/SubscriptionScreen.tsx` | ✅     |
| M-002 | Configurar productos Stripe Dashboard | 🟡        | 🔨          | Dashboard Stripe                 | ✅     |
| M-003 | Visualización de límites de uso       | 🟡        | 🔨          | `components/UsageLimits.tsx`     | ✅     |
| M-004 | Paywall inteligente                   | 🟢        | 🔨          | `components/Paywall.tsx`         | ❌     |
| M-005 | RevenueCat para iOS/Android           | 🟢        | 🏗️          | Configuración SDK                | ❌     |

---

## 📦 TIENDAS

| #     | Tarea                          | Prioridad | Complejidad | Archivos                    |
| ----- | ------------------------------ | --------- | ----------- | --------------------------- |
| S-001 | Política de Privacidad (texto) | 🔴        | 🔨          | `legal/privacy-policy.md`   |
| S-002 | Términos de Servicio (texto)   | 🔴        | 🔨          | `legal/terms-of-service.md` |
| S-003 | Configurar Google Play Console | 🟡        | 🔨          | Dashboard                   |
| S-004 | Configurar App Store Connect   | 🟡        | 🔨          | Dashboard                   |
| S-005 | Screenshots para tiendas       | 🟡        | 🔨          | Marketing                   |
| S-006 | Video trailer                  | 🟢        | 🏰          | Marketing                   |

---

## 📊 Resumen por Módulo

| Módulo              | Total  | 🔴 Crítico | 🟡 Alto | 🟢 Medio | 🔵 Bajo |
| ------------------- | ------ | ---------- | ------- | -------- | ------- |
| Frontend Auth       | 5      | 5          | 0       | 0        | 0       |
| Frontend WebSocket  | 5      | 2          | 2       | 1        | 0       |
| Frontend Game       | 8      | 5          | 1       | 2        | 0       |
| Frontend Creation   | 5      | 4          | 1       | 0        | 0       |
| Frontend Nav        | 4      | 3          | 1       | 0        | 0       |
| Frontend Polish     | 7      | 0          | 0       | 7        | 0       |
| Backend Integration | 5      | 2          | 3       | 0        | 0       |
| Backend Images      | 4      | 0          | 2       | 2        | 0       |
| Backend Testing     | 4      | 0          | 2       | 2        | 0       |
| Backend Production  | 5      | 0          | 1       | 3        | 1       |
| Database            | 4      | 1          | 1       | 1        | 1       |
| Assets              | 11     | 0          | 4       | 7        | 0       |
| Monetización        | 5      | 0          | 3       | 2        | 0       |
| Tiendas             | 6      | 2          | 2       | 2        | 0       |
| **TOTAL**           | **81** | **24**     | **25**  | **30**   | **2**   |
| **COMPLETADAS**     | **49** | **22**     | **19**  | **8**    | **0**   |
| **RESTANTES**       | **32** | **2**      | **6**   | **22**   | **2**   |

---

## 📈 Progreso Reciente

### ✅ Últimas Tareas Completadas (25 Nov 2025)

- ✅ F-001 a F-005: Sistema de Autenticación completo
- ✅ F-010, F-011, F-013: WebSocket configurado con reconexión
- ✅ F-020 a F-026: GameScreen completo con UI mejorada
- ✅ F-030 a F-034: Creación de personajes end-to-end
- ✅ F-040, F-041, F-043: Navegación configurada
- ✅ F-050 a F-054: Polish visual (haptics, skeleton, animaciones, dados, efectos de combate)
- ✅ B-021 a B-024: Tests E2E implementados (auth, character, game-flow, premium)
- ✅ B-027: Docker Compose + CI/CD (GitHub Actions)
- ✅ A-001 a A-006: Audio placeholders implementados + configuración iOS

**🎉 Progreso Total: 49/81 tareas completadas (60%)**

### 🔥 Próximas Prioridades

1. **Tests Frontend RNTL** (B-025) - 🟡 Alto
2. **Performance Tests k6** (B-026) - 🟢 Medio
3. **Música ambiental** (A-007, A-008) - 🟢 Medio
4. **Paywall inteligente** (M-004) - 🟢 Medio

---

## 🎯 Orden de Ejecución Recomendado

### Sprint 1 (Semana 1-2): Conexión Básica

```
F-003 → F-004 → F-001 → F-002 → F-005 → F-010 → F-011 → D-001
```

**Meta:** Usuario puede registrarse, hacer login, y conectar WebSocket.

### Sprint 2 (Semana 3-4): Game Loop

```
F-040 → F-041 → F-042 → F-020 → F-021 → F-022 → F-025 → B-001 → B-002
```

**Meta:** Usuario puede jugar una partida básica.

### Sprint 3 (Semana 5-6): Personajes y Sesiones

```
F-030 → F-031 → F-032 → F-033 → B-003 → B-004 → B-005
```

**Meta:** Usuario puede crear personajes y gestionar partidas.

### Sprint 4 (Semana 7-8): Polish y Assets

```
F-050 → F-051 → F-023 → F-024 → A-001...A-006 → A-009 → A-010
```

**Meta:** El juego se siente y se ve profesional.

### Sprint 5 (Semana 9-10): Monetización y Legal

```
M-001 → M-002 → M-003 → S-001 → S-002 → S-003 → S-004
```

**Meta:** Pagos funcionan, legal listo.

### Sprint 6 (Semana 11-12): Testing y Lanzamiento

```
B-020 → B-021 → S-005 → Soft Launch
```

**Meta:** Estamos en las tiendas.

---

## ✅ Cómo Marcar como Completado

Al completar una tarea:

1. Marca con ✅ en esta lista
2. Actualiza `ESTADO_PROYECTO.md`
3. Añade al `CHANGELOG.md`
4. Commit con mensaje descriptivo

```bash
git commit -m "feat(frontend): F-001 LoginScreen completada

- Input email con validación
- Input password con toggle
- Conexión con API auth
- Manejo de errores

Closes #F-001"
```

---

> 💪 **¡Cada tarea completada nos acerca al sueño!**
