import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../theme';
import {
  type IChallenge,
  getChallengeTypeIcon,
  getDifficultyColor,
  getRewardIcon,
  getProgressPercentage,
  formatTimeRemaining,
} from '../../types/dailies';

interface ChallengeCardProps {
  challenge: IChallenge;
  onPress: (challenge: IChallenge) => void;
  onClaim: (challenge: IChallenge) => void;
  compact?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ChallengeCard({
  challenge,
  onPress,
  onClaim,
  compact = false,
}: ChallengeCardProps) {
  const scale = useSharedValue(1);
  const progress = getProgressPercentage(challenge);
  const difficultyColor = getDifficultyColor(challenge.difficulty);
  const typeIcon = getChallengeTypeIcon(challenge.type);
  const isCompleted = challenge.completed;
  const canClaim = isCompleted && !challenge.claimed;

  const handlePress = useCallback(() => {
    scale.value = withSequence(withSpring(0.97, { damping: 10 }), withSpring(1, { damping: 8 }));
    if (canClaim) {
      onClaim(challenge);
    } else {
      onPress(challenge);
    }
  }, [scale, onPress, onClaim, challenge, canClaim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const timeRemaining = useMemo(
    () => formatTimeRemaining(challenge.expiresAt),
    [challenge.expiresAt]
  );

  const rewardsPreview = useMemo(
    () =>
      challenge.rewards.slice(0, 3).map((reward, index) => (
        <View key={index} style={styles.rewardBadge}>
          <Text style={styles.rewardIcon}>{getRewardIcon(reward.type)}</Text>
          <Text style={styles.rewardAmount}>{reward.amount}</Text>
        </View>
      )),
    [challenge.rewards]
  );

  if (compact) {
    return (
      <AnimatedTouchable
        style={[styles.compactContainer, animatedStyle]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>{challenge.icon}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {challenge.title}
            </Text>
            <View style={styles.compactProgressContainer}>
              <View style={styles.compactProgressBg}>
                <View
                  style={[
                    styles.compactProgressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? COLORS.success : difficultyColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.compactProgressText}>
                {challenge.objective.current}/{challenge.objective.target}
              </Text>
            </View>
          </View>
          {canClaim ? (
            <View style={styles.claimBadge}>
              <Text style={styles.claimBadgeText}>!</Text>
            </View>
          ) : (
            <Text style={styles.compactTime}>⏱️ {timeRemaining}</Text>
          )}
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          challenge.claimed
            ? ['rgba(40,40,50,0.6)', 'rgba(30,30,40,0.6)']
            : isCompleted
              ? ['rgba(46,204,113,0.2)', 'rgba(39,174,96,0.1)']
              : ['rgba(40,40,50,0.95)', 'rgba(30,30,40,0.98)']
        }
        style={styles.gradient}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{challenge.icon}</Text>
            <View style={[styles.typeBadge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.typeIcon}>{typeIcon}</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, challenge.claimed && styles.claimedText]} numberOfLines={1}>
              {challenge.title}
            </Text>
            <Text style={styles.difficulty}>
              {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
            </Text>
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>
        </View>

        {/* Description */}
        <Text
          style={[styles.description, challenge.claimed && styles.claimedText]}
          numberOfLines={2}
        >
          {challenge.description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <Animated.View
              entering={FadeIn}
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? COLORS.success : difficultyColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {challenge.objective.current} / {challenge.objective.target} {challenge.objective.unit}
          </Text>
        </View>

        {/* Rewards Row */}
        <View style={styles.rewardsRow}>
          <View style={styles.rewards}>{rewardsPreview}</View>

          {canClaim && (
            <Animated.View entering={FadeIn} style={styles.claimButton}>
              <LinearGradient colors={[COLORS.success, '#27AE60']} style={styles.claimGradient}>
                <Text style={styles.claimText}>CLAIM</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {challenge.claimed && (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedBadgeText}>✓ CLAIMED</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  typeIcon: {
    fontSize: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  difficulty: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 12,
    lineHeight: 20,
  },
  claimedText: {
    opacity: 0.5,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewards: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardAmount: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.text,
  },
  claimButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  claimGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  claimText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.text,
    letterSpacing: 1,
  },
  claimedBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimedBadgeText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.success,
  },
  // Compact styles
  compactContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  compactProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactProgressText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    minWidth: 40,
    textAlign: 'right',
  },
  compactTime: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    marginLeft: 8,
  },
  claimBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  claimBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
});
