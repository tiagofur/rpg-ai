import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../../theme';

interface CombatEffectsProps {
  type: 'hit' | 'critical' | 'miss' | 'block' | 'heal' | 'damage';
  value?: number;
  trigger?: boolean;
  position?: { x: number; y: number };
}

export function CombatEffects({
  type,
  value,
  trigger = false,
  position = { x: 0, y: 0 },
}: CombatEffectsProps) {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      // Reset
      translateYAnim.setValue(0);
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // Animate
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: -50,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(400),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [trigger, translateYAnim, scaleAnim, opacityAnim]);

  const getEffectConfig = () => {
    switch (type) {
      case 'critical':
        return {
          text: `CRÍTICO! ${value || ''}`,
          color: '#ffeb3b',
          icon: '💥',
          shake: true,
        };
      case 'hit':
        return {
          text: value ? `-${value}` : 'HIT',
          color: '#ff4444',
          icon: '⚔️',
          shake: false,
        };
      case 'miss':
        return {
          text: 'MISS',
          color: '#9e9e9e',
          icon: '💨',
          shake: false,
        };
      case 'block':
        return {
          text: 'BLOQUEADO',
          color: '#2196f3',
          icon: '🛡️',
          shake: false,
        };
      case 'heal':
        return {
          text: value ? `+${value}` : 'HEAL',
          color: '#4caf50',
          icon: '💚',
          shake: false,
        };
      case 'damage':
        return {
          text: value ? `-${value}` : 'DMG',
          color: '#f44336',
          icon: '💢',
          shake: true,
        };
      default:
        return {
          text: '',
          color: COLORS.text,
          icon: '',
          shake: false,
        };
    }
  };

  const config = getEffectConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.effectContent}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  effectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 20,
    fontFamily: FONTS.title,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
