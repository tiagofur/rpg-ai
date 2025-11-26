import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS, FONTS } from '../../theme';
import {
  ISpell,
  ISpellState,
  SpellSchool,
  getSchoolIcon,
  getSchoolColor,
  SAMPLE_SPELLS,
} from '../../types/magic';
import { ManaBar } from './ManaBar';
import { SpellList } from './SpellList';

const { height } = Dimensions.get('window');

const SCHOOLS: Array<SpellSchool | 'all'> = [
  'all',
  'fire',
  'ice',
  'lightning',
  'arcane',
  'light',
  'dark',
  'nature',
  'earth',
];

interface SpellScreenProps {
  spells?: ISpell[];
  state: ISpellState;
  onCast: (spell: ISpell) => void;
  onClose: () => void;
  inCombat?: boolean | undefined;
}

export function SpellScreen({
  spells = SAMPLE_SPELLS,
  state,
  onCast,
  onClose,
  inCombat = false,
}: SpellScreenProps) {
  const [selectedSchool, setSelectedSchool] = useState<SpellSchool | 'all'>('all');

  const handleCast = useCallback(
    (spell: ISpell) => {
      onCast(spell);
      if (inCombat) {
        // Auto-close after casting in combat
        onClose();
      }
    },
    [onCast, onClose, inCombat]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      {/* Background */}
      <BlurView intensity={30} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />

      {/* Content */}
      <Animated.View
        entering={SlideInDown.springify()}
        exiting={SlideOutDown}
        style={styles.content}
      >
        <LinearGradient
          colors={['rgba(20,20,35,0.98)', 'rgba(10,10,20,0.99)']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>✨ Spellbook</Text>
              <Text style={styles.subtitle}>{state.learnedSpells.length} spells learned</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mana bar */}
          <View style={styles.manaContainer}>
            <ManaBar current={state.currentMana} max={state.maxMana} height={24} />
          </View>

          {/* School filter tabs */}
          <View style={styles.tabsContainer}>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {SCHOOLS.map((school) => {
                const isActive = selectedSchool === school;
                const schoolColor = school === 'all' ? '#FFFFFF' : getSchoolColor(school);

                return (
                  <TouchableOpacity
                    key={school}
                    style={[
                      styles.tab,
                      isActive && styles.tabActive,
                      isActive && { borderColor: schoolColor },
                    ]}
                    onPress={() => setSelectedSchool(school)}
                  >
                    <Text style={styles.tabIcon}>
                      {school === 'all' ? '📚' : getSchoolIcon(school)}
                    </Text>
                    <Text style={[styles.tabText, isActive && { color: schoolColor }]}>
                      {school === 'all' ? 'All' : school.charAt(0).toUpperCase() + school.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.ScrollView>
          </View>

          {/* Spell list */}
          <View style={styles.listContainer}>
            <SpellList
              spells={spells}
              state={state}
              onCast={handleCast}
              filterSchool={selectedSchool}
            />
          </View>

          {/* Combat hint */}
          {inCombat && (
            <View style={styles.combatHint}>
              <Text style={styles.combatHintText}>⚔️ Select a spell to cast in combat</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
  manaContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabsContainer: {
    marginBottom: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    textTransform: 'capitalize',
  },
  listContainer: {
    flex: 1,
    maxHeight: height * 0.55,
  },
  combatHint: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 76, 60, 0.3)',
  },
  combatHintText: {
    color: '#E74C3C',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
  },
});

export default SpellScreen;
