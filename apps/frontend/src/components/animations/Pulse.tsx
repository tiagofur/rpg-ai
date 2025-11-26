import { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface PulseProps {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  repeat?: boolean;
  style?: ViewStyle;
}

export function Pulse({
  children,
  duration = 1000,
  minScale = 1,
  maxScale = 1.1,
  repeat = true,
  style,
}: PulseProps) {
  const scaleAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: maxScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: minScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);

    if (repeat) {
      Animated.loop(animation).start();
    } else {
      animation.start();
    }
  }, [scaleAnim, duration, minScale, maxScale, repeat]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
