/**
 * Quest System - Exports
 */

export {
    QuestManager,
    questManager,
    type IQuestInstance,
    type IQuestObjectiveProgress,
    type IQuestProgressEvent,
} from './QuestManager.js';

export {
    getQuestTemplate,
    getAllQuestTemplates,
    getQuestsForLevel,
    getQuestsByCategory,
    QUEST_TEMPLATES,
    type IQuestTemplate,
    type IQuestObjective,
    type IQuestReward,
    type QuestObjectiveType,
    type QuestStatus,
} from './QuestTemplates.js';
