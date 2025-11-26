/**
 * M2: Sistema de Arco Narrativo - Plantillas de Capítulos
 *
 * Define las plantillas predefinidas para generar capítulos con estructura narrativa.
 * Cada plantilla especifica: tipo, gancho, complicaciones, clímax y resoluciones posibles.
 */

import type { IChapterTemplate, ChapterType } from './NarrativeInterfaces.js';

// ============================================================================
// PLANTILLAS DE CAPÍTULOS
// ============================================================================

/**
 * Capítulo Tutorial: "El Despertar del Héroe"
 * Primer capítulo para nuevos jugadores - enseña mecánicas básicas
 */
export const CHAPTER_TUTORIAL: IChapterTemplate = {
    id: 'chapter_tutorial',
    type: 'ACTION',
    name: 'El Despertar del Héroe',
    description: 'Primer encuentro del héroe con el peligro. Introduce mecánicas básicas.',

    requirements: {
        maxLevel: 1,
        completedChapters: [], // Primer capítulo
    },

    hookConfig: {
        type: 'ATTACK',
        tensionBoost: 30,
        promptTemplate: `
El jugador despierta en {{setting}} con recuerdos fragmentados.
Un peligro inmediato ({{threat}}) lo obliga a actuar sin tiempo para pensar.
Debe encontrar {{objective}} para sobrevivir las próximas horas.

TONO: Urgente pero con esperanza. El jugador debe sentir que puede lograrlo.
OBJETIVO: Enseñar comandos básicos (moverse, atacar, usar objetos).
    `.trim(),
        possibleQuests: ['quest_survive_awakening', 'quest_find_shelter'],
    },

    complications: [
        {
            id: 'tutorial_first_ally',
            trigger: { type: 'progress', atPercent: 30 },
            description: 'Un misterioso extraño aparece y ofrece ayuda. ¿Se puede confiar?',
            tensionChange: -10,
            newThread: {
                id: 'thread_mysterious_ally',
                description: 'Alianza con el misterioso extraño',
                importance: 'SIDE',
                status: 'INTRODUCED',
                characters: ['{{ally_name}}'],
                relatedQuests: [],
                foreshadowing: ['Conoce demasiado sobre tu pasado', 'Evita hablar de sí mismo'],
            },
        },
        {
            id: 'tutorial_reveal_threat',
            trigger: { type: 'progress', atPercent: 60 },
            description: 'La amenaza inicial es solo una avanzadilla de algo mayor',
            tensionChange: 15,
        },
    ],

    climaxConfig: {
        type: 'BOSS_FIGHT',
        enemyScaling: 0.8, // Más fácil para tutorial
        requiredThreadsResolved: 0,
        promptTemplate: `
El jugador enfrenta al líder de {{threat}}.
Este enemigo es más fuerte pero tiene una debilidad obvia.
El jugador debe usar lo aprendido ({{learned_skill}}) para derrotarlo.

BALANCE: Victoria posible con estrategia básica. Permitir errores.
ENSEÑANZA: Reforzar mecánicas de combate.
    `.trim(),
    },

    resolutions: [
        {
            outcome: 'VICTORY',
            conditions: [{ type: 'boss_defeated' }],
            rewards: {
                xpMultiplier: 1.2,
                goldMultiplier: 1,
                bonusItems: ['item_starter_weapon_upgraded'],
                unlockedContent: ['location_village', 'chapter_templates_tier1'],
            },
            nextHooks: [
                {
                    id: 'hook_master_mention',
                    type: 'MYSTERY',
                    description: 'El líder derrotado menciona un "Maestro" antes de morir',
                    urgency: 'MEDIUM',
                },
            ],
            epiloguePrompt: `
Con el peligro inmediato resuelto, {{player_name}} puede respirar por primera vez.
Pero las últimas palabras del enemigo resonan: "El Maestro sabrá de ti..."
Un nuevo camino se abre. El pueblo cercano podría tener respuestas.

TONO: Alivio mezclado con intriga. Invitar a continuar.
      `.trim(),
        },
        {
            outcome: 'PARTIAL_SUCCESS',
            conditions: [{ type: 'time_elapsed', minutes: 20 }],
            rewards: {
                xpMultiplier: 0.8,
                goldMultiplier: 0.5,
            },
            nextHooks: [
                {
                    id: 'hook_enemy_escaped',
                    type: 'THREAT',
                    description: 'El líder escapó y buscará venganza',
                    urgency: 'HIGH',
                },
            ],
            epiloguePrompt: `
{{player_name}} logró sobrevivir, pero el líder enemigo escapó jurando venganza.
El pueblo podría ofrecer refugio... por ahora.

TONO: Victoria agridulce. El peligro continúa.
      `.trim(),
        },
    ],

    weight: 100, // Siempre elegido primero para nuevos jugadores

    variables: {
        setting: ['una cueva oscura', 'un bosque en llamas', 'las ruinas de una torre'],
        threat: ['goblins salvajes', 'bandidos desesperados', 'bestias corrompidas'],
        objective: ['una salida segura', 'agua y comida', 'un arma para defenderse'],
        ally_name: ['Kael el Errante', 'Mira la Silenciosa', 'Theron el Viejo'],
        learned_skill: ['esquivar ataques', 'usar el entorno', 'atacar puntos débiles'],
    },
};

