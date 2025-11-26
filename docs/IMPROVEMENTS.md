# 🚀 Mejoras Propuestas - RPG-AI Supreme

> **Documento**: Backlog de Mejoras Priorizadas  
> **Fecha**: 26 de Noviembre, 2025  
> **Estado**: Pendiente de Implementación

---

## Resumen de Prioridades

| Prioridad     | Cantidad | Impacto en Retención                  |
| ------------- | -------- | ------------------------------------- |
| 🔴 CRÍTICA    | 4        | Bloquean retención de usuarios        |
| 🟡 IMPORTANTE | 5        | Mejoran engagement significativamente |
| 🟢 DESEABLE   | 6        | Polish y adicción a largo plazo       |

---

## 🔴 MEJORAS CRÍTICAS

### M1: Sistema de Misiones Activas

**Problema**: Sin objetivos claros, el jugador no sabe qué hacer después de 5 minutos.

**Solución**: Implementar un sistema de quests con tracking visible.

#### Especificación

```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  giver: string; // NPC que da la misión

  objectives: QuestObjective[];

  rewards: {
    xp: number;
    gold: number;
    items?: string[];
    reputation?: { faction: string; amount: number };
  };

  requirements?: {
    level?: number;
    completedQuests?: string[];
    items?: string[];
  };

  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  timeLimit?: number; // En minutos (opcional)
}

interface QuestObjective {
  type: 'KILL' | 'COLLECT' | 'EXPLORE' | 'TALK' | 'ESCORT' | 'DELIVER';
  target: string;
  currentCount: number;
  requiredCount: number;
  description: string;
  completed: boolean;
}
```

#### UI Requerida

```
┌─ MISIÓN ACTIVA ─────────────────────────────────────────┐
│                                                          │
│  📜 Ratas en el Sótano                                  │
│  "El tabernero necesita ayuda con una plaga"            │
│                                                          │
│  Objetivos:                                              │
│  ☑ Hablar con el tabernero              [██████████] ✓ │
│  ☐ Derrotar 5 ratas gigantes            [████░░░░░░] 2/5│
│  ☐ Volver con el tabernero              [░░░░░░░░░░] 0/1│
│                                                          │
│  Recompensa: 100 XP, 25 Oro, Poción de Vida             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Implementación

**Archivos a crear/modificar:**

- `apps/backend/src/game/quests/QuestManager.ts`
- `apps/backend/src/game/quests/QuestTemplates.ts`
- `apps/backend/prisma/schema.prisma` (modelo Quest ya existe)
- `apps/frontend/src/components/QuestLog.tsx`
- `apps/frontend/src/components/QuestTracker.tsx`

**Misiones iniciales:**

1. "Bienvenida al Valle" - Tutorial, hablar con 3 NPCs
2. "Ratas en el Sótano" - Matar 5 ratas
3. "Hierbas Curativas" - Recoger 3 hierbas en el bosque
4. "El Bandido Escapado" - Encontrar y derrotar bandido nivel 2
5. "Secretos del Bosque" - Explorar el claro oculto

**Esfuerzo estimado**: 2-3 días

---

### M2: Arco Narrativo por Sesión

**Problema**: No hay historia, solo momentos inconexos.

**Solución**: Estructurar cada sesión como un capítulo con inicio, desarrollo y cierre.

#### Especificación

```typescript
interface ChapterState {
  currentChapter: number;
  phase: 'hook' | 'development' | 'climax' | 'resolution';
  phaseProgress: number; // 0-100
  mainConflict: string;
  activeThreads: NarrativeThread[];
}

