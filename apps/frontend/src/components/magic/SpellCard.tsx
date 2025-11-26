import { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../theme';
import {
  ISpell,
  ISpellState,
  getSchoolColor,
  getSchoolIcon,
  canCastSpell,
  formatCooldown,
} from '../../types/magic';

interface SpellCardProps {
  spell: ISpell;
  state: ISpellState;
  onCast: (spell: ISpell) => void;
  compact?: boolean | undefined;
  disabled?: boolean | undefined;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function SpellCard({
  spell,
  state,
  onCast,
  compact = false,
  disabled = false,
}: SpellCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const { canCast, reason } = canCastSpell(spell, state);
  const isDisabled = disabled || !canCast;
  const cooldownRemaining = state.cooldowns[spell.id] || 0;
  const schoolColor = getSchoolColor(spell.school);
  const schoolIcon = getSchoolIcon(spell.school);

  const handlePress = useCallback(() => {
    if (isDisabled) return;

    // Press animation
    scale.value = withSequence(withSpring(0.95, { damping: 10 }), withSpring(1, { damping: 8 }));

    // Glow effect
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );

    onCast(spell);
  }, [isDisabled, scale, glowOpacity, onCast, spell]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Damage/healing text
  const getDamageText = () => {
    if (spell.baseDamage) {
      return `${spell.baseDamage.min}-${spell.baseDamage.max}`;
    }
    if (spell.baseHealing) {
      return `+${spell.baseHealing.min}-${spell.baseHealing.max}`;
    }
    return null;
  };

  if (compact) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        disabled={isDisabled}
        style={[styles.compactContainer, animatedStyle, isDisabled && styles.disabled]}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[`${schoolColor}30`, `${schoolColor}10`]}
          style={styles.compactGradient}
        >
          <Text style={styles.compactIcon}>{spell.icon}</Text>
          {cooldownRemaining > 0 && (
            <View style={styles.cooldownBadge}>
              <Text style={styles.cooldownBadgeText}>{cooldownRemaining}</Text>
            </View>
          )}
          <Text style={styles.compactMana}>{spell.manaCost}</Text>
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={isDisabled}
      style={[styles.container, animatedStyle, isDisabled && styles.disabled]}
      activeOpacity={0.8}
    >
      {/* Glow effect on cast */}
      <Animated.View
        style={[styles.glow, glowStyle, { backgroundColor: schoolColor, shadowColor: schoolColor }]}
      />

      <LinearGradient
        colors={['rgba(30,30,40,0.95)', 'rgba(20,20,30,0.98)']}
        style={styles.gradient}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{spell.icon}</Text>
            <View style={[styles.schoolBadge, { backgroundColor: `${schoolColor}40` }]}>
              <Text style={styles.schoolIcon}>{schoolIcon}</Text>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{spell.name}</Text>
            <Text style={styles.school}>
              {spell.school.charAt(0).toUpperCase() + spell.school.slice(1)}
            </Text>
          </View>
          <View style={styles.costContainer}>
            <Text
              style={[
                styles.manaCost,
                !canCast && state.currentMana < spell.manaCost && styles.insufficientMana,
              ]}
            >
              {spell.manaCost} MP
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {spell.description}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {getDamageText() && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{spell.baseDamage ? 'DMG' : 'HEAL'}</Text>
              <Text style={[styles.statValue, { color: spell.baseDamage ? '#FF6B6B' : '#4ECDC4' }]}>
                {getDamageText()}
              </Text>
            </View>
          )}

          <View style={styles.stat}>
            <Text style={styles.statLabel}>RANGE</Text>
            <Text style={styles.statValue}>{spell.range}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>CD</Text>
            <Text style={[styles.statValue, cooldownRemaining > 0 && styles.onCooldown]}>
              {cooldownRemaining > 0 ? `${cooldownRemaining}` : formatCooldown(spell.cooldown)}
            </Text>
          </View>
        </View>

        {/* Effects preview */}
        {spell.effects && spell.effects.length > 0 && (
          <View style={styles.effectsRow}>
            {spell.effects.slice(0, 2).map((effect, idx) => (
              <View key={idx} style={styles.effectBadge}>
                <Text style={styles.effectText}>
                  {effect.type === 'debuff' && '↓'}
                  {effect.type === 'buff' && '↑'}
                  {effect.type === 'dot' && '🩸'}
                  {effect.type === 'shield' && '🛡️'} {effect.duration}t
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Disabled reason */}
        {isDisabled && reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradient: {
    padding: 12,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  schoolBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolIcon: {
    fontSize: 10,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  school: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    textTransform: 'capitalize',
  },
  costContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  manaCost: {
    color: '#3498DB',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  insufficientMana: {
    color: '#E74C3C',
  },
  description: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    marginBottom: 10,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: FONTS.body,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    textTransform: 'capitalize',
  },
  onCooldown: {
    color: '#E74C3C',
  },
  effectsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  effectBadge: {
    backgroundColor: 'rgba(155,89,182,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  effectText: {
    color: '#9B59B6',
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  reasonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  reasonText: {
    color: '#E74C3C',
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  // Compact styles
  compactContainer: {
    width: 60,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compactGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  compactIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  compactMana: {
    color: '#3498DB',
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
  },
  cooldownBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(231,76,60,0.9)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownBadgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
});

export default SpellCard;