/**
 * Capítulo Misterio: "La Amenaza Oculta"
 * Investigación en un pueblo con secretos oscuros
 */
export const CHAPTER_HIDDEN_THREAT: IChapterTemplate = {
    id: 'chapter_hidden_threat',
    type: 'MYSTERY',
    name: 'La Amenaza Oculta',
    description: 'Algo siniestro acecha en un pueblo aparentemente tranquilo.',

    requirements: {
        minLevel: 2,
    },

    hookConfig: {
        type: 'DISCOVERY',
        tensionBoost: 20,
        promptTemplate: `
Mientras {{player_name}} explora {{location}}, encuentra evidencia perturbadora:
{{mystery_element}}.
Los lugareños actúan extraño. Evitan ciertas preguntas. Algo no está bien.

TONO: Misterio creciente. Sembrar sospechas sobre múltiples personajes.
    `.trim(),
        possibleQuests: ['quest_investigate_village', 'quest_find_clues', 'quest_gain_trust'],
    },

    complications: [
        {
            id: 'mystery_false_suspect',
            trigger: { type: 'progress', atPercent: 25 },
            description: 'El sospechoso más obvio resulta ser inocente... o víctima',
            tensionChange: 10,
        },
        {
            id: 'mystery_disappearance',
            trigger: { type: 'progress', atPercent: 50 },
            description: 'Alguien cercano al jugador desaparece misteriosamente',
            tensionChange: 20,
            newThread: {
                id: 'thread_missing_person',
                description: 'Búsqueda del desaparecido',
                importance: 'MAIN',
                status: 'INTRODUCED',
                characters: ['{{missing_person}}'],
                relatedQuests: ['quest_find_missing'],
                foreshadowing: [],
            },
        },
        {
            id: 'mystery_true_reveal',
            trigger: { type: 'progress', atPercent: 75 },
            description: 'El verdadero culpable se revela de forma impactante',
            tensionChange: 15,
        },
    ],

    climaxConfig: {
        type: 'REVELATION',
        enemyScaling: 1,
        requiredThreadsResolved: 1,
        promptTemplate: `
La verdad sale a la luz. {{antagonist}} era el responsable todo el tiempo.
Sus motivos son {{motivation}}.
{{player_name}} debe decidir: ¿justicia o misericordia?

TONO: Confrontación moral. La decisión del jugador importa.
    `.trim(),
    },

    resolutions: [
        {
            outcome: 'VICTORY',
            conditions: [{ type: 'mystery_solved' }, { type: 'antagonist_dealt' }],
            rewards: {
                xpMultiplier: 1.3, // Bonus por resolver misterio
                goldMultiplier: 1,
                reputationChanges: [{ faction: 'village', amount: 50 }],
            },
            nextHooks: [
                {
                    id: 'hook_conspiracy',
                    type: 'THREAT',
                    description: 'El culpable trabajaba para alguien más poderoso',
                    urgency: 'HIGH',
                },
            ],
            epiloguePrompt: `
La verdad trajo paz al pueblo, pero también reveló una conspiración más profunda.
El {{antagonist}} era solo un peón. Las sombras tienen un maestro.
{{player_name}} ahora tiene un nuevo enemigo que conoce su nombre.

TONO: Satisfacción por resolver el misterio, pero nueva amenaza emerge.
      `.trim(),
        },
        {
            outcome: 'PYRRHIC_VICTORY',
            conditions: [{ type: 'mystery_solved' }],
            rewards: {
                xpMultiplier: 1.1,
                goldMultiplier: 0.8,
                reputationChanges: [{ faction: 'village', amount: -20 }],
            },
            nextHooks: [
                {
                    id: 'hook_consequence',
                    type: 'RELATIONSHIP',
                    description: 'La forma de resolver el misterio dejó heridas',
                    urgency: 'MEDIUM',
                },
            ],
            epiloguePrompt: `
El misterio fue resuelto, pero a un costo. El pueblo no olvidará cómo actuó {{player_name}}.
A veces la verdad duele más que la mentira.

TONO: Victoria amarga. Las acciones tienen consecuencias.
      `.trim(),
        },
    ],

    weight: 30,

    variables: {
        location: ['el pueblo de Ravenhollow', 'la aldea de Millbrook', 'el asentamiento de Thornwick'],
        mystery_element: [
            'sangre fresca que no es de ningún animal conocido',
            'símbolos extraños tallados en las puertas',
            'un diario con entradas cada vez más perturbadoras',
        ],
        missing_person: ['el tabernero amable', 'el niño curioso', 'el viejo sabio del pueblo'],
        antagonist: ['el alcalde respetado', 'el curandero querido', 'el comerciante amigable'],
        motivation: [
            'desesperación por salvar a un ser querido',
            'pacto con fuerzas oscuras por poder',
            'venganza por una injusticia del pasado',
        ],
    },
};

