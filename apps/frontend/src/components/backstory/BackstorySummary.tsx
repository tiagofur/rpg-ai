import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IBackstory,
  calculateBackstoryStats,
  getStartingItems,
  getSpecialEvents,
  getRecurringNPCs,
  BACKSTORY_QUESTIONS,
  getOptionById,
} from '../../types/backstory';

interface BackstorySummaryProps {
  backstory: IBackstory;
  characterName?: string;
}

export function BackstorySummary({ backstory, characterName = 'Hero' }: BackstorySummaryProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => calculateBackstoryStats(backstory.answers), [backstory.answers]);

  const startingItems = useMemo(() => getStartingItems(backstory.answers), [backstory.answers]);

  const specialEvents = useMemo(() => getSpecialEvents(backstory.answers), [backstory.answers]);

  const recurringNPCs = useMemo(() => getRecurringNPCs(backstory.answers), [backstory.answers]);

  // Get selected answers for display
  const selectedAnswers = useMemo(() => {
    const result: Array<{ question: string; answer: string; icon: string }> = [];
    for (const question of BACKSTORY_QUESTIONS) {
      const optionId = backstory.answers[question.id];
      if (optionId) {
        const option = getOptionById(question.id, optionId);
        if (option) {
          result.push({
            question: t(question.question),
            answer: t(option.text),
            icon: option.icon,
          });
        }
      }
    }
    return result;
  }, [backstory.answers, t]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <BlurView intensity={30} tint='dark' style={styles.headerBlur}>
          <LinearGradient
            colors={[`${COLORS.primary}40`, `${COLORS.primary}20`]}
            style={styles.headerGradient}
          >
            <Text style={styles.title}>{t('backstory.summaryTitle', { name: characterName })}</Text>
            <Text style={styles.subtitle}>{t('backstory.yourJourneyBegins')}</Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Generated Summary */}
      {backstory.generatedSummary && (
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.yourStory')}</Text>
          <BlurView intensity={20} tint='dark' style={styles.storyBlur}>
            <View style={styles.storyContainer}>
              <Text style={styles.storyIcon}>📜</Text>
              <Text style={styles.storyText}>{backstory.generatedSummary}</Text>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Choices Made */}
      <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
        <Text style={styles.sectionTitle}>{t('backstory.choicesMade')}</Text>
        {selectedAnswers.map((item, index) => (
          <Animated.View key={index} entering={SlideInDown.delay(250 + index * 50).duration(300)}>
            <BlurView intensity={15} tint='dark' style={styles.choiceBlur}>
              <View style={styles.choiceContainer}>
                <Text style={styles.choiceIcon}>{item.icon}</Text>
                <View style={styles.choiceContent}>
                  <Text style={styles.choiceQuestion}>{item.question}</Text>
                  <Text style={styles.choiceAnswer}>{item.answer}</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Stat Modifiers */}
      {Object.keys(stats).length > 0 && (
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.statBonuses')}</Text>
          <BlurView intensity={20} tint='dark' style={styles.statsBlur}>
            <View style={styles.statsGrid}>
              {Object.entries(stats).map(([stat, value]) => (
                <View key={stat} style={styles.statItem}>
                  <Text style={styles.statName}>{t(`backstory.stats.${stat}`)}</Text>
                  <Text
                    style={[styles.statValue, { color: value > 0 ? COLORS.success : COLORS.error }]}
                  >
                    {value > 0 ? '+' : ''}
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Starting Items */}
      {startingItems.length > 0 && (
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.startingItems')}</Text>
          <BlurView intensity={20} tint='dark' style={styles.itemsBlur}>
            <View style={styles.itemsContainer}>
              {startingItems.map((item, index) => (
                <View key={index} style={styles.itemBadge}>
                  <Text style={styles.itemIcon}>🎁</Text>
                  <Text style={styles.itemName}>{t(`backstory.items.${item}`)}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Special Events */}
      {specialEvents.length > 0 && (
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.futureEvents')}</Text>
          <BlurView intensity={20} tint='dark' style={styles.eventsBlur}>
            <View style={styles.eventsContainer}>
              {specialEvents.map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Text style={styles.eventIcon}>⭐</Text>
                  <Text style={styles.eventName}>{t(`backstory.events.${event}`)}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Recurring NPCs */}
      {recurringNPCs.length > 0 && (
        <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.keyCharacters')}</Text>
          <BlurView intensity={20} tint='dark' style={styles.npcsBlur}>
            <View style={styles.npcsContainer}>
              {recurringNPCs.map((npc, index) => (
                <View key={index} style={styles.npcItem}>
                  <Text style={styles.npcIcon}>👤</Text>
                  <Text style={styles.npcName}>{t(`backstory.npcs.${npc}`)}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Narrative Tags (for developer info) */}
      {backstory.narrativeTags.length > 0 && (
        <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backstory.narrativeTags')}</Text>
          <View style={styles.tagsContainer}>
            {backstory.narrativeTags.map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerBlur: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.title,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.textDim,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  storyBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  storyContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  storyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  storyText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  choiceBlur: {
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 8,
  },
  choiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  choiceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  choiceContent: {
    flex: 1,
  },
  choiceQuestion: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginBottom: 2,
  },
  choiceAnswer: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  statsBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statName: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  statValue: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  itemsBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  itemIcon: {
    fontSize: 16,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  eventsBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  eventsContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventIcon: {
    fontSize: 18,
  },
  eventName: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  npcsBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  npcsContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 8,
  },
  npcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  npcIcon: {
    fontSize: 18,
  },
  npcName: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(138,43,226,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
});
