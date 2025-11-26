import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  style,
  borderRadius,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const getDefaultStyle = (): ViewStyle => {
    switch (variant) {
      case 'circle': {
        const size = typeof width === 'number' ? width : 50;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      }
      case 'rect':
        return {
          width: width as number,
          height: (height as number) || 100,
          borderRadius: borderRadius || 8,
        };
      default:
        return {
          width: width as number,
          height: (height as number) || 16,
          borderRadius: borderRadius || 4,
        };
    }
  };

  return <Animated.View style={[styles.skeleton, getDefaultStyle(), { opacity }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
