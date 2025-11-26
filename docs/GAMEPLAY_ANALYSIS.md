# 🎮 Análisis de Jugabilidad - RPG-AI Supreme

> **Documento**: Evaluación de Experiencia de Usuario  
> **Fecha**: 26 de Noviembre, 2025  
> **Propósito**: Análisis profundo de la jugabilidad actual y áreas de mejora

---

## Resumen Ejecutivo

RPG-AI Supreme tiene una **base técnica sólida** con arquitectura extensible y IA de calidad, pero **carece de los
elementos esenciales** que mantienen a los jugadores enganchados: objetivos claros, progresión tangible y ritmo de
combate definido.

**Puntuación General**: ⭐⭐⭐ (3/5) - Funcional, no adictivo

---

## 1. Primera Impresión del Jugador (0-5 minutos)

### Lo que experimenta actualmente:

1. ✅ Pantalla de creación de personaje rica en opciones
2. ✅ Selección de raza con ilustraciones y descripciones
3. ✅ Selección de clase con habilidades visibles
4. ✅ Sistema de atributos intuitivo
5. ❌ No hay tutorial
6. ❌ No hay introducción narrativa
7. ❌ Aparece en la plaza sin contexto

### Emoción actual: **Confusión después de creación**

### Emoción objetivo: **Anticipación y curiosidad**

### Recomendación:

```
Después de crear personaje:
1. Cinemática de texto: "Llegas al Valle de Luminar..."
2. Primer NPC te saluda y da contexto
3. Primera misión automática: "Habla con el Tabernero"
4. Tutorial implícito en primeros 5 minutos
```

---

## 2. Exploración (5-15 minutos)

### Análisis del Mundo Actual

**Tamaño**: 5 locaciones conectadas - **Muy pequeño**

```
Mapa actual:
     [Claro]
        │
[Herrería]─[Plaza]─[Bosque]
        │
    [Taberna]
```

### Problemas identificados:

| Problema          | Impacto                        | Severidad |
| ----------------- | ------------------------------ | --------- |
| Mundo muy pequeño | Exploración dura 3 minutos     | 🔴 Alto   |
| NPCs sin diálogo  | No hay razón para visitarlos   | 🔴 Alto   |
| Sin secretos      | No hay recompensa por explorar | 🟡 Medio  |
| Sin eventos       | Mundo se siente muerto         | 🟡 Medio  |

### Experiencia ideal de exploración:

```
Jugador entra al Bosque
    ↓
Descripción atmosférica (IA)
    ↓
Evento aleatorio: "Escuchas un ruido entre los arbustos"
    ↓
Elección: Investigar / Ignorar / Prepararse
    ↓
Resultado con consecuencias
```

---

## 3. Combate (Análisis Profundo)

### Estado Actual del Combate

```
[Jugador escribe "atacar lobo"]
         ↓
[Servidor calcula daño]
         ↓
[IA narra resultado]
         ↓
[...silencio... ¿ahora qué?]
```

### Problemas Críticos:

1. **Sin sistema de turnos**: Jugador no sabe cuándo actuar
2. **Sin feedback de enemigo**: Lobo no contraataca automáticamente
3. **Sin información visible**: HP del enemigo, intención, estado
4. **Sin cooldowns visuales**: No sabe cuándo puede usar habilidades
5. **Sin estrategia**: Siempre es mejor "atacar"

### Flujo de Combate Propuesto:

