# RPG AI — TTRPG Narrativo Guiado por Inteligencia Artificial

**Versión:** 0.3 (Especificación Técnica Definitiva)  
**Stack Principal:** React Native + Expo + Node.js + TypeScript  
**Estado:** Documentación completa — Listo para desarrollo

---

## 🎯 Visión del Proyecto

RPG AI es un juego de rol de mesa digital (TTRPG) donde la Inteligencia Artificial actúa como Director de Juego (DJ). No es un generador de historias ni un chatbot — es un **juego completo** con mecánicas reales, resolución de acciones basada en estadísticas, generación visual dinámica y una experiencia de usuario diseñada para sentirse como un videojuego premium, no como una aplicación de chat.

### Diferenciadores Clave

- **Mecánicas de Juego Reales**: Sistema de resolución de acciones basado en atributos, habilidades y RNG reproducible (seedable).
- **Interfaz de Juego Premium**: HUD, animaciones, gestos, efectos visuales — diseñado como un juego AAA mobile/desktop, no como una aplicación de mensajería.
- **Narrativa Emergente Visual**: Cada momento importante genera arte conceptual mediante IA; la narrativa se presenta de forma cinemática.
- **Multiplataforma Nativo**: Una única base de código para iOS, Android, Web y Desktop (Tauri/Electron).
- **Experiencia Sin Preparación**: Sin necesidad de configurar campañas, preparar material o tener un DJ humano disponible.

---

## 📦 Stack Tecnológico (Decisión Final)

### Frontend — Aplicación del Juego
- **React Native (Expo Managed Workflow)**: Framework principal para desarrollo multiplataforma.
- **React Native Web**: Compilación a web sin modificaciones de código.
- **TypeScript**: Lenguaje obligatorio para todo el proyecto.
- **React Native Reanimated 2+**: Animaciones de alto rendimiento (60fps).
- **React Native Skia**: Rendering 2D avanzado para HUD, efectos, mapas y elementos gráficos custom.
- **React Native Gesture Handler**: Gestos nativos para interacciones táctiles fluidas.
- **React Navigation**: Navegación y gestión de pantallas.
- **Zustand / Redux Toolkit**: Estado global de la aplicación.
- **Socket.io Client**: Comunicación en tiempo real con el servidor authoritative.
- **Expo AV**: Reproducción de audio ambiente, efectos de sonido y TTS.
- **Lottie React Native**: Animaciones vectoriales para feedback visual.

### Backend — Servidor Authoritative
- **Node.js + TypeScript**: Runtime y lenguaje.
- **Fastify**: Framework HTTP de alto rendimiento.
- **Socket.io**: WebSockets para estado en tiempo real y multijugador.
- **MongoDB**: Base de datos principal para sesiones, personajes y partidas.
- **Pinecone / Weaviate**: Vector Database para memoria semántica y contexto de largo plazo.
- **Bull / BullMQ**: Cola de trabajos para generación de imágenes y procesamiento asíncrono.

### AI & Generación de Contenido
- **OpenAI GPT-4o / GPT-4.1**: LLM para la IA-DJ (narración, resolución, contexto).
- **OpenAI DALL-E / Stable Diffusion API**: Generación de imágenes.
- **Azure/Google TTS**: Text-to-Speech para narración de voz (opcional v2.0).

### Infraestructura & DevOps
- **GitHub Codespaces**: Entorno de desarrollo principal en la nube.
- **Expo EAS Build**: Builds nativos en la nube (iOS/Android).
- **Expo EAS Submit**: Publicación automatizada a App Store / Play Store.
- **Vercel / Netlify**: Deploy del frontend web.
- **Fly.io / Railway / DigitalOcean**: Deploy del backend authoritative.
- **GitHub Actions**: CI/CD para testing, linting y deployments.
- **Sentry**: Observabilidad y error tracking.

### Testing & Calidad
- **Jest / Vitest**: Tests unitarios.
- **Detox**: Tests E2E para React Native.
- **Playwright**: Tests E2E para web.
- **ESLint + Prettier**: Linting y formateo.
- **TypeScript Strict Mode**: Type safety máxima.