interface NarrativeThread {
  id: string;
  description: string;
  importance: 'main' | 'side' | 'background';
  resolved: boolean;
}
```

#### Prompt de IA Modificado

```typescript
const CHAPTER_AWARE_PROMPT = `
FASE ACTUAL DEL CAPÍTULO: ${phase}

INSTRUCCIONES POR FASE:
- HOOK: Introduce un evento emocionante que enganche al jugador
- DEVELOPMENT: Desarrolla el conflicto, introduce complicaciones
- CLIMAX: Prepara el enfrentamiento principal
- RESOLUTION: Cierra hilos narrativos, prepara el siguiente capítulo

CONFLICTO PRINCIPAL: ${mainConflict}

Después de 30 minutos de juego, busca un punto natural de cierre.
Si el jugador parece querer terminar, ofrece un cierre satisfactorio.
`;
```

#### Implementación

**Archivos a crear/modificar:**

- `apps/backend/src/ai/prompts/ChapterPrompts.ts`
- `apps/backend/src/game/narrative/NarrativeManager.ts`
- `apps/backend/src/game/narrative/ChapterTemplates.ts`

**Esfuerzo estimado**: 2-3 días

---

### M3: Combate por Turnos

**Problema**: El combate no tiene ritmo ni claridad. Jugador no sabe cuándo actuar.

**Solución**: Sistema de iniciativa y turnos explícitos.

#### Especificación

```typescript
interface CombatState {
  phase: 'initiative' | 'player_turn' | 'enemy_turn' | 'end_round' | 'victory' | 'defeat';
  round: number;
  turnOrder: CombatParticipant[];
  currentTurnIndex: number;
  playerActions: number; // Acciones restantes este turno
}

interface CombatParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  initiative: number;
  currentHp: number;
  maxHp: number;
  statusEffects: StatusEffect[];
  intention?: EnemyIntention; // Solo para enemigos
}

type EnemyIntention =
  | { type: 'attack'; target: string }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string }
  | { type: 'flee' };
```

#### Flujo de Combate

```
1. INICIO COMBATE
   └─ Calcular iniciativa: 1d20 + DEX modifier
   └─ Ordenar participantes
   └─ Mostrar orden de turnos

2. TURNO DEL JUGADOR (si le toca)
   └─ Mostrar opciones: Atacar | Defender | Magia | Item | Huir
   └─ Esperar input
   └─ Resolver acción
   └─ Narrar resultado

3. TURNO DEL ENEMIGO (si le toca)
   └─ IA decide según behavior pattern
   └─ Mostrar intención brevemente
   └─ Resolver acción
   └─ Narrar resultado

4. FIN DE RONDA
   └─ Aplicar DoT/HoT
   └─ Reducir duración de buffs/debuffs
   └─ Reducir cooldowns
   └─ Verificar victoria/derrota

5. REPETIR hasta resolución
```

#### UI de Combate

```
┌─────────────────────────────────────────────────────────┐
│  ═══════════════ COMBATE - RONDA 3 ════════════════════│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ORDEN: [Tú ►] → [Lobo] → [Rata]                        │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🐺 Lobo Terrible                                       │
│  HP: [████████░░░░░░░░░░░░] 35/80                       │
│  Intención: ⚔️ Preparando ataque...                     │
│                                                          │
│  🐀 Rata Gigante                                        │
│  HP: [██░░░░░░░░░░░░░░░░░░] 5/20                        │
│  Intención: 🏃 Intentará huir                           │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ► TU TURNO - Elige una acción:                         │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │⚔️ Atacar│ │🛡️ Defensa│ │✨ Magia│ │🎒 Items│ │🏃 Huir │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  👤 Thorin (Guerrero Nivel 2)                           │
│  HP: [████████████████░░░░] 80/100  ❤️                  │
│  Stamina: [██████████████░░░░░░] 35/50  ⚡              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Implementación

**Archivos a crear/modificar:**

- `apps/backend/src/game/combat/CombatManager.ts`
- `apps/backend/src/game/combat/InitiativeSystem.ts`
- `apps/backend/src/game/combat/EnemyAI.ts`
- `apps/frontend/src/screens/CombatScreen.tsx`
- `apps/frontend/src/components/CombatUI.tsx`
- `apps/frontend/src/components/TurnOrder.tsx`

**Esfuerzo estimado**: 4-5 días

---

### M4: Loot de Enemigos