/**
 * Capítulo Acción: "La Horda se Acerca"
 * Defensa contra una invasión inminente
 */
export const CHAPTER_INCOMING_HORDE: IChapterTemplate = {
    id: 'chapter_incoming_horde',
    type: 'ACTION',
    name: 'La Horda se Acerca',
    description: 'Una fuerza enemiga marcha hacia una posición vulnerable. El tiempo es limitado.',

    requirements: {
        minLevel: 3,
    },

    hookConfig: {
        type: 'OMEN',
        tensionBoost: 35,
        promptTemplate: `
Un explorador herido llega con noticias terribles: {{enemy_force}} marcha hacia {{location}}.
Llegarán en {{time_limit}}. No hay tiempo para huir, solo para prepararse.
{{player_name}} debe organizar la defensa o todo estará perdido.

TONO: Urgencia extrema. Cuenta regresiva palpable.
    `.trim(),
        possibleQuests: ['quest_fortify_defenses', 'quest_gather_allies', 'quest_sabotage_enemy'],
    },

    complications: [
        {
            id: 'horde_traitor',
            trigger: { type: 'progress', atPercent: 30 },
            description: 'Se descubre un traidor entre los defensores',
            tensionChange: 15,
            newThread: {
                id: 'thread_traitor',
                description: 'Desenmascarar y lidiar con el traidor',
                importance: 'SIDE',
                status: 'INTRODUCED',
                characters: ['{{traitor}}'],
                relatedQuests: [],
                foreshadowing: ['Nerviosismo sospechoso', 'Ausencias sin explicar'],
            },
        },
        {
            id: 'horde_early_scouts',
            trigger: { type: 'time', afterMinutes: 10 },
            description: 'Exploradores enemigos llegan antes de tiempo',
            tensionChange: 12,
        },
        {
            id: 'horde_unexpected_ally',
            trigger: { type: 'progress', atPercent: 55 },
            description: 'Ayuda inesperada llega de una fuente improbable',
            tensionChange: -8,
        },
    ],

    climaxConfig: {
        type: 'SHOWDOWN',
        enemyScaling: 1.3, // Batalla difícil
        requiredThreadsResolved: 0,
        promptTemplate: `
La horda llega. El momento de la verdad.
Las defensas preparadas ({{defenses}}) serán puestas a prueba.
{{player_name}} debe liderar la defensa y enfrentar al {{enemy_leader}}.

TONO: Épico y desesperado. Cada acción cuenta.
    `.trim(),
    },

    resolutions: [
        {
            outcome: 'VICTORY',
            conditions: [{ type: 'boss_defeated' }, { type: 'main_objective_complete' }],
            rewards: {
                xpMultiplier: 1.5,
                goldMultiplier: 1.3,
                bonusItems: ['item_trophy_enemy_banner'],
                reputationChanges: [{ faction: 'defenders', amount: 100 }],
                unlockedContent: ['title_defender'],
            },
            nextHooks: [
                {
                    id: 'hook_enemy_retreat',
                    type: 'OPPORTUNITY',
                    description: 'El enemigo en retirada dejó suministros. ¿Perseguir o consolidar?',
                    urgency: 'MEDIUM',
                },
            ],
            epiloguePrompt: `
Contra todo pronóstico, {{location}} resistió. {{player_name}} es aclamado como héroe.
Pero en la distancia, el estandarte enemigo aún ondea. Esto fue solo una batalla.
La guerra continúa.

TONO: Triunfo épico. El jugador es un héroe reconocido.
      `.trim(),
        },
        {
            outcome: 'ESCAPE',
            conditions: [{ type: 'time_elapsed', minutes: 25 }],
            rewards: {
                xpMultiplier: 0.7,
                goldMultiplier: 0.3,
            },
            nextHooks: [
                {
                    id: 'hook_refugees',
                    type: 'RELATIONSHIP',
                    description: 'Los supervivientes buscan un nuevo hogar. Te miran para liderarlos.',
                    urgency: 'HIGH',
                },
            ],
            epiloguePrompt: `
{{location}} cayó, pero no todos perecieron. {{player_name}} logró salvar a algunos.
El peso de la derrota es real, pero también el valor de cada vida salvada.
Habrá tiempo para la venganza.

TONO: Derrota pero no destrucción. Semilla de esperanza.
      `.trim(),
        },
    ],

    weight: 25,

    variables: {
        enemy_force: ['una horda de orcos', 'un ejército de no-muertos', 'mercenarios despiadados'],
        location: ['el fuerte de Highwatch', 'el pueblo de Millbrook', 'el paso montañoso'],
        time_limit: ['el amanecer', 'tres días', 'antes del anochecer'],
        traitor: ['el capitán de la guardia', 'el comerciante de armas', 'el curandero del pueblo'],
        defenses: ['barricadas improvisadas', 'trampas en el camino', 'arqueros en las torres'],
        enemy_leader: ['Warlord Grakk', 'el Caballero Negro', 'Comandante Vex'],
    },
};

