# 🎮 RPG-AI SUPREME - Game Design Document (GDD)

> **Versión:** 2.0 — Especificación Completa  
> **Actualizado:** 25 de Noviembre 2025  
> **Estado:** En desarrollo activo

---

## 📋 Índice

1. [Visión](#1-visión)
2. [Concepto Central](#2-concepto-central)
3. [Pilares de Diseño](#3-pilares-de-diseño)
4. [Público Objetivo](#4-público-objetivo)
5. [Mecánicas Core](#5-mecánicas-core)
6. [Sistema de Personajes](#6-sistema-de-personajes)
7. [Sistema de Combate](#7-sistema-de-combate)
8. [Sistema de Progresión](#8-sistema-de-progresión)
9. [Economía del Juego](#9-economía-del-juego)
10. [Sistema de Quests](#10-sistema-de-quests)
11. [Generación de Contenido IA](#11-generación-de-contenido-ia)
12. [Flujo UI/UX](#12-flujo-uiux)
13. [Multijugador](#13-multijugador)
14. [Monetización](#14-monetización)
15. [Ética y Seguridad](#15-ética-y-seguridad)
16. [Roadmap](#16-roadmap)

---

## 1. Visión

> **"Ser el Dungeons & Dragons personal, visual e instantáneo"**

Un TTRPG guiado por IA para solitario y multijugador, sin preparación previa y con fuerte énfasis en la agencia del
jugador. El juego que cualquiera puede disfrutar en cualquier momento, sin necesidad de coordinar grupos o preparar
sesiones.

### Propuesta de Valor Única

- **Inmediato:** Empieza a jugar en 30 segundos
- **Personal:** La IA adapta la historia a TUS decisiones
- **Visual:** Imágenes generadas de TU aventura específica
- **Real:** Mecánicas de RPG con consecuencias reales
- **Social:** Juega solo o con hasta 4 amigos

---

## 2. Concepto Central

### IA como Director de Juego (IA-DJ)

La IA no solo genera texto. Es un **Game Master completo** que:

1. **Narra** la historia de forma inmersiva
2. **Arbitra** las reglas del juego justamente
3. **Adapta** la dificultad al jugador
4. **Genera** contenido único para cada partida
5. **Visualiza** momentos clave con imágenes

### Diferenciadores Clave

| Competidor      | Solo texto | RPG-AI Supreme      |
| --------------- | ---------- | ------------------- |
| AI Dungeon      | ✅         | ❌ Mecánicas reales |
| ChatGPT RPG     | ✅         | ❌ Sistema completo |
| D&D tradicional | ❌         | ❌ Sin preparación  |

---

## 3. Pilares de Diseño

### 🎯 Pilar 1: Agencia Absoluta

- El jugador puede escribir CUALQUIER acción
- La IA interpreta y resuelve de forma coherente
- Nunca hay "no puedes hacer eso" arbitrario
- Las consecuencias son lógicas y narrativas

### 📖 Pilar 2: Narrativa Emergente

- Cada partida es única
- Las decisiones tienen consecuencias a largo plazo
- NPCs con personalidades consistentes
- El mundo reacciona a las acciones del jugador

### 🎨 Pilar 3: Inmersión Visual

- Imágenes generadas en momentos clave
- Arte que refleja TU historia específica
- Consistencia visual durante la aventura
- Calidad de imagen premium (DALL-E 3)

### ⚔️ Pilar 4: Mecánicas Tangibles

- Sistema de stats que IMPORTA
- Tiradas de dado con probabilidades reales
- Inventario funcional
- Progresión significativa

---

## 4. Público Objetivo

### Jugador Primario

- **Edad:** 18-35 años
- **Perfil:** Fan de RPGs, jugador de D&D sin grupo, gamer casual narrativo
- **Motivación:** Quiere experiencias de rol sin la fricción de coordinar grupos
- **Tiempo:** Sesiones de 15-60 minutos
- **Dispositivo:** Principalmente móvil

### Jugador Secundario

- **Perfil:** Curioso de D&D que nunca ha jugado
- **Motivación:** Probar RPG sin barrera de entrada
- **Valor:** Conversión a jugador de mesa tradicional

### Jugador Social

- **Perfil:** Grupo de amigos que quiere jugar juntos
- **Motivación:** Experiencia compartida sin GM humano
- **Valor:** Alto LTV, viralidad

---

## 5. Mecánicas Core

### 5.1 Resolución de Acciones

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE RESOLUCIÓN                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ENTRADA: "Intento escalar el muro del castillo"         │
│                          ↓                                   │
│  2. PARSEO: Acción=Escalar, Objetivo=Muro, Contexto=Castillo│
│                          ↓                                   │
│  3. LOOKUP: Habilidad=Atletismo, Atributo=Fuerza            │
│                          ↓                                   │
│  4. DIFICULTAD: CD 15 (muro alto, piedra lisa)              │
│                          ↓                                   │
│  5. MODIFICADORES: +3 (Fuerza) +2 (Atletismo) = +5          │
│                          ↓                                   │
│  6. TIRADA: d20 + 5 = 18 vs CD 15                           │
│                          ↓                                   │
│  7. RESULTADO: ✅ ÉXITO                                      │
│                          ↓                                   │
│  8. NARRACIÓN: "Tus dedos encuentran grietas en la piedra..."│
│                          ↓                                   │
│  9. EFECTOS: location="top_of_wall", stamina-=10            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Sistema de Tiradas

| Tirada   | Uso                   | Resultado            |
| -------- | --------------------- | -------------------- |
| **d20**  | Acciones generales    | 1-20 + modificadores |
| **d6**   | Daño, efectos menores | 1-6 por dado         |
| **d100** | Eventos raros, loot   | Percentil            |

### Resultados Posibles

| Roll vs CD | Resultado        | Efecto                           |
| ---------- | ---------------- | -------------------------------- |
| Natural 1  | 💀 Fallo Crítico | Consecuencia negativa extra      |
| < CD - 5   | ❌ Fallo Total   | Acción falla completamente       |
| < CD       | ⚠️ Fallo         | Acción falla, sin extra negativo |
| ≥ CD       | ✅ Éxito         | Acción tiene éxito               |
| ≥ CD + 5   | ⭐ Éxito Notable | Bonus narrativo                  |
| Natural 20 | 🌟 Crítico       | Éxito automático + bonus         |

---

## 6. Sistema de Personajes

### 6.1 Atributos Principales

| Atributo         | Abreviación | Afecta                                       |
| ---------------- | ----------- | -------------------------------------------- |
| **Fuerza**       | FUE         | Daño cuerpo a cuerpo, cargar peso, atletismo |
| **Destreza**     | DES         | Precisión, evasión, sigilo, iniciativa       |
| **Constitución** | CON         | HP máximo, resistencia, stamina              |
| **Inteligencia** | INT         | Magia arcana, conocimientos, investigación   |
| **Sabiduría**    | SAB         | Percepción, intuición, magia divina          |
| **Carisma**      | CAR         | Persuasión, engaño, liderazgo                |

### Escala de Atributos

| Valor | Nivel         | Modificador |
| ----- | ------------- | ----------- |
| 1-3   | Muy Bajo      | -3          |
| 4-5   | Bajo          | -2          |
| 6-7   | Inferior      | -1          |
| 8-9   | Promedio bajo | +0          |
| 10-11 | Promedio      | +0          |
| 12-13 | Promedio alto | +1          |
| 14-15 | Bueno         | +2          |
| 16-17 | Muy Bueno     | +3          |
| 18-19 | Excelente     | +4          |
| 20    | Legendario    | +5          |

### 6.2 Razas Disponibles

| Raza         | Bonus          | Habilidad Especial                            |
| ------------ | -------------- | --------------------------------------------- |
| **Humano**   | +1 a todos     | Versatilidad: +1 habilidad extra              |
| **Elfo**     | +2 DES, +1 INT | Visión nocturna, resistencia a encantamientos |
| **Enano**    | +2 CON, +1 FUE | Resistencia a veneno, visión en oscuridad     |
| **Mediano**  | +2 DES, +1 CAR | Suerte: re-roll 1s en d20                     |
| **Semiorco** | +2 FUE, +1 CON | Furia: +daño cuando HP < 50%                  |
| **Tiefling** | +2 CAR, +1 INT | Resistencia al fuego, hechizo innato          |

### 6.3 Clases

| Clase        | Rol            | HP/Nivel | Atributo Clave |
| ------------ | -------------- | -------- | -------------- |
| **Guerrero** | Tanque/DPS     | d10      | Fuerza         |
| **Pícaro**   | DPS/Utilidad   | d8       | Destreza       |
| **Mago**     | DPS Mágico     | d6       | Inteligencia   |
| **Clérigo**  | Soporte/Tank   | d8       | Sabiduría      |
| **Ranger**   | DPS Distancia  | d10      | Destreza       |
| **Bardo**    | Soporte/Social | d8       | Carisma        |

### 6.4 Habilidades

Cada personaje tiene **proficiencia** en ciertas habilidades según su clase:

```
FUERZA          DESTREZA        CONSTITUCIÓN
├─ Atletismo    ├─ Acrobacia    └─ (Sin habilidades)
                ├─ Sigilo
                ├─ Juego de manos
                └─ Prestidigitación

INTELIGENCIA    SABIDURÍA       CARISMA
├─ Arcano       ├─ Percepción   ├─ Persuasión
├─ Historia     ├─ Perspicacia  ├─ Engaño
├─ Investigación├─ Supervivencia├─ Intimidación
├─ Naturaleza   ├─ Medicina     └─ Interpretación
└─ Religión     └─ Trato animal
```

### 6.5 Formato de Personaje (JSON)

```json
{
  "id": "uuid",
  "name": "Aldric el Valiente",
  "race": "Humano",
  "class": "Guerrero",
  "level": 5,
  "xp": 6500,
  "xpToNext": 14000,

  "attributes": {
    "strength": 16,
    "dexterity": 12,
    "constitution": 14,
    "intelligence": 10,
    "wisdom": 11,
    "charisma": 13
  },

  "combat": {
    "hp": 45,
    "maxHp": 52,
    "ac": 18,
    "initiative": "+1",
    "speed": 30
  },

  "resources": {
    "mana": 0,
    "maxMana": 0,
    "stamina": 100,
    "maxStamina": 100
  },

  "skills": {
    "proficient": ["Atletismo", "Intimidación", "Percepción"],
    "expertise": []
  },

  "inventory": {
    "equipped": {
      "weapon": "Espada Larga +1",
      "armor": "Cota de Mallas",
      "shield": "Escudo de Acero"
    },
    "backpack": [
      { "name": "Poción de Curación", "quantity": 3 },
      { "name": "Cuerda (15m)", "quantity": 1 },
      { "name": "Antorcha", "quantity": 5 }
    ],
    "gold": 127
  },

  "status": {
    "condition": "Saludable",
    "effects": [],
    "location": "Taberna del Dragón Rojo"
  }
}
```

---

## 7. Sistema de Combate

### 7.1 Iniciativa

Al comenzar un combate:

1. Cada participante tira d20 + modificador de Destreza
2. Orden de mayor a menor
3. Empates: mayor Destreza gana

### 7.2 Turno de Combate

Cada turno el jugador puede:

| Tipo             | Ejemplos                                             |
| ---------------- | ---------------------------------------------------- |
| **Acción**       | Atacar, Lanzar hechizo, Usar objeto, Esconderse      |
| **Acción Bonus** | Segundo ataque (ciertas clases), habilidades rápidas |
| **Movimiento**   | Hasta velocidad base (generalmente 30 pies)          |
| **Reacción**     | Ataque de oportunidad, contraataques                 |

### 7.3 Ataque

```
Tirada de Ataque = d20 + Modificador de Atributo + Proficiencia (si aplica)

Si Tirada ≥ AC del enemigo → IMPACTO
  → Tirada de Daño = Dado del arma + Modificador de Atributo

Si Natural 20 → CRÍTICO
  → Dados de daño se duplican

Si Natural 1 → PIFIA
  → Fallo automático + posible efecto negativo
```

### 7.4 Tipos de Daño

| Tipo        | Resistencias Comunes |
| ----------- | -------------------- |
| Cortante    | Esqueletos           |
| Perforante  | -                    |
| Contundente | -                    |
| Fuego       | Demonios             |
| Frío        | Elementales de fuego |
| Rayo        | Golems               |
| Veneno      | No-muertos           |
| Necrótico   | Celestiales          |
| Radiante    | No-muertos, demonios |
| Psíquico    | Constructos          |

### 7.5 Condiciones de Estado

| Condición        | Efecto                                         |
| ---------------- | ---------------------------------------------- |
| **Envenenado**   | Desventaja en ataques y checks                 |
| **Aturdido**     | No puede moverse, hablar o actuar              |
| **Cegado**       | Falla checks de visión, desventaja en ataques  |
| **Paralizado**   | Incapacitado, falla tiradas de FUE/DES         |
| **Asustado**     | Desventaja mientras ve la fuente del miedo     |
| **Encantado**    | No puede atacar al encantador                  |
| **Derribado**    | Desventaja en ataques, enemigos tienen ventaja |
| **Agarrado**     | Velocidad 0                                    |
| **Inconsciente** | Incapacitado, tiradas de muerte                |

### 7.6 Muerte y Tiradas de Salvación

Cuando HP llega a 0:

1. El personaje cae **Inconsciente**
2. Cada turno hace una **Tirada de Muerte** (d20)
   - 10+ = Éxito
   - 1-9 = Fallo
   - Natural 1 = 2 fallos
   - Natural 20 = Recupera 1 HP
3. **3 Éxitos** = Estabilizado (vivo pero inconsciente)
4. **3 Fallos** = Muerte del personaje

---

## 8. Sistema de Progresión

### 8.1 Tabla de Niveles

| Nivel | XP Requerido | Proficiencia | HP (Guerrero) |
| ----- | ------------ | ------------ | ------------- |
| 1     | 0            | +2           | 10 + CON      |
| 2     | 300          | +2           | +1d10 + CON   |
| 3     | 900          | +2           | +1d10 + CON   |
| 4     | 2,700        | +2           | +1d10 + CON   |
| 5     | 6,500        | +3           | +1d10 + CON   |
| 6     | 14,000       | +3           | +1d10 + CON   |
| 7     | 23,000       | +3           | +1d10 + CON   |
| 8     | 34,000       | +3           | +1d10 + CON   |
| 9     | 48,000       | +4           | +1d10 + CON   |
| 10    | 64,000       | +4           | +1d10 + CON   |

### 8.2 Recompensas por Nivel

Al subir de nivel, el jugador recibe:

- **HP adicional** según clase
- **Aumento de Proficiencia** (niveles 5, 9, 13, 17)
- **Ability Score Improvement** (niveles 4, 8, 12, 16, 19)
  - +2 a un atributo O +1 a dos atributos O un Feat
- **Nuevas habilidades de clase**

### 8.3 XP por Actividad

| Actividad              | XP Base     |
| ---------------------- | ----------- |
| Derrotar enemigo CD 5  | 25 XP       |
| Derrotar enemigo CD 10 | 50 XP       |
| Derrotar enemigo CD 15 | 100 XP      |
| Derrotar enemigo CD 20 | 200 XP      |
| Derrotar boss          | 500-2000 XP |
| Completar quest menor  | 100 XP      |
| Completar quest mayor  | 500 XP      |
| Completar quest épica  | 2000 XP     |
| Roleplay excepcional   | 50 XP       |
| Explorar área nueva    | 25 XP       |

---

## 9. Economía del Juego

### 9.1 Monedas

| Moneda       | Abreviación | Equivalencia |
| ------------ | ----------- | ------------ |
| Cobre (cp)   | cp          | 1            |
| Plata (sp)   | sp          | 10 cp        |
| Oro (gp)     | gp          | 100 cp       |
| Platino (pp) | pp          | 1000 cp      |

### 9.2 Precios de Referencia

#### Equipo Básico

| Item               | Precio  |
| ------------------ | ------- |
| Daga               | 2 gp    |
| Espada corta       | 10 gp   |
| Espada larga       | 15 gp   |
| Arco largo         | 50 gp   |
| Armadura de cuero  | 10 gp   |
| Cota de mallas     | 75 gp   |
| Armadura de placas | 1500 gp |
| Escudo             | 10 gp   |

#### Consumibles

| Item                             | Precio |
| -------------------------------- | ------ |
| Poción de curación (2d4+2)       | 50 gp  |
| Poción de curación mayor (4d4+4) | 150 gp |
| Antídoto                         | 50 gp  |
| Ración (1 día)                   | 5 sp   |
| Antorcha (10)                    | 1 gp   |
| Cuerda (15m)                     | 1 gp   |

#### Servicios

| Servicio                     | Precio   |
| ---------------------------- | -------- |
| Habitación simple (noche)    | 5 sp     |
| Habitación buena (noche)     | 2 gp     |
| Comida en taberna            | 5 sp     |
| Curación menor (templo)      | 10 gp    |
| Resurrección (si disponible) | 1000+ gp |
| Identificar objeto mágico    | 25 gp    |

### 9.3 Loot Tables

#### Tabla: Enemigo Común (CR 1-4)

| d100  | Resultado            |
| ----- | -------------------- |
| 01-50 | 1d6 × 10 cp          |
| 51-75 | 1d6 × 5 sp           |
| 76-90 | 1d6 gp               |
| 91-95 | Item común aleatorio |
| 96-99 | Poción de curación   |
| 00    | Item poco común      |

#### Tabla: Jefe (CR 5-10)

| d100  | Resultado       |
| ----- | --------------- |
| 01-30 | 2d6 × 10 gp     |
| 31-60 | 4d6 × 10 gp     |
| 61-80 | Item poco común |
| 81-95 | Item raro       |
| 96-99 | Item muy raro   |
| 00    | Item legendario |

---

## 10. Sistema de Quests

### 10.1 Tipos de Quest

| Tipo            | Descripción                        | Duración           |
| --------------- | ---------------------------------- | ------------------ |
| **Principal**   | Historia central, narrativa épica  | Múltiples sesiones |
| **Secundaria**  | Historias paralelas, worldbuilding | 1-3 sesiones       |
| **Diaria**      | Tareas simples, repetibles         | 1 sesión           |
| **Bounty**      | Cazar monstruo/criminal específico | 1-2 sesiones       |
| **Exploración** | Descubrir nuevo área/dungeon       | Variable           |

### 10.2 Estructura de Quest

```
┌────────────────────────────────────────┐
│           QUEST: El Dragón Negro       │
├────────────────────────────────────────┤
│ Tipo: Principal                        │
│ Dificultad: ⭐⭐⭐⭐ (Épica)            │
│ Recompensa: 2000 XP, 500 gp, Item Raro │
├────────────────────────────────────────┤
│ OBJETIVOS:                             │
│ ☐ Hablar con el Alcalde de Riverbend   │
│ ☐ Investigar los ataques               │
│ ☐ Encontrar la guarida del dragón      │
│ ☐ Derrotar o negociar con el dragón    │
├────────────────────────────────────────┤
│ OBJETIVOS OPCIONALES:                  │
│ ☐ Salvar a los aldeanos capturados     │
│ ☐ Recuperar el tesoro robado           │
│ ☐ Descubrir quién despertó al dragón   │
└────────────────────────────────────────┘
```

### 10.3 Generación Procedural de Quests

La IA genera quests basándose en:

1. **Ubicación actual** del jugador
2. **Nivel** del personaje
3. **Historia previa** de la partida
4. **Acciones** del jugador
5. **NPCs** conocidos

---

## 11. Generación de Contenido IA

### 11.1 Triggers de Imagen

| Trigger                | Descripción                  | Frecuencia      |
| ---------------------- | ---------------------------- | --------------- |
| **Inicio de aventura** | Primera imagen de la partida | 1 por partida   |
| **Creación de PJ**     | Retrato del personaje        | 1 por personaje |
| **Nueva ubicación**    | Escena del lugar importante  | Al llegar       |
| **NPC importante**     | Retrato del personaje        | Al conocerlo    |
| **Objeto único**       | Imagen del item especial     | Al encontrarlo  |
| **Evento crítico**     | Momento épico de la historia | Decisión IA     |
| **Boss/Jefe**          | Enemigo importante           | Al encontrarlo  |

### 11.2 Prompt Engineering para Imágenes

```
Plantilla base:
"{estilo}, {sujeto}, {acción}, {ambiente}, {iluminación}, {detalles}"

Ejemplo:
"Fantasy digital art, a scarred elven rogue, sneaking through shadows,
inside a torch-lit dungeon corridor, dramatic lighting from behind,
wearing dark leather armor, holding twin daggers, detailed, 4k"
```

### 11.3 Consistencia Visual

Para mantener consistencia:

- **Character seed:** Descripción fija del personaje para todas las imágenes
- **Style lock:** Mismo estilo artístico toda la partida
- **Context carry:** Elementos narrativos recientes incluidos

---

## 12. Flujo UI/UX

### 12.1 Layout Principal (GameScreen)

```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │              IMAGE VIEWER                         │  │
│  │         (Imagen generada por IA)                  │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────┐  ┌───────────────────────────┐ │
│  │   CHARACTER HUD     │  │                           │ │
│  │ ┌─────────────────┐ │  │    NARRATIVE PANEL        │ │
│  │ │ [Avatar] Aldric │ │  │                           │ │
│  │ │ Guerrero Nv.5   │ │  │ La taberna está llena de  │ │
│  │ │                 │ │  │ aventureros. Un hombre    │ │
│  │ │ HP ████████░░   │ │  │ misterioso se acerca...   │ │
│  │ │ 45/52           │ │  │                           │ │
│  │ │                 │ │  │ [Dado: d20 = 15 ✓]        │ │
│  │ │ Stamina ███████ │ │  │                           │ │
│  │ │ 100/100         │ │  │ Tu percepción detecta     │ │
│  │ │                 │ │  │ que oculta algo bajo su   │ │
│  │ │ 💰 127 gp       │ │  │ capa...                   │ │
│  │ └─────────────────┘ │  │                           │ │
│  │ [📦 Inventario]     │  │                           │ │
│  └─────────────────────┘  └───────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [⚔️] [🛡️] [🗣️] [🏃] │  ¿Qué quieres hacer?      │  │
│  │                     │  [________________________] │  │
│  │   Quick Actions     │         [Enviar →]         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Quick Actions

| Botón | Acción   | Descripción               |
| ----- | -------- | ------------------------- |
| ⚔️    | Atacar   | Ataque básico al objetivo |
| 🛡️    | Defender | Postura defensiva (+2 AC) |
| 🗣️    | Hablar   | Iniciar diálogo           |
| 🏃    | Huir     | Intentar escapar          |

### 12.3 Feedback Visual

- **IA Pensando:** Indicador animado mientras la IA procesa
- **Tirada de dado:** Animación de dado con resultado
- **Daño recibido:** Screen shake + flash rojo
- **Level up:** Efectos de partículas doradas
- **Crítico:** Cámara lenta + efectos especiales

---

## 13. Multijugador

### 13.1 Sistema de Salas

- **1-4 jugadores** por sala
- **Código de 6 dígitos** para invitar
- **IA-DJ** como árbitro neutral
- **Turnos gestionados** por servidor

### 13.2 Flujo Multijugador

```
1. Host crea sala → Recibe código (ABC123)
2. Invitados se unen con código
3. Cada jugador crea su personaje (privado)
4. Host inicia aventura
5. IA narra introducción conjunta
6. Sistema de turnos:
   - Exploración: Acciones simultáneas
   - Combate: Por iniciativa
   - Diálogo: Round-robin
```

### 13.3 Chat

- **In-Character (IC):** Mensajes narrativos
- **Out-of-Character (OOC):** Mensajes entre jugadores
- **Whisper:** Mensajes privados a otro jugador

---

## 14. Monetización

### 14.1 Modelo Freemium

| Plan        | Precio | IA/mes | Imágenes | Guardados | Features       |
| ----------- | ------ | ------ | -------- | --------- | -------------- |
| **Free**    | $0     | 100    | 10       | 3         | Core game      |
| **Basic**   | $9.99  | 1,000  | 50       | 10        | + Sin ads      |
| **Premium** | $29.99 | 10,000 | 500      | 50        | + Multijugador |
| **Supreme** | $99.99 | ∞      | ∞        | ∞         | + Early access |

### 14.2 Filosofía de Monetización

- ✅ **Sí:** Más contenido, más acciones, conveniencia
- ❌ **No:** Pay-to-win, stats comprados, ventaja en combate
- ✅ **Sí:** Cosméticos, temas visuales
- ❌ **No:** Bloquear contenido narrativo tras paywall

---

## 15. Ética y Seguridad

### 15.1 Moderación de Contenido

**Prohibido:**

- Contenido sexual explícito
- Violencia extrema/gore detallado
- Discurso de odio
- Contenido que involucre menores
- Promoción de actividades ilegales

**Implementación:**

- Filtros de entrada de usuario
- Revisión de outputs de IA
- Sistema de reportes
- Baneos por violaciones

### 15.2 Privacidad

- Datos de usuario encriptados
- Partidas guardadas en servidores seguros
- Opción de exportar/eliminar datos (GDPR)
- No vendemos datos a terceros
- Prompts/respuestas no usados para entrenar IA

### 15.3 Rating Esperado

- **PEGI:** 12 (Violencia de fantasía)
- **ESRB:** T (Teen)
- **USK:** 12
- **GRAC:** 15

---

## 16. Roadmap

### v1.0 - MVP (Actual)

- ✅ Backend completo
- 🚧 Frontend en desarrollo
- Single player funcional
- Sistema de personajes básico
- Combate y exploración
- Generación de imágenes

### v1.5 - Social

- Multijugador 1-4 jugadores
- Sistema de salas
- Chat IC/OOC
- Compartir momentos épicos

### v2.0 - Profundidad

- Sistema de progresión completo
- Más razas y clases
- Crafting básico
- Campañas guardadas

### v2.5 - Inmersión

- TTS para narración
- Música generativa/dinámica
- Más triggers de imagen
- Efectos visuales avanzados

### v3.0 - Comunidad

- Editor de campañas
- Marketplace de escenarios
- Torneos y eventos
- Logros globales

---

## 📚 Referencias

- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Estado del Proyecto](./ESTADO_PROYECTO.md)
- [Competidores](./COMPETIDORES.md)
- [Ruta al Lanzamiento](./RUTA_LANZAMIENTO.md)

---

> 🎮 **"No juegues una historia generada. VIVE una aventura donde tus decisiones importan."**