**Problema**: Matar enemigos no da recompensa tangible.

**Solución**: Sistema de loot tables con drops visuales.

#### Especificación

```typescript
interface LootTable {
  enemyId: string;
  guaranteedGold: { min: number; max: number };
  drops: LootDrop[];
}

interface LootDrop {
  itemId: string;
  chance: number; // 0.0 - 1.0
  minQuantity: number;
  maxQuantity: number;
  rarity?: Rarity; // Override de rareza
}

interface LootResult {
  gold: number;
  items: { item: Item; quantity: number }[];
  xp: number;
}
```

#### Loot Tables Iniciales

```typescript
const LOOT_TABLES: LootTable[] = [
  {
    enemyId: 'giant_rat',
    guaranteedGold: { min: 2, max: 8 },
    drops: [
      { itemId: 'rat_tail', chance: 0.8, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'small_cheese', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'minor_health_potion', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
    ],
  },
  {
    enemyId: 'bandit',
    guaranteedGold: { min: 15, max: 35 },
    drops: [
      { itemId: 'bandit_mask', chance: 0.4, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'iron_dagger', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'lockpicks', chance: 0.2, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'minor_health_potion', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
    ],
  },
  {
    enemyId: 'dire_wolf',
    guaranteedGold: { min: 0, max: 0 },
    drops: [
      { itemId: 'wolf_pelt', chance: 0.9, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'wolf_fang', chance: 0.6, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'pristine_pelt', chance: 0.08, minQuantity: 1, maxQuantity: 1, rarity: 'rare' },
    ],
  },
];
```

#### UI de Victoria/Loot

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              ⚔️ ¡VICTORIA! ⚔️                            │
│                                                          │
│  Has derrotado al Lobo Terrible                         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Recompensas:                                           │
│                                                          │
│  ⭐ +45 XP                                              │
│  🪙 +0 Oro                                              │
│                                                          │
│  Items obtenidos:                                        │
│  ├─ 🦴 Colmillo de Lobo ×2                              │
│  └─ 🧥 Piel de Lobo (Común)                             │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [████████████████░░░░] Nivel 2 → 3 (75%)              │
│                                                          │
│                    [Continuar]                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Implementación

**Archivos a crear/modificar:**

- `apps/backend/src/game/loot/LootManager.ts`
- `apps/backend/src/game/loot/LootTables.ts`
- `apps/backend/src/game/commands/AttackCommand.ts` (añadir loot)
- `apps/frontend/src/components/VictoryScreen.tsx`
- `apps/frontend/src/components/LootDisplay.tsx`

**Esfuerzo estimado**: 2-3 días

---

## 🟡 MEJORAS IMPORTANTES

### M5: Diálogos con NPCs ✅ COMPLETADO

**Estado**: Implementado (26 Nov 2025)

**Problema**: NPCs existen pero no interactúan realmente.

**Solución**: Árboles de diálogo con opciones que afectan el juego.

**Archivos implementados**:

- `apps/frontend/src/types/dialogue.ts` - Tipos completos del sistema
- `apps/frontend/src/components/dialogue/DialogueOption.tsx` - Opciones seleccionables
- `apps/frontend/src/components/dialogue/NPCPortrait.tsx` - Retrato animado con emociones
- `apps/frontend/src/components/dialogue/DialogueBox.tsx` - Caja con efecto typewriter
- `apps/frontend/src/components/dialogue/DialogueScreen.tsx` - Pantalla de conversación
- `apps/frontend/src/components/dialogue/index.ts` - Exports

#### Especificación

```typescript
interface DialogueTree {
  npcId: string;
  startNode: string;
  nodes: DialogueNode[];
}

interface DialogueNode {
  id: string;
  text: string;
  speaker: 'npc' | 'player';
  options?: DialogueOption[];
  effects?: DialogueEffect[];
  next?: string; // Auto-avanzar a este nodo
}

interface DialogueOption {
  text: string;
  targetNode: string;
  requirements?: {
    stat?: { name: string; min: number };
    item?: string;
    quest?: string;
    gold?: number;
  };
  effects?: DialogueEffect[];
}

interface DialogueEffect {
  type:
    | 'give_quest'
    | 'complete_quest'
    | 'give_item'
    | 'take_item'
    | 'give_gold'
    | 'take_gold'
    | 'change_reputation'
    | 'unlock_location';
  value: any;
}
```