/**
 * Capítulo Exploración: "Más Allá del Mapa"
 * Descubrimiento de territorios desconocidos
 */
export const CHAPTER_BEYOND_THE_MAP: IChapterTemplate = {
    id: 'chapter_beyond_the_map',
    type: 'EXPLORATION',
    name: 'Más Allá del Mapa',
    description: 'Expedición a tierras inexploradas llenas de maravillas y peligros.',

    requirements: {
        minLevel: 2,
    },

    hookConfig: {
        type: 'DISCOVERY',
        tensionBoost: 15,
        promptTemplate: `
Un mapa antiguo revela la existencia de {{lost_place}}.
Los rumores hablan de {{treasure}}, pero también de {{danger}}.
{{player_name}} tiene la oportunidad de ser el primero en generaciones en explorarlo.

TONO: Maravilla y aventura. El mundo es vasto y misterioso.
    `.trim(),
        possibleQuests: ['quest_reach_destination', 'quest_map_territory', 'quest_find_artifacts'],
    },

    complications: [
        {
            id: 'exploration_terrain',
            trigger: { type: 'progress', atPercent: 20 },
            description: 'El terreno es más peligroso de lo esperado',
            tensionChange: 10,
        },
        {
            id: 'exploration_not_alone',
            trigger: { type: 'progress', atPercent: 45 },
            description: 'Señales de que alguien más busca lo mismo',
            tensionChange: 12,
            newThread: {
                id: 'thread_rival_explorer',
                description: 'Competencia con otro explorador',
                importance: 'SIDE',
                status: 'INTRODUCED',
                characters: ['{{rival}}'],
                relatedQuests: [],
                foreshadowing: ['Huellas recientes', 'Campamento abandonado'],
            },
        },
        {
            id: 'exploration_guardian',
            trigger: { type: 'progress', atPercent: 70 },
            description: 'El lugar tiene un guardián ancestral',
            tensionChange: 18,
        },
    ],

    climaxConfig: {
        type: 'REVELATION',
        enemyScaling: 1.1,
        requiredThreadsResolved: 0,
        promptTemplate: `
{{player_name}} finalmente llega al corazón de {{lost_place}}.
Lo que encuentra supera las expectativas: {{revelation}}.
Pero el guardián {{guardian}} exige una prueba antes de permitir el paso.

TONO: Asombro mezclado con desafío. El descubrimiento tiene un precio.
    `.trim(),
    },

    resolutions: [
        {
            outcome: 'VICTORY',
            conditions: [{ type: 'main_objective_complete' }],
            rewards: {
                xpMultiplier: 1.4,
                goldMultiplier: 1.5,
                bonusItems: ['item_ancient_artifact'],
                unlockedContent: ['location_{{lost_place}}', 'lore_ancient_civilization'],
            },
            nextHooks: [
                {
                    id: 'hook_artifact_power',
                    type: 'MYSTERY',
                    description: 'El artefacto encontrado tiene poderes que apenas comprendes',
                    urgency: 'MEDIUM',
                },
            ],
            epiloguePrompt: `
{{player_name}} ha logrado lo imposible. {{lost_place}} ya no es leyenda.
El conocimiento ganado abre puertas a lugares aún más remotos.
Pero con cada descubrimiento, el mundo se vuelve más grande... y más peligroso.

TONO: Logro y maravilla. El mundo tiene más secretos esperando.
      `.trim(),
        },
        {
            outcome: 'PARTIAL_SUCCESS',
            conditions: [{ type: 'time_elapsed', minutes: 30 }],
            rewards: {
                xpMultiplier: 1,
                goldMultiplier: 0.8,
                unlockedContent: ['location_{{lost_place}}_partial'],
            },
            nextHooks: [
                {
                    id: 'hook_return_prepared',
                    type: 'OPPORTUNITY',
                    description: 'Sabes el camino ahora. Podrás volver mejor preparado.',
                    urgency: 'LOW',
                },
            ],
            epiloguePrompt: `
El viaje no fue en vano. {{player_name}} ahora conoce el camino a {{lost_place}}.
Queda mucho por explorar, pero eso será para otro día.
El mapa personal del héroe se ha expandido.

TONO: Progreso parcial pero valioso. La aventura continúa.
      `.trim(),
        },
    ],

    weight: 20,

    variables: {
        lost_place: ['las Ruinas de Solaria', 'el Valle Olvidado', 'la Ciudad Flotante de Aether'],
        treasure: ['un artefacto de poder inmenso', 'conocimiento perdido de los antiguos', 'una fuente de magia pura'],
        danger: ['criaturas que no deberían existir', 'trampas ancestrales', 'la maldición de sus antiguos habitantes'],
        rival: ['Helena la Cazadora de Reliquias', 'el misterioso Colector', 'tu antiguo mentor'],
        guardian: ['un golem de cristal', 'el espíritu del último guardián', 'una esfinge sabia'],
        revelation: [
            'una civilización que ascendió a otro plano',
            'el origen del mal que asola la tierra',
            'la tumba de un dios olvidado',
        ],
    },
};

