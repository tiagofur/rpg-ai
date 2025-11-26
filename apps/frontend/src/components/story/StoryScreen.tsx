import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInUp, LayoutAnimationConfig } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IStoryProgress,
  type IStoryChapter,
  type StoryAct,
  STORY_ACTS,
  SAMPLE_CHAPTERS,
  SAMPLE_PROGRESS,
} from '../../types/story';
import { ActSection } from './ActSection';
import { ChapterCard } from './ChapterCard';
import { StoryProgressBar } from './StoryProgressBar';

interface StoryScreenProps {
  onBack?: (() => void) | undefined;
  onPlayChapter?: ((chapterId: string) => void) | undefined;
}

export function StoryScreen({ onBack, onPlayChapter }: StoryScreenProps) {
  const { t } = useTranslation();
  const [progress] = useState<IStoryProgress>(SAMPLE_PROGRESS);
  const [chapters] = useState<IStoryChapter[]>(SAMPLE_CHAPTERS);
  const [expandedAct, setExpandedAct] = useState<StoryAct | null>(progress.currentAct);

  // Group chapters by act
  const chaptersByAct = useMemo(() => {
    const grouped: Record<StoryAct, IStoryChapter[]> = {
      prologue: [],
      act1: [],
      act2: [],
      act3: [],
      epilogue: [],
    };

    for (const chapter of chapters) {
      grouped[chapter.act].push(chapter);
    }

    return grouped;
  }, [chapters]);

  // Total chapters count
  const totalChapters = useMemo(() => STORY_ACTS.reduce((sum, act) => sum + act.chapters, 0), []);

  const handleToggleAct = useCallback((act: StoryAct) => {
    setExpandedAct((current) => (current === act ? null : act));
  }, []);

  const handleChapterPress = useCallback(
    (chapterId: string) => {
      if (onPlayChapter) {
        onPlayChapter(chapterId);
      }
    },
    [onPlayChapter]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        {/* Header */}
        <Animated.View entering={SlideInUp.duration(300)} style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('story.title')}</Text>
            <Text style={styles.subtitle}>{t('story.subtitle')}</Text>
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress overview */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <StoryProgressBar progress={progress} totalChapters={totalChapters} />
          </Animated.View>

          {/* Acts list */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.actsContainer}>
            <Text style={styles.sectionTitle}>{t('story.yourJourney')}</Text>

            <LayoutAnimationConfig skipEntering>
              {STORY_ACTS.map((act) => (
                <View key={act.id}>
                  <ActSection
                    act={act}
                    chapters={chaptersByAct[act.id]}
                    isExpanded={expandedAct === act.id}
                    onToggle={() => handleToggleAct(act.id)}
                  />

                  {/* Expanded chapters */}
                  {expandedAct === act.id && chaptersByAct[act.id].length > 0 && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.chaptersContainer}>
                      {chaptersByAct[act.id].map((chapter) => (
                        <ChapterCard
                          key={chapter.id}
                          chapter={chapter}
                          onPress={handleChapterPress}
                        />
                      ))}
                    </Animated.View>
                  )}

                  {/* No chapters placeholder */}
                  {expandedAct === act.id && chaptersByAct[act.id].length === 0 && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.emptyChapters}>
                      <Text style={styles.emptyText}>🔒</Text>
                      <Text style={styles.emptyLabel}>{t('story.chaptersComingSoon')}</Text>
                    </Animated.View>
                  )}
                </View>
              ))}
            </LayoutAnimationConfig>
          </Animated.View>

          {/* Story tips */}
          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.tipsSection}>
            <LinearGradient
              colors={['rgba(138,43,226,0.2)', 'rgba(138,43,226,0.05)']}
              style={styles.tipCard}
            >
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{t('story.tip')}</Text>
                <Text style={styles.tipText}>{t('story.tipText')}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.surface}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  actsContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 12,
  },
  chaptersContainer: {
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: `${COLORS.primary}40`,
  },
  emptyChapters: {
    alignItems: 'center',
    paddingVertical: 24,
    marginLeft: 20,
    marginBottom: 8,
    backgroundColor: `${COLORS.surface}40`,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  tipsSection: {
    marginTop: 24,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 18,
  },
});
