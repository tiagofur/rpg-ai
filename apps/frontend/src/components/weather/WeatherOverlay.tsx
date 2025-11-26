import { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../../theme';
import {
  type WeatherType,
  type WeatherIntensity,
  type TimeOfDay,
  getWeatherGradient,
} from '../../types/weather';

interface WeatherOverlayProps {
  weatherType: WeatherType;
  intensity: WeatherIntensity;
  timeOfDay: TimeOfDay;
  enabled?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Particle counts based on intensity
const PARTICLE_COUNTS: Record<WeatherIntensity, number> = {
  light: 15,
  moderate: 30,
  heavy: 50,
};

export function WeatherOverlay({
  weatherType,
  intensity,
  timeOfDay,
  enabled = true,
}: WeatherOverlayProps) {
  const gradientColors = useMemo(
    () => getWeatherGradient(weatherType, timeOfDay),
    [weatherType, timeOfDay]
  );

  const particleCount = PARTICLE_COUNTS[intensity];

  // Generate rain drops
  const rainDrops = useMemo(() => {
    if (weatherType !== 'rain' && weatherType !== 'storm') return [];
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 1000,
      duration: 800 + Math.random() * 400,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, [weatherType, particleCount]);

  // Generate snowflakes
  const snowflakes = useMemo(() => {
    if (weatherType !== 'snow' && weatherType !== 'blizzard') return [];
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 2000,
      duration: 3000 + Math.random() * 2000,
      size: 4 + Math.random() * 8,
      sway: 20 + Math.random() * 30,
    }));
  }, [weatherType, particleCount]);

  // Generate fog layers
  const fogLayers = useMemo(() => {
    if (weatherType !== 'fog') return [];
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      opacity: 0.15 + i * 0.1,
      speed: 20_000 + i * 10_000,
    }));
  }, [weatherType]);

  if (!enabled) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      exiting={FadeOut.duration(1000)}
      style={styles.container}
      pointerEvents='none'
    >
      {/* Background gradient overlay */}
      <LinearGradient
        colors={[`${gradientColors[0]}40`, `${gradientColors[1]}20`]}
        style={styles.gradientOverlay}
      />

      {/* Rain particles */}
      {rainDrops.map((drop) => (
        <RainDrop
          key={drop.id}
          left={drop.left}
          delay={drop.delay}
          duration={drop.duration}
          opacity={drop.opacity}
          isStorm={weatherType === 'storm'}
        />
      ))}

      {/* Snow particles */}
      {snowflakes.map((flake) => (
        <Snowflake
          key={flake.id}
          left={flake.left}
          delay={flake.delay}
          duration={flake.duration}
          size={flake.size}
          sway={flake.sway}
          isBlizzard={weatherType === 'blizzard'}
        />
      ))}

      {/* Fog layers */}
      {fogLayers.map((layer) => (
        <FogLayer key={layer.id} opacity={layer.opacity} speed={layer.speed} />
      ))}

      {/* Lightning flash for storms */}
      {weatherType === 'storm' && intensity === 'heavy' && <LightningFlash />}

      {/* Heat shimmer for heatwave */}
      {weatherType === 'heatwave' && <HeatShimmer />}

      {/* Wind lines for windy/sandstorm */}
      {(weatherType === 'windy' || weatherType === 'sandstorm') && (
        <WindLines count={particleCount} isSand={weatherType === 'sandstorm'} />
      )}
    </Animated.View>
  );
}

// Rain drop component
function RainDrop({
  left,
  delay,
  duration,
  opacity,
  isStorm,
}: {
  left: number;
  delay: number;
  duration: number;
  opacity: number;
  isStorm: boolean;
}) {
  const translateY = useSharedValue(-20);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 0 }),
        withTiming(SCREEN_HEIGHT + 20, {
          duration,
          easing: Easing.linear,
        })
      ),
      -1,
      false
    );
  }, [translateY, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: isStorm ? '15deg' : '5deg' }],
  }));

  return (
    <Animated.View
      style={[styles.rainDrop, { left, opacity, animationDelay: `${delay}ms` }, animatedStyle]}
    />
  );
}

// Snowflake component
function Snowflake({
  left,
  delay,
  duration,
  size,
  sway,
  isBlizzard,
}: {
  left: number;
  delay: number;
  duration: number;
  size: number;
  sway: number;
  isBlizzard: boolean;
}) {
  const translateY = useSharedValue(-size);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(SCREEN_HEIGHT + size, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(sway, { duration: duration / 4 }),
        withTiming(-sway, { duration: duration / 2 }),
        withTiming(0, { duration: duration / 4 })
      ),
      -1,
      false
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: duration * 2, easing: Easing.linear }),
      -1,
      false
    );
  }, [translateY, translateX, rotation, duration, size, sway]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: isBlizzard ? translateX.value * 2 : translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.snowflake,
        { left, width: size, height: size, borderRadius: size / 2, animationDelay: `${delay}ms` },
        animatedStyle,
      ]}
    />
  );
}

// Fog layer component
function FogLayer({ opacity, speed }: { opacity: number; speed: number }) {
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [translateX, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.fogLayer, { opacity }, animatedStyle]}>
      <LinearGradient
        colors={['transparent', 'rgba(200,200,200,0.5)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fogGradient}
      />
    </Animated.View>
  );
}

// Lightning flash component
function LightningFlash() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const flash = () => {
      opacity.value = withSequence(
        withTiming(0.8, { duration: 50 }),
        withTiming(0, { duration: 100 }),
        withTiming(0.6, { duration: 50 }),
        withTiming(0, { duration: 150 })
      );
    };

    // Random lightning intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        flash();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.lightning, animatedStyle]} />;
}

// Heat shimmer effect
function HeatShimmer() {
  const distortion = useSharedValue(0);

  useEffect(() => {
    distortion.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [distortion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + distortion.value * 0.15,
  }));

  return (
    <Animated.View style={[styles.heatShimmer, animatedStyle]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,107,53,0.3)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// Wind lines component
function WindLines({ count, isSand }: { count: number; isSand: boolean }) {
  const lines = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * SCREEN_HEIGHT,
        width: 30 + Math.random() * 50,
        delay: Math.random() * 1000,
      })),
    [count]
  );

  return (
    <>
      {lines.map((line) => (
        <WindLine
          key={line.id}
          top={line.top}
          width={line.width}
          delay={line.delay}
          color={isSand ? '#C2B280' : 'rgba(255,255,255,0.3)'}
        />
      ))}
    </>
  );
}

function WindLine({
  top,
  width,
  delay,
  color,
}: {
  top: number;
  width: number;
  delay: number;
  color: string;
}) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-width, { duration: 0 }),
        withTiming(SCREEN_WIDTH + width, {
          duration: 1000 + Math.random() * 500,
          easing: Easing.linear,
        })
      ),
      -1,
      false
    );
  }, [translateX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.windLine,
        { top, width, backgroundColor: color, animationDelay: `${delay}ms` },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(174,194,224,0.5)',
    borderRadius: 1,
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  fogLayer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT,
    top: 0,
  },
  fogGradient: {
    flex: 1,
  },
  lightning: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.text,
  },
  heatShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  windLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
});
