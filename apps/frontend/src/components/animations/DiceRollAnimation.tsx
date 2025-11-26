import { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, theme } from '../../theme';

/**
 * Dice types supported by the animation
 */
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/**
 * Result of a dice roll
 */
export interface DiceResult {
  type: DiceType;
  value: number;
  modifier?: number;
  isCritical?: boolean;
  isCriticalFail?: boolean;
}

interface DiceRollAnimationProps {
  /** The dice result to display */
  result: DiceResult | null;
  /** Whether to show the animation */
  visible: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Duration of roll animation in ms */
  rollDuration?: number;
  /** Whether to play haptics */
  haptics?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

const DICE_MAX: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

const DICE_COLORS: Record<DiceType, [string, string]> = {
  d4: ['#ff6b6b', '#ee5a5a'],
  d6: ['#4ecdc4', '#3dbdb5'],
  d8: ['#45b7d1', '#35a7c1'],
  d10: ['#96ceb4', '#86bea4'],
  d12: ['#dda0dd', '#cd90cd'],
  d20: [theme.colors.gold, theme.colors.goldDark],
  d100: ['#9b59b6', '#8b49a6'],
};

/**
 * Animated dice roll component
 *
 * Features:
 * - 3D rotation effect during roll
 * - Random intermediate values shown
 * - Critical hit/fail special effects
 * - Haptic feedback on result
 * - Bounce animation on final value
 */
export function DiceRollAnimation({
  result,
  visible,
  onComplete,
  rollDuration = 1500,
  haptics = true,
  style,
}: DiceRollAnimationProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);

  // Animation values
  const scale = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const playHaptic = useCallback(() => {
    if (haptics) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [haptics]);

  const playSuccessHaptic = useCallback(() => {
    if (haptics) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [haptics]);

  const playErrorHaptic = useCallback(() => {
    if (haptics) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [haptics]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Simulate rolling with random values
  useEffect(() => {
    if (!visible || !result) return;

    setIsRolling(true);
    const maxValue = DICE_MAX[result.type];
    const intervals: ReturnType<typeof setInterval>[] = [];

    // Fast random values during roll
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * maxValue) + 1;
      setDisplayValue(randomValue);
    }, 50);
    intervals.push(rollInterval);

    // Show final value after roll duration
    const finalTimeout = setTimeout(() => {
      clearInterval(rollInterval);
      setDisplayValue(result.value);
      setIsRolling(false);

      // Haptic based on result
      if (result.isCritical) {
        playSuccessHaptic();
      } else if (result.isCriticalFail) {
        playErrorHaptic();
      } else {
        playHaptic();
      }
    }, rollDuration - 300);

    return () => {
      intervals.forEach(clearInterval);
      clearTimeout(finalTimeout);
    };
  }, [visible, result, rollDuration, playHaptic, playSuccessHaptic, playErrorHaptic]);

  // Main animation sequence
  useEffect(() => {
    if (!visible || !result) {
      // Hide animation
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      return;
    }

    // Reset values
    scale.value = 0;
    translateY.value = -100;
    opacity.value = 0;
    rotateX.value = 0;
    rotateY.value = 0;
    glowOpacity.value = 0;

    // Entry animation
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // Rolling rotation
    rotateX.value = withSequence(
      withTiming(360 * 3, { duration: rollDuration - 200, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 15 })
    );
    rotateY.value = withSequence(
      withTiming(360 * 2, { duration: rollDuration - 200, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 15 })
    );

    // Final bounce and glow
    const showResult = rollDuration;
    scale.value = withDelay(
      showResult - 300,
      withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    );

    // Critical glow effect
    if (result.isCritical || result.isCriticalFail) {
      glowOpacity.value = withDelay(
        showResult - 200,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.5, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.5, { duration: 300 })
        )
      );
    }

    // Complete callback
    const completeTimeout = setTimeout(() => {
      runOnJS(handleComplete)();
    }, rollDuration + 500);

    return () => {
      clearTimeout(completeTimeout);
    };
  }, [
    visible,
    result,
    rollDuration,
    scale,
    translateY,
    opacity,
    rotateX,
    rotateY,
    glowOpacity,
    handleComplete,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const glowScale = interpolate(glowOpacity.value, [0, 1], [1, 1.5], Extrapolation.CLAMP);
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale }],
    };
  });

  if (!result) return null;

  const diceColors = DICE_COLORS[result.type];
  const isCrit = result.isCritical || result.isCriticalFail;
  const critColor = result.isCritical ? theme.colors.success : theme.colors.danger;

  return (
    <View style={[styles.container, style]} pointerEvents='none'>
      <Animated.View style={[styles.diceWrapper, animatedStyle]}>
        {/* Glow effect for crits */}
        {isCrit && (
          <Animated.View style={[styles.glow, { backgroundColor: critColor }, glowStyle]} />
        )}

        {/* Dice body */}
        <LinearGradient
          colors={isCrit ? [critColor, critColor] : diceColors}
          style={styles.dice}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Dice type label */}
          <Text style={styles.diceType}>{result.type.toUpperCase()}</Text>

          {/* Value */}
          <Text style={[styles.diceValue, isRolling && styles.diceValueRolling]}>
            {displayValue}
          </Text>

          {/* Modifier */}
          {result.modifier !== undefined && result.modifier !== 0 && !isRolling && (
            <Text style={styles.modifier}>
              {result.modifier > 0 ? '+' : ''}
              {result.modifier}
            </Text>
          )}

          {/* Critical label */}
          {isCrit && !isRolling && (
            <Text style={styles.critLabel}>
              {result.isCritical ? '✨ CRITICAL!' : '💀 CRITICAL FAIL'}
            </Text>
          )}
        </LinearGradient>

        {/* Total with modifier */}
        {result.modifier !== undefined && result.modifier !== 0 && !isRolling && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{result.value + result.modifier}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  diceWrapper: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.5,
  },
  dice: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  diceType: {
    position: 'absolute',
    top: 8,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 1,
  },
  diceValue: {
    fontFamily: FONTS.title,
    fontSize: 48,
    color: COLORS.background,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  diceValueRolling: {
    opacity: 0.8,
  },
  modifier: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: 'rgba(0,0,0,0.6)',
  },
  critLabel: {
    position: 'absolute',
    bottom: -30,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  totalContainer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  totalLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  totalValue: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: theme.colors.gold,
  },
});

export default DiceRollAnimation;
