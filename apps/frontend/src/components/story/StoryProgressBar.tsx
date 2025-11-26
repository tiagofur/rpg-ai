import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IStoryProgress,
  type ICampaignSummary,
  STORY_ACTS,
  getActInfo,
  formatStoryTime,
} from '../../types/story';

interface StoryProgressBarProps {
  progress: IStoryProgress;
  totalChapters: number;
}

export function StoryProgressBar({ progress, totalChapters }: StoryProgressBarProps) {
  const { t } = useTranslation();
  const glowAnim = useSharedValue(0.5);

  // Animate glow effect
  glowAnim.value = withRepeat(
    withSequence(withTiming(1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
    -1,
    true
  );

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const currentActInfo = getActInfo(progress.currentAct);

  // Calculate summary
  const summary: ICampaignSummary = useMemo(() => {
    const completedCount = progress.completedChapters.length;
    const percentComplete = Math.round((completedCount / totalChapters) * 100);

    // Estimate remaining time based on average chapter length
    const avgChapterTime = 10; // minutes
    const remaining = (totalChapters - completedCount) * avgChapterTime;

    return {
      totalChapters,
      completedChapters: completedCount,
      currentAct: progress.currentAct,
      estimatedTimeRemaining: remaining,
      percentComplete,
    };
  }, [progress, totalChapters]);

  // Calculate act progress for the timeline
  const actProgress = useMemo(() => {
    const acts = STORY_ACTS.map((act) => {
      const currentActIndex = STORY_ACTS.findIndex((a) => a.id === progress.currentAct);
      const actIndex = STORY_ACTS.findIndex((a) => a.id === act.id);

      let status: 'completed' | 'current' | 'locked' = 'locked';
      if (actIndex < currentActIndex) {
        status = 'completed';
      } else if (actIndex === currentActIndex) {
        status = 'current';
      }

      return { ...act, status };
    });
    return acts;
  }, [progress.currentAct]);

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <BlurView intensity={30} tint='dark' style={styles.blur}>
        <LinearGradient
          colors={[`${COLORS.surface}90`, `${COLORS.background}95`]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.currentActEmoji}>{currentActInfo.iconEmoji}</Text>
              <View>
                <Text style={styles.currentActLabel}>{t('story.currentlyPlaying')}</Text>
                <Text style={styles.currentActName}>{t(`story.acts.${progress.currentAct}`)}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.percentText}>{summary.percentComplete}%</Text>
              <Text style={styles.completeLabel}>{t('story.complete')}</Text>
            </View>
          </View>

          {/* Main progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${summary.percentComplete}%` }]}
              />
              {/* Glow effect at the end */}
              <Animated.View
                style={[styles.progressGlow, { left: `${summary.percentComplete}%` }, glowStyle]}
              />
            </View>
          </View>

          {/* Act timeline */}
          <View style={styles.timeline}>
            {actProgress.map((act, index) => (
              <View key={act.id} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    act.status === 'completed' && styles.timelineDotCompleted,
                    act.status === 'current' && styles.timelineDotCurrent,
                  ]}
                >
                  {act.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
                  {act.status === 'current' && <Text style={styles.currentDot}>●</Text>}
                </View>
                {index < actProgress.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      act.status === 'completed' && styles.timelineLineCompleted,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.timelineLabel,
                    act.status === 'locked' && styles.timelineLabelLocked,
                  ]}
                  numberOfLines={1}
                >
                  {act.iconEmoji}
                </Text>
              </View>
            ))}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📖</Text>
              <Text style={styles.statValue}>
                {summary.completedChapters}/{summary.totalChapters}
              </Text>
              <Text style={styles.statLabel}>{t('story.chapters')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{formatStoryTime(progress.totalPlayTime)}</Text>
              <Text style={styles.statLabel}>{t('story.playTime')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🎭</Text>
              <Text style={styles.statValue}>{progress.choicesMade.length}</Text>
              <Text style={styles.statLabel}>{t('story.choices')}</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentActEmoji: {
    fontSize: 32,
  },
  currentActLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  currentActName: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.text,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.primary,
  },
  completeLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 12,
    backgroundColor: `${COLORS.textDim}30`,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressGlow: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timelineItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.textDim}40`,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineDotCurrent: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentDot: {
    color: COLORS.text,
    fontSize: 10,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: `${COLORS.textDim}30`,
    marginHorizontal: -2,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineLabel: {
    position: 'absolute',
    top: 28,
    fontSize: 14,
    textAlign: 'center',
  },
  timelineLabelLocked: {
    opacity: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textDim}20`,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: `${COLORS.textDim}30`,
  },
});
