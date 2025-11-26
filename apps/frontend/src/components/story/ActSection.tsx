import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IActInfo, type IStoryChapter, getActColors } from '../../types/story';

interface ActSectionProps {
  act: IActInfo;
  chapters: IStoryChapter[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ActSection({ act, chapters, isExpanded, onToggle }: ActSectionProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  const actColors = getActColors(act.id);

  // Progress calculation
  const progress = useMemo(() => {
    const completed = chapters.filter((c) => c.status === 'completed').length;
    const total = chapters.length;
    return {
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [chapters]);

  // Check if act has available chapter
  const hasAvailableChapter = chapters.some(
    (c) => c.status === 'available' || c.status === 'in_progress'
  );

  // Pulse animation for available acts
  if (hasAvailableChapter) {
    pulse.value = withRepeat(withTiming(1.02, { duration: 1500 }), -1, true);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, animatedStyle]}>
      <Pressable onPress={onToggle} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <BlurView intensity={25} tint='dark' style={styles.blur}>
          <LinearGradient
            colors={actColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Act icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.actIcon}>{act.iconEmoji}</Text>
            </View>

            {/* Act info */}
            <View style={styles.infoContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.actName}>{t(`story.acts.${act.id}`)}</Text>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </View>

              <Text style={styles.actDescription}>{t(`story.actDescriptions.${act.id}`)}</Text>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#4CAF50', '#8BC34A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress.percent}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress.completed}/{progress.total}
                </Text>
              </View>

              {/* Meta info */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📖</Text>
                  <Text style={styles.metaText}>
                    {act.chapters} {t('story.chapters')}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱️</Text>
                  <Text style={styles.metaText}>~{act.estimatedMinutes}m</Text>
                </View>
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
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actIcon: {
    fontSize: 32,
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actName: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  expandIcon: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  actDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.85,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.text,
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
    opacity: 0.8,
  },
});
