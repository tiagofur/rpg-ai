/**
 * Story Mode Types
 * Campaña estructurada con inicio, desarrollo y final épico
 */

export type StoryAct = 'prologue' | 'act1' | 'act2' | 'act3' | 'epilogue';

export type ChapterStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface IStoryChapter {
    id: string;
    act: StoryAct;
    number: number;
    title: string;
    description: string;
    estimatedMinutes: number;
    status: ChapterStatus;
    objectives: IStoryObjective[];
    rewards: IChapterRewards;
    prerequisites: string[]; // Chapter IDs
    unlocksChapters: string[];
}

export interface IStoryObjective {
    id: string;
    description: string;
    type: 'main' | 'optional' | 'secret';
    isCompleted: boolean;
    xpReward: number;
}

export interface IChapterRewards {
    xp: number;
    gold: number;
    items: string[];
    achievements?: string[];
    unlocksContent?: string[];
}

export interface IStoryProgress {
    currentAct: StoryAct;
    currentChapterId: string;
    completedChapters: string[];
    totalPlayTime: number; // In seconds
    choicesMade: IStoryChoice[];
    relationshipScores: Record<string, number>;
    unlockedEndings: string[];
}

export interface IStoryChoice {
    chapterId: string;
    choiceId: string;
    option: string;
    timestamp: Date;
    affectedNpcs?: string[];
    consequences?: string[];
}

export interface ICampaignSummary {
    totalChapters: number;
    completedChapters: number;
    currentAct: StoryAct;
    estimatedTimeRemaining: number;
    percentComplete: number;
}

// Act metadata
export interface IActInfo {
    id: StoryAct;
    name: string;
    description: string;
    chapters: number;
    estimatedMinutes: number;
    iconEmoji: string;
}

// Story acts configuration
export const STORY_ACTS: IActInfo[] = [
    {
        id: 'prologue',
        name: 'Prologue',
        description: 'The awakening of a hero',
        chapters: 2,
        estimatedMinutes: 15,
        iconEmoji: '🌅',
    },
    {
        id: 'act1',
        name: 'Act I: The Call',
        description: 'A threat emerges from the shadows',
        chapters: 5,
        estimatedMinutes: 45,
        iconEmoji: '⚔️',
    },
    {
        id: 'act2',
        name: 'Act II: The Journey',
        description: 'Gathering allies and ancient artifacts',
        chapters: 8,
        estimatedMinutes: 90,
        iconEmoji: '🗺️',
    },
    {
        id: 'act3',
        name: 'Act III: The Reckoning',
        description: 'The final confrontation awaits',
        chapters: 5,
        estimatedMinutes: 60,
        iconEmoji: '🐉',
    },
    {
        id: 'epilogue',
        name: 'Epilogue',
        description: 'The world after your choices',
        chapters: 1,
        estimatedMinutes: 10,
        iconEmoji: '🏰',
    },
];

// Get act info by id
export function getActInfo(act: StoryAct): IActInfo {
    const info = STORY_ACTS.find((a) => a.id === act);
    if (!info) {
        // Return prologue as default (always exists)
        return {
            id: 'prologue',
            name: 'Prologue',
            description: 'The awakening of a hero',
            chapters: 2,
            estimatedMinutes: 15,
            iconEmoji: '🌅',
        };
    }
    return info;
}

// Get act colors for gradients
export function getActColors(act: StoryAct): [string, string] {
    const colors: Record<StoryAct, [string, string]> = {
        prologue: ['#4A90A4', '#2C5364'],
        act1: ['#8B4513', '#654321'],
        act2: ['#2E7D32', '#1B5E20'],
        act3: ['#B71C1C', '#880E4F'],
        epilogue: ['#FFD700', '#FF8C00'],
    };
    return colors[act];
}

// Get chapter status color
export function getStatusColor(status: ChapterStatus): string {
    const colors: Record<ChapterStatus, string> = {
        locked: '#757575',
        available: '#2196F3',
        in_progress: '#FF9800',
        completed: '#4CAF50',
    };
    return colors[status];
}

// Format play time
export function formatStoryTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

