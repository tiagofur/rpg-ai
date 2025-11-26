import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IBackstoryQuestion, type IBackstoryProgress } from '../../types/backstory';
import { BackstoryOptionCard } from './BackstoryOptionCard';

interface BackstoryQuestionProps {
  question: IBackstoryQuestion;
  progress: IBackstoryProgress;
  selectedOptionId: string | undefined;
  onSelectOption: (optionId: string) => void;
}

export function BackstoryQuestion({
  question,
  progress,
  selectedOptionId,
  onSelectOption,
}: BackstoryQuestionProps) {
  const { t } = useTranslation();

  // Progress animation
  const progressValue = useSharedValue(0);

  useMemo(() => {
    progressValue.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(progress.currentStep / progress.totalSteps, { duration: 500 })
    );
  }, [progress.currentStep, progress.totalSteps, progressValue]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.stepText}>
            {t('backstory.step', { current: progress.currentStep, total: progress.totalSteps })}
          </Text>
          <Text style={styles.categoryText}>{t(`backstory.categories.${question.category}`)}</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      {/* Question Card */}
      <Animated.View
        entering={SlideInUp.delay(100).duration(400).springify()}
        style={styles.questionCard}
      >
        <BlurView intensity={30} tint='dark' style={styles.questionBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.questionGradient}
          >
            <Text style={styles.questionIcon}>{question.icon}</Text>
            <Text style={styles.questionText}>{t(question.question)}</Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Options */}
      <ScrollView
        style={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsContent}
      >
        {question.options.map((option, index) => (
          <BackstoryOptionCard
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            index={index}
            onSelect={onSelectOption}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  questionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  questionBlur: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  questionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  questionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 20,
    fontFamily: FONTS.title,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
  },
  optionsContent: {
    paddingBottom: 24,
  },
});
