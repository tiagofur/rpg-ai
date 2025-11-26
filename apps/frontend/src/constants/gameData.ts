// ============================================================================
// Razas disponibles
// ============================================================================

export interface RaceData {
    id: string;
    name: string;
    nameEs: string;
    description: string;
    icon: string;
    bonuses: {
        attribute: string;
        value: number;
    }[];
    traits: string[];
}

export const RACES: RaceData[] = [
    {
        id: 'human',
        name: 'Human',
        nameEs: 'Humano',
        description: 'Versátiles y ambiciosos, los humanos se adaptan a cualquier situación.',
        icon: '👤',
        bonuses: [
            { attribute: 'Todas', value: 1 },
        ],
        traits: ['Versátil', 'Ambicioso', 'Adaptable'],
    },
    {
        id: 'elf',
        name: 'Elf',
        nameEs: 'Elfo',
        description: 'Elegantes y longevos, dotados de agudos sentidos y afinidad mágica.',
        icon: '🧝',
        bonuses: [
            { attribute: 'Agilidad', value: 2 },
            { attribute: 'Inteligencia', value: 1 },
        ],
        traits: ['Visión Nocturna', 'Inmune a Sueño', 'Longevidad'],
    },
    {
        id: 'dwarf',
        name: 'Dwarf',
        nameEs: 'Enano',
        description: 'Resistentes y obstinados, maestros de la forja y la piedra.',
        icon: '⛏️',
        bonuses: [
            { attribute: 'Constitución', value: 2 },
            { attribute: 'Fuerza', value: 1 },
        ],
        traits: ['Resistencia a Veneno', 'Visión en Oscuridad', 'Fortaleza'],
    },
    {
        id: 'halfling',
        name: 'Halfling',
        nameEs: 'Mediano',
        description: 'Pequeños y ágiles, con una suerte excepcional.',
        icon: '🍀',
        bonuses: [
            { attribute: 'Agilidad', value: 2 },
            { attribute: 'Carisma', value: 1 },
        ],
        traits: ['Suertudo', 'Valiente', 'Ágil'],
    },
    {
        id: 'tiefling',
        name: 'Tiefling',
        nameEs: 'Tiefling',
        description: 'Descendientes de linajes infernales, poseen poderes oscuros.',
        icon: '😈',
        bonuses: [
            { attribute: 'Carisma', value: 2 },
            { attribute: 'Inteligencia', value: 1 },
        ],
        traits: ['Resistencia al Fuego', 'Visión en Oscuridad', 'Magia Infernal'],
    },
    {
        id: 'dragonborn',
        name: 'Dragonborn',
        nameEs: 'Dracónido',
        description: 'Orgullosos guerreros con sangre de dragón y aliento elemental.',
        icon: '🐉',
        bonuses: [
            { attribute: 'Fuerza', value: 2 },
            { attribute: 'Carisma', value: 1 },
        ],
        traits: ['Aliento de Dragón', 'Resistencia Elemental', 'Presencia Imponente'],
    },
];

// ============================================================================
// Clases disponibles
// ============================================================================

export interface ClassData {
    id: string;
    name: string;
    nameEs: string;
    description: string;
    icon: string;
    primaryAttribute: string;
    secondaryAttribute: string;
    skills: string[];
    startingItems: string[];
    hitDie: number;
}

export const CLASSES: ClassData[] = [
    {
        id: 'warrior',
        name: 'Warrior',
        nameEs: 'Guerrero',
        description: 'Maestro del combate cuerpo a cuerpo, experto en todas las armas.',
        icon: '⚔️',
        primaryAttribute: 'Fuerza',
        secondaryAttribute: 'Constitución',
        skills: ['Ataque Poderoso', 'Intimidación', 'Armas Marciales', 'Atletismo'],
        startingItems: ['Espada Bastarda', 'Escudo Reforzado', 'Cota de Malla'],
        hitDie: 10,
    },
    {
        id: 'mage',
        name: 'Mage',
        nameEs: 'Mago',
        description: 'Estudioso de las artes arcanas, canaliza poder mágico devastador.',
        icon: '🧙',
        primaryAttribute: 'Inteligencia',
        secondaryAttribute: 'Sabiduría',
        skills: ['Arcanos', 'Conocimiento Histórico', 'Trucos', 'Concentración'],
        startingItems: ['Bastón Arcano', 'Grimorio', 'Componentes Arcanos'],
        hitDie: 6,
    },
    {
        id: 'rogue',
        name: 'Rogue',
        nameEs: 'Pícaro',
        description: 'Experto en sigilo y artimañas, golpea donde menos se espera.',
        icon: '🗡️',
        primaryAttribute: 'Agilidad',
        secondaryAttribute: 'Inteligencia',
        skills: ['Sigilo', 'Juego de Manos', 'Percepción', 'Acrobacias'],
        startingItems: ['Dos Dagas', 'Ganzúas', 'Capa Oscura'],
        hitDie: 8,
    },
    {
        id: 'bard',
        name: 'Bard',
        nameEs: 'Bardo',
        description: 'Artista versátil que usa música y palabras como armas.',
        icon: '🎵',
        primaryAttribute: 'Carisma',
        secondaryAttribute: 'Agilidad',
        skills: ['Interpretación', 'Persuasión', 'Historia', 'Juego de Manos'],
        startingItems: ['Laúd Tallado', 'Capa Elegante', 'Diario de Canciones'],
        hitDie: 8,
    },
    {
        id: 'ranger',
        name: 'Ranger',
        nameEs: 'Explorador',
        description: 'Guardián de la naturaleza, rastreador y arquero experto.',
        icon: '🏹',
        primaryAttribute: 'Agilidad',
        secondaryAttribute: 'Sabiduría',
        skills: ['Supervivencia', 'Sigilo', 'Percepción', 'Atletismo'],
        startingItems: ['Arco Corto', 'Carcaj con Flechas', 'Capa de Camuflaje'],
        hitDie: 10,
    },
    {
        id: 'cleric',
        name: 'Cleric',
        nameEs: 'Clérigo',
        description: 'Siervo divino que canaliza el poder de su deidad.',
        icon: '✨',
        primaryAttribute: 'Sabiduría',
        secondaryAttribute: 'Constitución',
        skills: ['Religión', 'Sanación', 'Arcanos', 'Persuasión'],
        startingItems: ['Maza Liviana', 'Símbolo Sagrado', 'Kit de Sanación'],
        hitDie: 8,
    },
];

