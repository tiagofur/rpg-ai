/**
 * Dialogue System Types
 * Tipos para el sistema de diálogos con NPCs
 */

export type DialogueSpeaker = 'npc' | 'player';

export type DialogueEffectType =
    | 'give_quest'
    | 'complete_quest'
    | 'give_item'
    | 'take_item'
    | 'give_gold'
    | 'take_gold'
    | 'change_reputation'
    | 'unlock_location'
    | 'heal'
    | 'trigger_combat'
    | 'end_dialogue';

export interface IDialogueRequirement {
    stat?: { name: string; min: number };
    item?: string;
    quest?: string;
    questCompleted?: string;
    gold?: number;
    reputation?: { faction: string; min: number };
    level?: number;
}

export interface IDialogueEffect {
    type: DialogueEffectType;
    value: string | number | Record<string, unknown>;
}

export interface IDialogueOption {
    id: string;
    text: string;
    targetNode: string;
    requirements?: IDialogueRequirement;
    effects?: IDialogueEffect[];
    isHidden?: boolean; // Hide if requirements not met (vs showing greyed out)
    tooltip?: string; // Shown when hovering/requirements not met
}

export interface IDialogueNode {
    id: string;
    text: string;
    speaker: DialogueSpeaker;
    speakerName?: string; // Override NPC name for this line
    emotion?: NPCEmotion;
    options?: IDialogueOption[];
    effects?: IDialogueEffect[];
    next?: string; // Auto-advance to this node (if no options)
    delay?: number; // Delay in ms before showing next node
}

export interface IDialogueTree {
    id: string;
    npcId: string;
    npcName: string;
    npcPortrait?: string;
    startNode: string;
    nodes: IDialogueNode[];
    tags?: string[]; // For filtering/searching dialogues
}

export type NPCEmotion =
    | 'neutral'
    | 'happy'
    | 'sad'
    | 'angry'
    | 'surprised'
    | 'scared'
    | 'thinking'
    | 'suspicious';

export interface INPCData {
    id: string;
    name: string;
    title?: string; // e.g., "Innkeeper", "Blacksmith"
    portrait?: string;
    emotion: NPCEmotion;
    dialogueTreeId?: string;
}

export interface IDialogueState {
    isActive: boolean;
    currentDialogueId?: string;
    currentNodeId?: string;
    npc?: INPCData;
    history: string[]; // Node IDs visited in this conversation
    variables: Record<string, string | number | boolean>; // Dynamic dialogue state
}

/**
 * Get emoji for NPC emotion
 */
export function getEmotionEmoji(emotion: NPCEmotion): string {
    switch (emotion) {
        case 'happy':
            return '😊';
        case 'sad':
            return '😢';
        case 'angry':
            return '😠';
        case 'surprised':
            return '😮';
        case 'scared':
            return '😨';
        case 'thinking':
            return '🤔';
        case 'suspicious':
            return '🤨';
        default:
            return '😐';
    }
}

/**
 * Get NPC type icon
 */
export function getNPCIcon(title?: string): string {
    const titleLower = title?.toLowerCase() || '';

    if (titleLower.includes('innkeeper') || titleLower.includes('tabernero')) {
        return '🍺';
    }
    if (titleLower.includes('blacksmith') || titleLower.includes('herrero')) {
        return '⚒️';
    }
    if (titleLower.includes('merchant') || titleLower.includes('mercader')) {
        return '💰';
    }
    if (titleLower.includes('guard') || titleLower.includes('guardia')) {
        return '🛡️';
    }
    if (titleLower.includes('mage') || titleLower.includes('mago')) {
        return '🧙';
    }
    if (titleLower.includes('healer') || titleLower.includes('sanador')) {
        return '💚';
    }
    if (titleLower.includes('king') || titleLower.includes('rey')) {
        return '👑';
    }
    if (titleLower.includes('quest') || titleLower.includes('misión')) {
        return '❗';
    }
    return '👤';
}

/**
 * Check if dialogue option requirements are met
 */
export function checkRequirements(
    requirements: IDialogueRequirement | undefined,
    playerData: {
        stats?: Record<string, number>;
        items?: string[];
        quests?: string[];
        completedQuests?: string[];
        gold?: number;
        reputation?: Record<string, number>;
        level?: number;
    }
): boolean {
    if (!requirements) return true;

    if (requirements.stat) {
        const statValue = playerData.stats?.[requirements.stat.name] || 0;
        if (statValue < requirements.stat.min) return false;
    }

    if (requirements.item && !playerData.items?.includes(requirements.item)) {
        return false;
    }

    if (requirements.quest && !playerData.quests?.includes(requirements.quest)) {
        return false;
    }

    if (requirements.questCompleted && !playerData.completedQuests?.includes(requirements.questCompleted)) {
        return false;
    }

    if (requirements.gold && (playerData.gold || 0) < requirements.gold) {
        return false;
    }

    if (requirements.reputation) {
        const repValue = playerData.reputation?.[requirements.reputation.faction] || 0;
        if (repValue < requirements.reputation.min) return false;
    }

    if (requirements.level && (playerData.level || 1) < requirements.level) {
        return false;
    }

    return true;
}

