import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../theme';

interface AIThinkingIndicatorProps {
  visible: boolean;
  variant?: 'full' | 'inline' | 'minimal';
}

export function AIThinkingIndicator({ visible, variant = 'inline' }: AIThinkingIndicatorProps) {
  const { t } = useTranslation();

  // Animation values for the dots
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      // Dots animation - cascading bounce
      dot1.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      dot2.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
          ),
          -1,
          false
        )
      );

      dot3.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
          ),
          -1,
          false
        )
      );

      // Pulse animation for the crystal
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible, dot1, dot2, dot3, pulseScale, glowOpacity]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  // Minimal variant - just dots
  if (variant === 'minimal') {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.minimalContainer}
      >
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </Animated.View>
    );
  }

  // Inline variant - compact with text
  if (variant === 'inline') {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.inlineContainer}
      >
        <LinearGradient
          colors={['rgba(138, 43, 226, 0.1)', 'rgba(75, 0, 130, 0.1)']}
          style={styles.inlineGradient}
        >
          <Animated.View style={pulseStyle}>
            <Text style={styles.crystalEmoji}>🔮</Text>
          </Animated.View>
          <Text style={styles.inlineText}>{t('game.aiThinking', 'AI is thinking')}</Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dotSmall, dot1Style]} />
            <Animated.View style={[styles.dotSmall, dot2Style]} />
            <Animated.View style={[styles.dotSmall, dot3Style]} />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Full variant - big centered display
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.fullContainer}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(20,0,40,0.95)']}
        style={styles.fullGradient}
      >
        {/* Glow effect */}
        <Animated.View style={[styles.glowCircle, glowStyle]} />

        {/* Crystal */}
        <Animated.View style={pulseStyle}>
          <Text style={styles.crystalBig}>🔮</Text>
        </Animated.View>

        {/* Text */}
        <Text style={styles.fullText}>
          {t('game.aiCrafting', 'The Dungeon Master is crafting your fate')}
        </Text>

        {/* Dots */}
        <View style={styles.dotsRowLarge}>
          <Animated.View style={[styles.dotLarge, dot1Style]} />
          <Animated.View style={[styles.dotLarge, dot2Style]} />
          <Animated.View style={[styles.dotLarge, dot3Style]} />
        </View>

        {/* Sub text */}
        <Text style={styles.subText}>{t('game.aiPleaseWait', 'Please wait...')}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Minimal variant
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },

  // Inline variant
  inlineContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inlineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  inlineText: {
    color: COLORS.primary,
    fontFamily: FONTS.body,
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  crystalEmoji: {
    fontSize: 20,
  },

  // Full variant
  fullContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
  },
  crystalBig: {
    fontSize: 80,
    marginBottom: 24,
  },
  fullText: {
    color: COLORS.text,
    fontFamily: FONTS.title,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  subText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 16,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotsRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  dotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
});
