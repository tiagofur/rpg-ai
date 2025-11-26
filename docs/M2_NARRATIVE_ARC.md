# 📖 M2: Sistema de Arco Narrativo por Sesión

> **Documento**: Especificación Técnica de Diseño  
> **Fecha**: 26 de Noviembre, 2025  
> **Estado**: En Diseño - Previo a Implementación  
> **Prioridad**: 🔴 CRÍTICA

---

## 📋 Índice

1. [Problema a Resolver](#problema-a-resolver)
2. [Objetivos del Sistema](#objetivos-del-sistema)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura Narrativa de 3 Actos](#estructura-narrativa-de-3-actos)
5. [Interfaces y Tipos](#interfaces-y-tipos)
6. [Plantillas de Capítulos](#plantillas-de-capítulos)
7. [Integración con IA](#integración-con-ia)
8. [Integración con Sistemas Existentes](#integración-con-sistemas-existentes)
9. [Archivos a Crear](#archivos-a-crear)
10. [Plan de Implementación](#plan-de-implementación)
11. [Métricas de Éxito](#métricas-de-éxito)

---

## 🎯 Problema a Resolver

### Situación Actual

- El jugador entra al juego y recibe eventos aleatorios sin conexión
- No hay sensación de progresión narrativa
- Las sesiones no tienen un cierre satisfactorio
- Sin arco dramático, el jugador no se siente "en una historia"
- La IA genera contenido sin contexto de dónde está la narrativa

### Impacto

| Métrica                        | Sin Arco Narrativo | Con Arco Narrativo (objetivo) |
| ------------------------------ | ------------------ | ----------------------------- |
| Tiempo de sesión promedio      | ~10 min            | >25 min                       |
| Retención D1                   | ~20%               | >45%                          |
| Completar primera "historia"   | N/A                | >60%                          |
| Sensación de progreso (survey) | 2/5                | 4/5                           |

---

## 🎯 Objetivos del Sistema

### Objetivos Primarios

1. **Cada sesión = 1 capítulo completo** con inicio, desarrollo y cierre
2. **Tensión dramática creciente** hasta un clímax satisfactorio
3. **Cierre natural** que invite a volver (cliffhanger o resolución + gancho)
4. **Integración con misiones** - las quests son parte del arco

### Objetivos Secundarios

1. Permitir sesiones cortas (15 min) y largas (60+ min)
2. Adaptar ritmo según acciones del jugador
3. Guardar estado narrativo entre sesiones
4. Ofrecer variedad de arcos (acción, misterio, social, exploración)

---

## 🏗️ Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                     NARRATIVE MANAGER                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │ ChapterEngine  │  │ PhaseTracker   │  │ ThreadManager  │     │
│  │                │  │                │  │                │     │
│  │ - currentChap  │  │ - phase        │  │ - mainThread   │     │
│  │ - chapterType  │  │ - progress     │  │ - sideThreads  │     │
│  │ - timeInChap   │  │ - transitions  │  │ - resolution   │     │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘     │
│          │                   │                   │               │
│          └───────────────────┼───────────────────┘               │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │  NarrativeState   │                         │
│                    │                   │                         │
│                    │  - chapter        │                         │
│                    │  - phase          │                         │
│                    │  - threads[]      │                         │
│                    │  - tension        │                         │
│                    │  - hooks[]        │                         │
│                    └─────────┬─────────┘                         │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ QuestManager │      │ AIGateway    │      │ CombatManager│
│              │      │              │      │              │
│ Misiones     │      │ Prompts      │      │ Encuentros   │
│ activas se   │      │ contextuales │      │ escalados    │
│ alinean con  │      │ por fase     │      │ según fase   │
│ la narrativa │      │ narrativa    │      │ del arco     │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 📚 Estructura Narrativa de 3 Actos

### Modelo de Tensión Dramática

```
Tensión
  ▲
  │                              ★ CLÍMAX
  │                           ╱     ╲
  │                        ╱          ╲
  │                     ╱               ╲
  │     DESARROLLO  ╱                     ╲ RESOLUCIÓN
  │              ╱                           ╲
  │           ╱                                 ╲
  │   GANCHO ●                                    ● CIERRE + HOOK
  │        ╱                                         ╲
  │      ╱
  └────●────────────────────────────────────────────────► Tiempo
     INTRO   15%      40%           75%      90%   100%
```

### Fases del Capítulo

| Fase            | % del Capítulo | Objetivo          | Contenido Típico                             |
| --------------- | -------------- | ----------------- | -------------------------------------------- |
| **HOOK**        | 0-15%          | Captar atención   | Evento dramático, misterio, peligro          |
| **DEVELOPMENT** | 15-65%         | Construir tensión | Exploración, combates, pistas, aliados       |
| **CLIMAX**      | 65-85%         | Momento cumbre    | Boss, revelación, decisión crucial           |
| **RESOLUTION**  | 85-100%        | Cierre + gancho   | Recompensas, consecuencias, teaser siguiente |

### Transiciones entre Fases

```typescript
// Condiciones para avanzar de fase
const PHASE_TRANSITIONS = {
  HOOK_TO_DEVELOPMENT: {
    conditions: [
      { type: 'time_elapsed', min: 2, max: 5 }, // minutos
      { type: 'event_triggered', event: 'hook_resolved' },
      { type: 'player_action', action: 'accepted_quest' },
    ],
    any: true, // Cualquier condición activa la transición
  },

  DEVELOPMENT_TO_CLIMAX: {
    conditions: [
      { type: 'progress', min: 60 }, // % de objetivos completados
      { type: 'time_elapsed', min: 15 },
      { type: 'narrative_threads_ready', count: 2 },
    ],
    all: false, // Al menos 2 de 3
  },

  CLIMAX_TO_RESOLUTION: {
    conditions: [
      { type: 'boss_defeated', required: true },
      { type: 'main_objective_complete', required: true },
    ],
    all: true,
  },
};
```

---

## 📝 Interfaces y Tipos

### Estado Narrativo Principal

```typescript
/**
 * Estado completo del arco narrativo de la sesión
 */
interface INarrativeState {
  /** Información del capítulo actual */
  chapter: IChapterState;

  /** Fase actual dentro del capítulo */
  phase: NarrativePhase;

  /** Progreso dentro de la fase actual (0-100) */
  phaseProgress: number;

  /** Nivel de tensión dramática (0-100) */
  tensionLevel: number;

  /** Hilos narrativos activos */
  threads: INarrativeThread[];

  /** Ganchos para el próximo capítulo */
  nextChapterHooks: IChapterHook[];

  /** Tiempo en sesión actual (ms) */
  sessionTime: number;

  /** Eventos narrativos ocurridos */
  narrativeLog: INarrativeEvent[];
}

/**
 * Fases del arco narrativo
 */
type NarrativePhase = 'HOOK' | 'DEVELOPMENT' | 'CLIMAX' | 'RESOLUTION';

/**
 * Estado del capítulo
 */
interface IChapterState {
  /** ID único del capítulo */
  id: string;

  /** Número de capítulo en la historia del jugador */
  number: number;

  /** Tipo de capítulo (determina tono y estructura) */
  type: ChapterType;

  /** Título del capítulo */
  title: string;

  /** Conflicto principal a resolver */
  mainConflict: string;

  /** Escenario principal */
  setting: string;

  /** Antagonista o fuerza opositora */
  antagonist?: IAntagonist;

  /** Timestamp de inicio */
  startedAt: Date;

  /** Si el capítulo fue completado */
  completed: boolean;

  /** Resultado del capítulo */
  outcome?: ChapterOutcome;
}

/**
 * Tipos de capítulos disponibles
 */
type ChapterType =
  | 'ACTION' // Combate intenso, persecución, supervivencia
  | 'MYSTERY' // Investigación, pistas, revelación
  | 'SOCIAL' // Diplomacia, alianzas, intriga
  | 'EXPLORATION' // Descubrimiento, viaje, maravillas
  | 'HORROR' // Tensión, terror, escape
  | 'HEIST'; // Planificación, infiltración, escape

/**
 * Resultado posible de un capítulo
 */
type ChapterOutcome =
  | 'VICTORY' // Éxito completo
  | 'PYRRHIC_VICTORY' // Éxito con costo
  | 'PARTIAL_SUCCESS' // Objetivo principal logrado, secundarios no
  | 'ESCAPE' // Supervivencia sin resolver conflicto
  | 'DEFEAT'; // Fallo (raro, permite retry)

/**
 * Hilo narrativo (subplot)
 */
interface INarrativeThread {
  id: string;
  description: string;
  importance: 'MAIN' | 'SIDE' | 'BACKGROUND';
  status: 'INTRODUCED' | 'DEVELOPING' | 'READY_FOR_RESOLUTION' | 'RESOLVED';
  relatedQuests: string[];
  characters: string[];
  foreshadowing: string[]; // Pistas sembradas
}

/**
 * Gancho para próximo capítulo
 */
interface IChapterHook {
  id: string;
  type: 'CLIFFHANGER' | 'MYSTERY' | 'THREAT' | 'OPPORTUNITY' | 'RELATIONSHIP';
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expiresIn?: number; // Capítulos antes de expirar
}

/**
 * Antagonista del capítulo
 */
interface IAntagonist {
  id: string;
  name: string;
  type: 'CREATURE' | 'NPC' | 'FACTION' | 'FORCE' | 'SELF';
  motivation: string;
  threatLevel: number; // 1-10
  isRecurring: boolean;
}

/**
 * Evento narrativo registrado
 */
interface INarrativeEvent {
  timestamp: Date;
  phase: NarrativePhase;
  type: NarrativeEventType;
  description: string;
  impact: 'MINOR' | 'MODERATE' | 'MAJOR' | 'PIVOTAL';
  tensionChange: number; // -20 a +20
}

type NarrativeEventType =
  | 'HOOK_TRIGGERED'
  | 'COMPLICATION_ADDED'
  | 'ALLY_GAINED'
  | 'ALLY_LOST'
  | 'REVELATION'
  | 'SETBACK'
  | 'BREAKTHROUGH'
  | 'CONFRONTATION'
  | 'RESOLUTION'
  | 'CLIFFHANGER';
```

### Configuración de Capítulos

```typescript
/**
 * Plantilla para generar capítulos
 */
interface IChapterTemplate {
  id: string;
  type: ChapterType;

  /** Requisitos para que este template sea elegible */
  requirements?: {
    minLevel?: number;
    maxLevel?: number;
    completedChapters?: string[];
    hasItem?: string[];
    inLocation?: string[];
  };

  /** Configuración del gancho inicial */
  hookConfig: IHookConfig;

  /** Complicaciones posibles durante desarrollo */
  complications: IComplication[];

  /** Configuración del clímax */
  climaxConfig: IClimaxConfig;

  /** Posibles resoluciones */
  resolutions: IResolutionConfig[];

  /** Peso para selección aleatoria */
  weight: number;
}

interface IHookConfig {
  type: 'ATTACK' | 'DISCOVERY' | 'REQUEST' | 'OMEN' | 'ARRIVAL';
  tensionBoost: number;
  promptTemplate: string;
  possibleQuests: string[];
}

interface IComplication {
  id: string;
  trigger: ComplicationTrigger;
  description: string;
  tensionChange: number;
  newThread?: Partial<INarrativeThread>;
}

type ComplicationTrigger =
  | { type: 'time'; afterMinutes: number }
  | { type: 'progress'; atPercent: number }
  | { type: 'action'; playerAction: string }
  | { type: 'random'; chance: number };

interface IClimaxConfig {
  type: 'BOSS_FIGHT' | 'FINAL_CHOICE' | 'REVELATION' | 'ESCAPE' | 'SHOWDOWN';
  enemyScaling: number; // Multiplicador de dificultad
  requiredThreadsResolved: number;
  promptTemplate: string;
}

interface IResolutionConfig {
  outcome: ChapterOutcome;
  conditions: ResolutionCondition[];
  rewards: IChapterReward;
  nextHooks: Partial<IChapterHook>[];
  epiloguePrompt: string;
}

interface IChapterReward {
  xpMultiplier: number; // 1.0 = normal, 1.5 = bonus
  goldMultiplier: number;
  bonusItems?: string[];
  reputationChanges?: { faction: string; amount: number }[];
  unlockedContent?: string[];
}
```

---

## 📚 Plantillas de Capítulos

### Capítulo 1: "El Despertar del Héroe" (Tutorial Narrativo)

```typescript
const CHAPTER_TUTORIAL: IChapterTemplate = {
  id: 'chapter_tutorial',
  type: 'ACTION',

  requirements: {
    maxLevel: 1,
    completedChapters: [], // Primer capítulo
  },

  hookConfig: {
    type: 'ATTACK',
    tensionBoost: 30,
    promptTemplate: `
      El jugador despierta en ${setting} con recuerdos fragmentados.
      Un peligro inmediato (${threat}) lo obliga a actuar.
      Debe encontrar ${objective} para sobrevivir.
      Tono: Urgente pero con esperanza.
    `,
    possibleQuests: ['quest_survive_awakening', 'quest_find_shelter'],
  },

  complications: [
    {
      id: 'first_ally',
      trigger: { type: 'progress', atPercent: 30 },
      description: 'Un NPC aparece y ofrece ayuda',
      tensionChange: -10,
      newThread: {
        description: 'Alianza con el misterioso extraño',
        importance: 'SIDE',
      },
    },
    {
      id: 'reveal_threat',
      trigger: { type: 'progress', atPercent: 60 },
      description: 'Se revela que la amenaza es parte de algo mayor',
      tensionChange: +15,
    },
  ],

  climaxConfig: {
    type: 'BOSS_FIGHT',
    enemyScaling: 0.8, // Más fácil para tutorial
    requiredThreadsResolved: 0,
    promptTemplate: `
      El jugador enfrenta al líder de ${threat}.
      Debe usar lo aprendido para derrotarlo.
      Victoria posible con estrategia básica.
    `,
  },

  resolutions: [
    {
      outcome: 'VICTORY',
      conditions: [{ type: 'boss_defeated' }],
      rewards: {
        xpMultiplier: 1.2,
        goldMultiplier: 1.0,
        bonusItems: ['item_starter_weapon_upgraded'],
        unlockedContent: ['location_village', 'chapter_templates_tier1'],
      },
      nextHooks: [
        {
          type: 'MYSTERY',
          description: 'El líder derrotado menciona un "maestro" antes de morir',
          urgency: 'MEDIUM',
        },
      ],
      epiloguePrompt: `
        Con el peligro inmediato resuelto, el jugador puede respirar.
        Pero las palabras del enemigo sugieren una amenaza mayor.
        Un nuevo camino se abre ante ${playerName}.
      `,
    },
  ],

  weight: 100, // Siempre elegido primero
};
```

### Capítulo Genérico: "La Amenaza Oculta"

```typescript
const CHAPTER_HIDDEN_THREAT: IChapterTemplate = {
  id: 'chapter_hidden_threat',
  type: 'MYSTERY',

  requirements: {
    minLevel: 2,
  },

  hookConfig: {
    type: 'DISCOVERY',
    tensionBoost: 20,
    promptTemplate: `
      Mientras ${playerName} explora ${currentLocation}, encuentra 
      evidencia perturbadora: ${mysteryElement}.
      Los lugareños actúan extraño. Algo no está bien.
    `,
    possibleQuests: ['quest_investigate_village', 'quest_find_clues'],
  },

  complications: [
    {
      id: 'false_suspect',
      trigger: { type: 'progress', atPercent: 25 },
      description: 'Un sospechoso obvio resulta ser inocente',
      tensionChange: +10,
    },
    {
      id: 'disappearance',
      trigger: { type: 'progress', atPercent: 50 },
      description: 'Alguien cercano desaparece',
      tensionChange: +20,
    },
    {
      id: 'true_reveal',
      trigger: { type: 'progress', atPercent: 75 },
      description: 'El verdadero culpable se revela',
      tensionChange: +15,
    },
  ],

  climaxConfig: {
    type: 'REVELATION',
    enemyScaling: 1.0,
    requiredThreadsResolved: 1,
    promptTemplate: `
      La verdad sale a la luz. ${antagonist} era el responsable.
      El jugador debe decidir: justicia o misericordia.
      Las consecuencias afectarán el futuro.
    `,
  },

  resolutions: [
    {
      outcome: 'VICTORY',
      conditions: [{ type: 'mystery_solved' }, { type: 'antagonist_dealt' }],
      rewards: {
        xpMultiplier: 1.3, // Bonus por resolver misterio
        goldMultiplier: 1.0,
        reputationChanges: [{ faction: 'village', amount: 50 }],
      },
      nextHooks: [
        {
          type: 'THREAT',
          description: 'El culpable trabajaba para alguien más poderoso',
          urgency: 'HIGH',
        },
      ],
      epiloguePrompt: `
        La verdad trajo paz al pueblo, pero también reveló 
        una conspiración más profunda. ${playerName} ahora tiene
        un nuevo enemigo que conoce su nombre.
      `,
    },
  ],

  weight: 30,
};
```

---

## 🤖 Integración con IA

### Prompts Contextuales por Fase

```typescript
/**
 * Genera el prompt de contexto narrativo para la IA
 */
function generateNarrativeContext(state: INarrativeState): string {
  const phaseInstructions = PHASE_INSTRUCTIONS[state.phase];
  const tensionGuidance = getTensionGuidance(state.tensionLevel);
  const threadContext = formatThreads(state.threads);

  return `
═══════════════════════════════════════════════════════════
CONTEXTO NARRATIVO - CAPÍTULO ${state.chapter.number}
═══════════════════════════════════════════════════════════

FASE ACTUAL: ${state.phase} (${state.phaseProgress}% completado)
TENSIÓN DRAMÁTICA: ${state.tensionLevel}/100

CONFLICTO PRINCIPAL:
${state.chapter.mainConflict}

${
  state.chapter.antagonist
    ? `ANTAGONISTA: ${state.chapter.antagonist.name}
Motivación: ${state.chapter.antagonist.motivation}`
    : ''
}

HILOS NARRATIVOS ACTIVOS:
${threadContext}

═══════════════════════════════════════════════════════════
INSTRUCCIONES PARA ESTA FASE
═══════════════════════════════════════════════════════════

${phaseInstructions}

${tensionGuidance}

REGLAS NARRATIVAS:
- Mantén consistencia con eventos previos
- No resuelvas hilos principales en DEVELOPMENT
- Siembra pistas para revelaciones futuras (foreshadowing)
- Cada respuesta debe avanzar al menos un hilo
- Ofrece opciones con consecuencias significativas
`;
}

const PHASE_INSTRUCTIONS: Record<NarrativePhase, string> = {
  HOOK: `
    OBJETIVO: Capturar la atención del jugador inmediatamente.
    
    HACER:
    - Comenzar con acción, misterio o revelación impactante
    - Establecer las stakes (qué está en juego)
    - Introducir el conflicto principal rápidamente
    - Dar al jugador una razón personal para involucrarse
    
    NO HACER:
    - Exposición larga o lenta
    - Introducir demasiados personajes
    - Dar toda la información de una vez
    - Resolver el misterio inicial
  `,

  DEVELOPMENT: `
    OBJETIVO: Construir tensión gradualmente mientras el jugador investiga/avanza.
    
    HACER:
    - Añadir complicaciones que aumenten las stakes
    - Revelar información parcial (pistas)
    - Desarrollar personajes secundarios
    - Crear momentos de respiro entre tensión
    - Preparar elementos para el clímax
    
    NO HACER:
    - Resolver el conflicto principal todavía
    - Mantener tensión máxima constante (agota al jugador)
    - Introducir demasiados hilos nuevos
    - Hacer que el jugador se sienta perdido
  `,

  CLIMAX: `
    OBJETIVO: Llevar la tensión al máximo con el enfrentamiento principal.
    
    HACER:
    - Convergir todos los hilos hacia el momento decisivo
    - Hacer que las decisiones del jugador importen
    - Crear un enfrentamiento memorable
    - Subir las stakes al máximo
    - Permitir que el jugador use todo lo aprendido
    
    NO HACER:
    - Resolución fácil o anticlimática
    - Introducir elementos nuevos importantes
    - Quitar agencia al jugador (cutscene feeling)
    - Extender demasiado después del pico de tensión
  `,

  RESOLUTION: `
    OBJETIVO: Cerrar satisfactoriamente mientras sembrar interés futuro.
    
    HACER:
    - Mostrar consecuencias de las acciones del jugador
    - Resolver los hilos principales (dejar 1-2 abiertos)
    - Dar recompensas tangibles y emocionales
    - Plantar semillas para el próximo capítulo
    - Crear un momento de cierre natural
    
    NO HACER:
    - Terminar abruptamente sin cierre
    - Introducir nuevos conflictos grandes
    - Resolver TODO (necesitamos ganchos)
    - Extender innecesariamente
  `,
};

function getTensionGuidance(tension: number): string {
  if (tension < 20) {
    return `
TENSIÓN BAJA - Momento de respiro
- Permite exploración tranquila
- Desarrollo de personajes
- Preparación para lo que viene
- Puede subir tensión gradualmente
    `;
  } else if (tension < 50) {
    return `
TENSIÓN MEDIA - Avance con propósito  
- Mantén sensación de progreso
- Añade complicaciones menores
- Mezcla acción con investigación
- Prepara revelaciones
    `;
  } else if (tension < 80) {
    return `
TENSIÓN ALTA - Camino al clímax
- Eventos se aceleran
- Decisiones tienen peso
- Menos tiempo para descanso
- Convergencia de hilos
    `;
  } else {
    return `
TENSIÓN MÁXIMA - Clímax inminente
- Todo converge ahora
- Cada acción es crucial
- No hay marcha atrás
- El momento definitivo
    `;
  }
}
```

---

## 🔗 Integración con Sistemas Existentes

### Con QuestManager

```typescript
// El NarrativeManager asigna quests según la fase
class NarrativeManager {
  private questManager: QuestManager;

  async onPhaseChange(newPhase: NarrativePhase): Promise<void> {
    const appropriateQuests = this.getQuestsForPhase(newPhase);

    for (const questId of appropriateQuests) {
      if (this.shouldActivateQuest(questId)) {
        await this.questManager.activateQuest(this.playerId, questId);
      }
    }
  }

  private getQuestsForPhase(phase: NarrativePhase): string[] {
    switch (phase) {
      case 'HOOK':
        return this.currentChapter.hookConfig.possibleQuests;
      case 'DEVELOPMENT':
        return this.getExplorationQuests();
      case 'CLIMAX':
        return this.getClimaxQuests();
      case 'RESOLUTION':
        return []; // No nuevas quests, solo cerrar
    }
  }
}
```

### Con CombatManager

```typescript
// Los encuentros escalan según la fase narrativa
class NarrativeManager {
  getCombatScaling(): number {
    const baseScaling = this.currentChapter.climaxConfig.enemyScaling;

    switch (this.state.phase) {
      case 'HOOK':
        return baseScaling * 0.7; // Encuentros introductorios
      case 'DEVELOPMENT':
        return baseScaling * 0.9; // Desafío moderado
      case 'CLIMAX':
        return baseScaling * 1.2; // Máxima dificultad
      case 'RESOLUTION':
        return baseScaling * 0.5; // Limpieza fácil
    }
  }

  suggestEnemiesForPhase(): string[] {
    // Sugiere enemigos temáticamente apropiados
    const theme = this.currentChapter.type;
    const tension = this.state.tensionLevel;

    return this.enemyDatabase.query({
      theme,
      minThreat: tension * 0.8,
      maxThreat: tension * 1.2,
    });
  }
}
```

### Con LootManager

```typescript
// Loot se ajusta a momentos narrativos
class NarrativeManager {
  getLootModifiers(): ILootModifiers {
    return {
      // Mejor loot en resolución como recompensa
      qualityBonus: this.state.phase === 'RESOLUTION' ? 0.3 : 0,

      // Items narrativamente relevantes más probables
      thematicBoost: this.getThematicItems(),

      // Clímax puede dar items únicos
      uniqueChance: this.state.phase === 'CLIMAX' ? 0.1 : 0.02,
    };
  }
}
```

---

## 📁 Archivos a Crear

### Backend

| Archivo                                     | Descripción                     | Líneas Est. |
| ------------------------------------------- | ------------------------------- | ----------- |
| `src/game/narrative/NarrativeInterfaces.ts` | Todas las interfaces y tipos    | ~200        |
| `src/game/narrative/NarrativeManager.ts`    | Orquestador principal           | ~400        |
| `src/game/narrative/ChapterEngine.ts`       | Lógica de capítulos             | ~300        |
| `src/game/narrative/PhaseTracker.ts`        | Gestión de fases y transiciones | ~200        |
| `src/game/narrative/ChapterTemplates.ts`    | Plantillas de capítulos         | ~350        |
| `src/game/narrative/index.ts`               | Exports del módulo              | ~20         |
| `src/ai/prompts/NarrativePrompts.ts`        | Prompts por fase                | ~250        |

### Comandos

| Archivo                                        | Descripción             |
| ---------------------------------------------- | ----------------------- |
| `src/game/commands/AdvanceNarrativeCommand.ts` | Avanzar fase narrativa  |
| `src/game/commands/ResolveThreadCommand.ts`    | Resolver hilo narrativo |

### Total Estimado: ~1,800 líneas de código

---

## 📋 Plan de Implementación

### Día 1: Fundamentos

1. ✅ Documentación (este documento)
2. Crear `NarrativeInterfaces.ts` con todos los tipos
3. Crear `PhaseTracker.ts` con lógica de transiciones
4. Tests unitarios para PhaseTracker

### Día 2: Core

1. Crear `ChapterEngine.ts`
2. Crear `NarrativeManager.ts` base
3. Integrar con GameEngine
4. Tests de integración

### Día 3: Plantillas y IA

1. Crear `ChapterTemplates.ts` con 5 capítulos base
2. Crear `NarrativePrompts.ts`
3. Integrar prompts con AIGatewayService
4. Test E2E de flujo narrativo completo

### Día 4: Integraciones

1. Integrar con QuestManager
2. Integrar con CombatManager
3. Integrar con LootManager
4. Ajustar balance

---

## 📊 Métricas de Éxito

### Métricas Técnicas

| Métrica                          | Objetivo  |
| -------------------------------- | --------- |
| Capítulos completados por sesión | ≥1        |
| Tiempo promedio por capítulo     | 20-40 min |
| Transiciones de fase suaves      | >95%      |
| Errores de narrativa             | <1%       |

### Métricas de UX (post-lanzamiento)

| Métrica                             | Actual  | Objetivo |
| ----------------------------------- | ------- | -------- |
| Tiempo de sesión                    | ~10 min | >25 min  |
| "¿Sentiste que la historia avanzó?" | N/A     | >80% sí  |
| "¿Quieres saber qué pasa después?"  | N/A     | >70% sí  |
| Retención D1                        | ~20%    | >45%     |

---

## ✅ Checklist Pre-Implementación

- [x] Interfaces definidas
- [x] Arquitectura documentada
- [x] Plantillas de ejemplo creadas
- [x] Integración con IA diseñada
- [x] Integración con sistemas existentes mapeada
- [x] Plan de implementación creado
- [x] Métricas de éxito definidas
- [ ] Aprobación del diseño

---

_Documento preparado para revisión antes de comenzar implementación._