---

## 🗂️ Estructura del Repositorio

```
rpg-ai/
├── .devcontainer/           # Configuración de GitHub Codespaces
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   └── ISSUE_TEMPLATE/      # Plantillas de issues
├── docs/                    # Documentación técnica exhaustiva
│   ├── GDD.md              # Game Design Document completo
│   ├── TECH_STACK.md       # Justificación y detalles del stack
│   ├── ARCHITECTURE.md     # Arquitectura de sistemas
│   ├── MVP_SPEC.md         # Especificación técnica del MVP
│   ├── UI_UX_GUIDELINES.md # Guías de diseño visual y experiencia
│   ├── AI_DJ_SPEC.md       # Especificación del sistema IA-DJ
│   └── DEPLOYMENT.md       # Guías de despliegue
├── system_prompts/          # Prompts de sistema para IA-DJ
├── src/
│   ├── app/                # Aplicación React Native (Expo)
│   │   ├── screens/        # Pantallas del juego
│   │   ├── components/     # Componentes UI reutilizables
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── services/       # Servicios (API, WebSocket)
│   │   ├── types/          # TypeScript types & interfaces
│   │   └── utils/          # Utilidades y helpers
│   └── server/             # Backend Node.js
│       ├── controllers/    # Lógica de endpoints
│       ├── services/       # Lógica de negocio
│       ├── models/         # Modelos de datos
│       ├── ai/             # Integración con LLM e imagen
│       └── game/           # Motor de juego (resolución, RNG)
├── assets/                  # Assets estáticos (fuentes, iconos, SFX)
├── package.json
├── tsconfig.json
├── app.json                # Configuración de Expo
└── README.md
```

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 20+ 
- pnpm (obligatorio - versión 9.12.0)
- MongoDB (local o MongoDB Atlas)
- Cuenta de Expo (gratuita, opcional)
- GitHub Codespaces habilitado (opcional pero recomendado)

> **Nota**: Este proyecto usa pnpm workspaces. El soporte para yarn está planificado pero actualmente solo pnpm está completamente soportado.

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/tiagofur/rpg-ai.git
cd rpg-ai

# Habilitar corepack y instalar dependencias
corepack enable
pnpm install

# Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env con tu configuración

# Generar Prisma client
pnpm prisma:generate

# Iniciar backend
pnpm dev:backend

# En otra terminal, iniciar frontend (web)
pnpm dev:frontend:web
```

**📖 Guía completa**: Ver [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) para instrucciones detalladas.

### Desarrollo en Codespaces

1. Abrir repositorio en GitHub
2. Click en "Code" → "Codespaces" → "Create codespace on main"
3. Esperar inicialización automática del devcontainer
4. El entorno se configurará automáticamente con:
   - Node.js 20
   - pnpm instalado y configurado
   - Dependencias instaladas
   - Prisma client generado
   - VS Code con extensiones recomendadas

#### Ejecutar la aplicación en Codespaces

```bash
# Iniciar backend (Terminal 1)
pnpm dev:backend

