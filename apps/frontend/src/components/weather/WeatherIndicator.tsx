import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IWeather,
  getWeatherIcon,
  getTimeIcon,
  getWeatherColor,
  getWeatherGradient,
  WEATHER_EFFECTS,
} from '../../types/weather';

interface WeatherIndicatorProps {
  weather: IWeather;
  compact?: boolean;
  showEffects?: boolean;
}

export function WeatherIndicator({
  weather,
  compact = false,
  showEffects = true,
}: WeatherIndicatorProps) {
  const { t } = useTranslation();

  const weatherIcon = getWeatherIcon(weather.type);
  const timeIcon = getTimeIcon(weather.timeOfDay);
  const weatherColor = getWeatherColor(weather.type);
  const gradientColors = getWeatherGradient(weather.type, weather.timeOfDay);
  const effects = WEATHER_EFFECTS[weather.type];

  const activeEffects = useMemo(
    () =>
      effects.map((effect) => ({
        key: effect.stat,
        value: effect.modifier,
        isPositive: effect.modifier > 0,
        description: effect.description,
      })),
    [effects]
  );

  if (compact) {
    return (
      <CompactIndicator weatherIcon={weatherIcon} timeIcon={timeIcon} weatherColor={weatherColor} />
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <BlurView intensity={30} tint='dark' style={styles.blurContainer}>
        <LinearGradient
          colors={[`${gradientColors[0]}40`, `${gradientColors[1]}20`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Weather Header */}
          <View style={styles.header}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherIcon}>{weatherIcon}</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherType}>{t(`weather.types.${weather.type}`)}</Text>
                <View style={styles.weatherMeta}>
                  <Text style={styles.timeIcon}>{timeIcon}</Text>
                  <View style={[styles.intensityBadge, { backgroundColor: `${weatherColor}40` }]}>
                    <Text style={[styles.intensityText, { color: weatherColor }]}>
                      {t(`weather.intensity.${weather.intensity}`)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Weather Effects */}
          {showEffects && activeEffects.length > 0 && (
            <View style={styles.effectsContainer}>
              <Text style={styles.effectsTitle}>{t('weather.effects')}</Text>
              <View style={styles.effectsGrid}>
                {activeEffects.map((effect) => (
                  <EffectBadge
                    key={effect.key}
                    effectKey={effect.key}
                    value={effect.value}
                    isPositive={effect.isPositive}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{t(`weather.descriptions.${weather.type}`)}</Text>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

function CompactIndicator({
  weatherIcon,
  timeIcon,
  weatherColor,
}: {
  weatherIcon: string;
  timeIcon: string;
  weatherColor: string;
}) {
  const pulseValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Gentle pulse animation
  pulseValue.value = withRepeat(
    withSequence(withTiming(1.05, { duration: 2000 }), withTiming(1, { duration: 2000 })),
    -1,
    false
  );

  return (
    <Animated.View style={[styles.compactContainer, animatedStyle]}>
      <BlurView intensity={20} tint='dark' style={styles.compactBlur}>
        <View style={[styles.compactContent, { borderColor: `${weatherColor}40` }]}>
          <Text style={styles.compactWeatherIcon}>{weatherIcon}</Text>
          <Text style={styles.compactTimeIcon}>{timeIcon}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function EffectBadge({
  effectKey,
  value,
  isPositive,
}: {
  effectKey: string;
  value: number;
  isPositive: boolean;
}) {
  const { t } = useTranslation();

  const effectIcons: Record<string, string> = {
    accuracy: '🎯',
    damage: '⚔️',
    speed: '💨',
    visibility: '👁️',
    magicPower: '✨',
    fireDamage: '🔥',
    iceDamage: '❄️',
    lightningDamage: '⚡',
    rangedAccuracy: '🏹',
    stealth: '🥷',
    movementSpeed: '🏃',
    healthRegen: '💚',
  };

  return (
    <View
      style={[
        styles.effectBadge,
        { backgroundColor: isPositive ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)' },
      ]}
    >
      <Text style={styles.effectIcon}>{effectIcons[effectKey] ?? '📊'}</Text>
      <Text style={styles.effectName}>{t(`weather.effectNames.${effectKey}`)}</Text>
      <Text style={[styles.effectValue, { color: isPositive ? COLORS.success : COLORS.error }]}>
        {isPositive ? '+' : ''}
        {value}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  gradient: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherType: {
    fontSize: 20,
    fontFamily: FONTS.title,
    color: COLORS.text,
    marginBottom: 4,
  },
  weatherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIcon: {
    fontSize: 16,
  },
  temperature: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  effectsContainer: {
    marginBottom: 12,
  },
  effectsTitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  effectIcon: {
    fontSize: 14,
  },
  effectName: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  effectValue: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  compactContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  compactWeatherIcon: {
    fontSize: 20,
  },
  compactTimeIcon: {
    fontSize: 14,
  },
  compactTemp: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
});
