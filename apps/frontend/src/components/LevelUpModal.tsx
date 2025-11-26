/**
 * LevelUpModal - Modal shown when player levels up
 * Shows bonuses, new abilities, and attribute point distribution
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

interface LevelUpRewards {
  newLevel: number;
  hpBonus: number;
  manaBonus: number;
  staminaBonus: number;
  attributePoints: number;
  newAbility?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  title?: string;
}

interface AttributeValues {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface LevelUpModalProps {
  visible: boolean;
  rewards: LevelUpRewards | null;
  currentAttributes: AttributeValues;
  onConfirm: (attributeDistribution: Partial<AttributeValues>) => void;
  onClose: () => void;
}

const ATTRIBUTE_CONFIG = [
  { key: 'strength', label: 'FUE', icon: '💪', color: '#ef4444' },
  { key: 'dexterity', label: 'AGI', icon: '🏃', color: '#22c55e' },
  { key: 'constitution', label: 'CON', icon: '❤️', color: '#f59e0b' },
  { key: 'intelligence', label: 'INT', icon: '🧠', color: '#3b82f6' },
  { key: 'wisdom', label: 'SAB', icon: '👁️', color: '#a855f7' },
  { key: 'charisma', label: 'CAR', icon: '✨', color: '#ec4899' },
] as const;

type AttributeKey = (typeof ATTRIBUTE_CONFIG)[number]['key'];

export function LevelUpModal({
  visible,
  rewards,
  currentAttributes,
  onConfirm,
  onClose,
}: LevelUpModalProps) {
  const { t } = useTranslation();
  const [attributeAllocation, setAttributeAllocation] = useState<Record<AttributeKey, number>>({
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  });

  if (!rewards) return null;

  const { newLevel, hpBonus, manaBonus, staminaBonus, attributePoints, newAbility, title } =
    rewards;

  const totalAllocated = Object.values(attributeAllocation).reduce((sum, val) => sum + val, 0);
  const pointsRemaining = attributePoints - totalAllocated;

  const handleIncrement = (attr: AttributeKey) => {
    if (pointsRemaining > 0) {
      setAttributeAllocation((prev) => ({
        ...prev,
        [attr]: prev[attr] + 1,
      }));
    }
  };

  const handleDecrement = (attr: AttributeKey) => {
    if (attributeAllocation[attr] > 0) {
      setAttributeAllocation((prev) => ({
        ...prev,
        [attr]: prev[attr] - 1,
      }));
    }
  };

  const handleConfirm = () => {
    // Filter out zero allocations
    const distribution: Partial<AttributeValues> = {};
    for (const [key, value] of Object.entries(attributeAllocation)) {
      if (value > 0) {
        distribution[key as AttributeKey] = value;
      }
    }
    onConfirm(distribution);
    // Reset allocation for next use
    setAttributeAllocation({
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    });
  };

  const handleClose = () => {
    // Reset and close
    setAttributeAllocation({
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>
          <LinearGradient colors={['#1a1a2e', '#0a0a1a']} style={styles.gradient}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header with level */}
              <Animated.View entering={BounceIn.delay(200)} style={styles.header}>
                <Text style={styles.levelUpText}>⭐ ¡SUBISTE DE NIVEL! ⭐</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelNumber}>{newLevel}</Text>
                </View>
                {title && <Text style={styles.titleText}>Nuevo Título: {title}</Text>}
              </Animated.View>

              {/* Stat bonuses */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.bonusSection}>
                <Text style={styles.sectionTitle}>{t('levelup.bonuses', 'Bonificaciones')}</Text>
                <View style={styles.bonusGrid}>
                  <View style={styles.bonusItem}>
                    <Text style={styles.bonusIcon}>❤️</Text>
                    <Text style={styles.bonusValue}>+{hpBonus} HP</Text>
                  </View>
                  <View style={styles.bonusItem}>
                    <Text style={styles.bonusIcon}>💧</Text>
                    <Text style={styles.bonusValue}>+{manaBonus} MP</Text>
                  </View>
                  <View style={styles.bonusItem}>
                    <Text style={styles.bonusIcon}>⚡</Text>
                    <Text style={styles.bonusValue}>+{staminaBonus} ST</Text>
                  </View>
                </View>
              </Animated.View>

              {/* New Ability */}
              {newAbility && (
                <Animated.View entering={FadeInDown.delay(600)} style={styles.abilitySection}>
                  <Text style={styles.sectionTitle}>
                    🆕 {t('levelup.newAbility', 'Nueva Habilidad')}
                  </Text>
                  <View style={styles.abilityCard}>
                    <Text style={styles.abilityIcon}>{newAbility.icon}</Text>
                    <View style={styles.abilityInfo}>
                      <Text style={styles.abilityName}>{newAbility.name}</Text>
                      <Text style={styles.abilityDesc}>{newAbility.description}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Attribute Distribution */}
              {attributePoints > 0 && (
                <Animated.View entering={FadeInDown.delay(800)} style={styles.attributeSection}>
                  <Text style={styles.sectionTitle}>
                    {t('levelup.attributePoints', 'Puntos de Atributo')}: {pointsRemaining}
                  </Text>
                  <View style={styles.attributeGrid}>
                    {ATTRIBUTE_CONFIG.map((attr, index) => {
                      const currentValue = currentAttributes[attr.key];
                      const allocated = attributeAllocation[attr.key];
                      const newValue = currentValue + allocated;

                      return (
                        <Animated.View
                          key={attr.key}
                          entering={FadeIn.delay(900 + index * 50)}
                          style={styles.attributeRow}
                        >
                          <View style={styles.attrLabelSection}>
                            <Text style={styles.attrIcon}>{attr.icon}</Text>
                            <Text style={styles.attrLabel}>{attr.label}</Text>
                          </View>
                          <View style={styles.attrValueSection}>
                            <Text style={styles.attrValue}>
                              [{currentValue}
                              {allocated > 0 && (
                                <Text style={{ color: theme.colors.success }}>+{allocated}</Text>
                              )}
                              ]
                            </Text>
                            <Text style={[styles.attrNewValue, { color: attr.color }]}>
                              {newValue}
                            </Text>
                          </View>
                          <View style={styles.attrButtons}>
                            <TouchableOpacity
                              style={[
                                styles.attrButton,
                                allocated === 0 && styles.attrButtonDisabled,
                              ]}
                              onPress={() => handleDecrement(attr.key)}
                              disabled={allocated === 0}
                            >
                              <Text style={styles.attrButtonText}>−</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.attrButton,
                                styles.attrButtonPlus,
                                pointsRemaining === 0 && styles.attrButtonDisabled,
                              ]}
                              onPress={() => handleIncrement(attr.key)}
                              disabled={pointsRemaining === 0}
                            >
                              <Text style={styles.attrButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* Confirm Button */}
              <Animated.View entering={FadeInDown.delay(1000)} style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={attributePoints > 0 && pointsRemaining > 0}
                >
                  <LinearGradient
                    colors={
                      pointsRemaining === 0 || attributePoints === 0
                        ? ['#f7cf46', '#b8982f']
                        : ['#6b7280', '#4b5563']
                    }
                    style={styles.confirmButton}
                  >
                    <Text style={styles.confirmText}>
                      {pointsRemaining > 0
                        ? t('levelup.distributePoints', `Distribuir ${pointsRemaining} puntos`)
                        : t('common.confirm', 'Confirmar')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Skip button if has points remaining */}
                {attributePoints > 0 && pointsRemaining > 0 && (
                  <TouchableOpacity onPress={handleClose} style={styles.skipButton}>
                    <Text style={styles.skipText}>
                      {t('levelup.decideLater', 'Decidir después')}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
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
    marginBottom: 20,
  },
  levelUpText: {
    fontFamily: theme.fonts.title,
    fontSize: 24,
    color: theme.colors.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(247, 207, 70, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 16,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(247, 207, 70, 0.2)',
    borderWidth: 3,
    borderColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontFamily: theme.fonts.title,
    fontSize: 36,
    color: theme.colors.gold,
  },
  titleText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.xp,
    marginTop: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontFamily: theme.fonts.title,
    fontSize: 14,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  bonusSection: {
    marginBottom: 20,
  },
  bonusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bonusItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
  },
  bonusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bonusValue: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.success,
  },
  abilitySection: {
    marginBottom: 20,
  },
  abilityCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    gap: 12,
  },
  abilityIcon: {
    fontSize: 32,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.xp,
    marginBottom: 4,
  },
  abilityDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  attributeSection: {
    marginBottom: 20,
  },
  attributeGrid: {
    gap: 8,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  attrLabelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    gap: 6,
  },
  attrIcon: {
    fontSize: 14,
  },
  attrLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.text,
  },
  attrValueSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attrValue: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  attrNewValue: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  attrButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  attrButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attrButtonPlus: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: theme.colors.success,
  },
  attrButtonDisabled: {
    opacity: 0.3,
  },
  attrButtonText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: theme.fonts.title,
    fontSize: 16,
    color: '#1a1a2e',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