# Iniciar frontend web (Terminal 2)
pnpm dev:frontend:web
```

**📖 Ver más**: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) y [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

---

## 📚 Documentación Completa

### Para Desarrolladores
- **[Development Setup Guide](docs/DEVELOPMENT_SETUP.md)**: Guía completa de configuración del entorno de desarrollo.
- **[Environment Variables](docs/ENVIRONMENT_VARIABLES.md)**: Documentación de variables de entorno.
- **[Game Design Document (GDD)](docs/GDD.md)**: Diseño completo del juego, mecánicas, pilares y visión.
- **[Stack Tecnológico](docs/TECH_STACK.md)**: Justificación detallada de cada decisión técnica.
- **[Arquitectura de Sistemas](docs/ARCHITECTURE.md)**: Diagramas, flujos de datos y componentes.
- **[Especificación del MVP](docs/MVP_SPEC.md)**: Requerimientos técnicos y funcionales del producto mínimo viable.
- **[Guías UI/UX](docs/UI_UX_GUIDELINES.md)**: Principios de diseño para lograr "cara de juego premium".
- **[Especificación IA-DJ](docs/AI_DJ_SPEC.md)**: Comportamiento, prompts y lógica del Director de Juego.

### Para Colaboradores
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Guía para contribuir al proyecto.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)**: Código de conducta de la comunidad.

---

## 🎮 Filosofía de Diseño

### No es un Chat — Es un Juego

Este proyecto rechaza explícitamente el paradigma de "chat con IA". Cada decisión técnica y de diseño está orientada a crear una experiencia que se sienta como un videojuego profesional:

- **Entrada de Usuario**: Aunque soporta texto libre, la interfaz principal usa botones de acción contextuales, menús radiales, gestos táctiles y selección directa en la escena.
- **Narrativa Visual**: La narración del DJ se presenta como subtítulos cinemáticos con tipografía de juego, efectos de máquina de escribir, fondos semitransparentes y sincronización con imágenes generadas.
- **Feedback Inmediato**: Cada acción produce feedback visual/audio instantáneo — partículas, shakes, flashes, sonidos — antes de que la IA responda.
- **HUD Siempre Presente**: Barras de estado, minimapa, inventario visual, retratos de personajes — todo visible como en un RPG tradicional.
- **Transiciones Cinematográficas**: Cambios de escena con fades, zooms, parallax y efectos de cámara.

### Desarrollo Cloud-First

El proyecto está optimizado para desarrollo en GitHub Codespaces:

- **React Native Web**: Permite iterar rápidamente en navegador sin necesidad de emuladores.
- **Expo Tunnel**: Permite testing en dispositivos físicos sin configuración de red compleja.
- **EAS Build**: Builds nativos en la nube — no requiere Xcode o Android Studio local.
- **Hot Reload Universal**: Cambios instantáneos en todas las plataformas.

---

## 🛣️ Roadmap

### v1.0 — MVP Single Player (Q2 2025)
- [x] Documentación completa
- [ ] Esqueleto de aplicación React Native + Expo
- [ ] Backend authoritative con resolución de acciones
- [ ] Integración con LLM (IA-DJ básica)
- [ ] Generación de imágenes para momentos clave
- [ ] Creación de personaje conversacional
- [ ] Sistema de resolución de acciones (RNG + atributos)
- [ ] UI/UX "cara de juego" (HUD, animaciones, gestos)
- [ ] Audio ambiente y SFX
- [ ] Builds para iOS, Android y Web

### v1.5 — Multijugador (Q3 2025)
- [ ] Sistema de salas (1-4 jugadores)
- [ ] Sincronización de estado en tiempo real
- [ ] Gestión de turnos
- [ ] Chat de voz opcional (Agora/WebRTC)
- [ ] Privacidad en creación de personajes

### v2.0 — RPG Completo (Q4 2025)
- [ ] Hojas de personaje completas y editables
- [ ] Sistema de progresión y nivelación
- [ ] Guardado persistente de campañas
- [ ] Memoria semántica de largo plazo (Vector DB)
- [ ] Text-to-Speech para narración
- [ ] Generación de música ambiente
- [ ] Editor de campañas para GMs humanos
- [ ] Marketplace de módulos/aventuras comunitarias

---

## 🤝 Contribuir

Este proyecto está en fase de desarrollo activo y acepta contribuciones. Por favor lee:
- [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir PRs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender el sistema
- Todas las contribuciones deben incluir tests y seguir las guías de estilo

---

## 📄 Licencia

Por definir (pendiente de decisión del maintainer).

---

## 🙏 Agradecimientos

- Comunidad de Expo y React Native
- OpenAI por las APIs de LLM e imagen
- Contribuidores y testers early access

---

**Contacto**: [@tiagofur](https://github.com/tiagofur)  
**Estado del Proyecto**: 🟡 En Desarrollo Activo