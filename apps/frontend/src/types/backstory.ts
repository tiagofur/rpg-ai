/**
 * Backstory Generator Types
 * Sistema de generación de historia personal del personaje
 */

export type BackstoryCategory =
    | 'origin'
    | 'motivation'
    | 'fear'
    | 'enemy'
    | 'trait'
    | 'secret';

export interface IBackstoryQuestion {
    id: string;
    category: BackstoryCategory;
    question: string;
    options: IBackstoryOption[];
    icon: string;
}

export interface IBackstoryOption {
    id: string;
    text: string;
    effect: IBackstoryEffect;
    icon: string;
}

export interface IBackstoryEffect {
    narrativeTag: string; // Tag usado por la AI para contextualizar
    statModifiers?: Record<string, number>; // Modificadores de stats opcionales
    startingItem?: string; // Item inicial opcional
    specialEvent?: string; // Evento especial que se desbloqueará
    recurringNPC?: string; // NPC que aparecerá recurrentemente
}

export interface IBackstory {
    answers: Record<string, string>; // questionId -> optionId
    generatedSummary?: string; // Resumen generado por AI
    narrativeTags: string[]; // Tags acumulados para la AI
    completedAt?: Date;
}

export interface IBackstoryProgress {
    currentStep: number;
    totalSteps: number;
    answers: Record<string, string>;
    isComplete: boolean;
}

/**
 * Backstory questions database
 */
export const BACKSTORY_QUESTIONS: IBackstoryQuestion[] = [
    {
        id: 'origin',
        category: 'origin',
        question: 'backstory.questions.origin',
        icon: '🏠',
        options: [
            {
                id: 'noble',
                text: 'backstory.options.origin.noble',
                icon: '👑',
                effect: {
                    narrativeTag: 'noble_heritage',
                    statModifiers: { charisma: 2 },
                    startingItem: 'family_signet_ring',
                },
            },
            {
                id: 'commoner',
                text: 'backstory.options.origin.commoner',
                icon: '🌾',
                effect: {
                    narrativeTag: 'humble_origins',
                    statModifiers: { endurance: 2 },
                    startingItem: 'lucky_coin',
                },
            },
            {
                id: 'orphan',
                text: 'backstory.options.origin.orphan',
                icon: '🌙',
                effect: {
                    narrativeTag: 'mysterious_past',
                    statModifiers: { perception: 2 },
                    specialEvent: 'discover_true_parents',
                },
            },
            {
                id: 'outcast',
                text: 'backstory.options.origin.outcast',
                icon: '🔥',
                effect: {
                    narrativeTag: 'exile_survivor',
                    statModifiers: { survival: 2 },
                    recurringNPC: 'old_enemy_from_tribe',
                },
            },
        ],
    },
    {
        id: 'motivation',
        category: 'motivation',
        question: 'backstory.questions.motivation',
        icon: '🎯',
        options: [
            {
                id: 'revenge',
                text: 'backstory.options.motivation.revenge',
                icon: '⚔️',
                effect: {
                    narrativeTag: 'seeking_vengeance',
                    specialEvent: 'confront_nemesis',
                    recurringNPC: 'sworn_enemy',
                },
            },
            {
                id: 'glory',
                text: 'backstory.options.motivation.glory',
                icon: '🏆',
                effect: {
                    narrativeTag: 'glory_seeker',
                    statModifiers: { strength: 1, charisma: 1 },
                },
            },
            {
                id: 'knowledge',
                text: 'backstory.options.motivation.knowledge',
                icon: '📚',
                effect: {
                    narrativeTag: 'seeker_of_truth',
                    statModifiers: { intelligence: 2 },
                    startingItem: 'ancient_tome',
                },
            },
            {
                id: 'redemption',
                text: 'backstory.options.motivation.redemption',
                icon: '🕊️',
                effect: {
                    narrativeTag: 'past_sins',
                    specialEvent: 'face_past_mistakes',
                    statModifiers: { wisdom: 2 },
                },
            },
        ],
    },
    {
        id: 'fear',
        category: 'fear',
        question: 'backstory.questions.fear',
        icon: '😨',
        options: [
            {
                id: 'darkness',
                text: 'backstory.options.fear.darkness',
                icon: '🌑',
                effect: {
                    narrativeTag: 'fears_darkness',
                    specialEvent: 'overcome_darkness',
                },
            },
            {
                id: 'failure',
                text: 'backstory.options.fear.failure',
                icon: '💔',
                effect: {
                    narrativeTag: 'fears_failure',
                    statModifiers: { willpower: 2 },
                },
            },
            {
                id: 'abandonment',
                text: 'backstory.options.fear.abandonment',
                icon: '👤',
                effect: {
                    narrativeTag: 'fears_being_alone',
                    recurringNPC: 'loyal_companion',
                },
            },
            {
                id: 'magic',
                text: 'backstory.options.fear.magic',
                icon: '✨',
                effect: {
                    narrativeTag: 'distrusts_magic',
                    statModifiers: { magic_resistance: 10 },
                },
            },
        ],
    },
    {
        id: 'enemy',
        category: 'enemy',
        question: 'backstory.questions.enemy',
        icon: '👹',
        options: [
            {
                id: 'none',
                text: 'backstory.options.enemy.none',
                icon: '🕊️',
                effect: {
                    narrativeTag: 'no_enemies',
                },
            },
            {
                id: 'rival',
                text: 'backstory.options.enemy.rival',
                icon: '⚔️',
                effect: {
                    narrativeTag: 'has_rival',
                    recurringNPC: 'childhood_rival',
                    specialEvent: 'rival_confrontation',
                },
            },
            {
                id: 'crime_lord',
                text: 'backstory.options.enemy.crimeLord',
                icon: '🎭',
                effect: {
                    narrativeTag: 'owes_debt',
                    recurringNPC: 'crime_lord_collector',
                    startingItem: 'debt_note',
                },
            },
            {
                id: 'cult',
                text: 'backstory.options.enemy.cult',
                icon: '🔮',
                effect: {
                    narrativeTag: 'hunted_by_cult',
                    recurringNPC: 'cult_assassin',
                    specialEvent: 'cult_ritual',
                },
            },
        ],
    },
    {
        id: 'trait',
        category: 'trait',
        question: 'backstory.questions.trait',
        icon: '💎',
        options: [
            {
                id: 'honest',
                text: 'backstory.options.trait.honest',
                icon: '💯',
                effect: {
                    narrativeTag: 'brutally_honest',
                    statModifiers: { charisma: -1, wisdom: 2 },
                },
            },
            {
                id: 'cunning',
                text: 'backstory.options.trait.cunning',
                icon: '🦊',
                effect: {
                    narrativeTag: 'street_smart',
                    statModifiers: { intelligence: 1, perception: 1 },
                },
            },
            {
                id: 'brave',
                text: 'backstory.options.trait.brave',
                icon: '🦁',
                effect: {
                    narrativeTag: 'fearless_warrior',
                    statModifiers: { courage: 3 },
                },
            },
            {
                id: 'compassionate',
                text: 'backstory.options.trait.compassionate',
                icon: '💕',
                effect: {
                    narrativeTag: 'kind_heart',
                    statModifiers: { charisma: 2 },
                    recurringNPC: 'grateful_villager',
                },
            },
        ],
    },
    {
        id: 'secret',
        category: 'secret',
        question: 'backstory.questions.secret',
        icon: '🤫',
        options: [
            {
                id: 'none',
                text: 'backstory.options.secret.none',
                icon: '📖',
                effect: {
                    narrativeTag: 'open_book',
                },
            },
            {
                id: 'power',
                text: 'backstory.options.secret.power',
                icon: '⚡',
                effect: {
                    narrativeTag: 'hidden_power',
                    specialEvent: 'power_awakening',
                    statModifiers: { latent_magic: 5 },
                },
            },
            {
                id: 'identity',
                text: 'backstory.options.secret.identity',
                icon: '🎭',
                effect: {
                    narrativeTag: 'false_identity',
                    specialEvent: 'identity_revealed',
                },
            },
            {
                id: 'curse',
                text: 'backstory.options.secret.curse',
                icon: '☠️',
                effect: {
                    narrativeTag: 'cursed_soul',
                    specialEvent: 'break_curse',
                    recurringNPC: 'curse_origin',
                },
            },
        ],
    },
];

