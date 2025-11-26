import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../theme';
import {
  type ICreature,
  type IBestiaryEntry,
  type CreatureType,
  getCreatureTypeIcon,
} from '../../types/bestiary';
import { CreatureCard } from './CreatureCard';
import { CreatureDetail } from './CreatureDetail';

export interface BestiaryEntryWithCreature {
  creature: ICreature;
  entry: IBestiaryEntry | undefined;
}

interface BestiaryListProps {
  entries: BestiaryEntryWithCreature[];
  onCreatureSelect?: (creature: ICreature, entry?: IBestiaryEntry) => void;
  style?: ViewStyle;
}

const CREATURE_TYPES: Array<CreatureType | 'all'> = [
  'all',
  'beast',
  'undead',
  'demon',
  'elemental',
  'dragon',
  'humanoid',
  'construct',
  'aberration',
];

const getFilterLabel = (filter: CreatureType | 'all'): string => {
  if (filter === 'all') return '📖';
  return getCreatureTypeIcon(filter);
};

const getFilterColor = (filter: CreatureType | 'all'): string => {
  if (filter === 'all') return COLORS.primary;
  // Return type-based colors
  const colorMap: Record<CreatureType, string> = {
    beast: '#8B4513',
    undead: '#4A0080',
    demon: '#8B0000',
    dragon: '#FFD700',
    humanoid: '#4169E1',
    elemental: '#00CED1',
    construct: '#708090',
    aberration: '#2F4F4F',
    plant: '#228B22',
    fey: '#FF69B4',
  };
  return colorMap[filter];
};

export function BestiaryList({ entries, onCreatureSelect, style }: BestiaryListProps) {
  const [selectedFilter, setSelectedFilter] = useState<CreatureType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<BestiaryEntryWithCreature | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredEntries = useMemo(() => {
    if (selectedFilter === 'all') return entries;
    return entries.filter((item) => item.creature.type === selectedFilter);
  }, [entries, selectedFilter]);

  const stats = useMemo(() => {
    const discovered = entries.filter((e) => e.entry?.discovered === true).length;
    const totalKills = entries.reduce((sum, e) => sum + (e.entry?.timesDefeated ?? 0), 0);
    return { discovered, total: entries.length, totalKills };
  }, [entries]);

  const handleCreaturePress = useCallback(
    (creature: ICreature, item: BestiaryEntryWithCreature) => {
      const isDiscovered = item.entry?.discovered ?? false;
      if (isDiscovered) {
        setSelectedItem(item);
        setShowDetail(true);
        onCreatureSelect?.(creature, item.entry);
      }
    },
    [onCreatureSelect]
  );

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setSelectedItem(null);
  }, []);

  const renderFilterButton = useCallback(
    (filter: CreatureType | 'all') => {
      const isSelected = selectedFilter === filter;
      const color = getFilterColor(filter);

      return (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            isSelected ? { backgroundColor: color, borderColor: color } : undefined,
          ]}
          onPress={() => setSelectedFilter(filter)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterEmoji}>{getFilterLabel(filter)}</Text>
        </TouchableOpacity>
      );
    },
    [selectedFilter]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: BestiaryEntryWithCreature; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.cardContainer}
      >
        <CreatureCard
          creature={item.creature}
          entry={item.entry}
          onPress={(creature) => handleCreaturePress(creature, item)}
        />
      </Animated.View>
    ),
    [handleCreaturePress]
  );

  const keyExtractor = useCallback((item: BestiaryEntryWithCreature) => item.creature.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        {/* Stats Summary */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.discovered}</Text>
            <Text style={styles.statLabel}>/ {stats.total}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⚔️ {stats.totalKills}</Text>
            <Text style={styles.statLabel}>kills</Text>
          </View>
        </Animated.View>

        {/* Filter Buttons */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.filtersContainer}>
          {CREATURE_TYPES.map(renderFilterButton)}
        </Animated.View>

        {/* Results Count */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredEntries.length} creature{filteredEntries.length === 1 ? '' : 's'}
            {selectedFilter === 'all' ? '' : ` • ${getCreatureTypeIcon(selectedFilter)}`}
          </Text>
        </Animated.View>
      </View>
    ),
    [stats, filteredEntries.length, selectedFilter, renderFilterButton]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyText}>No creatures found</Text>
        <Text style={styles.emptySubtext}>
          {selectedFilter === 'all'
            ? 'Explore the world to discover creatures!'
            : 'Try a different filter'}
        </Text>
      </View>
    ),
    [selectedFilter]
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {showDetail && selectedItem !== null && (
        <CreatureDetail
          creature={selectedItem.creature}
          entry={selectedItem.entry}
          onClose={handleCloseDetail}
        />
      )}
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  statsContainer: ViewStyle;
  statItem: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  statDivider: ViewStyle;
  filtersContainer: ViewStyle;
  filterButton: ViewStyle;
  filterEmoji: TextStyle;
  resultsContainer: ViewStyle;
  resultsText: TextStyle;
  listContent: ViewStyle;
  row: ViewStyle;
  cardContainer: ViewStyle;
  emptyContainer: ViewStyle;
  emptyEmoji: TextStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontFamily: FONTS.title,
    color: COLORS.primary,
    fontSize: 24,
  },
  statLabel: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterEmoji: {
    fontSize: 18,
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsText: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: FONTS.title,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
  },
});
