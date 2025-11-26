import { useRef, useEffect } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';

interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  duration?: number;
  intensity?: number;
  style?: ViewStyle;
}

export function Shake({
  children,
  trigger = false,
  duration = 500,
  intensity = 10,
  style,
}: ShakeProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: intensity,
          duration: duration / 8,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -intensity,
          duration: duration / 4,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: intensity / 2,
          duration: duration / 4,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -intensity / 2,
          duration: duration / 4,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: duration / 8,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger, shakeAnim, duration, intensity]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