/**
 * Capítulo Horror: "Lo que Acecha en la Oscuridad"
 * Supervivencia contra lo desconocido
 */
export const CHAPTER_LURKING_DARKNESS: IChapterTemplate = {
    id: 'chapter_lurking_darkness',
    type: 'HORROR',
    name: 'Lo que Acecha en la Oscuridad',
    description: 'Algo terrible ha despertado. La supervivencia es la única prioridad.',

    requirements: {
        minLevel: 4,
    },

    hookConfig: {
        type: 'ATTACK',
        tensionBoost: 40,
        promptTemplate: `
Las luces de {{location}} parpadean y mueren. En la oscuridad, algo se mueve.
Los gritos comienzan. Nadie sabe qué es, pero {{horror_sign}}.
{{player_name}} debe sobrevivir hasta {{escape_condition}}.

TONO: Terror creciente. Lo desconocido es el peor enemigo.
    `.trim(),
        possibleQuests: ['quest_survive_night', 'quest_find_survivors', 'quest_discover_weakness'],
    },

    complications: [
        {
            id: 'horror_first_victim',
            trigger: { type: 'time', afterMinutes: 3 },
            description: 'Alguien cercano cae ante la criatura',
            tensionChange: 20,
        },
        {
            id: 'horror_false_safety',
            trigger: { type: 'progress', atPercent: 35 },
            description: 'Un refugio aparentemente seguro resulta ser una trampa',
            tensionChange: 15,
        },
        {
            id: 'horror_weakness_hint',
            trigger: { type: 'progress', atPercent: 60 },
            description: 'Se descubre una pista sobre cómo dañar a la criatura',
            tensionChange: -5,
            newThread: {
                id: 'thread_weakness',
                description: 'Descubrir la debilidad del horror',
                importance: 'MAIN',
                status: 'INTRODUCED',
                characters: [],
                relatedQuests: ['quest_find_weapon'],
                foreshadowing: ['La criatura evita {{weakness}}'],
            },
        },
    ],

    climaxConfig: {
        type: 'ESCAPE',
        enemyScaling: 1.5, // Muy difícil en combate directo
        requiredThreadsResolved: 1,
        promptTemplate: `
La única oportunidad de {{player_name}} es {{climax_action}}.
El horror está cerca. Puede sentir su presencia helada.
Es ahora o nunca.

TONO: Desesperación máxima. Victoria = supervivencia.
    `.trim(),
    },

    resolutions: [
        {
            outcome: 'VICTORY',
            conditions: [{ type: 'boss_defeated' }],
            rewards: {
                xpMultiplier: 1.6,
                goldMultiplier: 0.5, // No es sobre tesoros
                bonusItems: ['item_trophy_horror'],
                unlockedContent: ['knowledge_eldritch', 'resistance_fear'],
            },
            nextHooks: [
                {
                    id: 'hook_horror_origin',
                    type: 'MYSTERY',
                    description: '¿Qué despertó a esta criatura? Hay más donde vino.',
                    urgency: 'HIGH',
                },
            ],
            epiloguePrompt: `
Contra toda lógica, {{player_name}} destruyó al horror. O al menos, a su forma física.
Los susurros dicen que estas cosas no mueren realmente.
Pero por ahora, la oscuridad retrocede. {{player_name}} ha mirado al abismo y sobrevivido.

TONO: Victoria traumática. Las cicatrices son reales.
      `.trim(),
        },
        {
            outcome: 'ESCAPE',
            conditions: [{ type: 'main_objective_complete' }],
            rewards: {
                xpMultiplier: 1.2,
                goldMultiplier: 0.3,
            },
            nextHooks: [
                {
                    id: 'hook_horror_follows',
                    type: 'THREAT',
                    description: 'El horror no fue destruido. Sigue acechando.',
                    urgency: 'CRITICAL',
                    expiresIn: 3,
                },
            ],
            epiloguePrompt: `
{{player_name}} escapó, pero otros no tuvieron tanta suerte.
El sol sale, pero no hay alivio. La criatura sigue ahí fuera.
Volverá. Siempre vuelven.

TONO: Supervivencia con costo. El horror no ha terminado.
      `.trim(),
        },
    ],

    weight: 15,

    variables: {
        location: ['la mansión abandonada', 'las minas profundas', 'el pueblo durante el eclipse'],
        horror_sign: [
            'los que mueren no permanecen muertos',
            'el frío antinatural congela el alma',
            'las sombras tienen vida propia',
        ],
        escape_condition: ['el amanecer', 'llegar al santuario', 'destruir el foco del mal'],
        weakness: ['la luz pura', 'el sonido de campanas', 'la sal bendita'],
        climax_action: ['alcanzar la salida', 'completar el ritual de sellado', 'destruir el corazón oscuro'],
    },
};

