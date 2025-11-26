import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { retentionApi } from '../api/retention';
import { COLORS, FONTS } from '../theme';
import { useGameEffects } from '../hooks/useGameEffects';

interface DailyRewardModalProps {
  token: string;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ token }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rewardData, setRewardData] = useState<{
    streak: number;
    reward: { type: string; amount: number };
    nextRewardAt: string;
  } | null>(null);

  const { playHaptic } = useGameEffects();

  useEffect(() => {
    void checkReward();
  }, [token]);

  const checkReward = async () => {
    try {
      const { data } = await retentionApi.checkDailyReward(token);
      if (data.canClaim) {
        setVisible(true);
        playHaptic('success');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to check daily reward', error);
    }
  };

  const handleClaim = async () => {
    playHaptic('medium');
    setLoading(true);
    try {
      const { data } = await retentionApi.claimDailyReward(token);
      setRewardData(data);
      playHaptic('success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to claim reward', error);
      playHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    playHaptic('light');
    setVisible(false);
    setRewardData(null);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType='fade' visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />

        <Animated.View entering={ZoomIn.springify()} style={styles.containerWrapper}>
          <LinearGradient colors={[COLORS.secondary, '#1a1a2e']} style={styles.container}>
            <View style={styles.headerDecoration} />

            <Text style={styles.title}>DAILY REWARD</Text>

            {rewardData ? (
              <Animated.View entering={FadeIn} style={styles.content}>
                <Text style={styles.message}>Reward Claimed!</Text>

                <View style={styles.rewardBox}>
                  <LinearGradient
                    colors={['rgba(247, 207, 70, 0.2)', 'rgba(247, 207, 70, 0.05)']}
                    style={styles.rewardGradient}
                  >
                    <Text style={styles.rewardIcon}>🎁</Text>
                    <Text style={styles.rewardAmount}>+{rewardData.reward.amount}</Text>
                    <Text style={styles.rewardType}>{rewardData.reward.type.toUpperCase()}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.streakContainer}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={styles.streakText}>Streak: {rewardData.streak} days</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleClose}>
                  <LinearGradient
                    colors={[COLORS.primary, '#b8962e']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>AWESOME</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.content}>
                <Text style={styles.message}>Your daily login reward is ready!</Text>

                <View style={styles.chestContainer}>
                  <Text style={styles.chestIcon}>👑</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleClaim} disabled={loading}>
                  <LinearGradient
                    colors={[COLORS.primary, '#b8962e']}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color='#050510' />
                    ) : (
                      <Text style={styles.buttonText}>CLAIM REWARD</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerWrapper: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    marginBottom: 8,
    fontFamily: FONTS.title,
    textShadowColor: 'rgba(247, 207, 70, 0.5)',
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  message: {
    color: COLORS.textDim,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
  rewardBox: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(247, 207, 70, 0.3)',
  },
  rewardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  rewardAmount: {
    color: COLORS.text,
    fontSize: 36,
    fontFamily: FONTS.title,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  rewardType: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  streakText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  chestContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chestIcon: {
    fontSize: 64,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#050510',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 1,
  },
});
