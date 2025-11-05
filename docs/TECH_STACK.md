# Stack Tecnológico — Decisiones y Justificación

**Versión**: 0.3  
**Última Actualización**: 2025-05-11  
**Estado**: Decisión Final — Ready for Implementation

---

## 🎯 Objetivo del Stack

Construir un RPG narrativo multiplataforma (iOS, Android, Web, Desktop) con:
- **Experiencia de usuario premium**: 60fps, animaciones fluidas, gestos nativos, feedback visual instantáneo.
- **Desarrollo cloud-first**: Optimizado para GitHub Codespaces y workflows sin máquinas potentes.
- **Escalabilidad**: Desde MVP single-player hasta MMO con miles de partidas concurrentes.
- **Mantenibilidad**: Codebase única, TypeScript strict, arquitectura modular.
- **Costos controlados**: Infraestructura serverless/edge donde aplique, caching agresivo de LLM.

---

## 📱 Frontend — React Native + Expo

### Decisión: Expo Managed Workflow

**Por qué React Native:**
- **Multiplataforma real**: Un código base para iOS, Android, Web (react-native-web) y Desktop (vía Electron/Tauri).
- **Ecosistema maduro**: Miles de librerías, patrones establecidos, gran comunidad.
- **Rendimiento nativo**: Componentes nativos reales, no webviews.
- **Hot reload rápido**: Ciclos de desarrollo de segundos, no minutos.
- **JavaScript/TypeScript**: Permite compartir lógica entre frontend y backend.

**Por qué Expo Managed (vs Bare React Native):**
- **EAS Build**: Builds nativos en la nube sin Xcode/Android Studio local.
- **Expo Go**: Testing instantáneo en dispositivos físicos sin builds.
- **Over-the-air updates**: Desplegar fixes y features sin pasar por review de stores.
- **APIs unificadas**: Cámara, notificaciones, audio, persistencia — todo con APIs consistentes.
- **Desarrollo cloud-friendly**: Expo Tunnel permite conectar dispositivos a Codespaces sin configuración de red.

**Por qué React Native Web:**
- Permite desarrollo completo en navegador dentro de Codespaces.
- Web build funcional para jugadores que prefieren navegador.
- Misma UI/UX que mobile — no "versión web separada".

**Alternativas consideradas y descartadas:**
- **Flutter**: Excelente framework, pero desarrollo en Codespaces más limitado (emuladores difíciles de correr en cloud), y ecosistema de librerías de juego/animación menos maduro que RN.
- **Unity/Godot**: Overkill para un juego 2D narrativo; harder para desarrollo web y mobile simultáneo; ciclos de iteración más lentos.
- **Web pura (React)**: No proporciona experiencia nativa en mobile; gestos y animaciones limitados; no acceso a APIs nativas sin workarounds.

---

### Librerías Frontend Clave

#### Rendering & Gráficos
- **react-native-skia**: Canvas 2D de alto rendimiento basado en Skia (mismo engine que Chrome/Android).
  - Uso: HUD custom, efectos de partículas, mapas 2D, transiciones.
  - Por qué: 60fps garantizado, control total de rendering, shaders custom.
  - Alternativa descartada: react-native-svg (menos performante para animaciones complejas).

- **expo-gl + react-three-fiber** (opcional para v2.0+):
  - Uso: Escenas 3D, visualización de mazmorras en 3D.
  - Por qué: Permite evolucionar a 3D sin cambiar de stack.

#### Animaciones
- **react-native-reanimated 2+**: Animaciones que corren en UI thread nativo.
  - Uso: Todas las animaciones de UI — transiciones, feedback, parallax.
  - Por qué: 60fps sin bloquear JS thread; declarativo; worklets permiten lógica compleja en nativo.
  - Alternativa descartada: Animated API (menos performante, no corre en UI thread).

- **lottie-react-native**: Animaciones vectoriales exportadas desde After Effects.
  - Uso: Animaciones de feedback (éxito/fallo), iconos animados, efectos de aparición.
  - Por qué: Animaciones complejas sin costo de desarrollo; archivos pequeños.

#### Gestos
- **react-native-gesture-handler**: Gestos nativos con latencia mínima.
  - Uso: Swipes, pinch-to-zoom en mapas, long-press en objetos, drag-and-drop.
  - Por qué: Performance nativa; soporte para gestos complejos; integración perfecta con Reanimated.

