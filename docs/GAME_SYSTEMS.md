# ⚔️ Sistemas de Juego - Especificación Técnica

> **Documento**: Referencia de Sistemas Implementados  
> **Fecha**: 26 de Noviembre, 2025  
> **Propósito**: Documentación detallada de las mecánicas de juego

---

## Índice

1. [Sistema de Personajes](#1-sistema-de-personajes)
2. [Sistema de Combate](#2-sistema-de-combate)
3. [Sistema de Magia](#3-sistema-de-magia)
4. [Sistema de Items](#4-sistema-de-items)
5. [Sistema de Mundo](#5-sistema-de-mundo)
6. [Sistema de IA Game Master](#6-sistema-de-ia-game-master)
7. [Sistema de Comandos](#7-sistema-de-comandos)
8. [Sistema de Logros](#8-sistema-de-logros)

---

## 1. Sistema de Personajes

### 1.1 Atributos Base

| Atributo                        | Abreviatura | Efectos                                |
| ------------------------------- | ----------- | -------------------------------------- |
| **Strength** (Fuerza)           | STR         | Daño físico, capacidad de carga        |
| **Dexterity** (Agilidad)        | DEX         | Precisión, evasión, iniciativa         |
| **Constitution** (Constitución) | CON         | HP máximo, resistencia                 |
| **Intelligence** (Inteligencia) | INT         | Daño mágico, maná máximo               |
| **Wisdom** (Sabiduría)          | WIS         | Curación, detección                    |
| **Charisma** (Carisma)          | CHA         | Persuasión, precios, diálogos          |
| **Luck** (Suerte)               | LCK         | Críticos, loot, eventos (solo backend) |

### 1.2 Stats Derivados

```typescript
// HP Máximo
maxHP = baseHP + (constitution - 10) * 5 + level * hitDie;

// Maná Máximo
maxMana = baseMana + (intelligence - 10) * 3 + (wisdom - 10) * 2;

// Stamina Máximo
maxStamina = baseStamina + (constitution - 10) * 2 + (strength - 10);

// Iniciativa (para combate por turnos)
initiative = dexterity + luck / 2;

// Capacidad de Inventario
inventoryCapacity = 30 + strength * 2;
```

### 1.3 Razas

#### Human (Humano)

```yaml
bonuses:
  strength: +1
  dexterity: +1
  constitution: +1
  intelligence: +1
  wisdom: +1
  charisma: +1
traits:
  - Versátil: +10% XP ganado
  - Ambicioso: +5% oro encontrado
  - Adaptable: Aprende habilidades 20% más rápido
startingEquipment:
  - Espada Corta
  - Armadura de Cuero
  - 50 Oro
```

#### Elf (Elfo)

```yaml
bonuses:
  dexterity: +2
  intelligence: +1
traits:
  - Visión Nocturna: Ve en oscuridad total
  - Inmune a Sueño: No puede ser dormido
  - Longevidad: +20% duración de buffs
startingEquipment:
  - Arco Largo
  - Capa Élfica
  - 30 Oro
```

#### Dwarf (Enano)

```yaml
bonuses:
  constitution: +2
  strength: +1
traits:
  - Resistencia a Veneno: 50% reducción daño veneno
  - Visión en Oscuridad: Ve en penumbra
  - Fortaleza: +10% HP máximo
startingEquipment:
  - Hacha de Guerra
  - Cota de Malla
  - 40 Oro
```

#### Halfling (Mediano)

```yaml
bonuses:
  dexterity: +2
  charisma: +1
traits:
  - Suertudo: Puede repetir un dado crítico fallido
  - Valiente: Inmune a miedo
  - Ágil: +5% evasión
startingEquipment:
  - Daga
  - Honda
  - 60 Oro
```

#### Tiefling

```yaml
bonuses:
  charisma: +2
  intelligence: +1
traits:
  - Resistencia al Fuego: 50% reducción daño fuego
  - Visión en Oscuridad: Ve en penumbra
  - Magia Infernal: Conoce hechizo Llamas Infernales
startingEquipment:
  - Bastón
  - Túnica Oscura
  - 35 Oro
```

#### Dragonborn (Dracónido)

```yaml
bonuses:
  strength: +2
  charisma: +1
traits:
  - Aliento de Dragón: Ataque de área elemental (1/descanso)
  - Resistencia Elemental: Elige elemento al crear
  - Presencia Imponente: +10% intimidación
elements:
  - Fuego (más común)
  - Hielo
  - Rayo
  - Ácido
  - Veneno
startingEquipment:
  - Espada Bastarda
  - Escamas Ancestrales
  - 25 Oro
```

### 1.4 Clases

#### Warrior (Guerrero)

```yaml
hitDie: d10
primaryStat: strength
secondaryStat: constitution
proficiencies:
  - Todas las armas
  - Armaduras pesadas
  - Escudos
startingSkills:
  - Ataque Poderoso: +50% daño, -20% precisión
  - Intimidación: Chance de hacer huir enemigo débil
abilities:
  level3: Golpe Aturdidor
  level5: Segundo Viento
  level7: Furia Berserker
  level10: Golpe Devastador
```

#### Mage (Mago)

```yaml
hitDie: d6
primaryStat: intelligence
secondaryStat: wisdom
proficiencies:
  - Bastones
  - Dagas
  - Varitas
  - Armaduras de tela
startingSkills:
  - Arcanos: Identificar magia
  - Concentración: Mantener hechizos activos
startingSpells:
  - Rayo Arcano
  - Escudo Mágico
abilities:
  level3: Misil Mágico (auto-hit)
  level5: Bola de Fuego (AoE)
  level7: Telequinesis
  level10: Invocación
```

#### Rogue (Pícaro)

```yaml
hitDie: d8
primaryStat: dexterity
secondaryStat: intelligence
proficiencies:
  - Armas ligeras
  - Arcos cortos
  - Armaduras ligeras
  - Herramientas de ladrón
startingSkills:
  - Sigilo: Moverse sin ser detectado
  - Juego de Manos: Robar, abrir cerraduras
  - Ataque Furtivo: +100% daño si sorprende
abilities:
  level3: Evasión
  level5: Veneno (DoT)
  level7: Sombras (invisibilidad temporal)
  level10: Golpe Mortal (ejecutar)
```

#### Bard (Bardo)

```yaml
hitDie: d8
primaryStat: charisma
secondaryStat: dexterity
proficiencies:
  - Armas simples
  - Espadas ligeras
  - Instrumentos musicales
  - Armaduras ligeras
startingSkills:
  - Interpretación: Buffs aliados
  - Persuasión: Mejores precios, diálogos
  - Canción de Batalla: +10% daño grupo
abilities:
  level3: Canción Curativa
  level5: Canto Encantador (charm)
  level7: Inspiración (aliado repite tirada)
  level10: Épica (buffs masivos)
```

#### Ranger (Explorador)

```yaml
hitDie: d10
primaryStat: dexterity
secondaryStat: wisdom
proficiencies:
  - Arcos
  - Armas simples
  - Armaduras medias
startingSkills:
  - Supervivencia: Encontrar comida, agua
  - Rastreo: Seguir huellas
  - Terreno Favorable: Bonus en naturaleza
abilities:
  level3: Disparo Preciso
  level5: Compañero Animal
  level7: Lluvia de Flechas (AoE)
  level10: Ojo de Águila (crítico garantizado)
```

#### Cleric (Clérigo)

```yaml
hitDie: d8
primaryStat: wisdom
secondaryStat: constitution
proficiencies:
  - Armas simples
  - Mazas
  - Armaduras medias
  - Escudos
startingSkills:
  - Religión: Conocimiento divino
  - Sanación: Curar heridas
  - Canalizar Divinidad: Poder especial
startingSpells:
  - Curación Menor
  - Luz Sagrada
abilities:
  level3: Repeler Muertos Vivientes
  level5: Curación Grupal
  level7: Aura Protectora
  level10: Resurrección
```

---

## 2. Sistema de Combate

### 2.1 Cálculo de Precisión

```typescript
function calculateHitChance(attacker: Character, target: Character): number {
  let hitChance = 80; // Base 80%

  // Bonificadores del atacante
  hitChance += (attacker.dexterity - 10) * 2;
  hitChance += attacker.getSkillLevel('weapon_proficiency') * 1.5;
  hitChance += attacker.hasWeapon() ? 5 : 0;
  hitChance += attacker.getBuffValue('accuracy');

  // Penalizadores
  if (attacker.hasDebuff('blind')) hitChance -= 30;
  if (target.isDefending('dodge')) hitChance -= 25 + target.dexterity * 2;
  hitChance -= target.dexterity * 1.5;

  // Límites
  return Math.max(5, Math.min(95, hitChance));
}
```

### 2.2 Cálculo de Daño

```typescript
function calculateDamage(attacker: Character, target: Character): number {
  // Daño base
  let damage = 10;
  damage += attacker.strength * 1.5;
  damage += attacker.weapon?.attack ?? 0;
  damage += attacker.getSkillLevel('combat') * 2;

  // Variación aleatoria (±15%)
  const variance = 0.85 + Math.random() * 0.3;
  damage *= variance;

  // Reducción por defensa del objetivo
  damage -= target.constitution * 0.8;
  damage -= target.getArmorValue();

  // Bloqueo con escudo
  if (target.isDefending('block')) {
    const blockReduction = 0.15 + target.strength * 0.015;
    damage *= 1 - blockReduction;
  }

  return Math.max(1, Math.floor(damage));
}
```

### 2.3 Golpe Crítico

```typescript
function calculateCritChance(attacker: Character): number {
  let critChance = 5; // Base 5%

  critChance += (attacker.dexterity - 10) * 0.5;
  critChance += attacker.getSkillLevel('critical_strike') * 0.8;
  critChance += attacker.weapon?.critBonus ?? 0;
  critChance += attacker.getBuffValue('critical_chance');

  return Math.min(50, critChance); // Máximo 50%
}

function applyCriticalDamage(baseDamage: number, attacker: Character): number {
  const critMultiplier = 2.0 + attacker.getSkillLevel('critical_damage') * 0.1;
  return Math.floor(baseDamage * critMultiplier);
}
```

### 2.4 Tipos de Defensa

#### Esquivar (Dodge)

```typescript
{
  type: 'dodge',
  staminaCost: 8,
  manaCost: 0,
  requirements: null,
  effect: {
    dodgeChance: 25 + dexterity * 2,
    description: 'Intenta esquivar el próximo ataque'
  }
}
```

#### Bloquear (Block)

```typescript
{
  type: 'block',
  staminaCost: 4 + (hasShield ? 0 : 2),
  manaCost: 0,
  requirements: ['shield'],
  effect: {
    blockChance: 30 + strength * 1.5,
    damageReduction: 15 + shieldDefense,
    description: 'Levanta el escudo para bloquear'
  }
}
```

#### Parar (Parry)

```typescript
{
  type: 'parry',
  staminaCost: 7,
  manaCost: 2,
  requirements: ['melee_weapon', 'dexterity >= 12'],
  effect: {
    parryChance: 20 + dexterity * 2.5,
    description: 'Desvía el ataque enemigo con tu arma'
  }
}
```

#### Contraatacar (Counter)

```typescript
{
  type: 'counter',
  staminaCost: 12,
  manaCost: 5,
  requirements: ['weapon', 'level >= 5', 'dexterity >= 15'],
  effect: {
    counterChance: 15 + dexterity * 1.5,
    counterDamage: attackDamage * 0.8,
    description: 'Contraataca si el enemigo falla su ataque'
  }
}
```

### 2.5 Efectos de Estado

```typescript
enum EffectType {
  BUFF = 'buff', // Mejora temporal
  DEBUFF = 'debuff', // Penalización temporal
  DAMAGE = 'damage', // Daño instantáneo
  HEAL = 'heal', // Curación instantánea
  DOT = 'dot', // Daño por turno
  HOT = 'hot', // Curación por turno
  STUN = 'stun', // Pierde turno
  SILENCE = 'silence', // No puede usar magia
  ROOT = 'root', // No puede moverse
  INVISIBILITY = 'invis', // Invisible hasta atacar
}

interface StatusEffect {
  type: EffectType;
  name: string;
  duration: number; // Turnos restantes
  value: number; // Magnitud del efecto
  stackable: boolean; // ¿Se acumula?
  maxStacks: number;
  source: string; // Quién lo aplicó
}
```

### 2.6 Descripciones de Combate

El sistema genera descripciones dinámicas basadas en:

```typescript
const WEAPON_TYPES = {
  BLADE: {
    verbs: ['slash', 'cut', 'slice', 'cleave'],
    sounds: ['clang', 'ring', 'sing'],
  },
  BLUNT: {
    verbs: ['crush', 'smash', 'bash', 'pummel'],
    sounds: ['crack', 'thud', 'crunch'],
  },
  PIERCE: {
    verbs: ['stab', 'thrust', 'pierce', 'impale'],
    sounds: ['squelch', 'whistle', 'hiss'],
  },
  MAGIC: {
    verbs: ['blast', 'zap', 'burn', 'freeze'],
    sounds: ['crackle', 'hum', 'roar'],
  },
  UNARMED: {
    verbs: ['punch', 'kick', 'strike', 'slam'],
    sounds: ['thump', 'smack', 'crack'],
  },
};

const BODY_PARTS = ['head', 'chest', 'arm', 'leg', 'shoulder', 'side'];

const CRITICAL_ADJECTIVES = ['brutal', 'devastating', 'savage', 'vicious', 'deadly'];
```

---

## 3. Sistema de Magia

### 3.1 Escuelas de Magia

| Escuela     | Stat Principal | Stat Secundario | Tipo             |
| ----------- | -------------- | --------------- | ---------------- |
| Fire        | Intelligence   | —               | Daño             |
| Ice         | Intelligence   | —               | Daño + Control   |
| Lightning   | Intelligence   | —               | Daño + Velocidad |
| Healing     | Wisdom         | —               | Curación         |
| Protection  | Wisdom         | Constitution    | Defensa          |
| Illusion    | Intelligence   | Charisma        | Control          |
| Enchantment | Charisma       | Intelligence    | Buff/Debuff      |

### 3.2 Fórmula de Costo de Maná

```typescript
function calculateManaCost(spell: Spell, caster: Character): number {
  const baseCost = spell.manaCost * spell.level;

  // Reducción por stats
  const intReduction = (caster.intelligence - 10) / 3;
  const wisReduction = (caster.wisdom - 10) / 3;

  // Reducción por especialización
  const schoolBonus = caster.hasSchoolMastery(spell.school) ? 0.8 : 1.0;

  return Math.max(1, Math.floor((baseCost - intReduction - wisReduction) * schoolBonus));
}
```

### 3.3 Efectividad de Hechizos

```typescript
function calculateSpellEffectiveness(spell: Spell, caster: Character): number {
  const primaryStat = caster.getStat(spell.primaryStat);
  const powerLevel = spell.powerLevel ?? 1;

  // Efectividad base
  let effectiveness = (primaryStat / 20) * (powerLevel / 5);

  // Variación aleatoria
  effectiveness *= 0.9 + Math.random() * 0.2;

  // Límites
  return Math.max(0.1, Math.min(2.0, effectiveness));
}
```

### 3.4 Lista de Hechizos Implementados

```typescript
const SPELLS = [
  {
    id: 'fireball',
    name: 'Bola de Fuego',
    level: 1,
    school: 'fire',
    manaCost: 15,
    cooldown: 5, // segundos (o turnos)
    target: 'enemy',
    effects: [{ type: 'damage', element: 'fire', value: 20 }],
    description: 'Lanza una bola de fuego que explota al impactar',
  },
  {
    id: 'minor_heal',
    name: 'Sanación Menor',
    level: 1,
    school: 'healing',
    manaCost: 10,
    cooldown: 10,
    target: 'ally',
    effects: [{ type: 'heal', value: 15 }],
    description: 'Cura heridas menores del objetivo',
  },
  {
    id: 'ice_shard',
    name: 'Fragmento de Hielo',
    level: 2,
    school: 'ice',
    manaCost: 12,
    cooldown: 6,
    target: 'enemy',
    effects: [
      { type: 'damage', element: 'ice', value: 12 },
      { type: 'debuff', name: 'slowed', duration: 2 },
    ],
    description: 'Dispara un fragmento de hielo que ralentiza',
  },
];
```

---

## 4. Sistema de Items

### 4.1 Raridades

```typescript
enum Rarity {
  COMMON = 'common', // Blanco - 60%
  UNCOMMON = 'uncommon', // Verde - 25%
  RARE = 'rare', // Azul - 10%
  EPIC = 'epic', // Púrpura - 4%
  LEGENDARY = 'legendary', // Naranja - 0.9%
  MYTHIC = 'mythic', // Rojo - 0.1%
}

const RARITY_STAT_MULTIPLIER = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
  mythic: 5.0,
};
```

### 4.2 Tipos de Items

```typescript
enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  QUEST = 'quest',
  KEY = 'key',
}
```

### 4.3 Slots de Equipamiento

```typescript
enum EquipmentSlot {
  HEAD = 'head',
  BODY = 'body',
  HANDS = 'hands',
  FEET = 'feet',
  MAIN_HAND = 'mainHand',
  OFF_HAND = 'offHand',
  RING_1 = 'ring1',
  RING_2 = 'ring2',
  AMULET = 'amulet',
}
```

### 4.4 Items de Ejemplo

```typescript
const ITEMS = [
  // Armas
  {
    id: 'rusty_sword',
    name: 'Espada Oxidada',
    type: 'weapon',
    slot: 'mainHand',
    rarity: 'common',
    stats: { attack: 5 },
    requirements: { strength: 8 },
    value: 10,
  },
  {
    id: 'iron_dagger',
    name: 'Daga de Hierro',
    type: 'weapon',
    slot: 'mainHand',
    rarity: 'common',
    stats: { attack: 4, critChance: 10 },
    requirements: { dexterity: 8 },
    value: 15,
  },
  {
    id: 'oak_staff',
    name: 'Bastón de Roble',
    type: 'weapon',
    slot: 'mainHand',
    rarity: 'common',
    stats: { attack: 3, magicAttack: 5 },
    requirements: { intelligence: 8 },
    value: 20,
  },

  // Armadura
  {
    id: 'leather_vest',
    name: 'Chaleco de Cuero',
    type: 'armor',
    slot: 'body',
    rarity: 'common',
    stats: { defense: 3 },
    requirements: null,
    value: 25,
  },

  // Consumibles
  {
    id: 'minor_health_potion',
    name: 'Poción de Vida Menor',
    type: 'consumable',
    rarity: 'common',
    effects: [{ type: 'heal', value: 20 }],
    stackable: true,
    maxStack: 10,
    value: 10,
  },
];
```

### 4.5 Sistema de Inventario

```typescript
interface Inventory {
  capacity: number; // Máximo de items
  items: InventorySlot[];
  gold: number;
}

interface InventorySlot {
  item: Item;
  quantity: number;
  equipped: boolean;
}

// Constantes
const BASE_INVENTORY_CAPACITY = 50;
const MAX_STACK_SIZE = 99;
```

---

## 5. Sistema de Mundo

### 5.1 Tipos de Locación

```typescript
enum LocationType {
  TOWN = 'town', // Seguro, NPCs, comercio
  DUNGEON = 'dungeon', // Peligroso, loot
  WILDERNESS = 'wilderness', // Semi-peligroso, exploración
  INTERIOR = 'interior', // Edificios, diálogos
  COMBAT_ARENA = 'arena', // Solo combate
}
```

### 5.2 Estructura de Locación

```typescript
interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  imageUrl?: string;

  // Conexiones
  exits: Exit[];

  // Contenido
  npcs: NPC[];
  enemies: Enemy[];
  items: Item[];

  // Eventos
  onEnter?: GameEvent;
  onExit?: GameEvent;
  randomEvents?: RandomEvent[];

  // Requisitos
  requirements?: {
    level?: number;
    quest?: string;
    item?: string;
  };
}

interface Exit {
  direction: string;
  targetLocationId: string;
  description: string;
  locked?: boolean;
  keyId?: string;
}
```

### 5.3 Mapa Inicial

```typescript
const STARTING_WORLD = [
  {
    id: 'town_square',
    name: 'Plaza del Pueblo',
    type: 'town',
    description: 'El corazón del pequeño pueblo de Luminar...',
    exits: [
      { direction: 'north', targetLocationId: 'forest_entrance' },
      { direction: 'east', targetLocationId: 'blacksmith' },
      { direction: 'south', targetLocationId: 'tavern' },
    ],
    npcs: ['guard', 'merchant'],
  },
  {
    id: 'forest_entrance',
    name: 'Entrada del Bosque',
    type: 'wilderness',
    description: 'Los árboles se cierran formando un dosel oscuro...',
    exits: [
      { direction: 'south', targetLocationId: 'town_square' },
      { direction: 'north', targetLocationId: 'forest_clearing' },
    ],
    enemies: ['giant_rat'],
  },
  {
    id: 'forest_clearing',
    name: 'Claro del Bosque',
    type: 'wilderness',
    description: 'Un claro bañado por luz solar...',
    exits: [{ direction: 'south', targetLocationId: 'forest_entrance' }],
    enemies: ['wolf', 'bandit'],
    items: ['healing_herb'],
  },
  {
    id: 'blacksmith',
    name: 'Herrería',
    type: 'interior',
    description: 'El calor del horno te golpea al entrar...',
    exits: [{ direction: 'west', targetLocationId: 'town_square' }],
    npcs: ['blacksmith'],
  },
  {
    id: 'tavern',
    name: 'Taberna "El Tanque Oxidado"',
    type: 'interior',
    description: 'El olor a cerveza y comida caliente...',
    exits: [{ direction: 'north', targetLocationId: 'town_square' }],
    npcs: ['innkeeper'],
  },
];
```

### 5.4 Enemigos Base

```typescript
const ENEMY_TEMPLATES = [
  {
    id: 'giant_rat',
    name: 'Rata Gigante',
    class: 'beast',
    level: 1,
    stats: {
      hp: 20,
      strength: 4,
      dexterity: 12,
      constitution: 6,
    },
    rewards: {
      xp: 10,
      gold: { min: 2, max: 5 },
    },
    loot: [
      { itemId: 'rat_tail', chance: 0.8 },
      { itemId: 'minor_health_potion', chance: 0.05 },
    ],
    behavior: 'aggressive',
    abilities: [],
  },
  {
    id: 'bandit',
    name: 'Bandido',
    class: 'rogue',
    level: 2,
    stats: {
      hp: 40,
      strength: 8,
      dexterity: 10,
      constitution: 8,
    },
    rewards: {
      xp: 25,
      gold: { min: 10, max: 20 },
    },
    loot: [
      { itemId: 'bandit_mask', chance: 0.3 },
      { itemId: 'iron_dagger', chance: 0.1 },
    ],
    behavior: 'tactical',
    abilities: ['sneak_attack'],
  },
  {
    id: 'dire_wolf',
    name: 'Lobo Terrible',
    class: 'beast',
    level: 3,
    stats: {
      hp: 60,
      strength: 12,
      dexterity: 14,
      constitution: 10,
    },
    rewards: {
      xp: 40,
      gold: { min: 0, max: 0 },
    },
    loot: [
      { itemId: 'wolf_pelt', chance: 0.9 },
      { itemId: 'wolf_fang', chance: 0.6 },
    ],
    behavior: 'pack',
    abilities: ['howl', 'pounce'],
  },
];
```

---

## 6. Sistema de IA Game Master

### 6.1 Prompt del Sistema

El IA-DJ opera con estas directivas:

```typescript
const AI_SYSTEM_PROMPT = `
Eres el Dungeon Master de un RPG de fantasía medieval.

PERSONALIDAD:
- Justo pero desafiante
- Descriptivo y evocador
- Consistente con el setting

REGLAS:
1. NUNCA digas "No puedes hacer eso"
2. En su lugar, describe las consecuencias de acciones imposibles
3. Mantén la inmersión siempre
4. Respeta las mecánicas del juego

FORMATO DE RESPUESTA (JSON):
{
  "narration": "Descripción de lo que sucede...",
  "stateChanges": {
    "hp": -10,
    "gold": 25,
    "addItem": "sword_of_fire"
  },
  "imageTrigger": true/false,
  "imagePrompt": "Descripción para imagen",
  "metadata": {
    "diceRoll": 15,
    "probability": 0.75,
    "resolution": "success|partial|failure"
  }
}

DECISIÓN DE IMÁGENES:
- SÍ generar: Nueva locación, nuevo enemigo, momento épico
- NO generar: Acciones triviales, diálogos simples
`;
```

### 6.2 Contexto Enviado a la IA

```typescript
interface AIContext {
  character: {
    name: string;
    class: string;
    level: number;
    currentHp: number;
    maxHp: number;
    currentMana: number;
    maxMana: number;
    equipped: Equipment;
    inventory: Item[];
  };

  location: {
    name: string;
    description: string;
    npcs: string[];
    enemies: string[];
    exits: string[];
  };

  recentHistory: GameEvent[]; // Últimos 3 eventos

  preferences: {
    language: 'es' | 'en';
    tone: 'serious' | 'humorous' | 'epic';
    detailLevel: 'brief' | 'normal' | 'detailed';
    narrativeStyle: 'first_person' | 'second_person' | 'third_person';
  };
}
```

### 6.3 Respuesta de la IA

```typescript
interface AIResponse {
  narration: string;
  stateChanges: StateChanges;
  imageTrigger: boolean;
  imagePrompt?: string;
  metadata: {
    diceRoll?: number;
    probability?: number;
    resolution: 'success' | 'partial' | 'failure' | 'critical_success' | 'critical_failure';
  };
}

interface StateChanges {
  hp?: number;
  mana?: number;
  stamina?: number;
  xp?: number;
  gold?: number;
  addItem?: string | string[];
  removeItem?: string | string[];
  addQuest?: string;
  completeQuest?: string;
  unlockLocation?: string;
  addBuff?: StatusEffect;
  addDebuff?: StatusEffect;
}
```

---

## 7. Sistema de Comandos

### 7.1 Patrón Command

```typescript
interface IGameCommand {
  type: CommandType;
  execute(context: IGameContext): Promise<ICommandResult>;
  undo?(context: IGameContext): Promise<void>;
  canUndo: boolean;
}

interface IGameContext {
  gameSession: GameSession;
  character: Character;
  gameState: GameState;
  aiService: AIGatewayService;
}

interface ICommandResult {
  success: boolean;
  narration: string;
  stateChanges: StateChanges;
  imageTrigger?: boolean;
  imagePrompt?: string;
  diceRoll?: DiceRoll;
}
```

### 7.2 Comandos Implementados

| Tipo               | Clase                    | Descripción                | Undo |
| ------------------ | ------------------------ | -------------------------- | ---- |
| ATTACK             | AttackCommand            | Ataque físico              | ❌   |
| MOVE               | MoveCommand              | Cambiar locación           | ✅   |
| USE_ITEM           | UseItemCommand           | Usar consumible            | ✅   |
| CAST_SPELL         | CastSpellCommand         | Lanzar hechizo             | ✅   |
| DEFEND             | DefendCommand            | Postura defensiva          | ✅   |
| INTERACT           | InteractCommand          | Interactuar con objeto/NPC | ✅   |
| LOOT               | LootCommand              | Recoger items              | ✅   |
| RESPAWN            | RespawnCommand           | Revivir tras muerte        | ✅   |
| GENERATE_NARRATIVE | GenerateNarrativeCommand | IA genera texto            | ✅   |
| GENERATE_IMAGE     | GenerateImageCommand     | IA genera imagen           | ✅   |
| CUSTOM             | ProcessInputCommand      | Input libre → IA           | ✅   |

### 7.3 Fases del Juego

```typescript
enum GamePhase {
  EXPLORATION = 'exploration', // Movimiento libre
  COMBAT = 'combat', // Turnos de combate
  DIALOGUE = 'dialogue', // Conversación con NPC
  TRADE = 'trade', // Compra/venta
  REST = 'rest', // Recuperación
  CUTSCENE = 'cutscene', // Narrativa sin input
}
```

---

## 8. Sistema de Logros

### 8.1 Categorías

```typescript
enum AchievementCategory {
  BATTLE = 'battle',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  SPECIAL = 'special',
}
```

### 8.2 Logros de Ejemplo

```typescript
const ACHIEVEMENTS = [
  // Batalla
  {
    id: 'first_blood',
    name: 'Primera Sangre',
    description: 'Derrota a tu primer enemigo',
    category: 'battle',
    points: 10,
    trigger: { type: 'enemies_killed', count: 1 },
  },
  {
    id: 'warrior',
    name: 'Guerrero',
    description: 'Derrota 100 enemigos',
    category: 'battle',
    points: 50,
    trigger: { type: 'enemies_killed', count: 100 },
  },

  // Exploración
  {
    id: 'explorer',
    name: 'Explorador',
    description: 'Descubre 10 locaciones',
    category: 'exploration',
    points: 25,
    trigger: { type: 'locations_discovered', count: 10 },
  },

  // Social
  {
    id: 'diplomat',
    name: 'Diplomático',
    description: 'Completa 10 diálogos sin combate',
    category: 'social',
    points: 30,
    trigger: { type: 'peaceful_resolutions', count: 10 },
  },

  // Especial
  {
    id: 'dedicated_player',
    name: 'Jugador Dedicado',
    description: 'Juega 100 horas',
    category: 'special',
    points: 150,
    trigger: { type: 'playtime_hours', count: 100 },
  },
];
```

### 8.3 Sistema de Tracking

```typescript
interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  completed: boolean;
  completedAt?: Date;
}

interface PlayerAchievements {
  total_points: number;
  achievements: AchievementProgress[];
  recently_unlocked: string[];
}
```

---

_Documento de referencia técnica - Actualizar cuando se implementen nuevos sistemas_
