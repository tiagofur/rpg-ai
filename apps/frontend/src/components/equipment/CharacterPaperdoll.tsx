import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { EquipmentSlot } from './EquipmentSlot';
import {
  EquipmentSlotType,
  IEquipmentState,
  IEquippedItem,
  calculateEquipmentStats,
} from '../../types/equipment';

interface CharacterPaperdollProps {
  equipment: IEquipmentState;
  characterName?: string;
  characterClass?: string;
  onSlotPress: (slotType: EquipmentSlotType, item?: IEquippedItem) => void;
  disabled?: boolean;
}

export function CharacterPaperdoll({
  equipment,
  characterName = 'Hero',
  characterClass = 'Adventurer',
  onSlotPress,
  disabled = false,
}: CharacterPaperdollProps) {
  const { t } = useTranslation();
  const stats = calculateEquipmentStats(equipment);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <LinearGradient
        colors={['rgba(30,30,50,0.95)', 'rgba(20,20,35,0.98)']}
        style={styles.gradient}
      >
        {/* Character Info Header */}
        <Animated.View entering={SlideInUp.delay(100)} style={styles.header}>
          <Text style={styles.characterName}>{characterName}</Text>
          <Text style={styles.characterClass}>{characterClass}</Text>
        </Animated.View>

        {/* Paperdoll Layout */}
        <View style={styles.paperdollContainer}>
          {/* Top Row: Helmet */}
          <View style={styles.row}>
            <EquipmentSlot
              slotType='helmet'
              item={equipment.helmet}
              onPress={onSlotPress}
              size='medium'
              disabled={disabled}
            />
          </View>

          {/* Second Row: Ring - Amulet - Ring */}
          <View style={styles.row}>
            <EquipmentSlot
              slotType='ring1'
              item={equipment.ring1}
              onPress={onSlotPress}
              size='small'
              disabled={disabled}
            />
            <View style={styles.connector}>
              <Text style={styles.connectorLine}>│</Text>
            </View>
            <EquipmentSlot
              slotType='amulet'
              item={equipment.amulet}
              onPress={onSlotPress}
              size='small'
              disabled={disabled}
            />
            <View style={styles.connector}>
              <Text style={styles.connectorLine}>│</Text>
            </View>
            <EquipmentSlot
              slotType='ring2'
              item={equipment.ring2}
              onPress={onSlotPress}
              size='small'
              disabled={disabled}
            />
          </View>

          {/* Third Row: Armor (Main body) */}
          <View style={styles.row}>
            <EquipmentSlot
              slotType='armor'
              item={equipment.armor}
              onPress={onSlotPress}
              size='large'
              disabled={disabled}
            />
          </View>

          {/* Fourth Row: Gloves - Body Space - Weapon */}
          <View style={styles.row}>
            <EquipmentSlot
              slotType='gloves'
              item={equipment.gloves}
              onPress={onSlotPress}
              size='medium'
              disabled={disabled}
            />
            <View style={styles.bodySpace}>
              <Text style={styles.bodyIcon}>👤</Text>
            </View>
            <EquipmentSlot
              slotType='weapon'
              item={equipment.weapon}
              onPress={onSlotPress}
              size='medium'
              disabled={disabled}
            />
          </View>

          {/* Fifth Row: Boots - Shield */}
          <View style={styles.row}>
            <EquipmentSlot
              slotType='boots'
              item={equipment.boots}
              onPress={onSlotPress}
              size='medium'
              disabled={disabled}
            />
            <View style={styles.spacer} />
            <EquipmentSlot
              slotType='shield'
              item={equipment.shield}
              onPress={onSlotPress}
              size='medium'
              disabled={disabled}
            />
          </View>
        </View>

        {/* Stats Summary */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.statsContainer}>
          <Text style={styles.statsTitle}>{t('equipment.statsWithGear')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('equipment.attack')}</Text>
              <Text style={styles.statValue}>
                {stats.bonusAttack > 0 && (
                  <Text style={styles.bonusText}>+{stats.bonusAttack}</Text>
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('equipment.defense')}</Text>
              <Text style={styles.statValue}>
                {stats.bonusDefense > 0 && (
                  <Text style={styles.bonusText}>+{stats.bonusDefense}</Text>
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('equipment.health')}</Text>
              <Text style={styles.statValue}>
                {stats.bonusHealth > 0 && (
                  <Text style={styles.bonusText}>+{stats.bonusHealth}</Text>
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('equipment.mana')}</Text>
              <Text style={styles.statValue}>
                {stats.bonusMana > 0 && <Text style={styles.bonusText}>+{stats.bonusMana}</Text>}
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(247,207,70,0.3)',
  },
  gradient: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
  },
  characterName: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: FONTS.title,
    textShadowColor: COLORS.primary,
    textShadowRadius: 4,
  },
  characterClass: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  paperdollContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  connector: {
    marginHorizontal: 4,
  },
  connectorLine: {
    color: '#444',
    fontSize: 12,
  },
  bodySpace: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  bodyIcon: {
    fontSize: 40,
    opacity: 0.3,
  },
  spacer: {
    width: 60,
    marginHorizontal: 16,
  },
  statsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  bonusText: {
    color: '#4CAF50',
    fontFamily: FONTS.bodyBold,
  },
});
