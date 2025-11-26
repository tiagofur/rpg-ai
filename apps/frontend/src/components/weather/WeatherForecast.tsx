import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInRight, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IWeather,
  type IWeatherForecast,
  getWeatherIcon,
  getTimeIcon,
  getWeatherColor,
  getWeatherGradient,
} from '../../types/weather';

interface WeatherForecastProps {
  currentWeather: IWeather;
  forecast: IWeatherForecast[];
  onWeatherSelect?: (weather: IWeather) => void;
}

export function WeatherForecastPanel({ currentWeather, forecast }: WeatherForecastProps) {
  const { t } = useTranslation();

  const currentIcon = getWeatherIcon(currentWeather.type);
  const currentTimeIcon = getTimeIcon(currentWeather.timeOfDay);
  const currentGradient = getWeatherGradient(currentWeather.type, currentWeather.timeOfDay);

  // Sort forecast by time
  const sortedForecast = useMemo(
    () => [...forecast].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [forecast]
  );

  return (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.container}>
      <BlurView intensity={40} tint='dark' style={styles.blurContainer}>
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']} style={styles.content}>
          {/* Current Weather Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('weather.forecast')}</Text>
            <View style={styles.currentBadge}>
              <LinearGradient
                colors={[`${currentGradient[0]}60`, `${currentGradient[1]}40`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.currentGradient}
              >
                <Text style={styles.currentIcon}>{currentIcon}</Text>
                <View style={styles.currentInfo}>
                  <Text style={styles.currentLabel}>{t('weather.current')}</Text>
                  <Text style={styles.currentType}>
                    {t(`weather.types.${currentWeather.type}`)}
                  </Text>
                </View>
                <Text style={styles.currentTimeIcon}>{currentTimeIcon}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Forecast Timeline */}
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>{t('weather.upcomingWeather')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastScroll}
            >
              {sortedForecast.map((item, index) => (
                <ForecastItem key={`forecast-${index}`} forecast={item} index={index} />
              ))}
            </ScrollView>
          </View>

          {/* Weather Duration */}
          <View style={styles.durationSection}>
            <View style={styles.durationItem}>
              <Text style={styles.durationIcon}>⏱️</Text>
              <Text style={styles.durationLabel}>{t('weather.duration')}</Text>
              <Text style={styles.durationValue}>
                {currentWeather.duration} {t('weather.minutes')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.durationItem}>
              <Text style={styles.durationIcon}>🔄</Text>
              <Text style={styles.durationLabel}>{t('weather.transition')}</Text>
              <Text style={styles.durationValue}>{currentWeather.transitionTime}s</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

function ForecastItem({ forecast, index }: { forecast: IWeatherForecast; index: number }) {
  const { t } = useTranslation();

  const icon = getWeatherIcon(forecast.weather.type);
  const timeIcon = getTimeIcon(forecast.weather.timeOfDay);
  const color = getWeatherColor(forecast.weather.type);
  const gradient = getWeatherGradient(forecast.weather.type, forecast.weather.timeOfDay);

  // Format time
  const timeString = useMemo(() => {
    const hours = forecast.startsAt.getHours();
    const minutes = forecast.startsAt.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, [forecast.startsAt]);

  // Probability percentage
  const probabilityPercent = Math.round(forecast.probability * 100);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(300)}
      style={styles.forecastItem}
    >
      <LinearGradient
        colors={[`${gradient[0]}30`, `${gradient[1]}20`]}
        style={styles.forecastGradient}
      >
        <Text style={styles.forecastTime}>{timeString}</Text>
        <Text style={styles.forecastIcon}>{icon}</Text>
        <Text style={styles.forecastTimeOfDay}>{timeIcon}</Text>
        <Text style={[styles.forecastType, { color }]}>
          {t(`weather.types.${forecast.weather.type}`)}
        </Text>
        <View style={styles.probabilityContainer}>
          <View
            style={[
              styles.probabilityBar,
              { width: `${probabilityPercent}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.probabilityText}>{probabilityPercent}%</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Mini forecast for compact display
export function MiniWeatherForecast({ forecast }: { forecast: IWeatherForecast[] }) {
  const sortedForecast = useMemo(
    () => [...forecast].slice(0, 3).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [forecast]
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.miniContainer}>
      <BlurView intensity={20} tint='dark' style={styles.miniBlur}>
        <View style={styles.miniContent}>
          {sortedForecast.map((item, index) => (
            <MiniItem key={`mini-${index}`} forecast={item} />
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
}

function MiniItem({ forecast }: { forecast: IWeatherForecast }) {
  const icon = getWeatherIcon(forecast.weather.type);
  const color = getWeatherColor(forecast.weather.type);

  const timeString = useMemo(() => {
    const hours = forecast.startsAt.getHours();
    return `${hours}:00`;
  }, [forecast.startsAt]);

  return (
    <View style={styles.miniItem}>
      <Text style={styles.miniTime}>{timeString}</Text>
      <Text style={styles.miniIcon}>{icon}</Text>
      <View style={[styles.miniIndicator, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.title,
    color: COLORS.text,
    marginBottom: 12,
  },
  currentBadge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  currentIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  currentInfo: {
    flex: 1,
  },
  currentLabel: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentType: {
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  currentTimeIcon: {
    fontSize: 24,
  },
  forecastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forecastScroll: {
    paddingRight: 16,
    gap: 12,
  },
  forecastItem: {
    width: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  forecastGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  forecastTime: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
    marginBottom: 8,
  },
  forecastIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  forecastTimeOfDay: {
    fontSize: 16,
    marginBottom: 8,
  },
  forecastType: {
    fontSize: 11,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 8,
  },
  probabilityContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 2,
  },
  probabilityText: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  durationItem: {
    flex: 1,
    alignItems: 'center',
  },
  durationIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniBlur: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  miniContent: {
    flexDirection: 'row',
    padding: 8,
    gap: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  miniItem: {
    alignItems: 'center',
    gap: 4,
  },
  miniTime: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  miniIcon: {
    fontSize: 20,
  },
  miniIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