#### Ejemplo de Diálogo

```typescript
const INNKEEPER_DIALOGUE: DialogueTree = {
  npcId: 'innkeeper',
  startNode: 'greeting',
  nodes: [
    {
      id: 'greeting',
      text: '¡Bienvenido a "El Tanque Oxidado"! ¿Qué puedo hacer por ti, viajero?',
      speaker: 'npc',
      options: [
        { text: 'Busco trabajo', targetNode: 'work' },
        { text: 'Quiero comprar algo', targetNode: 'shop' },
        { text: '¿Qué noticias hay?', targetNode: 'rumors' },
        { text: 'Necesito descansar', targetNode: 'rest' },
        { text: 'Hasta luego', targetNode: 'goodbye' },
      ],
    },
    {
      id: 'work',
      text: 'Trabajo, ¿eh? Bueno, tengo un problema con ratas en el sótano...',
      speaker: 'npc',
      options: [
        {
          text: 'Me encargo de ellas',
          targetNode: 'accept_rats',
          effects: [{ type: 'give_quest', value: 'rats_in_cellar' }],
        },
        { text: '¿Algo más peligroso?', targetNode: 'harder_work' },
        { text: 'No me interesa', targetNode: 'greeting' },
      ],
    },
    // ... más nodos
  ],
};
```

**Esfuerzo estimado**: 3-4 días

---

### M6: Sistema de Magia en UI ✅ COMPLETADO

**Estado**: Implementado (26 Nov 2025)

**Problema**: Jugador no puede ver ni usar hechizos fácilmente.

**Solución**: Pantalla de hechizos con cooldowns visibles.

**Archivos implementados**:

- `apps/frontend/src/types/magic.ts` - Tipos de hechizos, escuelas, efectos
- `apps/frontend/src/components/magic/SpellCard.tsx` - Tarjeta de hechizo con stats
- `apps/frontend/src/components/magic/ManaBar.tsx` - Barra de maná animada
- `apps/frontend/src/components/magic/SpellList.tsx` - Lista agrupada por escuela
- `apps/frontend/src/components/magic/SpellScreen.tsx` - Pantalla completa de grimorio
- `apps/frontend/src/components/magic/index.ts` - Exports

```
┌─ HECHIZOS ──────────────────────────────────────────────┐
│                                                          │
│  Maná: [████████████░░░░░░░░] 60/100                    │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🔥 Bola de Fuego         [15 MP]      [LISTO]         │
│     Daño: 20-30 fuego | Rango: Medio                    │
│                                                          │
│  ❄️ Fragmento de Hielo    [12 MP]      [2 turnos]      │
│     Daño: 12-18 hielo + Lentitud                        │
│                                                          │
│  💚 Sanación Menor        [10 MP]      [LISTO]         │
│     Cura: 15-25 HP                                       │
│                                                          │
│  🛡️ Escudo Arcano         [20 MP]      [LISTO]         │
│     Absorbe 30 daño por 3 turnos                        │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Selecciona un hechizo para lanzar]                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Esfuerzo estimado**: 2 días

---

### M7: Equipar Items desde UI ✅ COMPLETADO

**Estado**: Implementado (26 Nov 2025)

**Problema**: No hay forma visual de gestionar equipamiento.

**Solución**: Pantalla de inventario con paperdoll y drag-drop.

**Archivos implementados**:

- `apps/frontend/src/types/equipment.ts` - Tipos de equipamiento
- `apps/frontend/src/components/equipment/EquipmentSlot.tsx` - Slot individual
- `apps/frontend/src/components/equipment/CharacterPaperdoll.tsx` - Layout paperdoll
- `apps/frontend/src/components/equipment/EquipmentScreen.tsx` - Pantalla completa
- `apps/frontend/src/components/equipment/index.ts` - Exports

```
┌─ EQUIPAMIENTO ──────────────────────────────────────────┐
│                                                          │
│            [🎩 Ninguno]                                  │
│                 │                                        │
│  [💍 Ninguno]─[📿 Ninguno]─[💍 Ninguno]                 │
│                 │                                        │
│           [🛡️ Cota Malla]                               │
│           /            \                                 │
│    [🧤 Ninguno]    [⚔️ Espada +5]                       │
│           \            /                                 │
│         [👢 Botas]─[🛡️ Escudo]                          │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  STATS CON EQUIPO:                                       │
│  ATK: 15 (+10)  DEF: 12 (+8)  HP: +20                   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  INVENTARIO: (12/50)                                     │
│  [Poción ×3] [Antorcha ×5] [Cola Rata ×8] [...]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Esfuerzo estimado**: 3 días

