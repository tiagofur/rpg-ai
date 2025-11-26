import { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type IDungeonFloor, type IRoom, getThemeGradient } from '../../types/infinite';
import { DungeonRoom } from './DungeonRoom';

const ROOM_SIZE = 80;
const ROOM_GAP = 20;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface DungeonMapProps {
  floor: IDungeonFloor;
  currentRoomId: string;
  onRoomPress: (roomId: string) => void;
}

export function DungeonMap({ floor, currentRoomId, onRoomPress }: DungeonMapProps) {
  const { t } = useTranslation();
  const themeColors = getThemeGradient(floor.theme);

  // Calculate map bounds
  const bounds = useMemo(() => {
    const positions = floor.rooms.map((r) => r.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));
    return { minX, maxX, minY, maxY };
  }, [floor.rooms]);

  const mapWidth = (bounds.maxX - bounds.minX + 1) * (ROOM_SIZE + ROOM_GAP) + ROOM_GAP;
  const mapHeight = (bounds.maxY - bounds.minY + 1) * (ROOM_SIZE + ROOM_GAP) + ROOM_GAP;

  // Get adjacent rooms to current room
  const adjacentRoomIds = useMemo(() => {
    const currentRoom = floor.rooms.find((r) => r.id === currentRoomId);
    return currentRoom ? new Set(currentRoom.connections) : new Set<string>();
  }, [floor.rooms, currentRoomId]);

  // Calculate room position on map
  const getRoomPosition = useCallback(
    (room: IRoom) => ({
      left: (room.position.x - bounds.minX) * (ROOM_SIZE + ROOM_GAP) + ROOM_GAP,
      top: (room.position.y - bounds.minY) * (ROOM_SIZE + ROOM_GAP) + ROOM_GAP,
    }),
    [bounds]
  );

  // Draw connection lines
  const connections = useMemo(() => {
    const lines: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    const processedPairs = new Set<string>();

    for (const room of floor.rooms) {
      if (!room.isRevealed) continue;

      for (const connId of room.connections) {
        const pairKey = [room.id, connId].sort().join('-');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const connectedRoom = floor.rooms.find((r) => r.id === connId);
        if (!connectedRoom || !connectedRoom.isRevealed) continue;

        const pos1 = getRoomPosition(room);
        const pos2 = getRoomPosition(connectedRoom);

        lines.push({
          key: pairKey,
          x1: pos1.left + ROOM_SIZE / 2,
          y1: pos1.top + ROOM_SIZE / 2,
          x2: pos2.left + ROOM_SIZE / 2,
          y2: pos2.top + ROOM_SIZE / 2,
        });
      }
    }

    return lines;
  }, [floor.rooms, getRoomPosition]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Floor header */}
      <LinearGradient colors={themeColors} style={styles.header}>
        <Text style={styles.floorTitle}>
          {t('infinite.floor')} {floor.level}
        </Text>
        <Text style={styles.themeName}>{t(`infinite.themes.${floor.theme}`)}</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statText}>
            🚪 {floor.rooms.filter((r) => r.isRevealed).length}/{floor.rooms.length}
          </Text>
          <Text style={styles.statText}>✅ {floor.rooms.filter((r) => r.isCleared).length}</Text>
        </View>
      </LinearGradient>

      {/* Map scroll area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mapContainer, { width: mapWidth, height: mapHeight }]}
        >
          {/* Connection lines */}
          <View style={styles.linesContainer}>
            {connections.map((line) => {
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const length = Math.hypot(dx, dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={line.key}
                  style={[
                    styles.connectionLine,
                    {
                      left: line.x1,
                      top: line.y1,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Rooms */}
          {floor.rooms.map((room, index) => {
            const pos = getRoomPosition(room);
            return (
              <Animated.View
                key={room.id}
                entering={SlideInUp.delay(index * 50).duration(300)}
                style={[
                  styles.roomWrapper,
                  {
                    left: pos.left,
                    top: pos.top,
                    width: ROOM_SIZE,
                    height: ROOM_SIZE,
                  },
                ]}
              >
                <DungeonRoom
                  room={room}
                  isCurrent={room.id === currentRoomId}
                  isAdjacent={adjacentRoomIds.has(room.id)}
                  onPress={onRoomPress}
                />
              </Animated.View>
            );
          })}
        </ScrollView>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: `${COLORS.surface}80`,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textDim}30`,
  },
  floorTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  themeName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mapContainer: {
    position: 'relative',
    minWidth: SCREEN_WIDTH - 32,
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  connectionLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: `${COLORS.primary}60`,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  roomWrapper: {
    position: 'absolute',
  },
});
