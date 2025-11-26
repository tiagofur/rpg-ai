/**
 * Quest Templates - Plantillas de misiones del juego
 * 
 * Define las misiones disponibles con sus objetivos y recompensas
 */

export type QuestObjectiveType = 'KILL' | 'COLLECT' | 'EXPLORE' | 'TALK' | 'DELIVER' | 'ESCORT';
export type QuestStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IQuestObjective {
    /** Tipo de objetivo */
    type: QuestObjectiveType;
    /** ID del target (enemigo, item, locación, NPC) */
    targetId: string;
    /** Nombre legible del target */
    targetName: string;
    /** Cantidad requerida */
    requiredCount: number;
    /** Descripción del objetivo */
    description: string;
    /** Si el objetivo es opcional */
    optional?: boolean;
}

export interface IQuestReward {
    /** XP otorgada */
    xp: number;
    /** Oro otorgado */
    gold: number;
    /** IDs de items otorgados */
    items?: Array<{ itemId: string; quantity: number }>;
    /** Cambio de reputación */
    reputation?: { factionId: string; amount: number };
}

export interface IQuestTemplate {
    /** ID único de la misión */
    id: string;
    /** Título de la misión */
    title: string;
    /** Descripción corta */
    description: string;
    /** Descripción larga/historia */
    story: string;
    /** NPC que da la misión */
    giverId: string;
    /** Nombre del NPC que da la misión */
    giverName: string;
    /** Nivel mínimo requerido */
    minLevel: number;
    /** Objetivos de la misión */
    objectives: IQuestObjective[];
    /** Recompensas */
    rewards: IQuestReward;
    /** Misiones que deben completarse antes */
    prerequisites?: string[];
    /** Si la misión es repetible */
    repeatable?: boolean;
    /** Límite de tiempo en minutos (opcional) */
    timeLimit?: number;
    /** Categoría de la misión */
    category: 'main' | 'side' | 'daily' | 'tutorial';
}

/**
 * Todas las plantillas de misiones del juego
 */