// Calculate campaign progress percentage
export function calculateProgress(
    completedChapters: string[],
    totalChapters: number
): number {
    if (totalChapters === 0) return 0;
    return Math.round((completedChapters.length / totalChapters) * 100);
}

// Sample chapters for development
export const SAMPLE_CHAPTERS: IStoryChapter[] = [
    {
        id: 'prologue-1',
        act: 'prologue',
        number: 1,
        title: 'A Strange Dream',
        description: 'You awaken from a nightmare that feels all too real...',
        estimatedMinutes: 8,
        status: 'completed',
        objectives: [
            { id: 'p1-o1', description: 'Wake up and explore your surroundings', type: 'main', isCompleted: true, xpReward: 25 },
            { id: 'p1-o2', description: 'Speak with the village elder', type: 'main', isCompleted: true, xpReward: 25 },
            { id: 'p1-o3', description: 'Find the hidden letter', type: 'secret', isCompleted: false, xpReward: 50 },
        ],
        rewards: { xp: 100, gold: 25, items: ['Traveler Cloak'] },
        prerequisites: [],
        unlocksChapters: ['prologue-2'],
    },
    {
        id: 'prologue-2',
        act: 'prologue',
        number: 2,
        title: 'The Path Ahead',
        description: 'The elder reveals your destiny and the journey begins.',
        estimatedMinutes: 7,
        status: 'in_progress',
        objectives: [
            { id: 'p2-o1', description: 'Prepare for your journey', type: 'main', isCompleted: true, xpReward: 25 },
            { id: 'p2-o2', description: 'Leave the village', type: 'main', isCompleted: false, xpReward: 50 },
            { id: 'p2-o3', description: 'Say goodbye to your mentor', type: 'optional', isCompleted: false, xpReward: 30 },
        ],
        rewards: { xp: 150, gold: 50, items: ['Starter Sword', 'Health Potion'] },
        prerequisites: ['prologue-1'],
        unlocksChapters: ['act1-1'],
    },
    {
        id: 'act1-1',
        act: 'act1',
        number: 1,
        title: 'Shadows Rising',
        description: 'Dark forces begin to stir in the ancient ruins.',
        estimatedMinutes: 10,
        status: 'locked',
        objectives: [
            { id: 'a1-o1', description: 'Investigate the abandoned temple', type: 'main', isCompleted: false, xpReward: 50 },
            { id: 'a1-o2', description: 'Defeat the shadow cultists', type: 'main', isCompleted: false, xpReward: 75 },
            { id: 'a1-o3', description: 'Find the ancient artifact', type: 'main', isCompleted: false, xpReward: 100 },
        ],
        rewards: { xp: 300, gold: 100, items: ['Shadow Amulet'], achievements: ['Shadow Hunter'] },
        prerequisites: ['prologue-2'],
        unlocksChapters: ['act1-2'],
    },
    {
        id: 'act1-2',
        act: 'act1',
        number: 2,
        title: 'Unlikely Allies',
        description: 'Not all companions are found in expected places.',
        estimatedMinutes: 12,
        status: 'locked',
        objectives: [
            { id: 'a12-o1', description: 'Reach the crossroads tavern', type: 'main', isCompleted: false, xpReward: 40 },
            { id: 'a12-o2', description: 'Recruit the mercenary', type: 'main', isCompleted: false, xpReward: 60 },
            { id: 'a12-o3', description: 'Uncover the spy in your midst', type: 'optional', isCompleted: false, xpReward: 80 },
        ],
        rewards: { xp: 250, gold: 75, items: [] },
        prerequisites: ['act1-1'],
        unlocksChapters: ['act1-3'],
    },
];

// Sample progress
export const SAMPLE_PROGRESS: IStoryProgress = {
    currentAct: 'prologue',
    currentChapterId: 'prologue-2',
    completedChapters: ['prologue-1'],
    totalPlayTime: 1800, // 30 minutes
    choicesMade: [
        {
            chapterId: 'prologue-1',
            choiceId: 'elder-response',
            option: 'accept_destiny',
            timestamp: new Date(),
            affectedNpcs: ['elder'],
            consequences: ['destiny_accepted'],
        },
    ],
    relationshipScores: {
        elder: 15,
        mentor: 10,
    },
    unlockedEndings: [],
};
