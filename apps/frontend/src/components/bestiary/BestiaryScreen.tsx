import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { type ICreature, type IBestiaryEntry, SAMPLE_CREATURES } from '../../types/bestiary';
import { BestiaryList, type BestiaryEntryWithCreature } from './BestiaryList';

interface BestiaryScreenProps {
  creatures?: ICreature[];
  entries?: Record<string, IBestiaryEntry>;
  onBack?: () => void;
  onCreatureSelect?: (creature: ICreature, entry?: IBestiaryEntry) => void;
}

// Mock entries for development
const createMockEntries = (creatures: ICreature[]): BestiaryEntryWithCreature[] =>
  creatures.map((creature, index) => ({
    creature,
    entry:
      index < 2
        ? {
            creatureId: creature.id,
            discovered: true,
            timesDefeated: Math.floor(Math.random() * 50) + 1,
            firstEncounter: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            lastEncounter: new Date(),
            dropsObtained: {},
          }
        : undefined,
  }));

export function BestiaryScreen({
  creatures = SAMPLE_CREATURES,
  entries = {},
  onBack,
  onCreatureSelect,
}: BestiaryScreenProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const entriesWithCreatures = useMemo(() => {
    // Combine creatures with their entries
    const combined: BestiaryEntryWithCreature[] = creatures.map((creature) => ({
      creature,
      entry: entries[creature.id],
    }));

    // If no entries provided, use mock data for development
    if (Object.keys(entries).length === 0) {
      return createMockEntries(creatures);
    }

    return combined;
  }, [creatures, entries]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entriesWithCreatures;

    const query = searchQuery.toLowerCase();
    return entriesWithCreatures.filter((item) => {
      const nameMatch = item.creature.name.toLowerCase().includes(query);
      const typeMatch = item.creature.type.toLowerCase().includes(query);
      const habitatMatch = item.creature.habitat?.some((h) => h.toLowerCase().includes(query));
      return nameMatch || typeMatch || habitatMatch;
    });
  }, [entriesWithCreatures, searchQuery]);

  const stats = useMemo(() => {
    const discovered = entriesWithCreatures.filter((e) => e.entry?.discovered === true).length;
    return {
      discovered,
      total: entriesWithCreatures.length,
      percentage: Math.round((discovered / entriesWithCreatures.length) * 100),
    };
  }, [entriesWithCreatures]);

  const handleCreatureSelect = useCallback(
    (creature: ICreature, entry?: IBestiaryEntry) => {
      onCreatureSelect?.(creature, entry);
    },
    [onCreatureSelect]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(30,30,40,1)', 'rgba(20,20,30,1)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View entering={SlideInUp.springify()} style={styles.header}>
        {onBack !== undefined && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('bestiary.title', 'Bestiary')}</Text>
          <Text style={styles.subtitle}>
            {stats.discovered}/{stats.total} ({stats.percentage}%)
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('bestiary.searchPlaceholder', 'Search creatures...')}
            placeholderTextColor={COLORS.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Bestiary List */}
      <BestiaryList
        entries={filteredEntries}
        onCreatureSelect={handleCreatureSelect}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.text,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
});
