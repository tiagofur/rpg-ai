import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IInfiniteRun, getThemeGradient, getFloorMultiplier } from '../../types/infinite';

interface FloorProgressProps {
  run: IInfiniteRun;
}

export function FloorProgress({ run }: FloorProgressProps) {
  const { t } = useTranslation();
  const pulseAnim = useSharedValue(1);

  // Pulse animation for difficulty indicator
  pulseAnim.value = withRepeat(withTiming(1.15, { duration: 800 }), -1, true);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const currentFloor = run.floors[run.currentFloor];
  const difficulty = getFloorMultiplier(run.currentFloor + 1);
  const themeColors = currentFloor ? getThemeGradient(currentFloor.theme) : ['#424242', '#212121'];

  // Progress through current floor
  const floorProgress = useMemo(() => {
    if (!currentFloor) return 0;
    const cleared = currentFloor.rooms.filter((r) => r.isCleared).length;
    return cleared / currentFloor.rooms.length;
  }, [currentFloor]);

  // Milestone markers
  const milestones = useMemo(() => {
    const floorNum = run.currentFloor + 1;
    return {
      isShopFloor: floorNum % 5 === 0 && floorNum % 10 !== 0,
      isMinibossFloor: floorNum % 5 === 0,
      isBossFloor: floorNum % 10 === 0,
    };
  }, [run.currentFloor]);

  const getDifficultyColor = (): [string, string] => {
    if (difficulty >= 3) return ['#FF1744', '#D50000'];
    if (difficulty >= 2) return ['#FF9100', '#FF6D00'];
    if (difficulty >= 1.5) return ['#FFEA00', '#FFD600'];
    return ['#00E676', '#00C853'];
  };

  const getDifficultyLabel = () => {
    if (difficulty >= 3) return t('infinite.difficulty.nightmare');
    if (difficulty >= 2) return t('infinite.difficulty.hard');
    if (difficulty >= 1.5) return t('infinite.difficulty.medium');
    return t('infinite.difficulty.easy');
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <BlurView intensity={30} tint='dark' style={styles.blur}>
        <LinearGradient
          colors={[`${themeColors[0]}40`, `${themeColors[1]}40`]}
          style={styles.gradient}
        >
          {/* Floor counter */}
          <View style={styles.floorCounter}>
            <Text style={styles.floorLabel}>{t('infinite.floor')}</Text>
            <Animated.Text style={[styles.floorNumber, pulseStyle]}>
              {run.currentFloor + 1}
            </Animated.Text>
          </View>

          {/* Difficulty indicator */}
          <View style={styles.difficultySection}>
            <LinearGradient colors={getDifficultyColor()} style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{getDifficultyLabel()}</Text>
            </LinearGradient>
            <Text style={styles.multiplierText}>×{difficulty.toFixed(1)}</Text>
          </View>

          {/* Floor progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${floorProgress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(floorProgress * 100)}%</Text>
          </View>

          {/* Milestone indicators */}
          {(milestones.isShopFloor || milestones.isMinibossFloor || milestones.isBossFloor) && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.milestoneSection}>
              {milestones.isBossFloor && (
                <View style={[styles.milestoneBadge, styles.bossBadge]}>
                  <Text style={styles.milestoneIcon}>🐉</Text>
                  <Text style={styles.milestoneText}>{t('infinite.bossFloor')}</Text>
                </View>
              )}
              {milestones.isMinibossFloor && !milestones.isBossFloor && (
                <View style={[styles.milestoneBadge, styles.minibossBadge]}>
                  <Text style={styles.milestoneIcon}>👹</Text>
                  <Text style={styles.milestoneText}>{t('infinite.minibossFloor')}</Text>
                </View>
              )}
              {milestones.isShopFloor && (
                <View style={[styles.milestoneBadge, styles.shopBadge]}>
                  <Text style={styles.milestoneIcon}>🛒</Text>
                  <Text style={styles.milestoneText}>{t('infinite.shopFloor')}</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Run stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🏔️</Text>
              <Text style={styles.statValue}>{run.highestFloor}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💀</Text>
              <Text style={styles.statValue}>{run.totalKills}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{run.totalGold}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✨</Text>
              <Text style={styles.statValue}>{run.totalXp}</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    gap: 12,
  },
  floorCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  floorLabel: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.textDim,
  },
  floorNumber: {
    fontFamily: FONTS.title,
    fontSize: 48,
    color: COLORS.text,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  difficultySection: {
    alignItems: 'center',
    gap: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.background,
    textTransform: 'uppercase',
  },
  multiplierText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: `${COLORS.textDim}30`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    width: 45,
    textAlign: 'right',
  },
  milestoneSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bossBadge: {
    backgroundColor: 'rgba(183,28,28,0.8)',
  },
  minibossBadge: {
    backgroundColor: 'rgba(230,81,0,0.8)',
  },
  shopBadge: {
    backgroundColor: 'rgba(0,105,92,0.8)',
  },
  milestoneIcon: {
    fontSize: 16,
  },
  milestoneText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textDim}20`,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
  },
});
