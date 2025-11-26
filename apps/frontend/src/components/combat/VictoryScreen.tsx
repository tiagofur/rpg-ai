/**
 * VictoryScreen - Post-combat victory modal showing rewards
 */

import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import type { ICombatResult } from '../../types/combat';

const getRarityColor = (rarity?: string): string => {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return '#ff8000';
    case 'epic':
      return '#a855f7';
    case 'rare':
      return '#3b82f6';
    case 'uncommon':
      return '#22c55e';
    default:
      return theme.colors.text;
  }
};

interface VictoryScreenProps {
  visible: boolean;
  result: ICombatResult | null;
  onContinue: () => void;
  currentXp?: number;
  xpToNextLevel?: number;
  currentLevel?: number;
}

export function VictoryScreen({
  visible,
  result,
  onContinue,
  currentXp = 0,
  xpToNextLevel = 1000,
  currentLevel = 1,
}: VictoryScreenProps) {
  const { t } = useTranslation();

  if (!result) return null;

  const { outcome, experienceGained, goldGained, itemsLooted, enemiesDefeated, rounds } = result;

  const isVictory = outcome === 'victory';
  const isFled = outcome === 'fled';

  const xpPercent = Math.min(((currentXp + experienceGained) / xpToNextLevel) * 100, 100);
  const wouldLevelUp = currentXp + experienceGained >= xpToNextLevel;

  const getTitle = () => {
    if (isVictory) return '⚔️ ¡VICTORIA! ⚔️';
    if (isFled) return '🏃 ¡Escapaste!';
    return '💀 DERROTA';
  };

  const getSubtitle = () => {
    if (isVictory && enemiesDefeated.length > 0) {
      const names = enemiesDefeated.map((e) => e.name).join(', ');
      return `Has derrotado a: ${names}`;
    }
    if (isFled) return 'Has huido del combate';
    return 'Tu aventura ha terminado... por ahora.';
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>
          <LinearGradient
            colors={isVictory ? ['#1a1a2e', '#0a0a1a'] : ['#2e1a1a', '#1a0a0a']}
            style={styles.gradient}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <Text style={[styles.title, !isVictory && styles.defeatTitle]}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
              <Text style={styles.roundsText}>
                {t('combat.rounds', { count: rounds, defaultValue: `${rounds} rondas` })}
              </Text>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Rewards Section */}
            {isVictory && (
              <Animated.View entering={FadeInDown.delay(400)} style={styles.rewardsSection}>
                <Text style={styles.sectionTitle}>{t('combat.rewards', 'Recompensas')}</Text>

                {/* XP Reward */}
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardText}>+{experienceGained} XP</Text>
                </View>

                {/* Gold Reward */}
                {goldGained > 0 && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardIcon}>🪙</Text>
                    <Text style={styles.rewardText}>+{goldGained} Oro</Text>
                  </View>
                )}

                {/* Items Looted */}
                {itemsLooted.length > 0 && (
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsTitle}>
                      {t('combat.itemsObtained', 'Items obtenidos:')}
                    </Text>
                    {itemsLooted.map((item, index) => (
                      <Animated.View
                        key={`${item.itemId}-${index}`}
                        entering={SlideInRight.delay(600 + index * 100)}
                        style={styles.itemRow}
                      >
                        <Text style={styles.itemBullet}>├─</Text>
                        <Text style={[styles.itemName, { color: getRarityColor(item.rarity) }]}>
                          {item.itemName} {item.quantity > 1 ? `×${item.quantity}` : ''}
                        </Text>
                        {item.rarity && (
                          <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                            ({item.rarity})
                          </Text>
                        )}
                      </Animated.View>
                    ))}
                  </View>
                )}

                {/* XP Progress Bar */}
                <View style={styles.xpSection}>
                  <View style={styles.xpBarContainer}>
                    <LinearGradient
                      colors={['#b366ff', '#7e22ce']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.xpBarFill, { width: `${xpPercent}%` }]}
                    />
                  </View>
                  <Text style={styles.xpProgressText}>
                    {wouldLevelUp ? (
                      <Text style={styles.levelUpText}>
                        🎉 ¡Nivel {currentLevel} → {currentLevel + 1}!
                      </Text>
                    ) : (
                      `${currentXp + experienceGained}/${xpToNextLevel} XP`
                    )}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Defeat message */}
            {!isVictory && !isFled && (
              <Animated.View entering={FadeIn.delay(400)} style={styles.defeatSection}>
                <Text style={styles.defeatText}>Perdiste algo de XP y oro al caer en batalla.</Text>
              </Animated.View>
            )}

            {/* Continue Button */}
            <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
              <TouchableOpacity onPress={onContinue} activeOpacity={0.8}>
                <LinearGradient
                  colors={isVictory ? ['#f7cf46', '#b8982f'] : ['#6b7280', '#4b5563']}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueText}>{t('common.continue', 'Continuar')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  gradient: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.title,
    fontSize: 28,
    color: theme.colors.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(247, 207, 70, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  defeatTitle: {
    color: theme.colors.danger,
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  roundsText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  rewardsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.title,
    fontSize: 14,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rewardIcon: {
    fontSize: 18,
  },
  rewardText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  itemsSection: {
    marginTop: 12,
  },
  itemsTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  itemBullet: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  itemName: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  itemRarity: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
  },
  xpSection: {
    marginTop: 16,
  },
  xpBarContainer: {
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  xpProgressText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  levelUpText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.bodyBold,
  },
  defeatSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  defeatText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: theme.fonts.title,
    fontSize: 16,
    color: '#1a1a2e',
  },
});
