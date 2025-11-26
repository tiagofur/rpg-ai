import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, SafeAreaView } from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
  SlideInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IInfiniteRun,
  type ILeaderboardEntry,
  getThemeGradient,
  SAMPLE_RUN,
  SAMPLE_LEADERBOARD,
} from '../../types/infinite';
import { DungeonMap } from './DungeonMap';
import { FloorProgress } from './FloorProgress';
import { LeaderboardPanel } from './LeaderboardPanel';

interface InfiniteScreenProps {
  userId?: string | undefined;
  onBack?: (() => void) | undefined;
}

export function InfiniteScreen({ userId, onBack }: InfiniteScreenProps) {
  const { t } = useTranslation();
  const [run, setRun] = useState<IInfiniteRun | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard] = useState<ILeaderboardEntry[]>(SAMPLE_LEADERBOARD);

  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleStartRun = useCallback(() => {
    // Start a new run (using sample data for now)
    setRun(SAMPLE_RUN);
  }, []);

  const handleRoomPress = useCallback((roomId: string) => {
    // Navigate to room - would update game state via backend
    // eslint-disable-next-line no-console
    console.log('Navigate to room:', roomId);
  }, []);

  const handleAbandonRun = useCallback(() => {
    setRun(null);
  }, []);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Main menu (no active run)
  if (!run) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.menuContainer}>
            {/* Title */}
            <Animated.View entering={SlideInUp.duration(400)} style={styles.titleSection}>
              <Text style={styles.modeIcon}>🏰</Text>
              <Text style={styles.title}>{t('infinite.title')}</Text>
              <Text style={styles.subtitle}>{t('infinite.subtitle')}</Text>
            </Animated.View>

            {/* Features */}
            <Animated.View
              entering={SlideInUp.delay(100).duration(400)}
              style={styles.featuresSection}
            >
              <BlurView intensity={20} tint='dark' style={styles.featuresBlur}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎲</Text>
                  <Text style={styles.featureText}>{t('infinite.feature1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>💀</Text>
                  <Text style={styles.featureText}>{t('infinite.feature2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={styles.featureText}>{t('infinite.feature3')}</Text>
                </View>
              </BlurView>
            </Animated.View>

            {/* Action buttons */}
            <Animated.View
              entering={SlideInUp.delay(200).duration(400)}
              style={styles.buttonsSection}
            >
              <Animated.View style={buttonStyle}>
                <Pressable
                  onPress={handleStartRun}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonIcon}>⚔️</Text>
                    <Text style={styles.primaryButtonText}>{t('infinite.startRun')}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Pressable onPress={() => setShowLeaderboard(true)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonIcon}>🏆</Text>
                <Text style={styles.secondaryButtonText}>{t('infinite.leaderboard')}</Text>
              </Pressable>

              {onBack && (
                <Pressable onPress={onBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← {t('common.back')}</Text>
                </Pressable>
              )}
            </Animated.View>
          </Animated.View>

          {/* Leaderboard modal */}
          <Modal
            visible={showLeaderboard}
            transparent
            animationType='fade'
            onRequestClose={() => setShowLeaderboard(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.leaderboardContainer}>
                <LeaderboardPanel
                  entries={leaderboard}
                  currentUserId={userId}
                  onClose={() => setShowLeaderboard(false)}
                />
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Active run view
  const currentFloor = run.floors[run.currentFloor];
  const themeColors: [string, string] = currentFloor
    ? getThemeGradient(currentFloor.theme)
    : ['#1a1a2e', '#16213e'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={themeColors} style={styles.container}>
        {/* Header with progress */}
        <Animated.View entering={SlideInDown.duration(300)} style={styles.runHeader}>
          <FloorProgress run={run} />
        </Animated.View>

        {/* Dungeon map */}
        {currentFloor && (
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.mapSection}>
            <DungeonMap
              floor={currentFloor}
              currentRoomId={currentFloor.currentRoomId}
              onRoomPress={handleRoomPress}
            />
          </Animated.View>
        )}

        {/* Bottom action bar */}
        <Animated.View entering={SlideInUp.delay(300).duration(300)} style={styles.actionBar}>
          <BlurView intensity={30} tint='dark' style={styles.actionBlur}>
            <Pressable onPress={() => setShowLeaderboard(true)} style={styles.actionButton}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionLabel}>{t('infinite.leaderboard')}</Text>
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable onPress={() => {}} style={styles.actionButton}>
              <Text style={styles.actionIcon}>🎒</Text>
              <Text style={styles.actionLabel}>{t('infinite.inventory')}</Text>
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable onPress={handleAbandonRun} style={styles.actionButton}>
              <Text style={styles.actionIcon}>🚪</Text>
              <Text style={[styles.actionLabel, styles.dangerText]}>{t('infinite.abandon')}</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        {/* Leaderboard modal */}
        <Modal
          visible={showLeaderboard}
          transparent
          animationType='fade'
          onRequestClose={() => setShowLeaderboard(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.modalOverlay}
          >
            <View style={styles.leaderboardContainer}>
              <LeaderboardPanel
                entries={leaderboard}
                currentUserId={userId}
                onClose={() => setShowLeaderboard(false)}
              />
            </View>
          </Animated.View>
        </Modal>
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
    padding: 16,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
  },
  modeIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 36,
    color: COLORS.text,
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textDim,
    textAlign: 'center',
    maxWidth: 280,
  },
  featuresSection: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuresBlur: {
    padding: 20,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryButtonIcon: {
    fontSize: 24,
  },
  primaryButtonText: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: `${COLORS.surface}80`,
    borderWidth: 1,
    borderColor: `${COLORS.textDim}30`,
  },
  secondaryButtonIcon: {
    fontSize: 20,
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textDim,
  },
  runHeader: {
    marginBottom: 16,
  },
  mapSection: {
    flex: 1,
  },
  actionBar: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text,
  },
  actionDivider: {
    width: 1,
    height: 32,
    backgroundColor: `${COLORS.textDim}30`,
  },
  dangerText: {
    color: '#FF5252',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  leaderboardContainer: {
    flex: 1,
    maxHeight: '80%',
  },
});