// ============================================================================
// COLECCIÓN Y UTILIDADES
// ============================================================================

/**
 * Todas las plantillas de capítulos disponibles
 */
export const ALL_CHAPTER_TEMPLATES: IChapterTemplate[] = [
    CHAPTER_TUTORIAL,
    CHAPTER_HIDDEN_THREAT,
    CHAPTER_INCOMING_HORDE,
    CHAPTER_BEYOND_THE_MAP,
    CHAPTER_LURKING_DARKNESS,
];

/**
 * Mapa de plantillas por ID para acceso rápido
 */
export const CHAPTER_TEMPLATES_BY_ID: Record<string, IChapterTemplate> = Object.fromEntries(
    ALL_CHAPTER_TEMPLATES.map((t) => [t.id, t]),
);

/**
 * Plantillas por tipo de capítulo
 */
export const CHAPTER_TEMPLATES_BY_TYPE: Record<ChapterType, IChapterTemplate[]> = {
    ACTION: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'ACTION'),
    MYSTERY: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'MYSTERY'),
    SOCIAL: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'SOCIAL'),
    EXPLORATION: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'EXPLORATION'),
    HORROR: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'HORROR'),
    HEIST: ALL_CHAPTER_TEMPLATES.filter((t) => t.type === 'HEIST'),
};