```
┌─────────────────────────────────────────────────────────┐
│                   INICIO DE COMBATE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Cálculo de Iniciativa]                                │
│        ↓                                                 │
│  ┌─ RONDA 1 ────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  [Turno más rápido primero]                      │   │
│  │        ↓                                          │   │
│  │  [Si es jugador] → Mostrar opciones:             │   │
│  │        • ⚔️ Atacar (elegir target)               │   │
│  │        • 🛡️ Defender (tipo de defensa)           │   │
│  │        • ✨ Magia (lista de hechizos)            │   │
│  │        • 🎒 Item (lista de consumibles)          │   │
│  │        • 🏃 Huir (% basado en velocidad)         │   │
│  │        ↓                                          │   │
│  │  [Si es enemigo] → IA decide según behavior      │   │
│  │        ↓                                          │   │
│  │  [Narrar resultado con daño/efectos]             │   │
│  │        ↓                                          │   │
│  │  [Siguiente en orden de iniciativa]              │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│        ↓                                                 │
│  [Fin de ronda] → Aplicar DoT, reducir buffs/debuffs    │
│        ↓                                                 │
│  [¿Combate terminó?]                                    │
│        │                                                 │
│    NO ─┴─ SI                                            │
│    ↓      ↓                                             │
│  [Ronda+1] [Victoria/Derrota]                           │
│             ↓                                            │
│        [Loot + XP]                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### UI de Combate Propuesta:

```
┌─────────────────────────────────────────────────────────┐
│  ══════════════ COMBATE ══════════════                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🐺 Lobo Terrible (Nivel 3)                             │
│  HP: [████████████░░░░░░░░] 60/80                       │
│  Estado: Normal                                          │
│  Intención: 🗡️ Va a atacar                              │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  "El lobo gruñe mostrando sus colmillos.                │
│   Sus ojos amarillos brillan con hambre..."             │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ► ES TU TURNO                                          │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ ⚔️ ATACAR │ │ 🛡️ DEFEND │ │ ✨ MAGIA │ │ 🎒 ITEMS │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  👤 Thorin (Guerrero Nivel 2)                           │
│  HP: [████████████████░░░░] 80/100                      │
│  Stamina: [██████████████████░░] 45/50                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Progresión del Personaje

### Estado Actual

| Nivel | Lo que gana el jugador |
| ----- | ---------------------- |
| 1 → 2 | Número cambia          |
| 2 → 3 | Número cambia          |
| ...   | ...                    |

**Problema**: Subir de nivel no genera dopamina

### Progresión Propuesta

| Nivel | Recompensa                             |
| ----- | -------------------------------------- |
| 2     | +15 HP, +5 Stamina, Elegir +1 atributo |
| 3     | **Nueva habilidad de clase**           |
| 4     | +15 HP, +5 Stamina, Elegir +1 atributo |
| 5     | **Habilidad especial + Título**        |
| 6     | +15 HP, +5 Stamina, Elegir +1 atributo |
| 7     | **Nueva habilidad de clase**           |

### Habilidades por Clase y Nivel

#### Guerrero

| Nivel | Habilidad        | Efecto                            |
| ----- | ---------------- | --------------------------------- |
| 3     | Golpe Aturdidor  | 50% chance aturdir 1 turno        |
| 5     | Segundo Viento   | Recuperar 30% HP (1/combate)      |
| 7     | Furia Berserker  | +50% daño, -20% defensa, 3 turnos |
| 10    | Golpe Devastador | 3x daño, cooldown 5 turnos        |

#### Mago

| Nivel | Habilidad         | Efecto                     |
| ----- | ----------------- | -------------------------- |
| 3     | Escudo Arcano     | Absorbe 30 daño            |
| 5     | Tormenta de Fuego | AoE 15 daño a todos        |
| 7     | Telequinesis      | Usar item sin gastar turno |
| 10    | Invocación        | Invocar elemental aliado   |

#### Pícaro

| Nivel | Habilidad      | Efecto                         |
| ----- | -------------- | ------------------------------ |
| 3     | Ataque Furtivo | +100% daño si enemigo no te ve |
| 5     | Evasión        | Esquivar siguiente ataque      |
| 7     | Veneno         | DoT 5 daño por 5 turnos        |
| 10    | Golpe Mortal   | Ejecución si enemigo <20% HP   |

---

## 5. Sistema de Recompensas

### Análisis del Loop de Recompensa Actual

```
[Matar enemigo] → [Texto: "Lo derrotaste"] → [Nada más]
```

**Problema**: Sin dopamina, sin motivación para combatir

### Loop de Recompensa Propuesto