#### Navegación
- **@react-navigation/native**: Stack, tabs, drawer navigation.
  - Uso: Navegación entre pantallas (menú, juego, inventario, configuración).
  - Por qué: Estándar de la industria; transiciones customizables; integración con deep linking.

#### Estado Global
- **Zustand**: State management minimalista.
  - Uso: Estado de personaje, sesión actual, configuración, cache de imágenes.
  - Por qué: Simple, TypeScript-first, menos boilerplate que Redux, hooks nativos.
  - Alternativa: Redux Toolkit (más verboso pero válido si el equipo lo prefiere).

#### Networking
- **socket.io-client**: WebSockets con fallback automático.
  - Uso: Comunicación en tiempo real con servidor authoritative (acciones, estado, multijugador).
  - Por qué: Robusto, reconexión automática, rooms nativos para multijugador.
  - Alternativa descartada: ws nativo (menos features, sin fallback).

- **@tanstack/react-query**: Data fetching, caching, sincronización.
  - Uso: Queries a API REST (imágenes, metadatos, campañas guardadas).
  - Por qué: Caching automático, retry logic, invalidación inteligente.

#### Audio
- **expo-av**: Reproducción de audio/video.
  - Uso: Música ambiente, efectos de sonido, TTS (v2.0).
  - Por qué: API simple, cross-platform, streaming.

---

## 🖥️ Backend — Node.js + TypeScript

### Decisión: Fastify + Socket.io

**Por qué Node.js:**
- Comparte lenguaje (TypeScript) con frontend → menos context switching.
- Ecosistema enorme de librerías (validación, auth, queues, DB clients).
- Excelente para I/O intensivo (llamadas a LLM, DB, generación de imágenes).
- Serverless-friendly (AWS Lambda, Vercel Functions, Cloudflare Workers).

**Por qué Fastify (vs Express):**
- **2x más rápido** que Express en benchmarks.
- **TypeScript first-class**: Tipos automáticos en request/response.
- **Schema validation built-in**: JSON Schema para validar payloads automáticamente.
- **Plugin architecture**: Modular, fácil de testear y extender.
- Alternativa descartada: Express (más lento, menos features modernos); NestJS (overkill para MVP, demasiado opinado).

**Por qué Socket.io (vs WebSockets puros):**
- **Fallback automático** a HTTP long-polling si WebSocket falla.
- **Rooms y namespaces** nativos para multijugador.
- **Reconexión automática** con backoff.
- **Mensajes tipados** (TypeScript).

**Alternativa Backend considerada:**
- **Rust (actix/tokio)**: Mejor performance, pero ciclos de desarrollo más lentos y curva de aprendizaje. Reservado para v2.0+ si necesitamos escalar a >10k partidas concurrentes.

---

### Librerías Backend Clave

#### Base de Datos
- **MongoDB + Mongoose**: Document DB para partidas, personajes, sesiones.
  - Por qué: Schema flexible (JSON nativo), fácil de escalar horizontalmente, queries rápidas.
  - Alternativa: PostgreSQL (válida si necesitamos relaciones complejas; MongoDB preferida para MVP por velocidad de desarrollo).

- **Pinecone / Weaviate**: Vector Database para memoria semántica.
  - Uso: Recordar eventos pasados de campañas, buscar contexto relevante.
  - Por qué: Embeddings de OpenAI + búsqueda vectorial = memoria de largo plazo para IA-DJ.

#### Colas de Trabajo
- **BullMQ**: Job queues basadas en Redis.
  - Uso: Generación de imágenes (asíncrona), procesamiento de audio, triggers de eventos.
  - Por qué: Robusto, retry logic, prioridades, scheduled jobs.

#### AI Integration
- **OpenAI SDK**: Cliente oficial para GPT-4 y DALL-E.
  - Uso: Llamadas a LLM para narración, resolución de acciones, generación de prompts de imagen.
  - Por qué: Oficial, bien mantenido, tipado, streaming.

- **LangChain (opcional)**: Framework para apps LLM.
  - Uso: Chains complejos (memoria + herramientas + RAG).
  - Por qué: Simplifica prompts complejos, integración con Vector DB.
  - Nota: Evaluar en v1.5+; para MVP puede ser overkill.

#### Validación & Seguridad
- **Zod**: Schema validation TypeScript-first.
  - Uso: Validar inputs de usuarios, responses de APIs, configuración.
  - Por qué: Type inference automático, composable, excelentes mensajes de error.

