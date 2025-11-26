import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IRoom, getRoomIcon } from '../../types/infinite';

interface DungeonRoomProps {
  room: IRoom;
  isCurrent: boolean;
  isAdjacent: boolean;
  onPress: (roomId: string) => void;
}

export function DungeonRoom({ room, isCurrent, isAdjacent, onPress }: DungeonRoomProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  // Animate current room
  if (isCurrent) {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
      -1,
      true
    );
  }

  const handlePressIn = () => {
    if (isAdjacent && !room.isCleared) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const icon = getRoomIcon(room.type);
  const canEnter = isAdjacent && !room.isCleared;

  const roomColors = useMemo((): [string, string] => {
    if (room.isCleared) return ['#2E7D32', '#1B5E20'];
    if (isCurrent) return [COLORS.primary, '#7B1FA2'];
    if (room.type === 'boss') return ['#B71C1C', '#880E4F'];
    if (room.type === 'miniboss') return ['#E65100', '#BF360C'];
    if (room.type === 'treasure') return ['#F9A825', '#FF6F00'];
    if (room.type === 'shop') return ['#00695C', '#004D40'];
    if (room.type === 'rest') return ['#0277BD', '#01579B'];
    return ['#424242', '#212121'];
  }, [room.type, room.isCleared, isCurrent]);

  if (!room.isRevealed) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={[styles.container, styles.hiddenRoom]}>
        <Text style={styles.hiddenIcon}>❓</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={() => canEnter && onPress(room.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canEnter}
      >
        <BlurView intensity={20} tint='dark' style={styles.blur}>
          <LinearGradient
            colors={roomColors}
            style={[
              styles.gradient,
              isCurrent && styles.currentRoom,
              room.isCleared && styles.clearedRoom,
            ]}
          >
            {/* Glow effect for current room */}
            {isCurrent && (
              <Animated.View style={[styles.glowOverlay, glowStyle]}>
                <LinearGradient
                  colors={['rgba(138,43,226,0.4)', 'rgba(138,43,226,0)']}
                  style={styles.glowGradient}
                />
              </Animated.View>
            )}

            {/* Room icon */}
            <Text style={styles.icon}>{icon}</Text>

            {/* Room name */}
            <Text style={styles.name} numberOfLines={1}>
              {t(`infinite.rooms.${room.type}`)}
            </Text>

            {/* Status indicators */}
            <View style={styles.indicators}>
              {room.isCleared && <Text style={styles.indicator}>✓</Text>}
              {room.enemies && room.enemies.length > 0 && !room.isCleared && (
                <Text style={styles.indicator}>⚔️ {room.enemies.length}</Text>
              )}
              {room.loot && room.loot.length > 0 && !room.isCleared && (
                <Text style={styles.indicator}>💰</Text>
              )}
            </View>

            {/* Enter indicator */}
            {canEnter && (
              <View style={styles.enterBadge}>
                <Text style={styles.enterText}>{t('infinite.enter')}</Text>
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    margin: 4,
  },
  hiddenRoom: {
    backgroundColor: 'rgba(60,60,60,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  blur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currentRoom: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  clearedRoom: {
    opacity: 0.8,
  },
  glowOverlay: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 20,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  name: {
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
    textAlign: 'center',
  },
  indicators: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  indicator: {
    fontSize: 10,
  },
  enterBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  enterText: {
    fontSize: 8,
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
});
