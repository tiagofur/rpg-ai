import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import {
  type IBackstory,
  type IBackstoryProgress,
  BACKSTORY_QUESTIONS,
  getBackstoryTags,
} from '../../types/backstory';
import { BackstoryQuestion } from './BackstoryQuestion';
import { BackstorySummary } from './BackstorySummary';

interface BackstoryScreenProps {
  characterName?: string;
  onComplete: (backstory: IBackstory) => void;
  onSkip?: () => void;
}

export function BackstoryScreen({
  characterName = 'Hero',
  onComplete,
  onSkip,
}: BackstoryScreenProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);

  // Ensure we have a valid current question
  const validStep = Math.min(currentStep, BACKSTORY_QUESTIONS.length - 1);
  const currentQuestion = BACKSTORY_QUESTIONS[validStep] as (typeof BACKSTORY_QUESTIONS)[number];
  const currentQuestionId = currentQuestion.id;
  const isLastQuestion = validStep === BACKSTORY_QUESTIONS.length - 1;

  const progress: IBackstoryProgress = useMemo(
    () => ({
      currentStep: validStep + 1,
      totalSteps: BACKSTORY_QUESTIONS.length,
      answers,
      isComplete: Object.keys(answers).length === BACKSTORY_QUESTIONS.length,
    }),
    [validStep, answers]
  );

  const backstory = useMemo((): IBackstory => {
    const base: IBackstory = {
      answers,
      narrativeTags: getBackstoryTags(answers),
    };
    if (showSummary) {
      base.completedAt = new Date();
    }
    return base;
  }, [answers, showSummary]);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestionId]: optionId,
      }));
    },
    [currentQuestionId]
  );

  const handleNext = useCallback(() => {
    if (!answers[currentQuestionId]) return;

    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [answers, currentQuestionId, isLastQuestion]);

  const handleBack = useCallback(() => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, showSummary]);

  const handleComplete = useCallback(() => {
    onComplete(backstory);
  }, [backstory, onComplete]);

  const canProceed = Boolean(answers[currentQuestionId]);

  // Button animation
  const buttonScale = useSharedValue(1);

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, '#1a0a2e', COLORS.background]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          {(currentStep > 0 || showSummary) && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← {t('common.back')}</Text>
              </Pressable>
            </Animated.View>
          )}
          <View style={styles.headerSpacer} />
          {onSkip && !showSummary && (
            <Pressable onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
            </Pressable>
          )}
        </View>

        {/* Content */}
        {showSummary ? (
          <Animated.View entering={SlideInRight.duration(300)} style={styles.summaryContainer}>
            <BackstorySummary backstory={backstory} characterName={characterName} />
          </Animated.View>
        ) : (
          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.questionContainer}
          >
            <BackstoryQuestion
              question={currentQuestion}
              progress={progress}
              selectedOptionId={answers[currentQuestionId]}
              onSelectOption={handleSelectOption}
            />
          </Animated.View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <Pressable
              onPress={showSummary ? handleComplete : handleNext}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!showSummary && !canProceed}
              style={[
                styles.actionButton,
                !showSummary && !canProceed && styles.actionButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={canProceed || showSummary ? [COLORS.primary, '#7B1FA2'] : ['#444', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {showSummary
                    ? t('backstory.beginAdventure')
                    : isLastQuestion
                      ? t('backstory.finish')
                      : t('common.continue')}
                </Text>
                <Text style={styles.buttonIcon}>{showSummary ? '⚔️' : '→'}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.primary,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  questionContainer: {
    flex: 1,
  },
  summaryContainer: {
    flex: 1,
  },
  bottomActions: {
    padding: 16,
    paddingBottom: 24,
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  buttonIcon: {
    fontSize: 20,
  },
});
