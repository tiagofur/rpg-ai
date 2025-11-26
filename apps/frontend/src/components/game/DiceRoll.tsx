import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../../theme';

interface DiceRollProps {
  sides?: number; // 4, 6, 8, 10, 12, 20
  onRollComplete?: (result: number) => void;
  trigger?: boolean;
  showResult?: boolean;
}

export function DiceRoll({
  sides = 20,
  onRollComplete,
  trigger = false,
  showResult = true,
}: DiceRollProps) {
  const [result, setResult] = useState<number | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      // Reset animations
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      setResult(null);

      // Start rolling animation
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Roll complete - generate result
        const rollResult = Math.floor(Math.random() * sides) + 1;
        setResult(rollResult);
        onRollComplete?.(rollResult);

        // Fade out after showing result
        if (!showResult) {
          setTimeout(() => {
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 1000);
        }
      });
    }
  }, [trigger, sides, rotateAnim, scaleAnim, opacityAnim, onRollComplete, showResult]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const getDiceIcon = () => {
    switch (sides) {
      case 4:
        return '🔺';
      case 6:
        return '🎲';
      case 8:
        return '🔷';
      case 10:
        return '🔟';
      case 12:
        return '🌟';
      default:
        return '🎲';
    }
  };

  const isCritical = result === sides;
  const isFail = result === 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
        },
      ]}
    >
      {result === null ? (
        <Text style={styles.diceIcon}>{getDiceIcon()}</Text>
      ) : (
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.result,
              isCritical && styles.criticalResult,
              isFail && styles.failResult,
            ]}
          >
            {result}
          </Text>
          <Text style={styles.diceType}>d{sides}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  diceIcon: {
    fontSize: 40,
  },
  resultContainer: {
    alignItems: 'center',
  },
  result: {
    fontSize: 36,
    fontFamily: FONTS.title,
    color: COLORS.primary,
    textShadowColor: 'rgba(247, 207, 70, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  criticalResult: {
    color: '#4caf50',
    textShadowColor: 'rgba(76, 175, 80, 0.8)',
  },
  failResult: {
    color: '#ff4444',
    textShadowColor: 'rgba(255, 68, 68, 0.8)',
  },
  diceType: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    marginTop: 2,
  },
});
