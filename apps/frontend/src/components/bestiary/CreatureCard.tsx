import { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS } from '../../theme';
import {
  ICreature,
  IBestiaryEntry,
  getRarityColor,
  getCreatureTypeIcon,
} from '../../types/bestiary';

interface CreatureCardProps {
  creature: ICreature;
  entry?: IBestiaryEntry | undefined;
  onPress: (creature: ICreature) => void;
  compact?: boolean | undefined;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CreatureCard({ creature, entry, onPress, compact = false }: CreatureCardProps) {
  const scale = useSharedValue(1);
  const discovered = entry?.discovered ?? false;
  const timesDefeated = entry?.timesDefeated ?? 0;
  const rarityColor = getRarityColor(creature.rarity);
  const typeIcon = getCreatureTypeIcon(creature.type);

  const handlePress = useCallback(() => {
    scale.value = withSequence(withSpring(0.95, { damping: 10 }), withSpring(1, { damping: 8 }));
    onPress(creature);
  }, [scale, onPress, creature]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (compact) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        style={[styles.compactContainer, animatedStyle]}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={
            discovered
              ? [`${rarityColor}30`, `${rarityColor}10`]
              : ['rgba(50,50,50,0.8)', 'rgba(30,30,30,0.9)']
          }
          style={styles.compactGradient}
        >
          {discovered ? (
            <>
              <Text style={styles.compactIcon}>{creature.icon}</Text>
              <Text style={[styles.compactName, { color: rarityColor }]} numberOfLines={1}>
                {creature.name}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.compactIcon}>❓</Text>
              <Text style={styles.undiscoveredText}>???</Text>
            </>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[styles.container, animatedStyle]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          discovered
            ? ['rgba(30,30,40,0.95)', 'rgba(20,20,30,0.98)']
            : ['rgba(40,40,40,0.9)', 'rgba(25,25,25,0.95)']
        }
        style={styles.gradient}
      >
        {/* Rarity border glow */}
        {discovered && (
          <View
            style={[styles.rarityBorder, { borderColor: rarityColor, shadowColor: rarityColor }]}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Icon section */}
          <View style={styles.iconSection}>
            {discovered ? (
              <View style={[styles.iconContainer, { backgroundColor: `${rarityColor}20` }]}>
                <Text style={styles.icon}>{creature.icon}</Text>
              </View>
            ) : (
              <View style={styles.iconContainerUndiscovered}>
                <Text style={styles.iconUndiscovered}>❓</Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeIcon}>{discovered ? typeIcon : '?'}</Text>
            </View>
          </View>

          {/* Info section */}
          <View style={styles.infoSection}>
            {discovered ? (
              <>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: rarityColor }]}>{creature.name}</Text>
                  <Text style={styles.level}>Lv.{creature.stats.level}</Text>
                </View>

                {creature.title && <Text style={styles.title}>{creature.title}</Text>}

                <Text style={styles.description} numberOfLines={2}>
                  {creature.description}
                </Text>

                {/* Quick stats */}
                <View style={styles.quickStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statIcon}>❤️</Text>
                    <Text style={styles.statValue}>{creature.stats.hp}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statIcon}>⚔️</Text>
                    <Text style={styles.statValue}>{creature.stats.attack}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statIcon}>🛡️</Text>
                    <Text style={styles.statValue}>{creature.stats.defense}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.undiscoveredName}>???</Text>
                <Text style={styles.undiscoveredHint}>
                  Encounter this creature to discover its secrets
                </Text>
              </>
            )}
          </View>

          {/* Defeated counter */}
          {discovered && timesDefeated > 0 && (
            <View style={styles.defeatedBadge}>
              <Text style={styles.defeatedIcon}>💀</Text>
              <Text style={styles.defeatedCount}>{timesDefeated}</Text>
            </View>
          )}
        </View>

        {/* Rarity label */}
        <View style={[styles.rarityLabel, { backgroundColor: `${rarityColor}30` }]}>
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {discovered ? creature.rarity.toUpperCase() : 'UNKNOWN'}
          </Text>
        </View>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradient: {
    padding: 12,
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconSection: {
    marginRight: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerUndiscovered: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(100,100,100,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  iconUndiscovered: {
    fontSize: 28,
    opacity: 0.5,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 12,
  },
  infoSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  level: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  title: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  description: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    marginBottom: 8,
    lineHeight: 16,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 12,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  defeatedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  defeatedIcon: {
    fontSize: 12,
  },
  defeatedCount: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  undiscoveredName: {
    color: COLORS.textDim,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    marginBottom: 4,
  },
  undiscoveredHint: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  rarityLabel: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
    textTransform: 'uppercase',
  },
  // Compact styles
  compactContainer: {
    width: 80,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compactGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  compactIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  compactName: {
    fontSize: 10,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  undiscoveredText: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: FONTS.body,
    opacity: 0.5,
  },
});

export default CreatureCard;
