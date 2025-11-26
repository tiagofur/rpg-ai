import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { FONTS } from '../../theme';
import { IMapLocation, getLocationIcon, getStatusColor, getDangerColor } from '../../types/map';

interface MapNodeProps {
  location: IMapLocation;
  isCurrentLocation: boolean;
  onPress: (location: IMapLocation) => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  disabled?: boolean;
}

const SIZE_MAP = {
  small: 36,
  medium: 48,
  large: 60,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function MapNode({
  location,
  isCurrentLocation,
  onPress,
  size = 'medium',
  showLabel = true,
  disabled = false,
}: MapNodeProps) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const nodeSize = SIZE_MAP[size];
  const statusColor = getStatusColor(location.status);
  const dangerColor = getDangerColor(location.dangerLevel);

  // Pulse animation for current location
  useEffect(() => {
    if (isCurrentLocation) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1, // infinite
        true // reverse
      );
    } else {
      pulse.value = 1;
    }
  }, [isCurrentLocation, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (isCurrentLocation ? pulse.value : 1) }],
  }));

  const handlePress = () => {
    if (disabled || location.status === 'locked') return;

    scale.value = withSequence(withSpring(0.9, { damping: 10 }), withSpring(1, { damping: 8 }));

    onPress(location);
  };

  const isHidden = location.status === 'unexplored' && !isCurrentLocation;
  const icon = isHidden ? '❓' : location.icon || getLocationIcon(location.type);

  return (
    <View style={styles.container}>
      <AnimatedTouchable
        onPress={handlePress}
        disabled={disabled || location.status === 'locked'}
        style={[
          animatedStyle,
          {
            opacity: location.status === 'locked' ? 0.4 : 1,
          },
        ]}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.nodeOuter,
            {
              width: nodeSize + 8,
              height: nodeSize + 8,
              borderColor: statusColor,
              shadowColor: statusColor,
            },
          ]}
        >
          <View
            style={[
              styles.nodeInner,
              {
                width: nodeSize,
                height: nodeSize,
                backgroundColor: isCurrentLocation ? 'rgba(247,207,70,0.2)' : 'rgba(30,30,50,0.95)',
              },
            ]}
          >
            <Text style={[styles.icon, { fontSize: nodeSize * 0.5 }]}>{icon}</Text>

            {/* Current location indicator */}
            {isCurrentLocation && (
              <View style={styles.currentIndicator}>
                <Text style={styles.currentStar}>★</Text>
              </View>
            )}

            {/* Danger level indicator */}
            {location.dangerLevel && location.status !== 'unexplored' && (
              <View style={[styles.dangerIndicator, { backgroundColor: dangerColor }]} />
            )}
          </View>
        </View>
      </AnimatedTouchable>

      {/* Location name label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                color: isCurrentLocation ? '#f7cf46' : '#ccc',
                fontSize: size === 'small' ? 8 : 10,
              },
            ]}
            numberOfLines={2}
          >
            {isHidden ? '???' : location.name}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'absolute',
  },
  nodeOuter: {
    borderRadius: 100,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeInner: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  currentStar: {
    color: '#f7cf46',
    fontSize: 14,
    textShadowColor: '#f7cf46',
    textShadowRadius: 4,
  },
  dangerIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  labelContainer: {
    marginTop: 4,
    maxWidth: 80,
  },
  label: {
    fontFamily: FONTS.body,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
