import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, FONTS } from '../../theme';
import { IDialogueOption, IDialogueRequirement } from '../../types/dialogue';

interface DialogueOptionProps {
  option: IDialogueOption;
  index: number;
  onSelect: (option: IDialogueOption) => void;
  isAvailable: boolean;
  requirementText?: string;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function DialogueOption({
  option,
  index,
  onSelect,
  isAvailable,
  requirementText,
  disabled = false,
}: DialogueOptionProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  // Fade in animation with delay based on index
  opacity.value = withTiming(1, { duration: 300 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (!isAvailable || disabled) return;

    scale.value = withSequence(withSpring(0.95, { damping: 10 }), withSpring(1, { damping: 8 }));

    onSelect(option);
  };

  const optionNumber = index + 1;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={!isAvailable || disabled}
      style={[animatedStyle, styles.container, !isAvailable && styles.containerUnavailable]}
      activeOpacity={0.7}
    >
      <View style={styles.numberContainer}>
        <Text style={[styles.number, !isAvailable && styles.textUnavailable]}>{optionNumber}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.optionText, !isAvailable && styles.textUnavailable]} numberOfLines={2}>
          {option.text}
        </Text>

        {!isAvailable && requirementText && (
          <Text style={styles.requirementText}>🔒 {requirementText}</Text>
        )}
      </View>

      {isAvailable && (
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

/**
 * Generate human-readable requirement text
 */
export function getRequirementText(req?: IDialogueRequirement): string | undefined {
  if (!req) return undefined;

  const parts: string[] = [];

  if (req.level) {
    parts.push(`Nivel ${req.level}`);
  }
  if (req.gold) {
    parts.push(`${req.gold} oro`);
  }
  if (req.stat) {
    parts.push(`${req.stat.name} ${req.stat.min}+`);
  }
  if (req.item) {
    parts.push(`Requiere: ${req.item}`);
  }
  if (req.quest) {
    parts.push(`Misión activa`);
  }
  if (req.questCompleted) {
    parts.push(`Misión completada`);
  }
  if (req.reputation) {
    parts.push(`Reputación: ${req.reputation.faction}`);
  }

  return parts.length > 0 ? parts.join(', ') : undefined;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247,207,70,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(247,207,70,0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  containerUnavailable: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    borderColor: 'rgba(100,100,100,0.2)',
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(247,207,70,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  number: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  textUnavailable: {
    color: '#666',
  },
  requirementText: {
    color: '#888',
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 4,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: FONTS.bodyBold,
  },
});
