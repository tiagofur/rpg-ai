import { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IChallenge,
  type IDailyState,
  SAMPLE_DAILIES,
  DAILY_BONUS_REWARD,
} from '../../types/dailies';
import { DailyList } from './DailyList';

interface DailiesScreenProps {
  dailyState?: IDailyState;
  onBack?: () => void;
  onChallengeComplete?: (challenge: IChallenge) => void;
}

// Create mock state for development
const createMockState = (): IDailyState => ({
  challenges: SAMPLE_DAILIES,
  allCompletedBonus: DAILY_BONUS_REWARD,
  bonusClaimed: false,
  streak: 3,
  lastClaimDate: new Date(),
  resetTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
});

export function DailiesScreen({ dailyState, onBack, onChallengeComplete }: DailiesScreenProps) {
  const { t } = useTranslation();

  // Use provided state or mock state for development
  const initialState = useMemo(() => dailyState ?? createMockState(), [dailyState]);

  const [challenges, setChallenges] = useState(initialState.challenges);
  const [bonusClaimed, setBonusClaimed] = useState(initialState.bonusClaimed);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState<IChallenge | null>(null);

  const handleChallengePress = useCallback((_challenge: IChallenge) => {
    // Navigate to relevant game section based on challenge type
    // This will be implemented when navigation is integrated
  }, []);

  const handleChallengeClaim = useCallback(
    (challenge: IChallenge) => {
      // Update local state
      setChallenges((prev) =>
        prev.map((c) => (c.id === challenge.id ? { ...c, claimed: true } : c))
      );

      // Show reward animation
      setClaimedReward(challenge);
      setShowRewardModal(true);

      // Hide after 2 seconds
      setTimeout(() => {
        setShowRewardModal(false);
        setClaimedReward(null);
      }, 2000);

      // Notify parent
      onChallengeComplete?.(challenge);
    },
    [onChallengeComplete]
  );

  const handleBonusClaim = useCallback(() => {
    setBonusClaimed(true);
    // Show bonus reward animation
    setShowRewardModal(true);
    setTimeout(() => {
      setShowRewardModal(false);
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(30,30,40,1)', 'rgba(20,20,30,1)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View entering={SlideInUp.springify()} style={styles.header}>
        {onBack !== undefined && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('dailies.screenTitle', '📅 Dailies')}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Daily List */}
      <DailyList
        challenges={challenges}
        streak={initialState.streak}
        resetTime={initialState.resetTime}
        bonusClaimed={bonusClaimed}
        onChallengePress={handleChallengePress}
        onChallengeClaim={handleChallengeClaim}
        onBonusClaim={handleBonusClaim}
      />

      {/* Reward Modal */}
      {showRewardModal && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.rewardOverlay}>
          <View style={styles.rewardModal}>
            <LinearGradient
              colors={['rgba(46,204,113,0.95)', 'rgba(39,174,96,0.98)']}
              style={styles.rewardGradient}
            >
              <Text style={styles.rewardEmoji}>🎉</Text>
              <Text style={styles.rewardTitle}>
                {t('dailies.rewardClaimed', 'Reward Claimed!')}
              </Text>
              {claimedReward !== null && (
                <View style={styles.rewardItems}>
                  {claimedReward.rewards.map((reward, index) => (
                    <Text key={index} style={styles.rewardItem}>
                      +{reward.amount} {reward.itemName ?? reward.type}
                    </Text>
                  ))}
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.text,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  // Reward Modal
  rewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardModal: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 40,
  },
  rewardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  rewardEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  rewardTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  rewardItems: {
    alignItems: 'center',
    gap: 8,
  },
  rewardItem: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.text,
  },
});
