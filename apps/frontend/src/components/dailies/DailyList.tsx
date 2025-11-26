import { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IChallenge,
  type IChallengeReward,
  formatTimeRemaining,
  getRewardIcon,
  DAILY_BONUS_REWARD,
} from '../../types/dailies';
import { ChallengeCard } from './ChallengeCard';

interface DailyListProps {
  challenges: IChallenge[];
  streak: number;
  resetTime: Date;
  bonusClaimed: boolean;
  onChallengePress: (challenge: IChallenge) => void;
  onChallengeClaim: (challenge: IChallenge) => void;
  onBonusClaim: () => void;
}

export function DailyList({
  challenges,
  streak,
  resetTime,
  bonusClaimed,
  onChallengePress,
  onChallengeClaim,
  onBonusClaim,
}: DailyListProps) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(resetTime));

  // Update timer every minute
  useEffect(() => {
    const ONE_MINUTE = 60 * 1000;
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(resetTime));
    }, ONE_MINUTE);
    return () => clearInterval(interval);
  }, [resetTime]);

  const stats = useMemo(() => {
    const completed = challenges.filter((c) => c.completed).length;
    const claimed = challenges.filter((c) => c.claimed).length;
    const total = challenges.length;
    const allCompleted = completed === total;
    const canClaimBonus = allCompleted && !bonusClaimed;
    return { completed, claimed, total, allCompleted, canClaimBonus };
  }, [challenges, bonusClaimed]);

  const renderStreak = useCallback(() => {
    const streakDays = Array.from({ length: 7 }, (_, i) => i + 1);
    return (
      <View style={styles.streakContainer}>
        <Text style={styles.streakTitle}>{t('dailies.streak', 'Daily Streak')} 🔥</Text>
        <View style={styles.streakDays}>
          {streakDays.map((day) => {
            const isActive = day <= streak;
            const isCurrent = day === streak;
            return (
              <View
                key={day}
                style={[
                  styles.streakDay,
                  isActive && styles.streakDayActive,
                  isCurrent && styles.streakDayCurrent,
                ]}
              >
                <Text style={[styles.streakDayText, isActive && styles.streakDayTextActive]}>
                  {day}
                </Text>
                {isActive && <Text style={styles.streakCheck}>✓</Text>}
              </View>
            );
          })}
        </View>
        <Text style={styles.streakInfo}>
          {streak >= 7
            ? t('dailies.streakMax', '🎉 Max streak! +50% bonus rewards')
            : t('dailies.streakProgress', '{{days}} days until bonus reward', {
                days: 7 - streak,
              })}
        </Text>
      </View>
    );
  }, [streak, t]);

  const renderBonusReward = useCallback(
    (reward: IChallengeReward) => (
      <Animated.View
        entering={SlideInRight.delay(300)}
        style={[styles.bonusContainer, stats.canClaimBonus && styles.bonusContainerActive]}
      >
        <LinearGradient
          colors={
            stats.canClaimBonus
              ? ['rgba(46,204,113,0.3)', 'rgba(39,174,96,0.2)']
              : ['rgba(40,40,50,0.95)', 'rgba(30,30,40,0.98)']
          }
          style={styles.bonusGradient}
        >
          <View style={styles.bonusHeader}>
            <Text style={styles.bonusTitle}>{t('dailies.bonusReward', 'All Dailies Bonus')}</Text>
            <Text style={styles.bonusProgress}>
              {stats.completed}/{stats.total}
            </Text>
          </View>

          <View style={styles.bonusContent}>
            <View style={styles.bonusReward}>
              <Text style={styles.bonusRewardIcon}>{getRewardIcon(reward.type)}</Text>
              <Text style={styles.bonusRewardName}>{reward.itemName}</Text>
            </View>

            {stats.canClaimBonus ? (
              <Animated.View entering={FadeIn}>
                <LinearGradient
                  colors={[COLORS.success, '#27AE60']}
                  style={styles.bonusClaimButton}
                >
                  <Text style={styles.bonusClaimText} onPress={onBonusClaim}>
                    {t('dailies.claim', 'CLAIM')}
                  </Text>
                </LinearGradient>
              </Animated.View>
            ) : bonusClaimed ? (
              <View style={styles.bonusClaimedBadge}>
                <Text style={styles.bonusClaimedText}>✓ {t('dailies.claimed', 'CLAIMED')}</Text>
              </View>
            ) : (
              <View style={styles.bonusProgressBar}>
                <View
                  style={[
                    styles.bonusProgressFill,
                    { width: `${(stats.completed / stats.total) * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    ),
    [stats, bonusClaimed, onBonusClaim, t]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with timer */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('dailies.title', 'Daily Challenges')}</Text>
          <Text style={styles.headerSubtitle}>
            {stats.completed}/{stats.total} {t('dailies.completed', 'completed')}
          </Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerIcon}>⏱️</Text>
          <View>
            <Text style={styles.timerLabel}>{t('dailies.resetIn', 'Resets in')}</Text>
            <Text style={styles.timerValue}>{timeRemaining}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Streak */}
      <Animated.View entering={FadeInDown.delay(100)}>{renderStreak()}</Animated.View>

      {/* Bonus Reward */}
      {renderBonusReward(DAILY_BONUS_REWARD)}

      {/* Challenges List */}
      <View style={styles.challengesSection}>
        <Text style={styles.sectionTitle}>
          {t('dailies.todaysChallenges', "Today's Challenges")}
        </Text>
        {challenges.map((challenge, index) => (
          <Animated.View key={challenge.id} entering={FadeInDown.delay(200 + index * 100)}>
            <ChallengeCard
              challenge={challenge}
              onPress={onChallengePress}
              onClaim={onChallengeClaim}
            />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerIcon: {
    fontSize: 20,
  },
  timerLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  timerValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  // Streak
  streakContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streakTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  streakDayActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  streakDayCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  streakDayText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.textDim,
  },
  streakDayTextActive: {
    color: COLORS.text,
  },
  streakCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 10,
    color: COLORS.text,
    backgroundColor: COLORS.success,
    borderRadius: 6,
    width: 12,
    height: 12,
    textAlign: 'center',
    lineHeight: 12,
    overflow: 'hidden',
  },
  streakInfo: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'center',
  },
  // Bonus
  bonusContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bonusContainerActive: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  bonusGradient: {
    padding: 16,
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  bonusProgress: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  bonusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bonusReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusRewardIcon: {
    fontSize: 24,
  },
  bonusRewardName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
  },
  bonusClaimButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bonusClaimText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.text,
    letterSpacing: 1,
  },
  bonusClaimedBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bonusClaimedText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.success,
  },
  bonusProgressBar: {
    width: 80,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bonusProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  // Challenges Section
  challengesSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