---

### M8: Progresión al Subir Nivel

**Problema**: Subir de nivel no da nada tangible.

**Solución**: Recompensas significativas cada nivel.

```typescript
interface LevelUpReward {
  level: number;
  hpBonus: number;
  manaBonus: number;
  staminaBonus: number;
  attributePoints: number; // Puntos para distribuir
  newAbility?: string; // ID de habilidad desbloqueada
  title?: string; // Título cosmético
}

const LEVEL_REWARDS: LevelUpReward[] = [
  { level: 2, hpBonus: 15, manaBonus: 5, staminaBonus: 5, attributePoints: 1 },
  { level: 3, hpBonus: 15, manaBonus: 5, staminaBonus: 5, attributePoints: 1, newAbility: 'class_ability_1' },
  { level: 4, hpBonus: 15, manaBonus: 5, staminaBonus: 5, attributePoints: 1 },
  {
    level: 5,
    hpBonus: 20,
    manaBonus: 10,
    staminaBonus: 10,
    attributePoints: 2,
    newAbility: 'class_ability_2',
    title: 'Veterano',
  },
  // ...
];
```

**Pantalla de Level Up:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│            ⭐ ¡SUBISTE AL NIVEL 3! ⭐                   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Bonificaciones:                                         │
│  ❤️ +15 HP Máximo (85 → 100)                            │
│  💧 +5 Maná Máximo (40 → 45)                            │
│  ⚡ +5 Stamina Máximo (45 → 50)                         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🆕 Nueva Habilidad Desbloqueada:                       │
│                                                          │
│  ⚔️ GOLPE ATURDIDOR                                     │
│  Ataque poderoso con 50% de probabilidad                │
│  de aturdir al enemigo por 1 turno.                     │
│  Costo: 15 Stamina | Cooldown: 3 turnos                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Tienes 1 punto de atributo para distribuir:            │
│                                                          │
│  FUE [14] [+]   AGI [10] [+]   CON [12] [+]            │
│  INT [8]  [+]   SAB [10] [+]   CAR [10] [+]            │
│                                                          │
│                   [Confirmar]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Esfuerzo estimado**: 2 días

---

### M9: Mini-mapa Visual ✅ COMPLETADO

**Estado**: Implementado (26 Nov 2025)

**Problema**: No hay representación visual del mundo.

**Solución**: Mapa interactivo con locaciones.

**Archivos implementados**:

- `apps/frontend/src/types/map.ts` - Tipos de mapa y locaciones
- `apps/frontend/src/components/map/MapNode.tsx` - Nodo de locación
- `apps/frontend/src/components/map/MiniMap.tsx` - Mapa con conexiones
- `apps/frontend/src/components/map/index.ts` - Exports

