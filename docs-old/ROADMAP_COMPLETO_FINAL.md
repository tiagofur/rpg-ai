# 🗺️ RPG AI SUPREME - ROADMAP GLOBAL (Nov 2025)

## 🌟 Visión

Crear el mejor RPG narrativo con IA del mundo. Una experiencia inmersiva, visual y social que domine las App Stores
(Google, Apple, Steam). Queremos ser la referencia en "Juegos Infinitos".

## 📊 Estado Actual (25 Nov 2025)

### ✅ Backend (Cerebro & Cuerpo) - 95% Completado

Una infraestructura de nivel empresarial lista para escalar.

- **IA Gateway:** Integración con Gemini 2.5 Flash para narrativa estructurada y dirección de juego.
- **Motor de Juego:** Sistema de comandos, persistencia de estado y reglas de RPG.
- **Base de Datos:** Prisma + PostgreSQL con modelos complejos (Items, Quests, Enemigos).
- **Real-time:** WebSocket (Socket.io) con sistema de Salas y eventos sincronizados.
- **Monetización:** Backend de Stripe completo (Suscripciones, Webhooks).
- **Seguridad:** Auth JWT, Rate Limiting, Redis Caching.

### 🚧 Frontend (Rostro) - En Construcción

La aplicación móvil (React Native/Expo) existe pero necesita ser conectada al cerebro.

- Proyecto inicializado.
- Librerías clave instaladas (`socket.io-client`, `expo-av`, `expo-haptics`).

---

## 🚀 FASE 1: EL ROSTRO (Frontend Core) - PRIORIDAD INMEDIATA

**Objetivo:** Tener una app jugable "End-to-End" conectada al backend.

### 1.1 Conexión Vital

- [ ] **WebSocket Client:** Configurar `socket.io-client` en `apps/frontend` para conectar con el backend.
- [ ] **Auth UI:** Pantallas de Login y Registro conectadas a `AuthenticationService`.
- [ ] **Manejo de Errores:** Feedback visual cuando el servidor no responde.

### 1.2 Game Loop UI

- [ ] **Narrativa Stream:** Componente de chat optimizado para texto largo con auto-scroll.
- [ ] **Visor de Imaginación:** Componente para renderizar las imágenes Base64/URL que envía la IA.
- [ ] **Input de Acción:** Barra de texto para que el usuario escriba sus acciones.

### 1.3 HUD (Heads-Up Display)

- [ ] **Estado del Personaje:** Barras de HP, Mana/Energía.
- [ ] **Inventario Rápido:** Acceso visual a items equipados.
- [ ] **Feedback de Turno:** Indicador visual de "IA Pensando...".

---

## ✨ FASE 2: EL ALMA (Polish & Juice)

**Objetivo:** Que el juego se "sienta" increíble (Game Feel). Diferenciarnos por la calidad.

### 2.1 Inmersión Sensorial

- [ ] **Haptics:** Vibración sutil al escribir, vibración fuerte al recibir daño (`expo-haptics`).
- [ ] **Audio Dinámico:** Música de fondo que cambia según el contexto (Combate vs Exploración) (`expo-av`).
- [ ] **SFX:** Sonidos de UI, pasos, ataques.

### 2.2 Visual Polish

- [ ] **Animaciones:** Transiciones suaves entre pantallas, efectos de entrada de texto (`react-native-reanimated`).
- [ ] **Screen Shake:** Efecto de sacudida de pantalla en eventos críticos.
- [ ] **Partículas:** Efectos visuales simples para magia o loot.

---

## 🤝 FASE 3: SOCIAL & VIRAL

**Objetivo:** Crecimiento orgánico y retención social.

### 3.1 Multiplayer

- [ ] **Lobby UI:** Pantalla para crear salas y compartir código de invitación.
- [ ] **Party View:** Ver el estado (HP, Clase) de los compañeros de equipo.
- [ ] **Chat OOC:** Chat "Out of Character" para hablar entre jugadores.

### 3.2 Viralidad

- [ ] **Share Moment:** Botón para generar una imagen compuesta (Arte + Texto épico) lista para Instagram
      Stories/TikTok.
- [ ] **Referral System:** Recompensas por invitar amigos.

---

## 💎 FASE 4: IMPERIO (Monetización & Retención)

**Objetivo:** Rentabilidad y LTV (Lifetime Value).

### 4.1 Economía

- [ ] **Tienda Premium:** UI para comprar suscripciones y moneda virtual (conectado a Stripe/RevenueCat).
- [ ] **Visualización de Límites:** UI clara para usuarios Free vs Premium (ej: "5 turnos de IA restantes hoy").

### 4.2 Hábito

- [ ] **Daily Rewards:** Calendario de login diario con recompensas incrementales.
- [ ] **Push Notifications:** "Tu turno ha llegado" o "Tu energía se ha recargado" (`expo-notifications`).

---

## 🏗️ FASE 5: ESCALADO INFINITO (Infraestructura Futura)

**Objetivo:** Soportar 1M+ usuarios concurrentes.

- [ ] **Kubernetes:** Migrar de instancia única a cluster K8s con auto-scaling.
- [ ] **Redis Cluster:** Escalar la capa de caché distribuida.
- [ ] **Data Pipeline:** Analytics avanzado para balanceo de juego basado en datos reales.
- [ ] **Multi-LLM:** Sistema para cambiar dinámicamente entre modelos (Gemini, GPT-4, Claude) según costo/latencia.

---

## 📝 Notas de Desarrollo

- **Filosofía:** "Mobile First, AI Native". La IA no es un añadido, es el motor.
- **Calidad:** No aceptamos lag ni UI fea. Todo debe ser "snappy".
- **Iteración:** Lanzar FASE 1 lo antes posible para validar con usuarios reales.