```
[Matar enemigo]
      ↓
[Animación de victoria]
      ↓
[Pantalla de loot]
┌─────────────────────────────────────────┐
│       ¡VICTORIA!                        │
│                                          │
│  🪙 +15 Oro                              │
│  ⭐ +25 XP                               │
│                                          │
│  Items obtenidos:                        │
│  ├─ 🦴 Colmillo de Lobo (Material)      │
│  └─ 🧪 Poción Menor (Consumible)        │
│                                          │
│         [Continuar]                      │
└─────────────────────────────────────────┘
      ↓
[Barra de XP sube visiblemente]
      ↓
[Si sube nivel: Fanfarria + Pantalla especial]
```

### Tipos de Recompensa

| Tipo            | Frecuencia     | Ejemplos                             |
| --------------- | -------------- | ------------------------------------ |
| **Inmediata**   | Cada combate   | Oro, XP, loot común                  |
| **Corto plazo** | Cada 10-15 min | Completar misión, subir nivel        |
| **Medio plazo** | Cada sesión    | Completar capítulo, desbloquear zona |
| **Largo plazo** | Cada semana    | Achievements, colecciones            |

---

## 6. Interacción con NPCs

### Estado Actual

```
[Jugador]: "Hablar con tabernero"
[IA]: "El tabernero te saluda y te ofrece una bebida"
[Jugador]: "...¿y ahora qué?"
```

### Sistema de Diálogos Propuesto