```
┌─ MAPA DEL VALLE ────────────────────────────────────────┐
│                                                          │
│              ┌───────────────┐                           │
│              │   ? ? ? ? ?   │  ← Zonas no exploradas   │
│              │   ? ? ? ? ?   │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │ 🌲 Claro      │                           │
│              │   del Bosque  │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│  ┌─────────┐ ┌───────┴───────┐ ┌─────────┐             │
│  │ ⚒️       │ │ 🌲 Entrada    │ │   ???   │             │
│  │ Herrería │─│   del Bosque │─│         │             │
│  └─────────┘ └───────┬───────┘ └─────────┘             │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │ 🏠 Plaza      │  ← Estás aquí            │
│              │ ★ del Pueblo  │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │ 🍺 Taberna    │                           │
│              │               │                           │
│              └───────────────┘                           │
│                                                          │
│  Leyenda: 🏠 Pueblo  🌲 Naturaleza  ⚒️ Tienda  ? ???    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Esfuerzo estimado**: 3 días

---

## 🟢 MEJORAS DESEABLES

### M10: Modo Historia Finita ✅ IMPLEMENTADO

**Descripción**: Campaña estructurada con inicio, desarrollo y final épico.

**Estructura**:

- **Prólogo** (15 min): Introducción, tutorial, el despertar del héroe
- **Acto I: La Llamada** (45 min): Amenaza revelada, primeras misiones
- **Acto II: El Viaje** (90 min): Búsqueda de artefactos, aliados, enemigos
- **Acto III: El Ajuste de Cuentas** (60 min): Confrontación final, boss épico
- **Epílogo** (10 min): El mundo después de tus decisiones

**Implementación**:

- `types/story.ts` - Tipos completos: StoryAct, IStoryChapter, IStoryProgress, ICampaignSummary, STORY_ACTS, helpers
- `components/story/ChapterCard.tsx` - Tarjeta de capítulo con progreso, recompensas y estados
- `components/story/ActSection.tsx` - Sección de acto expandible con progreso y animaciones
- `components/story/StoryProgressBar.tsx` - Barra de progreso general con timeline de actos
- `components/story/StoryScreen.tsx` - Pantalla principal con vista de campaña completa
- Traducciones completas en `en.json` y `es.json`

**Características**:

- 5 actos con progresión estructurada (prólogo, 3 actos, epílogo)
- Sistema de prerrequisitos entre capítulos
- Tracking de decisiones que afectan la narrativa
- Sistema de relaciones con NPCs
- Múltiples finales desbloqueables
- Objetivos principales, opcionales y secretos por capítulo
- Recompensas de XP, oro, items y logros
- Timeline visual de progreso
- Animaciones fluidas con react-native-reanimated
- Soporte completo i18n

**Esfuerzo estimado**: 1-2 semanas ✅

---

### M11: Modo Infinito/Sandbox ✅ IMPLEMENTADO

**Descripción**: Generación procedural de dungeons sin fin.

**Mecánica**:

- Dungeons de 3-5 habitaciones
- Cada 5 niveles: Tienda + Mini-boss
- Cada 10 niveles: Boss mayor
- Muerte = Reinicio (roguelike)
- Leaderboards globales

**Implementación**:

- `types/infinite.ts` - Tipos completos: RoomType, DungeonTheme, IRoom, IDungeonFloor, IInfiniteRun, ILeaderboardEntry,
  helpers y datos de ejemplo
- `components/infinite/DungeonRoom.tsx` - Visualización de sala con tipo, puertas y contenido
- `components/infinite/DungeonMap.tsx` - Mapa scrolleable con conexiones entre salas
- `components/infinite/FloorProgress.tsx` - Indicador de piso, dificultad y estadísticas de la run
- `components/infinite/LeaderboardPanel.tsx` - Panel de clasificación global con rankings
- `components/infinite/InfiniteScreen.tsx` - Pantalla principal con menú y modo activo
- Traducciones completas en `en.json` y `es.json`

**Características**:

- 8 tipos de sala (entrance, combat, treasure, trap, puzzle, rest, shop, boss, miniboss, exit)
- 8 temas de dungeon (crypt, cave, temple, sewer, forest, volcano, ice, void) con gradientes únicos
- Sistema de dificultad escalable con multiplicadores
- Indicadores visuales de pisos especiales (shop, miniboss, boss)
- Animaciones fluidas con react-native-reanimated
- Leaderboard con top jugadores y rankings
- Sample data para desarrollo

**Esfuerzo estimado**: 1 semana ✅

---

### M12: Daily Challenges ✅ IMPLEMENTADO

**Descripción**: Misiones diarias con recompensas exclusivas.

**Ejemplos**:

- "Derrota 10 enemigos sin usar pociones" → 50 Oro
- "Completa una misión en menos de 10 minutos" → Item Raro
- "Descubre 3 locaciones nuevas" → 100 XP

**Implementación**:

- `types/dailies.ts` - Tipos para challenges, rewards, progreso y funciones helper
- `components/dailies/ChallengeCard.tsx` - Tarjeta de challenge con progreso, timer y claim
- `components/dailies/DailyList.tsx` - Lista de challenges con streak y bonus
- `components/dailies/DailiesScreen.tsx` - Pantalla completa con modal de recompensa
- Traducciones en `en.json` y `es.json`

**Características**:

- Sistema de streak (racha) de hasta 7 días con bonus
- Timer de reset diario
- Dificultades: easy, medium, hard, legendary
- Tipos de challenge: combat, exploration, survival, speedrun, etc.
- Bonus reward por completar todos los dailies
- Modal animado de claim de recompensa
- Soporte completo i18n

**Esfuerzo estimado**: 2 días ✅

---

### M13: Backstory del Personaje ✅

**Descripción**: Preguntas en creación que afectan la narrativa.

**Preguntas**:

1. "¿Por qué dejaste tu hogar?" → Afecta primera misión
2. "¿Cuál es tu mayor miedo?" → Evento especial más adelante
3. "¿Tienes algún enemigo?" → Villano recurrente

**Implementado**:

- `types/backstory.ts` - Tipos completos con 6 categorías de preguntas, efectos narrativos
- `components/backstory/BackstoryOptionCard.tsx` - Tarjeta de opción con efectos visuales
- `components/backstory/BackstoryQuestion.tsx` - Pregunta con barra de progreso animada
- `components/backstory/BackstorySummary.tsx` - Resumen completo con stats, items, eventos
- `components/backstory/BackstoryScreen.tsx` - Pantalla completa con flujo wizard
- Traducciones completas en `en.json` y `es.json`

**Características**:

- 6 preguntas de backstory (origen, motivación, miedo, enemigo, rasgo, secreto)
- Sistema de efectos narrativos (tags para AI, modificadores de stats, items iniciales)
- Eventos especiales desbloqueables según respuestas
- NPCs recurrentes basados en la historia
- Animaciones fluidas con react-native-reanimated
- Soporte completo i18n

**Esfuerzo estimado**: 2-3 días ✅

---

### M14: Bestiario ✅ IMPLEMENTADO

**Descripción**: Colección de monstruos encontrados.

**Contenido por criatura**:

- Ilustración (emoji icons)
- Stats y debilidades
- Lore/historia
- Contador de derrotados
- Drops posibles

**Implementación**:

- `types/bestiary.ts` - Tipos completos para criaturas, drops, debilidades, resistencias
- `components/bestiary/CreatureCard.tsx` - Tarjeta de criatura con tipo, kills, estado descubierto
- `components/bestiary/CreatureDetail.tsx` - Modal detallado con stats, lore, drops, debilidades
- `components/bestiary/BestiaryList.tsx` - Lista/grid con filtros por tipo de criatura
- `components/bestiary/BestiaryScreen.tsx` - Pantalla completa con búsqueda y navegación
- Traducciones en `en.json` y `es.json`

**Características**:

- Sistema de descubrimiento (criaturas ocultas hasta encontrarlas)
- Filtros por tipo de criatura (bestia, no-muerto, demonio, etc.)
- Búsqueda por nombre, tipo o hábitat
- Estadísticas globales (total descubierto, total derrotado)
- Animaciones con react-native-reanimated
- Soporte completo i18n

**Esfuerzo estimado**: 2 días ✅

---

### M15: Clima Dinámico ✅

**Descripción**: Sistema de clima que afecta el gameplay.

| Clima         | Efecto en Combate                   |
| ------------- | ----------------------------------- |
| Lluvia        | -10% precisión con arcos            |
| Niebla        | -20% precisión general, +10% sigilo |
| Tormenta      | Hechizos eléctricos +50% daño       |
| Nevado        | -1 velocidad de movimiento          |
| Calor extremo | -10% stamina máxima                 |

**Implementado**:

- `types/weather.ts` - Tipos completos con 10 tipos de clima, efectos de combate
- `components/weather/WeatherOverlay.tsx` - Partículas animadas (lluvia, nieve, niebla, tormentas)
- `components/weather/WeatherIndicator.tsx` - Indicador de clima con efectos activos
- `components/weather/WeatherForecast.tsx` - Panel de pronóstico y mini-forecast
- Traducciones completas en `en.json` y `es.json`

**Esfuerzo estimado**: 2 días ✅

---

## Matriz de Impacto vs Esfuerzo

```
                 Alto Impacto
                      ▲
                      │
         M3 ●         │         ● M1
        (Turnos)      │       (Misiones)
         5 días       │        3 días
                      │
         M2 ●         │         ● M4
       (Narrativa)    │        (Loot)
         3 días       │        3 días
                      │
   ────────────────────┼───────────────────► Bajo Esfuerzo
                      │
         M7 ●         │         ● M5
       (Equipo UI)    │       (Diálogos)
         3 días       │        4 días
                      │
         M10 ●        │         ● M8
        (Historia)    │      (Level Up)
        2 semanas     │        2 días
                      │
                 Bajo Impacto
