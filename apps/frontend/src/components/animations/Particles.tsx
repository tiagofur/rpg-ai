import { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

interface ParticlesProps {
  count?: number;
  color?: string;
  duration?: number;
  size?: number;
  trigger?: boolean;
}

export function Particles({
  count = 20,
  color = '#f7cf46',
  duration = 1500,
  size = 8,
  trigger = false,
}: ParticlesProps) {
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: new Animated.Value(width / 2),
        y: new Animated.Value(height / 2),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
      }));
    }
  }, [count]);

  useEffect(() => {
    if (trigger) {
      // Animate all particles
      const animations = particlesRef.current.map((particle) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 150;
        const targetX = width / 2 + Math.cos(angle) * distance;
        const targetY = height / 2 + Math.sin(angle) * distance;

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: duration / 4,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: (duration * 3) / 4,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: duration / 3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: (duration * 2) / 3,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => {
        // Reset particles
        particlesRef.current.forEach((particle) => {
          particle.x.setValue(width / 2);
          particle.y.setValue(height / 2);
          particle.opacity.setValue(0);
          particle.scale.setValue(0);
        });
      });
    }
  }, [trigger, duration]);

  if (!trigger && particlesRef.current.length > 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents='none'>
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity,
              transform: [{ scale: particle.scale }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
  },
});
