import { useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type ILeaderboardEntry } from '../../types/infinite';

// Format play time from seconds to HH:MM:SS
function formatPlayTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface LeaderboardPanelProps {
  entries: ILeaderboardEntry[];
  currentUserId?: string | undefined;
  onClose?: (() => void) | undefined;
}

export function LeaderboardPanel({ entries, currentUserId, onClose }: LeaderboardPanelProps) {
  const { t } = useTranslation();

  // Sort entries by highestFloor (primary), totalKills (secondary)
  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (b.highestFloor !== a.highestFloor) return b.highestFloor - a.highestFloor;
        return b.totalKills - a.totalKills;
      }),
    [entries]
  );

  const renderEntry = ({ item, index }: { item: ILeaderboardEntry; index: number }) => (
    <LeaderboardEntry
      entry={item}
      rank={index + 1}
      isCurrentUser={item.playerId === currentUserId}
    />
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <BlurView intensity={40} tint='dark' style={styles.blur}>
        <LinearGradient
          colors={[`${COLORS.surface}90`, `${COLORS.background}95`]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🏆 {t('infinite.leaderboard')}</Text>
            {onClose && (
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Column headers */}
          <View style={styles.columnHeaders}>
            <Text style={[styles.columnHeader, styles.rankColumn]}>#</Text>
            <Text style={[styles.columnHeader, styles.playerColumn]}>{t('infinite.player')}</Text>
            <Text style={[styles.columnHeader, styles.scoreColumn]}>{t('infinite.score')}</Text>
            <Text style={[styles.columnHeader, styles.floorColumn]}>{t('infinite.floor')}</Text>
          </View>

          {/* Entries list */}
          <FlatList
            data={sortedEntries}
            renderItem={renderEntry}
            keyExtractor={(item) => item.playerId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

interface LeaderboardEntryProps {
  entry: ILeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

function LeaderboardEntry({ entry, rank, isCurrentUser }: LeaderboardEntryProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getRankDisplay = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColors = (): [string, string] => {
    if (rank === 1) return ['#FFD700', '#FFA000'];
    if (rank === 2) return ['#C0C0C0', '#9E9E9E'];
    if (rank === 3) return ['#CD7F32', '#8B4513'];
    if (isCurrentUser) return [COLORS.primary, COLORS.secondary];
    return ['transparent', 'transparent'];
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(rank * 50).duration(300)}
      style={[styles.entryContainer, animatedStyle]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.entryPressable}
      >
        <LinearGradient
          colors={getRankColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.entryGradient,
            rank <= 3 && styles.topThreeEntry,
            isCurrentUser && styles.currentUserEntry,
          ]}
        >
          {/* Rank */}
          <View style={[styles.rankCell, styles.rankColumn]}>
            <Text style={[styles.rankText, rank <= 3 && styles.topRankText]}>
              {getRankDisplay()}
            </Text>
          </View>

          {/* Player info */}
          <View style={[styles.playerCell, styles.playerColumn]}>
            <Text
              style={[styles.playerName, isCurrentUser && styles.currentUserName]}
              numberOfLines={1}
            >
              {entry.playerName}
            </Text>
            <View style={styles.characterInfo}>
              <Text style={styles.killsText}>💀 {entry.totalKills}</Text>
              <Text style={styles.goldText}>💰 {entry.totalGold}</Text>
            </View>
          </View>

          {/* Floor reached */}
          <View style={[styles.scoreCell, styles.scoreColumn]}>
            <Text style={styles.scoreValue}>{entry.highestFloor}</Text>
            <Text style={styles.scoreLabel}>{t('infinite.floor')}</Text>
          </View>

          {/* Play time */}
          <View style={[styles.floorCell, styles.floorColumn]}>
            <Text style={styles.floorValue}>{formatPlayTime(entry.playTime)}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.textDim}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.text,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textDim}30`,
    marginBottom: 8,
  },
  columnHeader: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  rankColumn: {
    width: 40,
  },
  playerColumn: {
    flex: 1,
  },
  scoreColumn: {
    width: 80,
    textAlign: 'right',
  },
  floorColumn: {
    width: 60,
    textAlign: 'right',
  },
  listContent: {
    gap: 8,
  },
  entryContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryPressable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.surface}60`,
    borderRadius: 12,
  },
  topThreeEntry: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  currentUserEntry: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
  },
  topRankText: {
    fontSize: 20,
  },
  playerCell: {
    justifyContent: 'center',
  },
  playerName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  currentUserName: {
    color: COLORS.primary,
  },
  characterInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  killsText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textDim,
  },
  goldText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.secondary,
  },
  scoreCell: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.primary,
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textDim,
  },
  floorCell: {
    alignItems: 'flex-end',
  },
  floorValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
});
