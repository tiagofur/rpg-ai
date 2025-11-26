import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS, FONTS } from '../../theme';
import {
  ICreature,
  IBestiaryEntry,
  getRarityColor,
  getCreatureTypeIcon,
  getDamageTypeIcon,
  getDamageTypeColor,
  formatDropRate,
} from '../../types/bestiary';

interface CreatureDetailProps {
  creature: ICreature;
  entry?: IBestiaryEntry | undefined;
  onClose: () => void;
}

export function CreatureDetail({ creature, entry, onClose }: CreatureDetailProps) {
  const discovered = entry?.discovered ?? false;
  const timesDefeated = entry?.timesDefeated ?? 0;
  const rarityColor = getRarityColor(creature.rarity);
  const typeIcon = getCreatureTypeIcon(creature.type);

  if (!discovered) {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />

        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown}
          style={styles.content}
        >
          <LinearGradient
            colors={['rgba(40,40,50,0.98)', 'rgba(20,20,30,0.99)']}
            style={styles.gradient}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.undiscoveredContent}>
              <Text style={styles.undiscoveredIcon}>❓</Text>
              <Text style={styles.undiscoveredTitle}>Unknown Creature</Text>
              <Text style={styles.undiscoveredText}>
                Encounter and defeat this creature to learn its secrets.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <BlurView intensity={30} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />

      <Animated.View
        entering={SlideInDown.springify()}
        exiting={SlideOutDown}
        style={styles.content}
      >
        <LinearGradient
          colors={['rgba(30,30,40,0.98)', 'rgba(15,15,25,0.99)']}
          style={styles.gradient}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${rarityColor}20` }]}>
                <Text style={styles.icon}>{creature.icon}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={[styles.name, { color: rarityColor }]}>{creature.name}</Text>
                {creature.title && <Text style={styles.title}>"{creature.title}"</Text>}
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: `${rarityColor}30` }]}>
                    <Text style={[styles.badgeText, { color: rarityColor }]}>
                      {creature.rarity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>{typeIcon}</Text>
                    <Text style={styles.badgeText}>{creature.type}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Lv.{creature.stats.level}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
              <Text style={styles.description}>{creature.description}</Text>
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>❤️</Text>
                  <Text style={styles.statValue}>{creature.stats.hp}</Text>
                  <Text style={styles.statLabel}>HP</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>⚔️</Text>
                  <Text style={styles.statValue}>{creature.stats.attack}</Text>
                  <Text style={styles.statLabel}>ATK</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🛡️</Text>
                  <Text style={styles.statValue}>{creature.stats.defense}</Text>
                  <Text style={styles.statLabel}>DEF</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={styles.statValue}>{creature.stats.speed}</Text>
                  <Text style={styles.statLabel}>SPD</Text>
                </View>
              </View>
            </Animated.View>

            {/* Weaknesses & Resistances */}
            <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
              <Text style={styles.sectionTitle}>Weaknesses & Resistances</Text>

              {creature.weaknesses.length > 0 && (
                <View style={styles.damageRow}>
                  <Text style={styles.damageLabel}>Weak to:</Text>
                  <View style={styles.damageTypes}>
                    {creature.weaknesses.map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.damageTag,
                          { backgroundColor: `${getDamageTypeColor(type)}30` },
                        ]}
                      >
                        <Text style={styles.damageIcon}>{getDamageTypeIcon(type)}</Text>
                        <Text style={[styles.damageText, { color: getDamageTypeColor(type) }]}>
                          {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {creature.resistances.length > 0 && (
                <View style={styles.damageRow}>
                  <Text style={styles.damageLabel}>Resists:</Text>
                  <View style={styles.damageTypes}>
                    {creature.resistances.map((type) => (
                      <View
                        key={type}
                        style={[styles.damageTag, { backgroundColor: 'rgba(100,100,100,0.3)' }]}
                      >
                        <Text style={styles.damageIcon}>{getDamageTypeIcon(type)}</Text>
                        <Text style={styles.damageText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {creature.immunities && creature.immunities.length > 0 && (
                <View style={styles.damageRow}>
                  <Text style={styles.damageLabel}>Immune to:</Text>
                  <View style={styles.damageTypes}>
                    {creature.immunities.map((type) => (
                      <View
                        key={type}
                        style={[styles.damageTag, { backgroundColor: 'rgba(150,50,50,0.3)' }]}
                      >
                        <Text style={styles.damageIcon}>{getDamageTypeIcon(type)}</Text>
                        <Text style={[styles.damageText, { color: '#E74C3C' }]}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Abilities */}
            {creature.abilities && creature.abilities.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={styles.sectionTitle}>Abilities</Text>
                <View style={styles.abilitiesList}>
                  {creature.abilities.map((ability, idx) => (
                    <View key={idx} style={styles.abilityTag}>
                      <Text style={styles.abilityText}>✦ {ability}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Drops */}
            <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
              <Text style={styles.sectionTitle}>Drops</Text>
              <View style={styles.dropsList}>
                {creature.drops.map((drop, idx) => {
                  const obtained = entry?.dropsObtained[drop.itemId] ?? 0;
                  return (
                    <View key={idx} style={styles.dropItem}>
                      <View style={styles.dropInfo}>
                        <Text style={styles.dropName}>{drop.itemName}</Text>
                        <Text style={styles.dropRate}>{formatDropRate(drop.dropRate)}</Text>
                      </View>
                      {obtained > 0 && (
                        <Text style={styles.dropObtained}>×{obtained} obtained</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Rewards */}
              <View style={styles.rewards}>
                <View style={styles.reward}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardValue}>{creature.xpReward} XP</Text>
                </View>
                <View style={styles.reward}>
                  <Text style={styles.rewardIcon}>💰</Text>
                  <Text style={styles.rewardValue}>
                    {creature.goldReward.min}-{creature.goldReward.max} Gold
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Lore */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Lore</Text>
              <Text style={styles.lore}>{creature.lore}</Text>
            </Animated.View>

            {/* Habitat */}
            {creature.habitat && creature.habitat.length > 0 && (
              <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
                <Text style={styles.sectionTitle}>Habitat</Text>
                <View style={styles.habitatList}>
                  {creature.habitat.map((location, idx) => (
                    <View key={idx} style={styles.habitatTag}>
                      <Text style={styles.habitatIcon}>📍</Text>
                      <Text style={styles.habitatText}>{location}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Player stats */}
            {timesDefeated > 0 && (
              <Animated.View entering={FadeInDown.delay(500)} style={styles.playerStats}>
                <Text style={styles.playerStatsTitle}>Your Progress</Text>
                <View style={styles.playerStatsRow}>
                  <Text style={styles.playerStatLabel}>Times Defeated:</Text>
                  <Text style={styles.playerStatValue}>{timesDefeated}</Text>
                </View>
                {entry?.firstEncounter && (
                  <View style={styles.playerStatsRow}>
                    <Text style={styles.playerStatLabel}>First Encounter:</Text>
                    <Text style={styles.playerStatValue}>
                      {new Date(entry.firstEncounter).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>
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
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 48,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: FONTS.title,
    marginBottom: 2,
  },
  title: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontFamily: FONTS.body,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 6,
  },
  description: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.body,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  damageRow: {
    marginBottom: 10,
  },
  damageLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    marginBottom: 6,
  },
  damageTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  damageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  damageIcon: {
    fontSize: 12,
  },
  damageText: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.body,
    textTransform: 'capitalize',
  },
  abilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  abilityTag: {
    backgroundColor: 'rgba(155,89,182,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  abilityText: {
    color: '#9B59B6',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  dropsList: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  dropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropName: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  dropRate: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  dropObtained: {
    color: '#2ECC71',
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  rewards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardValue: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  lore: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  habitatList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  habitatIcon: {
    fontSize: 12,
  },
  habitatText: {
    color: '#2ECC71',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  playerStats: {
    backgroundColor: 'rgba(52,152,219,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52,152,219,0.3)',
  },
  playerStatsTitle: {
    color: '#3498DB',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    marginBottom: 8,
  },
  playerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerStatLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  playerStatValue: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  // Undiscovered
  undiscoveredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  undiscoveredIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.5,
  },
  undiscoveredTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.bodyBold,
    marginBottom: 12,
  },
  undiscoveredText: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
});

export default CreatureDetail;
