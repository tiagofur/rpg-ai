import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSocketStatus } from '../hooks/useSocket';
import { COLORS, FONTS, theme } from '../theme';

interface ConnectionIndicatorProps {
  /** Display style: 'badge' for compact, 'full' for detailed */
  variant?: 'badge' | 'full' | 'minimal';
  /** Custom style */
  style?: ViewStyle;
  /** Show text label (default: true for 'full', false for others) */
  showLabel?: boolean;
  /** Callback when tapped (e.g., to show reconnect dialog) */
  onPress?: () => void;
  /** Show reconnecting animation */
  animated?: boolean;
}

/**
 * Connection Status Indicator
 *
 * Displays the current WebSocket connection status with:
 * - Color-coded indicator (green/yellow/red)
 * - Pulsing animation when connecting
 * - Optional label text
 *
 * Variants:
 * - 'minimal': Just a colored dot
 * - 'badge': Dot with short status text
 * - 'full': Larger indicator with full status message
 */
export function ConnectionIndicator({
  variant = 'badge',
  style,
  showLabel,
  onPress,
  animated = true,
}: ConnectionIndicatorProps) {
  const { t } = useTranslation();
  const { status, isConnected, isConnecting, hasError } = useSocketStatus();

  // Determine if we should show label
  const shouldShowLabel = showLabel ?? variant === 'full';

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Setup pulse animation for connecting state
  useEffect(() => {
    if (animated && isConnecting) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1, // infinite
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withSpring(1);
      pulseOpacity.value = withTiming(1);
    }

    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
    };
  }, [animated, isConnecting, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const getStatusColor = (): string => {
    if (isConnected) return theme.colors.success;
    if (isConnecting) return theme.colors.warning;
    if (hasError) return theme.colors.danger;
    return COLORS.textDim;
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        return variant === 'full'
          ? t('connection.connected', 'Connected')
          : t('connection.online', 'Online');
      case 'connecting':
        return variant === 'full'
          ? t('connection.connecting', 'Connecting...')
          : t('connection.sync', 'Syncing');
      case 'disconnected':
        return variant === 'full'
          ? t('connection.disconnected', 'Disconnected')
          : t('connection.offline', 'Offline');
      case 'error':
        return variant === 'full'
          ? t('connection.error', 'Connection Error')
          : t('connection.error', 'Error');
      default:
        return t('connection.unknown', 'Unknown');
    }
  };

  const getStatusIcon = (): string => {
    if (isConnected) return '●';
    if (isConnecting) return '◐';
    if (hasError) return '✕';
    return '○';
  };

  const statusColor = getStatusColor();

  // Minimal variant - just a dot
  if (variant === 'minimal') {
    const content = (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.minimalContainer, style]}
      >
        <Animated.View
          style={[
            styles.minimalDot,
            { backgroundColor: statusColor },
            isConnecting && animated ? pulseStyle : undefined,
          ]}
        />
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  }

  // Badge variant - dot with short text
  if (variant === 'badge') {
    const content = (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.badgeContainer, style]}
      >
        <Animated.View
          style={[
            styles.badgeDot,
            { backgroundColor: statusColor },
            isConnecting && animated ? pulseStyle : undefined,
          ]}
        />
        {shouldShowLabel && (
          <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusText()}</Text>
        )}
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  }

  // Full variant - larger with more detail
  const content = (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.fullContainer,
        {
          borderColor: statusColor,
          backgroundColor: `${statusColor}15`,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fullIndicator,
          { backgroundColor: statusColor },
          isConnecting && animated ? pulseStyle : undefined,
        ]}
      >
        <Text style={styles.fullIcon}>{getStatusIcon()}</Text>
      </Animated.View>
      <View style={styles.fullTextContainer}>
        <Text style={[styles.fullStatus, { color: statusColor }]}>{getStatusText()}</Text>
        {!isConnected && (
          <Text style={styles.fullHint}>
            {hasError
              ? t('connection.tapRetry', 'Tap to retry')
              : t('connection.waitingServer', 'Waiting for server...')}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  // Minimal variant
  minimalContainer: {
    padding: 4,
  },
  minimalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Badge variant
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Full variant
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  fullIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullIcon: {
    fontSize: 14,
    color: COLORS.background,
  },
  fullTextContainer: {
    flex: 1,
  },
  fullStatus: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  fullHint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 2,
  },
});

export default ConnectionIndicator;
