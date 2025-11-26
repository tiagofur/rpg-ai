# 📋 PRD - RPG-AI Supreme: Documento de Diseño de Juego

> **Versión**: 1.0  
> **Fecha**: 26 de Noviembre, 2025  
> **Estado**: Análisis Inicial + Propuesta de Mejoras

---

## Índice

1. [Visión del Juego](#1-visión-del-juego)
2. [Estado Actual del Desarrollo](#2-estado-actual-del-desarrollo)
3. [Análisis del Game Loop](#3-análisis-del-game-loop)
4. [Sistemas de Juego](#4-sistemas-de-juego)
5. [Análisis de Jugabilidad](#5-análisis-de-jugabilidad)
6. [Problemas de Retención](#6-problemas-de-retención)
7. [MEJORAS PROPUESTAS](#7-mejoras-propuestas)
8. [Estructura Narrativa](#8-estructura-narrativa)
9. [Balance y Números](#9-balance-y-números)
10. [Métricas de Éxito](#10-métricas-de-éxito)
11. [Roadmap de Implementación](#11-roadmap-de-implementación)

---

## 1. Visión del Juego

### 1.1 Concepto Core

**RPG-AI Supreme** es un RPG de texto impulsado por Inteligencia Artificial donde un **IA-DJ (Game Master)** genera
narrativa dinámica, resuelve acciones del jugador y crea imágenes en momentos épicos.

### 1.2 Pilares de Diseño

| Pilar                   | Descripción                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Narrativa Emergente** | Cada partida es única, la IA adapta la historia a las decisiones del jugador |
| **Accesibilidad**       | Interfaz simple de texto con acciones rápidas, sin curva de aprendizaje      |
| **Inmersión Visual**    | Imágenes AI-generated en momentos clave para visualizar escenas              |
| **Rejugabilidad**       | Múltiples clases, razas y caminos narrativos                                 |

### 1.3 Target Audience

- Fans de D&D/TTRPGs sin grupo de juego
- Jugadores de RPGs que buscan experiencias narrativas
- Usuarios casuales que quieren partidas de 15-30 minutos
- Nostálgicos de aventuras de texto clásicas

---

## 2. Estado Actual del Desarrollo

### 2.1 Sistemas Implementados ✅

| Sistema                   | Estado       | Descripción                                          |
| ------------------------- | ------------ | ---------------------------------------------------- |
| **Creación de Personaje** | ✅ Completo  | 6 razas, 6 clases, point-buy attributes, retratos AI |
| **Motor de Comandos**     | ✅ Completo  | Patrón Command con undo/redo, 11 tipos de comando    |
| **IA Game Master**        | ✅ Funcional | Gemini 2.5 Flash, narrativa + triggers de imagen     |
| **Combate Básico**        | ⚠️ Parcial   | Ataque/defensa funcionan, sin sistema de turnos      |
| **Inventario**            | ✅ Completo  | Items, equipamiento, consumibles, capacidad 50       |
| **Mapa Inicial**          | ✅ Básico    | 5 locaciones conectadas (pueblo, bosque, taberna)    |
| **Muerte/Respawn**        | ✅ Completo  | Sistema de respawn funcional                         |
| **Achievements**          | ✅ Completo  | Sistema de logros por categorías                     |
| **WebSocket**             | ✅ Completo  | Comunicación real-time cliente-servidor              |
| **Monetización**          | ✅ Completo  | 4 planes de suscripción con Stripe                   |

### 2.2 Sistemas Faltantes ❌

| Sistema              | Prioridad  | Impacto en Retención |
| -------------------- | ---------- | -------------------- |
| Misiones/Quests      | 🔴 Crítica | Alto                 |
| Arco Narrativo       | 🔴 Crítica | Alto                 |
| Combate por Turnos   | 🔴 Crítica | Alto                 |
| Loot de Enemigos     | 🔴 Crítica | Alto                 |
| Diálogos NPCs        | 🟡 Alta    | Medio                |
| UI de Magia          | 🟡 Alta    | Medio                |
| UI de Equipamiento   | 🟡 Alta    | Medio                |
| Progresión por Nivel | 🟡 Alta    | Medio                |
| Mini-mapa            | 🟡 Media   | Medio                |
| Modo Historia Finita | 🟢 Baja    | Bajo                 |
| Modo Infinito        | 🟢 Baja    | Bajo                 |

---

## 3. Análisis del Game Loop

### 3.1 Game Loop Actual

```
┌─────────────────────────────────────────────────────────┐
│                    GAME LOOP ACTUAL                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Crear Personaje] ──► [Aparecer en Plaza] ──►          │
│                                                          │
│        ┌──────────────────────────────────┐              │
│        │                                  │              │
│        ▼                                  │              │
│  [Escribir acción libre] ──► [IA responde] ──► [Repetir]│
│        │                                  ▲              │
│        ▼                                  │              │
│  [Encontrar enemigo] ──► [Atacar/Defender] ──┘          │
│        │                                                 │
│        ▼                                                 │
│  [Morir] ──► [Respawn] ──► [Volver al loop]             │
│                                                          │
└─────────────────────────────────────────────────────────┘

PROBLEMA: Sin objetivo claro, sin progresión significativa,
          sin razón para continuar después de 15 minutos.
```

### 3.2 Game Loop Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAME LOOP PROPUESTO                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Crear Personaje + Backstory] ──► [Prólogo AI-generado]        │
│                                           │                      │
│                                           ▼                      │
│                              [MISIÓN PRINCIPAL ACTIVA]           │
│                                           │                      │
│               ┌───────────────────────────┼───────────────┐      │
│               │                           │               │      │
│               ▼                           ▼               ▼      │
│         [Explorar]              [Combate x Turnos]   [Hablar]   │
│               │                           │               │      │
│               ▼                           ▼               ▼      │
│         [Descubrir]                 [Loot Drop]     [Diálogo]   │
│               │                           │               │      │
│               └───────────────────────────┴───────────────┘      │
│                                           │                      │
│                                           ▼                      │
│                              [Completar Objetivo]                │
│                                           │                      │
│                                           ▼                      │
│                         [XP + Nivel + Recompensa]                │
│                                           │                      │
│                        ┌──────────────────┴──────────────────┐   │
│                        ▼                                     ▼   │
│               [Siguiente Capítulo]                    [FIN/Boss] │
│                        │                                     │   │
│                        └─────────► [Modo Infinito] ◄─────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Sesión Ideal del Jugador

| Tiempo    | Actividad                            | Emoción Objetivo              |
| --------- | ------------------------------------ | ----------------------------- |
| 0-3 min   | Creación de personaje                | Anticipación, personalización |
| 3-5 min   | Prólogo narrativo                    | Inmersión, curiosidad         |
| 5-10 min  | Primera misión + primer combate      | Aprendizaje, logro            |
| 10-20 min | Exploración + misiones secundarias   | Descubrimiento                |
| 20-30 min | Clímax de capítulo                   | Tensión, recompensa           |
| 30+ min   | Continuar o cerrar sesión satisfecho | Satisfacción                  |

---

## 4. Sistemas de Juego

### 4.1 Sistema de Personajes

#### Razas Disponibles

| Raza           | Nombre ES | Bonificaciones               | Traits Raciales                                        |
| -------------- | --------- | ---------------------------- | ------------------------------------------------------ |
| **Human**      | Humano    | +1 a todos los stats         | Versátil, Ambicioso, Adaptable                         |
| **Elf**        | Elfo      | +2 Agilidad, +1 Inteligencia | Visión Nocturna, Inmune a Sueño, Longevidad            |
| **Dwarf**      | Enano     | +2 Constitución, +1 Fuerza   | Resistencia a Veneno, Visión Oscuridad, Fortaleza      |
| **Halfling**   | Mediano   | +2 Agilidad, +1 Carisma      | Suertudo, Valiente, Ágil                               |
| **Tiefling**   | Tiefling  | +2 Carisma, +1 Inteligencia  | Resistencia al Fuego, Visión Oscuridad, Magia Infernal |
| **Dragonborn** | Dracónido | +2 Fuerza, +1 Carisma        | Aliento de Dragón, Resistencia Elemental               |

#### Clases Disponibles

| Clase          | Stats Primarios | Hit Die | Habilidades Iniciales         |
| -------------- | --------------- | ------- | ----------------------------- |
| **Guerrero**   | FUE/CON         | d10     | Ataque Poderoso, Intimidación |
| **Mago**       | INT/SAB         | d6      | Arcanos, Concentración        |
| **Pícaro**     | AGI/INT         | d8      | Sigilo, Juego de Manos        |
| **Bardo**      | CAR/AGI         | d8      | Interpretación, Persuasión    |
| **Explorador** | AGI/SAB         | d10     | Supervivencia, Percepción     |
| **Clérigo**    | SAB/CON         | d8      | Religión, Sanación            |

#### Sistema de Atributos (Point-Buy)

- **6 Atributos**: Fuerza, Agilidad, Constitución, Inteligencia, Sabiduría, Carisma
- **Valor Base**: 10
- **Rango**: 8-18
- **Puntos Totales**: 27 para distribuir

| Valor | Costo en Puntos |
| ----- | --------------- |
| 8     | 0               |
| 9     | 1               |
| 10    | 2               |
| 11    | 3               |
| 12    | 4               |
| 13    | 5               |
| 14    | 7               |
| 15    | 9               |
| 16    | 12              |
| 17    | 15              |
| 18    | 19              |

### 4.2 Sistema de Combate

#### Fórmulas Actuales

**Probabilidad de Impacto:**

```
hitChance = 80%
          + (destreza - 10) × 2%
          + nivelHabilidadArma × 1.5%
          + (tieneArma ? 5% : 0)
          + bonusPrecisión
          - penalizaciónCeguera(30%)
          - destrezaObjetivo × 1.5%

// Límites: 5% - 95%
```

**Cálculo de Daño:**

```
dañoBase = 10
         + (fuerza × 1.5)
         + ataqueArma
         + nivelHabilidadCombate × 2
         ± 15% variación

dañoFinal = dañoBase - (constituciónObjetivo × 0.8)

// Mínimo: 1 daño
```

**Golpe Crítico:**

```
critChance = 5%
           + (destreza - 10) × 0.5%
           + habilidadGolpeCrítico × 0.8%

// Máximo: 50%
// Crítico = 2× daño
```

#### Tipos de Defensa

| Tipo             | Requisitos                   | Stamina | Efecto                            |
| ---------------- | ---------------------------- | ------- | --------------------------------- |
| **Esquivar**     | Ninguno                      | 8       | 25% + DES×2 probabilidad          |
| **Bloquear**     | Escudo                       | 4-6     | 30% + FUE×1.5, reduce daño 15%+   |
| **Parar**        | Arma cuerpo a cuerpo, 12 DES | 7       | 20% + DES×2.5 probabilidad        |
| **Contraatacar** | Arma, Nivel 5+, 15 DES       | 12      | 15% + DES×1.5, devuelve 0.8× daño |

### 4.3 Sistema de Magia

#### Escuelas de Magia

| Escuela    | Stat de Escalado | Ejemplos           |
| ---------- | ---------------- | ------------------ |
| Fuego      | Inteligencia     | Bola de Fuego      |
| Hielo      | Inteligencia     | Fragmento de Hielo |
| Rayo       | Inteligencia     | Descarga           |
| Curación   | Sabiduría        | Sanación Menor     |
| Protección | Sabiduría        | Escudo Mágico      |
| Ilusión    | INT + CAR        | Invisibilidad      |

#### Hechizos Implementados

| Hechizo            | Nivel | Escuela  | Maná | Cooldown | Efecto             |
| ------------------ | ----- | -------- | ---- | -------- | ------------------ |
| Bola de Fuego      | 1     | Fuego    | 15   | 5s       | 20 daño fuego      |
| Sanación Menor     | 1     | Curación | 10   | 10s      | 15 HP              |
| Fragmento de Hielo | 2     | Hielo    | 12   | 6s       | 12 daño + lentitud |

**Fórmula de Costo de Maná:**

```
costoBase = spell.manaCost × spell.level × powerLevel
costoFinal = costoBase - (INT - 10)/3 - (SAB - 10)/3
costoStamina = costoFinal / 5
```

### 4.4 Sistema de Items

#### Raridades

| Rareza    | Color   | Drop Rate Estimado |
| --------- | ------- | ------------------ |
| Common    | Blanco  | 60%                |
| Uncommon  | Verde   | 25%                |
| Rare      | Azul    | 10%                |
| Epic      | Púrpura | 4%                 |
| Legendary | Naranja | 0.9%               |
| Mythic    | Rojo    | 0.1%               |

#### Slots de Equipamiento

```
        [Casco]
          │
[Anillo1]─[Amuleto]─[Anillo2]
          │
       [Armadura]
       /        \
  [Guantes]    [Arma]
       \        /
        [Botas]──[Escudo]
```

#### Items Iniciales por Clase

| Clase      | Arma            | Armadura      | Especial        |
| ---------- | --------------- | ------------- | --------------- |
| Guerrero   | Espada Bastarda | Cota de Malla | Escudo          |
| Mago       | Bastón Arcano   | Túnica        | Grimorio        |
| Pícaro     | Dos Dagas       | Cuero         | Ganzúas         |
| Bardo      | Espada Corta    | Cuero         | Laúd            |
| Explorador | Arco Corto      | Cuero         | Capa Camuflaje  |
| Clérigo    | Maza            | Cota de Malla | Símbolo Sagrado |

### 4.5 Sistema de Mundo

#### Locaciones Iniciales

```
                    [Claro del Bosque]
                           │
                           │
[Herrería] ─── [Plaza del Pueblo] ─── [Entrada del Bosque]
                           │
                           │
                  [Taberna "El Tanque Oxidado"]
```

| Locación           | Tipo       | Enemigos      | NPCs      | Características        |
| ------------------ | ---------- | ------------- | --------- | ---------------------- |
| Plaza del Pueblo   | Town       | Ninguno       | Varios    | Punto inicial          |
| Entrada del Bosque | Wilderness | Rata Gigante  | Ninguno   | Primera zona peligrosa |
| Claro del Bosque   | Wilderness | Lobo, Bandido | Ninguno   | Hierbas curativas      |
| Herrería           | Town       | Ninguno       | Herrero   | Compra/venta armas     |
| Taberna            | Interior   | Ninguno       | Tabernero | Descanso, rumores      |

#### Enemigos Base

| Enemigo       | Clase | Nivel | HP  | XP  | Oro |
| ------------- | ----- | ----- | --- | --- | --- |
| Rata Gigante  | Beast | 1     | 20  | 10  | 2   |
| Bandido       | Rogue | 2     | 40  | 25  | 15  |
| Lobo Terrible | Beast | 3     | 60  | 40  | 0   |

---

## 5. Análisis de Jugabilidad

### 5.1 Evaluación por Área

| Área                      | Puntuación     | Justificación                                   |
| ------------------------- | -------------- | ----------------------------------------------- |
| **Creación de Personaje** | ⭐⭐⭐⭐ (4/5) | Rica en opciones, falta backstory guiado        |
| **Narrativa**             | ⭐⭐⭐ (3/5)   | IA genera texto dinámico, sin arco estructurado |
| **Combate**               | ⭐⭐ (2/5)     | Fórmulas sólidas, sin sistema de turnos         |
| **Progresión**            | ⭐⭐ (2/5)     | XP funciona, subir nivel no recompensa          |
| **Mundo**                 | ⭐⭐ (2/5)     | Base creada, NPCs sin interacción real          |
| **UI/UX**                 | ⭐⭐⭐ (3/5)   | Funcional, falta magia y equipamiento           |

### 5.2 Fortalezas del Diseño Actual

1. **Arquitectura Sólida**: Patrón Command permite extensibilidad y undo/redo
2. **IA Flexible**: Gemini genera narrativa contextual de alta calidad
3. **Inmersión Visual**: Imágenes AI en momentos épicos
4. **Variedad de Personajes**: 36 combinaciones raza/clase únicas
5. **Real-time**: WebSocket para experiencia fluida

### 5.3 Debilidades Críticas

1. **Sin Objetivo**: Jugador no sabe qué hacer después de explorar
2. **Sin Recompensa Tangible**: Matar enemigos no da loot
3. **Combate Confuso**: No hay ritmo ni turnos claros
4. **NPCs Decorativos**: Existen pero no interactúan
5. **Progresión Vacía**: Niveles no desbloquean nada nuevo

---

## 6. Problemas de Retención

### 6.1 ¿Por qué los jugadores abandonarían?

| Problema                    | Momento de Abandono   | Causa Raíz             |
| --------------------------- | --------------------- | ---------------------- |
| "¿Y ahora qué?"             | 5-10 minutos          | Sin misiones activas   |
| "Esto no lleva a nada"      | 15-20 minutos         | Sin progresión visible |
| "El combate es confuso"     | Primer combate        | Sin sistema de turnos  |
| "¿Para qué matar enemigos?" | Después de 3 combates | Sin loot drops         |
| "Los NPCs no hacen nada"    | Al hablar con NPC     | Sin diálogos reales    |

### 6.2 Modelo de Retención Objetivo

```
Día 1:  ████████████████████████████████████████ 100% (instalación)
Día 1:  ████████████████████████████████ 80% (completa tutorial)
Día 1:  ████████████████████████ 60% (primera misión)
Día 2:  ████████████████ 40% (regresa)
Día 7:  ████████ 20% (jugador recurrente)
Día 30: ████ 10% (jugador comprometido)
```

---

## 7. MEJORAS PROPUESTAS

### 7.1 🔴 Mejoras CRÍTICAS (Bloquean retención)

#### M1: Sistema de Misiones Activas

**Descripción**: Implementar quest log con objetivos trackeables

**Tipos de Misiones**:

- `KILL`: Derrotar X enemigos de tipo Y
- `COLLECT`: Recoger X items
- `EXPLORE`: Descubrir locación
- `TALK`: Hablar con NPC específico
- `ESCORT`: Proteger NPC durante viaje
- `DELIVER`: Llevar item a destino

**UI Requerida**:

- Indicador de misión activa en pantalla
- Lista de objetivos con progreso
- Notificación al completar

**Ejemplo de Misión**:

```yaml
nombre: 'Ratas en el Sótano'
descripción: 'El tabernero necesita ayuda con una plaga de ratas'
objetivos:
  - tipo: KILL
    target: 'giant_rat'
    cantidad: 5
    progreso: 0
recompensas:
  xp: 100
  oro: 25
  items: ['minor_health_potion']
```

---

#### M2: Arco Narrativo por Sesión

**Descripción**: Cada sesión = un capítulo con estructura dramática

**Estructura de Capítulo**:

```
[Gancho]      → Evento que inicia la acción (5 min)
[Desarrollo]  → Exploración, combates, pistas (15-20 min)
[Clímax]      → Enfrentamiento/revelación principal (5-10 min)
[Resolución]  → Recompensas, setup del siguiente capítulo (5 min)
```

**Implementación en IA**:

- Prompt incluye "fase actual del capítulo"
- IA recibe instrucción de cerrar arcos
- Cada 30 minutos, IA busca punto de cierre natural

**Modos de Juego**:

- **Historia Finita**: 5-10 capítulos → Final → Créditos
- **Infinito**: Capítulos procedurales sin fin

---

#### M3: Combate por Turnos

**Descripción**: Sistema de iniciativa y turnos claros

**Flujo de Combate**:

```
1. [Inicio Combate] → Calcular iniciativa (1d20 + DES)
2. [Turno Jugador] → Elegir: Atacar | Defender | Magia | Item | Huir
3. [Turno Enemigo] → IA decide acción basada en AI behavior
4. [Fin de Ronda] → Aplicar efectos DoT, reducir cooldowns
5. [Repetir] hasta victoria/derrota/huida
```

**UI de Combate**:

```
┌────────────────────────────────────────┐
│ 🐺 Lobo Terrible    [████████░░] 60/80 │
├────────────────────────────────────────┤
│                                        │
│  El lobo gruñe, preparándose para      │
│  saltar sobre ti...                    │
│                                        │
│  ► TU TURNO                            │
│                                        │
├────────────────────────────────────────┤
│ ⚔️ Atacar  🛡️ Defender  ✨ Magia  🎒 Item │
└────────────────────────────────────────┘
```

---

#### M4: Loot de Enemigos

**Descripción**: Enemigos dropean items/oro al morir

**Tabla de Loot por Enemigo**:

```yaml
giant_rat:
  oro: 2-5
  items:
    - id: rat_tail
      chance: 80%
    - id: minor_health_potion
      chance: 5%

dire_wolf:
  oro: 0
  items:
    - id: wolf_pelt
      chance: 90%
    - id: wolf_fang
      chance: 60%
    - id: rare_pelt
      chance: 5%
```

**Feedback Visual**:

- Animación de items cayendo
- Sonido de monedas
- Notificación "+15 oro, Piel de Lobo obtenida"

---

### 7.2 🟡 Mejoras IMPORTANTES (Mejoran engagement)

#### M5: Diálogos con NPCs

**Descripción**: Árboles de diálogo con opciones

**Estructura**:

```yaml
npc: 'Tabernero'
entrada: '¡Bienvenido, viajero! ¿Qué te trae por aquí?'
opciones:
  - texto: 'Busco trabajo'
    resultado: quest_ratas
  - texto: 'Quiero comprar una bebida'
    resultado: open_shop
  - texto: '¿Qué noticias hay?'
    resultado: rumor_random
  - texto: 'Adiós'
    resultado: exit
```

---

#### M6: Sistema de Magia en UI

**UI Propuesta**:

```
┌─ HECHIZOS ─────────────────────────────┐
│                                        │
│ 🔥 Bola de Fuego    [15 MP] [LISTO]   │
│ ❄️ Fragmento Hielo  [12 MP] [3s...]   │
│ 💚 Sanación Menor   [10 MP] [LISTO]   │
│                                        │
│ Maná: [████████░░░░] 40/60            │
└────────────────────────────────────────┘
```

---

#### M7: Equipar Items desde UI

**UI Propuesta**:

```
┌─ EQUIPAMIENTO ─────────────────────────┐
│                                        │
│     [Casco Hierro]                     │
│          ⬇️                            │
│ [Anillo]  [Amuleto]  [Anillo]         │
│          ⬇️                            │
│     [Cota de Malla]                    │
│      /          \                      │
│ [Guantes]    [Espada +5]              │
│      \          /                      │
│     [Botas]─[Escudo]                  │
│                                        │
│ Stats: ATK +15  DEF +12  HP +20       │
└────────────────────────────────────────┘
```

---

#### M8: Progresión al Subir Nivel

**Recompensas por Nivel**:

| Nivel | Recompensas                            |
| ----- | -------------------------------------- |
| 2     | +10 HP, +5 MP, elegir +1 a un atributo |
| 3     | Nueva habilidad de clase               |
| 4     | +10 HP, +5 MP, elegir +1 a un atributo |
| 5     | Habilidad especial de clase, título    |
| 6+    | Patrón continúa                        |

**Habilidades por Nivel para Guerrero**:

- Nivel 3: "Golpe Aturdidor" - 50% chance de aturdir 1 turno
- Nivel 5: "Segundo Viento" - Recuperar 30% HP una vez por combate
- Nivel 7: "Furia" - +50% daño por 3 turnos

---

#### M9: Mini-mapa Visual

```
┌─ MAPA ─────────────────────────────────┐
│                                        │
│         [?]                            │
│          │                             │
│ [⚒️]───[🏠]───[🌲]                      │
│          │                             │
│         [🍺]                           │
│                                        │
│ 🏠 Plaza (tú estás aquí)              │
│ ⚒️ Herrería                            │
│ 🌲 Bosque                              │
│ 🍺 Taberna                             │
│ ? Zona inexplorada                     │
└────────────────────────────────────────┘
```

---

### 7.3 🟢 Mejoras DESEABLES (Polish y adicción)

#### M10: Modo Historia Finita

**Estructura de Campaña**:

- **Acto 1** (15-20 min): Tutorial, primera misión, establecer amenaza
- **Acto 2** (30-40 min): 3-4 misiones, desarrollar villano, aliados
- **Acto 3** (15-20 min): Confrontación final, boss fight, epílogo

**Final**: Créditos + estadísticas de partida + desbloqueo Modo Infinito

---

#### M11: Modo Infinito/Sandbox

- Dungeons procedurales con dificultad escalable
- Mini-boss cada 5 niveles de profundidad
- Leaderboards globales
- Sin historia, puro gameplay y loot

---

#### M12: Daily Challenges

**Ejemplos**:

- "Derrota 10 enemigos sin usar pociones" → 50 oro
- "Completa una misión en menos de 10 minutos" → Item raro
- "Descubre 3 locaciones nuevas" → 100 XP

---

#### M13: Backstory del Personaje

**Preguntas en Creación**:

1. "¿Por qué dejaste tu hogar?" → Afecta primera misión
2. "¿Cuál es tu mayor miedo?" → Evento especial más adelante
3. "¿Tienes algún enemigo?" → Villano recurrente

---

#### M14: Bestiario

Colección de monstruos encontrados con:

- Ilustración
- Stats y debilidades
- Lore
- Contador de derrotados

---

#### M15: Clima Dinámico

| Clima    | Efecto en Combate           |
| -------- | --------------------------- |
| Lluvia   | -10% precisión con arcos    |
| Niebla   | -20% precisión, +10% sigilo |
| Tormenta | Hechizos eléctricos +50%    |
| Nevado   | -1 velocidad movimiento     |

---

## 8. Estructura Narrativa

### 8.1 Modo Historia: "La Sombra del Valle"

**Sinopsis**: El Valle de Luminar ha sido invadido por una oscuridad misteriosa. El jugador debe descubrir su origen y
detenerla antes de que consuma todo.

**Acto 1: El Despertar**

- Capítulo 1: Llegada al pueblo, conocer NPCs clave
- Capítulo 2: Primera misión, descubrir pista sobre la oscuridad

**Acto 2: La Búsqueda**

- Capítulo 3-4: Buscar fragmentos de un artefacto antiguo
- Capítulo 5-6: Confrontar lugartenientes del mal
- Capítulo 7: Revelación sobre el villano

**Acto 3: El Enfrentamiento**

- Capítulo 8: Preparación final, aliados se unen
- Capítulo 9: Dungeon final
- Capítulo 10: Boss fight, epílogo

### 8.2 Modo Infinito: "Las Catacumbas Eternas"

**Mecánica**:

- Niveles procedurales de 3-5 habitaciones
- Cada 5 niveles = tienda + mini-boss
- Cada 10 niveles = boss mayor
- Dificultad escala infinitamente
- Muerte = reinicio (roguelike elements)

---

## 9. Balance y Números

### 9.1 Propuesta de Rebalanceo

| Elemento            | Valor Actual | Valor Propuesto | Razón                         |
| ------------------- | ------------ | --------------- | ----------------------------- |
| HP inicial Guerrero | ~100         | 120             | Más margen de error           |
| HP inicial Mago     | ~60          | 80              | Muy frágil                    |
| Daño espada básica  | 5 fijo       | 8-12 (rango)    | Más variación                 |
| Oro por Rata        | 2            | 5-10            | Recompensa tangible           |
| XP para nivel 2     | 1000         | 500             | Progresión más rápida inicial |
| XP para nivel 3     | 2000         | 1200            | Mantener momentum             |

### 9.2 Curva de Dificultad

```
Dificultad
    ▲
    │                                    ████
    │                              ██████
    │                        ██████
    │                  ██████
    │            ██████
    │      ██████
    │████████
    └────────────────────────────────────► Tiempo
       Tutorial   Early    Mid    Late    Endgame
```

### 9.3 Economía del Juego

| Fuente               | Oro/hora Estimado |
| -------------------- | ----------------- |
| Enemigos nivel 1-3   | 50-100            |
| Misiones básicas     | 25-50 por misión  |
| Misiones secundarias | 50-100 por misión |
| Bosses               | 200-500           |

| Gasto                | Costo   |
| -------------------- | ------- |
| Poción de vida menor | 15      |
| Poción de vida media | 50      |
| Espada de hierro     | 100     |
| Armadura de placas   | 500     |
| Hechizo nuevo        | 200-500 |

---

## 10. Métricas de Éxito

### 10.1 KPIs Principales

| Métrica                     | Objetivo | Crítico |
| --------------------------- | -------- | ------- |
| Tiempo primera sesión       | >20 min  | >10 min |
| Retención Día 1             | >40%     | >25%    |
| Retención Día 7             | >15%     | >8%     |
| Misiones completadas/sesión | >3       | >1      |
| Combates por sesión         | >5       | >2      |
| Conversión a premium        | >5%      | >2%     |

### 10.2 Eventos a Trackear

- Creación de personaje completada
- Tutorial completado
- Primera misión completada
- Primer combate ganado
- Primer nivel subido
- Primera compra en tienda
- Sesión >30 minutos
- Regreso después de 24h

---

## 11. Roadmap de Implementación

### Fase 1: Core Loop (2-3 semanas)

- [ ] M1: Sistema de Misiones
- [ ] M3: Combate por Turnos
- [ ] M4: Loot de Enemigos

### Fase 2: Engagement (2 semanas)

- [ ] M2: Arco Narrativo
- [ ] M5: Diálogos NPCs
- [ ] M8: Progresión por Nivel

### Fase 3: Polish UI (2 semanas)

- [ ] M6: UI de Magia
- [ ] M7: UI de Equipamiento
- [ ] M9: Mini-mapa

### Fase 4: Content (Ongoing)

- [ ] M10: Campaña Historia
- [ ] M11: Modo Infinito
- [ ] M12-M15: Extras

---

## Apéndice A: Glosario

| Término        | Definición                                 |
| -------------- | ------------------------------------------ |
| **IA-DJ**      | AI Game Master que genera narrativa        |
| **Point-Buy**  | Sistema de distribución de atributos       |
| **Hit Die**    | Dado de vida por clase (HP por nivel)      |
| **DoT**        | Damage over Time (daño por turno)          |
| **Loot Table** | Tabla de probabilidades de drop            |
| **Roguelike**  | Género con muerte permanente y runs cortas |

---

## Apéndice B: Referencias

- D&D 5e SRD para mecánicas base
- Baldur's Gate 3 para narrativa emergente
- Slay the Spire para loop roguelike
- AI Dungeon para narrativa AI

---

_Documento generado el 26 de Noviembre de 2025_  
_Próxima revisión: Después de implementar Fase 1_