/**
 * Obtiene plantillas elegibles para un jugador
 */
export function getEligibleTemplates(
    playerLevel: number,
    completedChapters: string[],
    currentLocation?: string,
    inventory?: string[],
): IChapterTemplate[] {
    return ALL_CHAPTER_TEMPLATES.filter((template) => {
        const req = template.requirements;
        if (!req) return true;

        // Verificar nivel
        if (req.minLevel !== undefined && playerLevel < req.minLevel) return false;
        if (req.maxLevel !== undefined && playerLevel > req.maxLevel) return false;

        // Verificar capítulos completados
        if (req.completedChapters?.length) {
            const hasAll = req.completedChapters.every((c) => completedChapters.includes(c));
            if (!hasAll) return false;
        }

        // Verificar localización
        if (req.inLocation?.length && currentLocation && !req.inLocation.includes(currentLocation)) {
            return false;
        }

        // Verificar items
        if (req.hasItem?.length && inventory) {
            const hasAll = req.hasItem.every((i) => inventory.includes(i));
            if (!hasAll) return false;
        }

        return true;
    });
}

/**
 * Selecciona una plantilla aleatoria basada en pesos
 */
export function selectWeightedTemplate(templates: IChapterTemplate[]): IChapterTemplate {
    if (templates.length === 0) {
        throw new Error('No hay plantillas elegibles');
    }

    const first = templates[0];
    if (!first) {
        throw new Error('No hay plantillas elegibles');
    }

    if (templates.length === 1) {
        return first;
    }

    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const template of templates) {
        random -= template.weight;
        if (random <= 0) {
            return template;
        }
    }

    // Fallback al primero
    return first;
}

/**
 * Reemplaza variables en un texto de plantilla
 */
export function interpolateTemplate(
    text: string,
    variables: Record<string, string>,
): string {
    let result = text;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    }

    return result;
}

/**
 * Selecciona valores aleatorios para las variables de una plantilla
 */
export function selectTemplateVariables(template: IChapterTemplate): Record<string, string> {
    const selected: Record<string, string> = {};

    if (!template.variables) return selected;

    for (const [key, options] of Object.entries(template.variables)) {
        const randomIndex = Math.floor(Math.random() * options.length);
        const value = options[randomIndex];
        if (value !== undefined) {
            selected[key] = value;
        }
    }

    return selected;
}
