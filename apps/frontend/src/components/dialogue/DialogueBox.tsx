import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

import { COLORS, FONTS } from '../../theme';
import { IDialogueNode } from '../../types/dialogue';

interface DialogueBoxProps {
  node: IDialogueNode;
  npcName: string;
  playerName?: string;
  onTextComplete?: () => void;
  onTap?: () => void;
  typewriterSpeed?: number; // ms per character
  showContinueIndicator?: boolean;
}

export function DialogueBox({
  node,
  npcName,
  playerName = 'Tú',
  onTextComplete,
  onTap,
  typewriterSpeed = 30,
  showContinueIndicator = true,
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const cursorOpacity = useSharedValue(1);

  const speakerName = node.speaker === 'npc' ? node.speakerName || npcName : playerName;

  const { text: nodeText } = node;

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < nodeText.length) {
        setDisplayedText(nodeText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onTextComplete?.();
      }
    }, typewriterSpeed);

    return () => clearInterval(interval);
  }, [nodeText, typewriterSpeed, onTextComplete]);

  // Blinking cursor animation
  useEffect(() => {
    if (!isComplete || !showContinueIndicator) {
      return;
    }

    const blink = setInterval(() => {
      cursorOpacity.value = withTiming(cursorOpacity.value === 1 ? 0.3 : 1, {
        duration: 500,
      });
    }, 500);
    return () => clearInterval(blink);
  }, [isComplete, showContinueIndicator, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const handlePress = useCallback(() => {
    if (isComplete) {
      onTap?.();
    } else {
      // Skip typewriter animation
      setDisplayedText(nodeText);
      setIsComplete(true);
      onTextComplete?.();
    }
  }, [isComplete, nodeText, onTextComplete, onTap]);

  const isPlayerSpeaking = node.speaker === 'player';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
      <LinearGradient
        colors={
          isPlayerSpeaking
            ? ['rgba(70,130,180,0.95)', 'rgba(40,80,120,0.98)']
            : ['rgba(40,40,60,0.95)', 'rgba(25,25,40,0.98)']
        }
        style={styles.gradient}
      >
        {/* Speaker name */}
        <View style={styles.header}>
          <View style={[styles.speakerBadge, isPlayerSpeaking && styles.speakerBadgePlayer]}>
            <Text style={[styles.speakerName, isPlayerSpeaking && styles.speakerNamePlayer]}>
              {speakerName}
            </Text>
          </View>
        </View>

        {/* Dialogue text */}
        <View style={styles.textContainer}>
          <Text style={styles.dialogueText}>
            {displayedText}
            {!isComplete && <Text style={styles.cursor}>▌</Text>}
          </Text>
        </View>

        {/* Continue indicator */}
        {isComplete && showContinueIndicator && !node.options?.length && (
          <Animated.View entering={FadeIn} style={[styles.continueContainer, cursorStyle]}>
            <Text style={styles.continueText}>▼ Toca para continuar</Text>
          </Animated.View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Hook to manage dialogue text animation
 */
export function useTypewriter(text: string, speed: number = 30, onComplete?: () => void) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  const skip = useCallback(() => {
    setDisplayedText(text);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  return { displayedText, isComplete, skip };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(247,207,70,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    padding: 16,
    minHeight: 120,
  },
  header: {
    marginBottom: 8,
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(247,207,70,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(247,207,70,0.3)',
  },
  speakerBadgePlayer: {
    backgroundColor: 'rgba(100,180,255,0.2)',
    borderColor: 'rgba(100,180,255,0.3)',
  },
  speakerName: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  speakerNamePlayer: {
    color: '#64b5f6',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dialogueText: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
  },
  cursor: {
    color: COLORS.primary,
    fontFamily: FONTS.body,
  },
  continueContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  continueText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
});