// ============================================================================
// Atributos
// ============================================================================

export interface AttributeData {
    id: string;
    name: string;
    nameEs: string;
    abbreviation: string;
    description: string;
    icon: string;
}

export const ATTRIBUTES: AttributeData[] = [
    {
        id: 'strength',
        name: 'Strength',
        nameEs: 'Fuerza',
        abbreviation: 'FUE',
        description: 'Poder físico, daño cuerpo a cuerpo, capacidad de carga.',
        icon: '💪',
    },
    {
        id: 'dexterity',
        name: 'Dexterity',
        nameEs: 'Agilidad',
        abbreviation: 'AGI',
        description: 'Reflejos, precisión, sigilo, iniciativa.',
        icon: '🏃',
    },
    {
        id: 'constitution',
        name: 'Constitution',
        nameEs: 'Constitución',
        abbreviation: 'CON',
        description: 'Resistencia, puntos de vida, aguante.',
        icon: '❤️',
    },
    {
        id: 'intelligence',
        name: 'Intelligence',
        nameEs: 'Inteligencia',
        abbreviation: 'INT',
        description: 'Conocimiento, poder mágico arcano, resolución de puzzles.',
        icon: '🧠',
    },
    {
        id: 'wisdom',
        name: 'Wisdom',
        nameEs: 'Sabiduría',
        abbreviation: 'SAB',
        description: 'Percepción, intuición, poder divino.',
        icon: '👁️',
    },
    {
        id: 'charisma',
        name: 'Charisma',
        nameEs: 'Carisma',
        abbreviation: 'CAR',
        description: 'Influencia social, liderazgo, intimidación.',
        icon: '💬',
    },
];

// ============================================================================
// Valores por defecto y constantes
// ============================================================================

export const DEFAULT_ATTRIBUTE_VALUE = 10;
export const MIN_ATTRIBUTE_VALUE = 8;
export const MAX_ATTRIBUTE_VALUE = 18;
export const TOTAL_POINTS_TO_DISTRIBUTE = 27; // Point buy system

export const POINT_COSTS: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
    16: 12,
    17: 15,
    18: 19,
};

export function calculatePointCost(value: number): number {
    return POINT_COSTS[value] ?? 0;
}

export function calculateTotalPointsUsed(attributes: Record<string, number>): number {
    return Object.values(attributes).reduce((sum, val) => sum + calculatePointCost(val), 0);
}

// ============================================================================
// Mapeo de IDs frontend a nombres del backend
// ============================================================================

export const RACE_TO_BACKEND: Record<string, 'Humano' | 'Elfo' | 'Enano' | 'Mediano' | 'Tiefling' | 'Dracónido'> = {
    human: 'Humano',
    elf: 'Elfo',
    dwarf: 'Enano',
    halfling: 'Mediano',
    tiefling: 'Tiefling',
    dragonborn: 'Dracónido',
};

export const CLASS_TO_BACKEND: Record<string, 'Guerrero' | 'Mago' | 'Pícaro' | 'Bardo' | 'Explorador' | 'Clérigo'> = {
    warrior: 'Guerrero',
    mage: 'Mago',
    rogue: 'Pícaro',
    bard: 'Bardo',
    ranger: 'Explorador',
    cleric: 'Clérigo',
};

// Mapeo de IDs de atributos del frontend a nombres del backend
export const ATTRIBUTE_TO_BACKEND: Record<string, keyof typeof ATTRIBUTE_BACKEND_NAMES> = {
    strength: 'Fuerza',
    dexterity: 'Agilidad',
    constitution: 'Constitución',
    intelligence: 'Inteligencia',
    wisdom: 'Sabiduría',
    charisma: 'Carisma',
};

export const ATTRIBUTE_BACKEND_NAMES = {
    Fuerza: 'Fuerza',
    Agilidad: 'Agilidad',
    Constitución: 'Constitución',
    Inteligencia: 'Inteligencia',
    Sabiduría: 'Sabiduría',
    Carisma: 'Carisma',
} as const;
