import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { COLORS, FONTS } from '../../theme';
import { ISpell, ISpellState, SpellSchool } from '../../types/magic';
import { SpellCard } from './SpellCard';

interface SpellListProps {
  spells: ISpell[];
  state: ISpellState;
  onCast: (spell: ISpell) => void;
  filterSchool?: SpellSchool | 'all' | undefined;
  compact?: boolean | undefined;
  showEmpty?: boolean | undefined;
}

export function SpellList({
  spells,
  state,
  onCast,
  filterSchool = 'all',
  compact = false,
  showEmpty = true,
}: SpellListProps) {
  // Filter spells by school and learned status
  const filteredSpells = useMemo(
    () =>
      spells.filter((spell) => {
        // Only show learned spells
        if (!state.learnedSpells.includes(spell.id)) return false;

        // Filter by school if specified
        if (filterSchool !== 'all' && spell.school !== filterSchool) return false;

        return true;
      }),
    [spells, state.learnedSpells, filterSchool]
  );

  // Group spells by school for better organization
  const groupedSpells = useMemo(() => {
    const groups: Record<SpellSchool, ISpell[]> = {
      fire: [],
      ice: [],
      lightning: [],
      earth: [],
      light: [],
      dark: [],
      arcane: [],
      nature: [],
    };

    for (const spell of filteredSpells) {
      groups[spell.school].push(spell);
    }

    // Return only non-empty groups
    return Object.entries(groups).filter(([, groupSpells]) => groupSpells.length > 0) as [
      SpellSchool,
      ISpell[],
    ][];
  }, [filteredSpells]);

  if (filteredSpells.length === 0 && showEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📖</Text>
        <Text style={styles.emptyText}>No spells learned</Text>
        <Text style={styles.emptySubtext}>Learn spells by leveling up or finding spell tomes</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactContainer}
      >
        {filteredSpells.map((spell, index) => (
          <Animated.View key={spell.id} entering={FadeInDown.delay(index * 50).springify()}>
            <SpellCard spell={spell} state={state} onCast={onCast} compact />
          </Animated.View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {groupedSpells.map(([school, schoolSpells]) => (
        <View key={school} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>
              {school.charAt(0).toUpperCase() + school.slice(1)} Magic
            </Text>
            <Text style={styles.groupCount}>{schoolSpells.length}</Text>
          </View>

          {schoolSpells.map((spell, index) => (
            <Animated.View key={spell.id} entering={FadeInDown.delay(index * 75).springify()}>
              <SpellCard spell={spell} state={state} onCast={onCast} />
            </Animated.View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  compactContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  groupTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    textTransform: 'capitalize',
  },
  groupCount: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
});

export default SpellList;