/**
 * Get question by ID
 */
export function getQuestionById(id: string): IBackstoryQuestion | undefined {
    return BACKSTORY_QUESTIONS.find((q) => q.id === id);
}

/**
 * Get option by question and option ID
 */
export function getOptionById(
    questionId: string,
    optionId: string
): IBackstoryOption | undefined {
    const question = getQuestionById(questionId);
    return question?.options.find((o) => o.id === optionId);
}

/**
 * Calculate total stat modifiers from backstory
 */
export function calculateBackstoryStats(
    answers: Record<string, string>
): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const [questionId, optionId] of Object.entries(answers)) {
        const option = getOptionById(questionId, optionId);
        if (option?.effect.statModifiers) {
            for (const [stat, value] of Object.entries(option.effect.statModifiers)) {
                stats[stat] = (stats[stat] ?? 0) + value;
            }
        }
    }

    return stats;
}

/**
 * Get all narrative tags from backstory
 */
export function getBackstoryTags(answers: Record<string, string>): string[] {
    const tags: string[] = [];

    for (const [questionId, optionId] of Object.entries(answers)) {
        const option = getOptionById(questionId, optionId);
        if (option?.effect.narrativeTag) {
            tags.push(option.effect.narrativeTag);
        }
    }

    return tags;
}

/**
 * Get starting items from backstory
 */
export function getStartingItems(answers: Record<string, string>): string[] {
    const items: string[] = [];

    for (const [questionId, optionId] of Object.entries(answers)) {
        const option = getOptionById(questionId, optionId);
        if (option?.effect.startingItem) {
            items.push(option.effect.startingItem);
        }
    }

    return items;
}

/**
 * Get special events from backstory
 */
export function getSpecialEvents(answers: Record<string, string>): string[] {
    const events: string[] = [];

    for (const [questionId, optionId] of Object.entries(answers)) {
        const option = getOptionById(questionId, optionId);
        if (option?.effect.specialEvent) {
            events.push(option.effect.specialEvent);
        }
    }

    return events;
}

/**
 * Get recurring NPCs from backstory
 */
export function getRecurringNPCs(answers: Record<string, string>): string[] {
    const npcs: string[] = [];

    for (const [questionId, optionId] of Object.entries(answers)) {
        const option = getOptionById(questionId, optionId);
        if (option?.effect.recurringNPC) {
            npcs.push(option.effect.recurringNPC);
        }
    }

    return npcs;
}

/**
 * Sample completed backstory for development
 */
export const SAMPLE_BACKSTORY: IBackstory = {
    answers: {
        origin: 'orphan',
        motivation: 'revenge',
        fear: 'darkness',
        enemy: 'cult',
        trait: 'brave',
        secret: 'power',
    },
    narrativeTags: [
        'mysterious_past',
        'seeking_vengeance',
        'fears_darkness',
        'hunted_by_cult',
        'fearless_warrior',
        'hidden_power',
    ],
    generatedSummary:
        'An orphan with a mysterious past, driven by vengeance against those who wronged them. Despite fearing the darkness, they face it bravely, hunted by a cult that knows of the hidden power dormant within them.',
    completedAt: new Date(),
};