export const QUEST_TEMPLATES: Record<string, IQuestTemplate> = {
    // ===== MISIONES DE TUTORIAL =====
    'quest_welcome': {
        id: 'quest_welcome',
        title: 'Bienvenido al Valle',
        description: 'Conoce a los habitantes del pueblo.',
        story: 'Has llegado al Valle de Luminar después de un largo viaje. Sería buena idea conocer a los lugareños y aprender sobre este lugar.',
        giverId: 'npc_guard',
        giverName: 'Guardia de la Plaza',
        minLevel: 1,
        objectives: [
            {
                type: 'TALK',
                targetId: 'npc_innkeeper',
                targetName: 'Tabernero Grom',
                requiredCount: 1,
                description: 'Habla con el tabernero',
            },
            {
                type: 'TALK',
                targetId: 'npc_blacksmith',
                targetName: 'Herrero Brom',
                requiredCount: 1,
                description: 'Habla con el herrero',
            },
            {
                type: 'EXPLORE',
                targetId: 'location_town_square',
                targetName: 'Plaza del Pueblo',
                requiredCount: 1,
                description: 'Explora la plaza',
            },
        ],
        rewards: {
            xp: 50,
            gold: 25,
            items: [{ itemId: 'potion_health_minor', quantity: 2 }],
        },
        category: 'tutorial',
    },

    // ===== MISIONES PRINCIPALES =====
    'quest_rats_cellar': {
        id: 'quest_rats_cellar',
        title: 'Ratas en el Sótano',
        description: 'El tabernero tiene un problema con ratas.',
        story: 'El tabernero Grom está desesperado. Las ratas han invadido su sótano y están arruinando sus suministros. Necesita a alguien que se encargue de ellas.',
        giverId: 'npc_innkeeper',
        giverName: 'Tabernero Grom',
        minLevel: 1,
        objectives: [
            {
                type: 'KILL',
                targetId: 'enemy_giant_rat',
                targetName: 'Rata Gigante',
                requiredCount: 5,
                description: 'Elimina 5 ratas gigantes',
            },
        ],
        rewards: {
            xp: 100,
            gold: 30,
            items: [{ itemId: 'potion_health_minor', quantity: 1 }],
        },
        prerequisites: ['quest_welcome'],
        category: 'main',
    },

    'quest_healing_herbs': {
        id: 'quest_healing_herbs',
        title: 'Hierbas Curativas',
        description: 'La sanadora necesita hierbas del bosque.',
        story: 'La sanadora del pueblo se ha quedado sin suministros de hierbas medicinales. Crecen en el claro del bosque, pero el camino es peligroso.',
        giverId: 'npc_healer',
        giverName: 'Sanadora Elara',
        minLevel: 1,
        objectives: [
            {
                type: 'COLLECT',
                targetId: 'item_healing_herb',
                targetName: 'Hierba Curativa',
                requiredCount: 5,
                description: 'Recoge 5 hierbas curativas',
            },
            {
                type: 'DELIVER',
                targetId: 'npc_healer',
                targetName: 'Sanadora Elara',
                requiredCount: 1,
                description: 'Entrega las hierbas a la sanadora',
            },
        ],
        rewards: {
            xp: 75,
            gold: 20,
            items: [
                { itemId: 'potion_health_minor', quantity: 3 },
            ],
        },
        category: 'side',
    },

    'quest_bandit_threat': {
        id: 'quest_bandit_threat',
        title: 'Amenaza Bandida',
        description: 'Los bandidos atacan a los viajeros en el camino.',
        story: 'Los comerciantes del pueblo están preocupados. Un grupo de bandidos ha tomado el camino al bosque y roba a todo el que pasa. El guardia de la plaza pide ayuda.',
        giverId: 'npc_guard',
        giverName: 'Guardia Marcus',
        minLevel: 2,
        objectives: [
            {
                type: 'KILL',
                targetId: 'enemy_bandit',
                targetName: 'Bandido',
                requiredCount: 3,
                description: 'Elimina 3 bandidos',
            },
            {
                type: 'COLLECT',
                targetId: 'item_bandit_orders',
                targetName: 'Órdenes del Bandido',
                requiredCount: 1,
                description: 'Encuentra las órdenes del líder bandido',
                optional: true,
            },
        ],
        rewards: {
            xp: 150,
            gold: 75,
            items: [{ itemId: 'weapon_iron_dagger', quantity: 1 }],
        },
        prerequisites: ['quest_rats_cellar'],
        category: 'main',
    },

    'quest_wolf_pack': {
        id: 'quest_wolf_pack',
        title: 'Manada de Lobos',
        description: 'Los lobos amenazan el ganado.',
        story: 'Una manada de lobos terribles ha sido vista cerca del pueblo. Los granjeros temen por su ganado y necesitan que alguien se encargue de la amenaza.',
        giverId: 'npc_farmer',
        giverName: 'Granjero Willem',
        minLevel: 2,
        objectives: [
            {
                type: 'KILL',
                targetId: 'enemy_wolf',
                targetName: 'Lobo Terrible',
                requiredCount: 4,
                description: 'Elimina 4 lobos terribles',
            },
        ],
        rewards: {
            xp: 200,
            gold: 50,
            items: [
                { itemId: 'material_wolf_pelt', quantity: 2 },
            ],
        },
        category: 'side',
    },

    // ===== MISIÓN DE EXPLORACIÓN =====
    'quest_forest_secrets': {
        id: 'quest_forest_secrets',
        title: 'Secretos del Bosque',
        description: 'Explora las profundidades del bosque.',
        story: 'El anciano del pueblo habla de ruinas antiguas escondidas en lo profundo del bosque. Quizás valga la pena investigar.',
        giverId: 'npc_elder',
        giverName: 'Anciano Theron',
        minLevel: 3,
        objectives: [
            {
                type: 'EXPLORE',
                targetId: 'location_forest_clearing',
                targetName: 'Claro del Bosque',
                requiredCount: 1,
                description: 'Encuentra el claro del bosque',
            },
            {
                type: 'EXPLORE',
                targetId: 'location_ancient_ruins',
                targetName: 'Ruinas Antiguas',
                requiredCount: 1,
                description: 'Descubre las ruinas antiguas',
            },
        ],
        rewards: {
            xp: 250,
            gold: 100,
        },
        prerequisites: ['quest_bandit_threat'],
        category: 'main',
    },
};

/**
 * Obtiene una plantilla de misión por ID
 */
export function getQuestTemplate(questId: string): IQuestTemplate | undefined {
    return QUEST_TEMPLATES[questId];
}

/**
 * Obtiene todas las plantillas de misiones
 */
export function getAllQuestTemplates(): IQuestTemplate[] {
    return Object.values(QUEST_TEMPLATES);
}

/**
 * Obtiene misiones disponibles para un nivel dado
 */
export function getQuestsForLevel(level: number): IQuestTemplate[] {
    return Object.values(QUEST_TEMPLATES).filter((q) => q.minLevel <= level);
}

/**
 * Obtiene misiones de una categoría específica
 */
export function getQuestsByCategory(category: IQuestTemplate['category']): IQuestTemplate[] {
    return Object.values(QUEST_TEMPLATES).filter((q) => q.category === category);
}