```

---

## Plan de Implementación Sugerido

### Sprint 1 (Semana 1-2): Core Loop

1. ✅ M1: Sistema de Misiones
2. ✅ M4: Loot de Enemigos

### Sprint 2 (Semana 2-3): Combate

3. ✅ M3: Combate por Turnos

### Sprint 3 (Semana 3-4): Narrativa

4. ✅ M2: Arco Narrativo
5. ✅ M5: Diálogos NPCs

### Sprint 4 (Semana 4-5): Progresión

6. ✅ M8: Progresión por Nivel
7. ✅ M6: UI de Magia

### Sprint 5 (Semana 5-6): Polish

8. ✅ M7: UI de Equipamiento
9. ✅ M9: Mini-mapa
10. ✅ M12: Desafíos Diarios
11. ✅ M14: Bestiario
12. ✅ M15: Clima Dinámico
13. ✅ M13: Backstory Generator
14. ✅ M11: Modo Infinito
15. ✅ M10: Modo Historia Principal

---

## 🎉 ¡TODOS LOS MILESTONES COMPLETADOS!

El frontend de RPG-AI Supreme está ahora completo con todas las funcionalidades de UI implementadas:

- **Sistema de Misiones**: Tracking de quests con objetivos y recompensas
- **Combate por Turnos**: UI completa para combate táctico
- **Arco Narrativo**: Sistema de progresión de historia
- **Loot de Enemigos**: Sistema de drops y recompensas
- **Diálogos NPCs**: Interacciones conversacionales
- **UI de Magia**: Sistema de hechizos y abilities
- **UI de Equipamiento**: Gestión de gear y stats
- **Progresión por Nivel**: Sistema de level up
- **Mini-mapa**: Navegación del mundo
- **Modo Historia**: Campaña estructurada en actos
- **Modo Infinito**: Dungeon crawler roguelike
- **Desafíos Diarios**: Misiones diarias con streaks
- **Backstory Generator**: Creación de personajes con historia
- **Bestiario**: Catálogo de criaturas
- **Clima Dinámico**: Sistema de weather con efectos visuales

---

_Este documento debe actualizarse conforme se completen las mejoras_