- **helmet**: Security headers.
- **rate-limiter-flexible**: Rate limiting para prevenir abuso de LLM.

---

## 🤖 AI & Generación de Contenido

### LLM: OpenAI GPT-4o / GPT-4.1

**Por qué GPT-4:**
- **Mejor seguimiento de instrucciones**: Crucial para que IA-DJ siga reglas de juego.
- **Context window grande** (128k tokens): Permite incluir historia completa de la partida.
- **Function calling**: Para triggers estructurados (generar imagen, cambiar estado).
- **Precio/performance**: Balance ideal para MVP.

**Alternativas consideradas:**
- Claude 3 Opus: Excelente en narrativa, pero API menos madura y más costosa.
- Llama 3 (self-hosted): Costos menores a largo plazo, pero latencia y complejidad de infra.

### Generación de Imágenes: OpenAI DALL-E 3 / Stable Diffusion

**Estrategia híbrida:**
- **DALL-E 3** para MVP: Mejor calidad out-of-the-box, menos prompt engineering.
- **Stable Diffusion (self-hosted o Replicate)** para v1.5+: Menor costo por imagen, control total, fine-tuning posible.

**Optimización de costos:**
- **Caching de imágenes**: Guardar imágenes generadas en CDN (Cloudflare R2 / AWS S3).
- **Reuso inteligente**: IA-DJ puede sugerir imágenes ya generadas si la escena es similar.
- **Generación selectiva**: No generar imagen en cada acción — solo momentos clave definidos por triggers.

### Text-to-Speech (v2.0): Azure / Google Cloud TTS

**Por qué no en MVP:**
- Costos adicionales.
- Complejidad de sincronización voz-texto.
- Prioridad menor para validación de concepto.

**Roadmap v2.0:**
- Voces personalizadas para IA-DJ (tono grave/místico).
- Voces diferenciadas para NPCs.
- Subtítulos sincronizados.

---

## 🏗️ Infraestructura & DevOps

### Hosting

#### Frontend
- **Vercel** (web build): Edge deployment, CDN global, preview deployments automáticos.
- **Expo EAS Hosting** (alternativa): Hosting oficial de Expo.

#### Backend
- **Fly.io** (recomendado para MVP): 
  - Deploy simple, escalado automático, regiones globales.
  - PostgreSQL y Redis managed incluidos.
  - Pricing predecible.
- **Alternativas**: Railway, Render, DigitalOcean App Platform.

#### Base de Datos
- **MongoDB Atlas**: Free tier suficiente para MVP, escalado automático.
- **Pinecone**: Free tier 1GB (suficiente para 1000 partidas).

#### Assets (imágenes generadas)
- **Cloudflare R2**: S3-compatible, sin costos de egress, CDN integrado.

### CI/CD

#### GitHub Actions Workflows
1. **Lint & Test**: ESLint, Prettier, Jest en cada PR.
2. **Preview Build**: EAS Build de preview en cada PR a main.
3. **Production Deploy**: 
   - Frontend: Vercel auto-deploy en merge a main.
   - Backend: Fly.io auto-deploy en merge a main.
4. **Release Build**: EAS Submit a App Store / Play Store en tags.

### Observabilidad
- **Sentry**: Error tracking y performance monitoring (frontend + backend).
- **LogRocket** (opcional): Session replay para debugging de UX.
- **Datadog / Better Stack** (v1.5+): Logs centralizados, métricas de infra.

---

## 🧪 Testing Strategy

### Testing sin Emuladores (Cloud-Friendly)

**Desarrollo en Codespaces:**
1. **Desarrollo web primero**: `expo start --web` en Codespaces → iterar UI en navegador.
2. **Testing en dispositivo físico**: `expo start --tunnel` → escanear QR con Expo Go.
3. **Builds remotos**: EAS Build para testing nativo cuando sea necesario.

**Testing Automatizado:**
- **Unit tests (Jest)**: Lógica de juego, resolución de acciones, parsers.
- **Integration tests**: API endpoints, flujos de DB, integración LLM (con mocks).
- **E2E web (Playwright)**: Flujos críticos en web build.
- **E2E mobile (Detox)**: Flujos críticos en builds nativos (CI en Expo EAS).

