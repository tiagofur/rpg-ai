import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '../hooks/useCharacter';
import { useSubscription } from '../hooks/useSubscription';
import { COLORS, FONTS } from '../theme';

interface CharacterSheetScreenProps {
  characterId: string;
  onClose: () => void;
}

import { Item } from '../types';

interface EquipmentSlotProps {
  slot: string;
  item?: Item;
}

function EquipmentSlot({ slot, item }: EquipmentSlotProps) {
  return (
    <View style={styles.slotContainer}>
      <View style={[styles.slotBox, item ? styles.slotFilled : styles.slotEmpty]}>
        <Text style={styles.slotIcon}>{getSlotIcon(slot)}</Text>
      </View>
      <Text style={styles.slotLabel}>{slot.toUpperCase()}</Text>
      <Text style={styles.slotItemName} numberOfLines={1}>
        {item ? item.name : '-'}
      </Text>
    </View>
  );
}

function getSlotIcon(slot: string): string {
  switch (slot) {
    case 'helmet':
      return '🪖';
    case 'armor':
      return '👕';
    case 'gloves':
      return '🧤';
    case 'boots':
      return '👢';
    case 'weapon':
      return '⚔️';
    case 'shield':
      return '🛡️';
    case 'amulet':
      return '📿';
    case 'ring1':
    case 'ring2':
      return '💍';
    default:
      return '📦';
  }
}

export function CharacterSheetScreen({ characterId, onClose }: CharacterSheetScreenProps) {
  const { t } = useTranslation();
  const { data: character, isLoading, isError } = useCharacter(characterId);
  const { subscription, config } = useSubscription();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !character) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPlanId = subscription.data?.planId || 'free';
  const isPremium = currentPlanId !== 'free';
  const currentPlan = config.data?.availablePlans.find((p) => p.id === currentPlanId);

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('game.character')}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.nameContainer}>
            <Text style={styles.characterName}>{character.name}</Text>
            {isPremium && (
              <LinearGradient
                colors={[COLORS.primary, '#ffd700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBadge}
              >
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.characterClass}>
            {t('character.level')} {character.level} {character.class}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <LinearGradient
            colors={['rgba(255, 77, 77, 0.2)', 'rgba(255, 77, 77, 0.05)']}
            style={styles.statBox}
          >
            <Text style={[styles.statLabel, { color: COLORS.hp }]}>HP</Text>
            <Text style={styles.statValue}>
              {character.health?.current}/{character.health?.maximum}
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={['rgba(77, 121, 255, 0.2)', 'rgba(77, 121, 255, 0.05)']}
            style={styles.statBox}
          >
            <Text style={[styles.statLabel, { color: COLORS.mp }]}>MP</Text>
            <Text style={styles.statValue}>
              {character.mana?.current}/{character.mana?.maximum}
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={['rgba(179, 102, 255, 0.2)', 'rgba(179, 102, 255, 0.05)']}
            style={styles.statBox}
          >
            <Text style={[styles.statLabel, { color: COLORS.xp }]}>XP</Text>
            <Text style={styles.statValue}>{character.experience}</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('character.attributes')}</Text>
          <View style={styles.attributesGrid}>
            {Object.entries(character.attributes || {}).map(([key, value]) => (
              <View key={key} style={styles.attributeRow}>
                <Text style={styles.attributeName}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.attributeValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('character.equipment')}</Text>
          <View style={styles.paperDollContainer}>
            {/* Left Column: Weapon, Shield, Gloves */}
            <View style={styles.paperDollColumn}>
              <EquipmentSlot slot='weapon' item={character.equipment?.weapon} />
              <EquipmentSlot slot='shield' item={character.equipment?.shield} />
              <EquipmentSlot slot='gloves' item={character.equipment?.gloves} />
            </View>

            {/* Center Column: Helmet, Armor, Boots */}
            <View style={styles.paperDollCenter}>
              <EquipmentSlot slot='helmet' item={character.equipment?.helmet} />
              <View style={styles.characterSilhouette}>
                <Text style={styles.silhouetteText}>👤</Text>
              </View>
              <EquipmentSlot slot='armor' item={character.equipment?.armor} />
              <EquipmentSlot slot='boots' item={character.equipment?.boots} />
            </View>

            {/* Right Column: Amulet, Ring1, Ring2 */}
            <View style={styles.paperDollColumn}>
              <EquipmentSlot slot='amulet' item={character.equipment?.amulet} />
              <EquipmentSlot slot='ring1' item={character.equipment?.ring1} />
              <EquipmentSlot slot='ring2' item={character.equipment?.ring2} />
            </View>
          </View>
        </View>

        {isPremium && currentPlan && (
          <LinearGradient
            colors={['rgba(247, 207, 70, 0.1)', 'rgba(247, 207, 70, 0.02)']}
            style={[styles.section, styles.premiumSection]}
          >
            <Text style={styles.sectionTitle}>{t('character.premiumFeatures')}</Text>
            <Text style={styles.planName}>
              {t('character.activePlan')}: {currentPlan.name}
            </Text>
            <View style={styles.featuresList}>
              {currentPlan.features.map((feature, index) => (
                <Text key={index} style={styles.featureItem}>
                  • {feature}
                </Text>
              ))}
            </View>
          </LinearGradient>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontFamily: FONTS.title,
    color: COLORS.text,
    fontSize: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.body,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  premiumSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(247, 207, 70, 0.3)',
  },
  characterName: {
    fontFamily: FONTS.title,
    color: COLORS.primary,
    fontSize: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(247, 207, 70, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontFamily: FONTS.bodyBold,
    color: '#050510',
    fontSize: 10,
  },
  characterClass: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.title,
    color: COLORS.text,
    fontSize: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    color: COLORS.primary,
    fontSize: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 207, 70, 0.3)',
    paddingBottom: 8,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attributeRow: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attributeName: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  attributeValue: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  equipmentSlot: {
    fontFamily: FONTS.body,
    color: COLORS.textDim,
  },
  equipmentName: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  paperDollContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paperDollColumn: {
    flex: 1,
    gap: 16,
    alignItems: 'center',
  },
  paperDollCenter: {
    flex: 1.2,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterSilhouette: {
    width: 80,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  silhouetteText: {
    fontSize: 40,
    opacity: 0.5,
  },
  slotContainer: {
    alignItems: 'center',
    width: '100%',
  },
  slotBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 4,
  },
  slotFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
  },
  slotEmpty: {
    borderStyle: 'dashed',
  },
  slotIcon: {
    fontSize: 24,
  },
  slotLabel: {
    fontSize: 8,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    marginBottom: 2,
  },
  slotItemName: {
    fontSize: 10,
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
    maxWidth: '100%',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONTS.body,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#050510',
    fontWeight: 'bold',
    fontFamily: FONTS.bodyBold,
  },
  planName: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    marginBottom: 8,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    color: COLORS.textDim,
    fontSize: 14,
    marginBottom: 4,
    fontFamily: FONTS.body,
  },
});
