import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IStoryChapter,
  type ChapterStatus,
  getActColors,
  getStatusColor,
} from '../../types/story';

interface ChapterCardProps {
  chapter: IStoryChapter;
  onPress: (chapterId: string) => void;
}

function getStatusIcon(status: ChapterStatus): string {
  const icons: Record<ChapterStatus, string> = {
    locked: '🔒',
    available: '▶️',
    in_progress: '⏳',
    completed: '✅',
  };
  return icons[status];
}

export function ChapterCard({ chapter, onPress }: ChapterCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const actColors = getActColors(chapter.act);
  const statusColor = getStatusColor(chapter.status);

  const isPlayable = chapter.status === 'available' || chapter.status === 'in_progress';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isPlayable) {
      scale.value = withSpring(0.97);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Calculate objectives progress
  const objectivesProgress = useMemo(() => {
    const completed = chapter.objectives.filter((o) => o.isCompleted).length;
    const total = chapter.objectives.length;
    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  }, [chapter.objectives]);

  return (
    <Animated.View
      entering={SlideInRight.delay(chapter.number * 80).duration(300)}
      style={[styles.container, animatedStyle]}
    >
      <Pressable
        onPress={() => isPlayable && onPress(chapter.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isPlayable}
      >
        <BlurView intensity={20} tint='dark' style={styles.blur}>
          <LinearGradient
            colors={chapter.status === 'locked' ? ['#3a3a3a', '#2a2a2a'] : actColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, chapter.status === 'locked' && styles.lockedGradient]}
          >
            {/* Chapter number badge */}
            <View style={[styles.chapterBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.chapterNumber}>{chapter.number}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, chapter.status === 'locked' && styles.lockedText]}
                  numberOfLines={1}
                >
                  {chapter.title}
                </Text>
                <Text style={styles.statusIcon}>{getStatusIcon(chapter.status)}</Text>
              </View>

              {/* Description */}
              <Text
                style={[styles.description, chapter.status === 'locked' && styles.lockedText]}
                numberOfLines={2}
              >
                {chapter.status === 'locked'
                  ? t('story.completePrerequisites')
                  : chapter.description}
              </Text>

              {/* Progress bar (for in_progress or completed) */}
              {(chapter.status === 'in_progress' || chapter.status === 'completed') && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${objectivesProgress.percent}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {objectivesProgress.completed}/{objectivesProgress.total}
                  </Text>
                </View>
              )}

              {/* Meta info */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱️</Text>
                  <Text style={styles.metaText}>~{chapter.estimatedMinutes}m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⭐</Text>
                  <Text style={styles.metaText}>{chapter.rewards.xp} XP</Text>
                </View>
                {chapter.rewards.items.length > 0 && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🎁</Text>
                    <Text style={styles.metaText}>{chapter.rewards.items.length}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  blur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    minHeight: 120,
  },
  lockedGradient: {
    opacity: 0.7,
  },
  chapterBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chapterNumber: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.text,
    flex: 1,
  },
  statusIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.85,
    lineHeight: 18,
  },
  lockedText: {
    opacity: 0.5,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7,
  },
});