**Testing Manual:**
- **TestFlight (iOS)** y **Google Play Internal Testing (Android)**: Distribución a beta testers.
- **Expo Updates**: Pushear fixes instantáneamente sin rebuild.

---

## 🔐 Seguridad & Privacidad

### Inputs de Usuario
- **Validación server-side**: Nunca confiar en cliente.
- **Rate limiting**: Máximo N acciones por minuto por usuario.
- **Content moderation**: Filtrar inputs antes de enviar a LLM (profanity, prompts adversariales).

### API Keys
- **Nunca en cliente**: Todas las llamadas a LLM/imagen desde backend.
- **Rotation automática**: Keys rotadas cada 90 días.
- **Secrets management**: GitHub Secrets para CI/CD, Doppler/Vault para producción.

### Datos de Usuario
- **Encriptación en reposo**: MongoDB encryption at rest.
- **GDPR compliance**: Export y delete de datos de usuario.
- **Anonimización**: Partidas guardadas sin PII.

---

## 💰 Estimación de Costos (MVP — 1000 usuarios activos)

| Servicio | Uso Estimado | Costo Mensual |
|----------|--------------|---------------|
| OpenAI GPT-4 | 1M tokens/día | ~$300 |
| OpenAI DALL-E 3 | 10k imágenes/mes | ~$200 |
| Fly.io (backend) | 2 VMs + Redis | ~$30 |
| MongoDB Atlas | Tier gratuito | $0 |
| Cloudflare R2 | 100GB storage + egress | ~$5 |
| Expo EAS | Build + hosting | ~$29 |
| Sentry | Free tier | $0 |
| **Total** | | **~$564/mes** |

**Optimizaciones para reducir costos:**
- Caching agresivo de respuestas LLM (70% de ahorro).
- Throttling de generación de imágenes (50% de ahorro).
- Fine-tuned model para v1.5+ (40% de ahorro en LLM).
- Self-hosted Stable Diffusion (90% de ahorro en imágenes).

---

## 🔄 Alternativas Futuras

### Si necesitamos más performance (v2.0+)
- **Backend en Rust**: Reescribir core engine en Rust para 10x throughput.
- **Edge computing**: Cloudflare Workers para baja latencia global.
- **GraphQL**: Reemplazar REST para queries más eficientes.

### Si necesitamos más control sobre IA
- **Self-hosted LLM**: Llama 3, Mistral en GPUs propios.
- **Fine-tuning**: Modelo específico entrenado en partidas reales.
- **Hybrid approach**: LLM local para acciones simples, GPT-4 para momentos críticos.

---

## 📊 Matriz de Decisiones (Resumen)

| Criterio | React Native + Expo | Flutter | Unity | Web Puro |
|----------|---------------------|---------|-------|----------|
| Desarrollo Cloud-Friendly | ✅✅✅ | ⚠️ | ❌ | ✅✅ |
| Performance Nativo | ✅✅ | ✅✅✅ | ✅✅✅ | ⚠️ |
| Multiplataforma Real | ✅✅✅ | ✅✅✅ | ✅✅ | ⚠️ |
| Ecosistema de Librerías | ✅✅✅ | ✅✅ | ✅✅✅ | ✅✅ |
| Curva de Aprendizaje | ✅✅ | ⚠️ | ❌ | ✅✅✅ |
| Compartir Código Frontend/Backend | ✅✅✅ | ❌ | ❌ | ✅✅✅ |
| Animaciones/Gestos | ✅✅ | ✅✅✅ | ✅✅✅ | ⚠️ |
| Costo de Desarrollo | ✅✅✅ | ✅✅ | ⚠️ | ✅✅✅ |

**Leyenda**: ✅✅✅ Excelente | ✅✅ Bueno | ✅ Aceptable | ⚠️ Limitaciones | ❌ No recomendado

---

## ✅ Conclusión

El stack **React Native + Expo + Node.js + TypeScript** proporciona el balance óptimo entre:
- Velocidad de desarrollo (crítico para MVP).
- Experiencia de usuario premium (animaciones, gestos, rendimiento).
- Desarrollo cloud-friendly (Codespaces + EAS).
- Multiplataforma real sin sacrificios.
- Costos controlados (infraestructura serverless, caching inteligente).

Este stack está validado por miles de apps en producción (Discord, Shopify, Coinbase) y permite escalar desde MVP hasta millones de usuarios sin reescribir la aplicación.