```
┌─────────────────────────────────────────────────────────┐
│  🍺 TABERNERO GROM                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  "¡Ah, otro aventurero! El Valle necesita gente         │
│   valiente como tú. ¿Qué puedo hacer por ti?"           │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ► [Busco trabajo] → Abre lista de misiones             │
│                                                          │
│  ► [Quiero comprar algo] → Abre tienda                  │
│                                                          │
│  ► [¿Qué noticias hay?] → Información del mundo        │
│                                                          │
│  ► [Cuéntame sobre ti] → Lore del NPC                   │
│                                                          │
│  ► [Hasta luego] → Cierra diálogo                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Funciones de cada NPC

| NPC               | Ubicación  | Funciones                                 |
| ----------------- | ---------- | ----------------------------------------- |
| **Tabernero**     | Taberna    | Misiones, rumores, descanso               |
| **Herrero**       | Herrería   | Comprar/vender armas, reparar             |
| **Sanadora**      | Templo     | Curar, remover maldiciones, bendecir      |
| **Mercader**      | Plaza      | Comprar/vender items generales            |
| **Guardia**       | Plaza      | Misiones de combate, información enemigos |
| **Anciano Sabio** | Biblioteca | Lore, identificar items, quests mágicos   |

---

## 7. Retención a Largo Plazo

### Mecánicas de Retención Propuestas

#### 7.1 Daily Login Rewards

| Día | Recompensa          |
| --- | ------------------- |
| 1   | 50 Oro              |
| 2   | Poción de Vida      |
| 3   | 100 Oro             |
| 4   | Poción de Maná      |
| 5   | 200 Oro             |
| 6   | Item aleatorio Raro |
| 7   | Cofre Legendario    |

#### 7.2 Misiones Diarias

```
┌─ MISIONES DIARIAS ──────────────────────────────────────┐
│                                                          │
│  ☐ Derrota 10 enemigos          [████░░░░░░] 4/10      │
│    Recompensa: 100 XP + 25 Oro                          │
│                                                          │
│  ☑ Completa una misión          [██████████] ✓         │
│    Recompensa: 50 XP (RECLAMADO)                        │
│                                                          │
│  ☐ Descubre una nueva zona      [░░░░░░░░░░] 0/1       │
│    Recompensa: 150 XP                                    │
│                                                          │
│  Tiempo restante: 14:32:15                              │
└─────────────────────────────────────────────────────────┘
```

#### 7.3 Colecciones

| Colección                | Progreso | Recompensa al Completar  |
| ------------------------ | -------- | ------------------------ |
| Bestiario (50 criaturas) | 12/50    | Título "Cazador Experto" |
| Armas Legendarias (10)   | 2/10     | +5% daño permanente      |
| Todas las Zonas (30)     | 8/30     | Montura especial         |
| Achievements (100)       | 23/100   | Skin exclusiva           |

---

## 8. Monetización y Valor Premium

### Análisis de Conversión

**Problema actual**: Los usuarios free no tienen incentivo para pagar

### Propuesta de Valor por Tier

| Feature            | Free     | Basic | Premium     | Supreme |
| ------------------ | -------- | ----- | ----------- | ------- |
| Acciones IA/día    | 10       | 50    | 200         | ∞       |
| Partidas guardadas | 3        | 10    | ∞           | ∞       |
| Imágenes AI        | Baja res | HD    | HD          | 4K      |
| Modo Infinito      | ❌       | ✅    | ✅          | ✅      |
| Daily Rewards      | Básicos  | x1.5  | x2          | x3      |
| Clases extra       | ❌       | ❌    | 2           | 4       |
| Razas extra        | ❌       | ❌    | 2           | 4       |
| Soporte            | ❌       | Email | Prioritario | VIP     |
| Beta features      | ❌       | ❌    | ❌          | ✅      |

### Puntos de Conversión

1. **Soft paywall**: "Has usado tus 10 acciones de hoy. ¡Vuelve mañana o mejora tu plan!"
2. **Momento épico**: "¡Increíble combate! Con Premium verías una imagen de esta escena"
3. **Progresión**: "Has alcanzado el nivel 5. Desbloquea clases avanzadas con Premium"

---

## 9. Accesibilidad y Onboarding

### Tutorial Implícito Propuesto

| Paso | Acción del Jugador               | Sistema Enseñado    |
| ---- | -------------------------------- | ------------------- |
| 1    | Crear personaje                  | Atributos, clases   |
| 2    | Prólogo narrativo                | Cómo funciona la IA |
| 3    | "Explora la plaza"               | Movimiento          |
| 4    | "Habla con el tabernero"         | NPCs, diálogos      |
| 5    | Recibe primera misión            | Sistema de quests   |
| 6    | Ir al bosque                     | Navegación mapa     |
| 7    | Combate tutorial                 | Sistema de combate  |
| 8    | Recoger loot                     | Inventario          |
| 9    | Volver a entregar misión         | Completar quests    |
| 10   | "¡Ahora eres libre de explorar!" | Fin tutorial        |

### Tooltips Contextuales

```
┌─ Primera vez viendo esto ───────────────────────────────┐
│                                                          │
│  💡 STAMINA                                             │
│                                                          │
│  La stamina se usa para acciones físicas como           │
│  atacar y defender. Se regenera al descansar.           │
│                                                          │
│  [Entendido]              [No mostrar más]              │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Conclusiones y Prioridades

### Impacto vs Esfuerzo

```
        Alto Impacto
             ▲
             │
    M3 ●     │     ● M1
   (Turnos)  │   (Misiones)
             │
    M4 ●     │     ● M2
   (Loot)    │   (Narrativa)
             │
─────────────┼─────────────► Bajo Esfuerzo
             │
    M9 ●     │     ● M5
   (Mapa)    │   (NPCs)
             │
    M12 ●    │     ● M6
  (Dailies)  │   (Magia UI)
             │
        Bajo Impacto
```

### Orden de Implementación Recomendado

1. **🔴 M1: Misiones** - Sin esto no hay objetivo
2. **🔴 M3: Combate por turnos** - Sin esto el combate es confuso
3. **🔴 M4: Loot** - Sin esto no hay recompensa
4. **🔴 M2: Arco narrativo** - Sin esto no hay historia
5. **🟡 M5: NPCs** - Mejora inmersión
6. **🟡 M8: Progresión** - Mejora retención
7. **🟡 M6/M7: UI** - Quality of life
8. **🟢 Resto** - Polish

---

_Este documento debe revisarse después de implementar las mejoras críticas para evaluar el impacto real en las métricas
de jugabilidad._
