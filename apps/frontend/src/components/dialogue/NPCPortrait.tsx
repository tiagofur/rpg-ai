import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { COLORS, FONTS } from '../../theme';
import { NPCEmotion, getEmotionEmoji, getNPCIcon } from '../../types/dialogue';

interface NPCPortraitProps {
  name: string;
  title?: string | undefined;
  emotion?: NPCEmotion | undefined;
  isSpeaking?: boolean | undefined;
  size?: 'small' | 'medium' | 'large' | undefined;
  portraitUrl?: string | undefined;
}

const SIZE_MAP = {
  small: 60,
  medium: 80,
  large: 100,
};

export function NPCPortrait({
  name,
  title,
  emotion = 'neutral',
  isSpeaking = false,
  size = 'medium',
  portraitUrl,
}: NPCPortraitProps) {
  const portraitSize = SIZE_MAP[size];
  const speakingScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Speaking animation
  useEffect(() => {
    if (isSpeaking) {
      speakingScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 300 }), withTiming(0.3, { duration: 300 })),
        -1,
        true
      );
    } else {
      speakingScale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0.3, { duration: 200 });
    }
  }, [isSpeaking, speakingScale, glowOpacity]);

  const animatedPortraitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakingScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const npcIcon = getNPCIcon(title);
  const emotionEmoji = getEmotionEmoji(emotion);

  return (
    <View style={styles.container}>
      {/* Glow effect behind portrait */}
      <Animated.View
        style={[
          styles.glow,
          animatedGlowStyle,
          {
            width: portraitSize + 20,
            height: portraitSize + 20,
          },
        ]}
      />

      {/* Portrait container */}
      <Animated.View
        style={[
          animatedPortraitStyle,
          styles.portraitContainer,
          {
            width: portraitSize,
            height: portraitSize,
            borderRadius: portraitSize / 2,
          },
        ]}
      >
        {portraitUrl ? (
          // Image portrait placeholder - would use Image component
          <View style={styles.imagePlaceholder}>
            <Text style={[styles.npcIcon, { fontSize: portraitSize * 0.5 }]}>{npcIcon}</Text>
          </View>
        ) : (
          <View style={styles.iconPortrait}>
            <Text style={[styles.npcIcon, { fontSize: portraitSize * 0.5 }]}>{npcIcon}</Text>
          </View>
        )}

        {/* Emotion indicator */}
        <View
          style={[
            styles.emotionBadge,
            {
              right: -4,
              bottom: -4,
            },
          ]}
        >
          <Text style={styles.emotionEmoji}>{emotionEmoji}</Text>
        </View>

        {/* Speaking indicator */}
        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <Text style={styles.speakingDot}>💬</Text>
          </View>
        )}
      </Animated.View>

      {/* NPC Name and Title */}
      <View style={styles.nameContainer}>
        <Text style={styles.npcName} numberOfLines={1}>
          {name}
        </Text>
        {title && (
          <Text style={styles.npcTitle} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    top: -10,
  },
  portraitContainer: {
    backgroundColor: 'rgba(30,30,50,0.95)',
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPortrait: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emotionBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emotionEmoji: {
    fontSize: 14,
  },
  speakingIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  speakingDot: {
    fontSize: 16,
  },
  nameContainer: {
    marginTop: 8,
    alignItems: 'center',
    maxWidth: 120,
  },
  npcName: {
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    textAlign: 'center',
  },
  npcTitle: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