/**
 * Sample dialogue data for testing
 */
export const SAMPLE_INNKEEPER_DIALOGUE: IDialogueTree = {
    id: 'innkeeper_main',
    npcId: 'innkeeper_01',
    npcName: 'Greta',
    startNode: 'greeting',
    nodes: [
        {
            id: 'greeting',
            text: '¡Bienvenido a "El Tanque Oxidado"! ¿Qué puedo hacer por ti, viajero?',
            speaker: 'npc',
            emotion: 'happy',
            options: [
                { id: 'opt_work', text: 'Busco trabajo', targetNode: 'work' },
                { id: 'opt_rumors', text: '¿Qué noticias hay?', targetNode: 'rumors' },
                { id: 'opt_rest', text: 'Necesito descansar', targetNode: 'rest' },
                { id: 'opt_bye', text: 'Hasta luego', targetNode: 'goodbye' },
            ],
        },
        {
            id: 'work',
            text: 'Trabajo, ¿eh? Bueno, tengo un problema con ratas en el sótano. Últimamente se han vuelto muy agresivas...',
            speaker: 'npc',
            emotion: 'thinking',
            options: [
                {
                    id: 'opt_accept',
                    text: 'Me encargo de ellas',
                    targetNode: 'accept_quest',
                    effects: [{ type: 'give_quest', value: 'rats_in_cellar' }],
                },
                {
                    id: 'opt_harder',
                    text: '¿Algo más peligroso?',
                    targetNode: 'harder_work',
                    requirements: { level: 3 },
                },
                { id: 'opt_back', text: 'Mejor no, gracias', targetNode: 'greeting' },
            ],
        },
        {
            id: 'accept_quest',
            text: '¡Excelente! El sótano está por la puerta de atrás. Ten cuidado, algunas son del tamaño de perros pequeños.',
            speaker: 'npc',
            emotion: 'happy',
            next: 'goodbye',
        },
        {
            id: 'harder_work',
            text: 'Veo que eres valiente... Hay rumores de un nido de goblins en las afueras. La recompensa sería mayor.',
            speaker: 'npc',
            emotion: 'surprised',
            options: [
                {
                    id: 'opt_goblins',
                    text: 'Cuéntame más sobre los goblins',
                    targetNode: 'goblin_quest',
                },
                { id: 'opt_rats', text: 'Las ratas están bien', targetNode: 'work' },
            ],
        },
        {
            id: 'rumors',
            text: 'Dicen que el bosque al norte se ha vuelto peligroso. Viajeros hablan de sombras que se mueven entre los árboles...',
            speaker: 'npc',
            emotion: 'scared',
            options: [
                { id: 'opt_more', text: '¿Algo más?', targetNode: 'more_rumors' },
                { id: 'opt_back2', text: 'Interesante. ¿Algo más?', targetNode: 'greeting' },
            ],
        },
        {
            id: 'more_rumors',
            text: 'También se dice que el herrero busca materiales raros. Paga bien por ellos.',
            speaker: 'npc',
            emotion: 'neutral',
            next: 'greeting',
        },
        {
            id: 'rest',
            text: 'Una habitación cuesta 10 monedas de oro la noche. ¿Te interesa?',
            speaker: 'npc',
            emotion: 'neutral',
            options: [
                {
                    id: 'opt_rest_yes',
                    text: 'Sí, necesito descansar',
                    targetNode: 'rest_confirm',
                    requirements: { gold: 10 },
                    effects: [
                        { type: 'take_gold', value: 10 },
                        { type: 'heal', value: 'full' },
                    ],
                },
                {
                    id: 'opt_rest_no',
                    text: 'No tengo suficiente oro',
                    targetNode: 'greeting',
                },
            ],
        },
        {
            id: 'rest_confirm',
            text: 'Perfecto. Tu habitación está lista. Que descanses bien, aventurero.',
            speaker: 'npc',
            emotion: 'happy',
            effects: [{ type: 'end_dialogue', value: 'rest' }],
        },
        {
            id: 'goblin_quest',
            text: 'Los goblins han establecido un campamento a unas horas al oeste. Si pudieras eliminarlos, el pueblo te estaría muy agradecido.',
            speaker: 'npc',
            emotion: 'thinking',
            options: [
                {
                    id: 'opt_accept_goblin',
                    text: 'Acepto el desafío',
                    targetNode: 'accept_goblin_quest',
                    effects: [{ type: 'give_quest', value: 'goblin_camp' }],
                },
                { id: 'opt_decline', text: 'Es demasiado para mí', targetNode: 'greeting' },
            ],
        },
        {
            id: 'accept_goblin_quest',
            text: 'Eres valiente. Ten cuidado, viajan en grupos. Vuelve cuando hayas terminado.',
            speaker: 'npc',
            emotion: 'neutral',
            next: 'goodbye',
        },
        {
            id: 'goodbye',
            text: 'Hasta pronto, viajero. ¡Que la suerte te acompañe!',
            speaker: 'npc',
            emotion: 'happy',
            effects: [{ type: 'end_dialogue', value: 'normal' }],
        },
    ],
};
