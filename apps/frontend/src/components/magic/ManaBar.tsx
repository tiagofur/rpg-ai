import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../theme';

interface ManaBarProps {
  current: number;
  max: number;
  showText?: boolean | undefined;
  height?: number | undefined;
  animated?: boolean | undefined;
}

export function ManaBar({
  current,
  max,
  showText = true,
  height = 20,
  animated = true,
}: ManaBarProps) {
  const progress = useSharedValue(current / max);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      progress.value = withSpring(current / max, {
        damping: 15,
        stiffness: 100,
      });

      // Pulse when low mana
      if (percentage < 25) {
        pulseScale.value = withTiming(1.02, { duration: 500 }, () => {
          pulseScale.value = withTiming(1, { duration: 500 });
        });
        glowOpacity.value = withTiming(0.6, { duration: 500 }, () => {
          glowOpacity.value = withTiming(0.3, { duration: 500 });
        });
      }
    } else {
      progress.value = current / max;
    }
  }, [current, max, animated, progress, percentage, pulseScale, glowOpacity]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
    transform: [{ scaleY: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.25, 0.5, 1],
      ['#E74C3C', '#F39C12', '#3498DB', '#3498DB']
    );
    return {
      opacity: glowOpacity.value,
      shadowColor: color,
    };
  });

  const getBarColors = (): readonly [string, string] => {
    if (percentage <= 25) {
      return ['#C0392B', '#E74C3C'] as const;
    }
    if (percentage <= 50) {
      return ['#D35400', '#F39C12'] as const;
    }
    return ['#2980B9', '#3498DB'] as const;
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Background */}
      <View style={[styles.background, { borderRadius: height / 2 }]}>
        {/* Glow effect for low mana */}
        <Animated.View style={[styles.glow, animatedGlowStyle, { borderRadius: height / 2 }]} />

        {/* Progress bar */}
        <Animated.View style={[styles.barWrapper, animatedBarStyle]}>
          <LinearGradient
            colors={getBarColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bar, { borderRadius: height / 2 }]}
          >
            {/* Shine effect */}
            <View style={[styles.shine, { borderRadius: height / 2 }]} />
          </LinearGradient>
        </Animated.View>

        {/* Segmentation lines */}
        <View style={styles.segments}>
          {[25, 50, 75].map((pos) => (
            <View key={pos} style={[styles.segment, { left: `${pos}%` }]} />
          ))}
        </View>
      </View>

      {/* Text overlay */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.manaIcon}>💧</Text>
          <Text style={styles.text}>
            {current}/{max}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  background: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  barWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bar: {
    flex: 1,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  segments: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  manaIcon: {
    fontSize: 12,
  },
  text: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ManaBar;
