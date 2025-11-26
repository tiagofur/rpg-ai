import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IBackstoryOption } from '../../types/backstory';

interface BackstoryOptionCardProps {
  option: IBackstoryOption;
  isSelected: boolean;
  index: number;
  onSelect: (optionId: string) => void;
}

export function BackstoryOptionCard({
  option,
  isSelected,
  index,
  onSelect,
}: BackstoryOptionCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    onSelect(option.id);
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100)
        .duration(300)
        .springify()}
      style={animatedStyle}
    >
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <BlurView intensity={isSelected ? 40 : 20} tint='dark' style={styles.container}>
          <LinearGradient
            colors={
              isSelected
                ? [`${COLORS.primary}40`, `${COLORS.primary}20`]
                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, isSelected && styles.selectedGradient]}
          >
            {/* Selection indicator */}
            {isSelected && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.checkmark}
              >
                <Text style={styles.checkmarkText}>✓</Text>
              </Animated.View>
            )}

            {/* Icon */}
            <View style={[styles.iconContainer, isSelected && styles.selectedIcon]}>
              <Text style={styles.icon}>{option.icon}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.text, isSelected && styles.selectedText]}>{t(option.text)}</Text>

              {/* Effect hints */}
              <View style={styles.effectsContainer}>
                {option.effect.statModifiers && (
                  <View style={styles.effectBadge}>
                    <Text style={styles.effectIcon}>📊</Text>
                    <Text style={styles.effectText}>{t('backstory.statsBonus')}</Text>
                  </View>
                )}
                {option.effect.startingItem && (
                  <View style={styles.effectBadge}>
                    <Text style={styles.effectIcon}>🎁</Text>
                    <Text style={styles.effectText}>{t('backstory.startsWithItem')}</Text>
                  </View>
                )}
                {option.effect.specialEvent && (
                  <View style={styles.effectBadge}>
                    <Text style={styles.effectIcon}>⭐</Text>
                    <Text style={styles.effectText}>{t('backstory.specialEvent')}</Text>
                  </View>
                )}
                {option.effect.recurringNPC && (
                  <View style={styles.effectBadge}>
                    <Text style={styles.effectIcon}>👤</Text>
                    <Text style={styles.effectText}>{t('backstory.recurringNPC')}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  selectedGradient: {
    borderColor: `${COLORS.primary}60`,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIcon: {
    backgroundColor: `${COLORS.primary}30`,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  selectedText: {
    fontFamily: FONTS.bodyBold,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  effectIcon: {
    fontSize: 12,
  },
  effectText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
});
