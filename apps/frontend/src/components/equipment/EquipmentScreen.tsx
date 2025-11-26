import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

import { COLORS, FONTS } from '../../theme';
import { CharacterPaperdoll } from './CharacterPaperdoll';
import {
  EquipmentSlotType,
  IEquipmentState,
  IEquippedItem,
  getRarityColor,
  EQUIPMENT_SLOTS,
} from '../../types/equipment';
import { Item } from '../../types';
import { useCharacter } from '../../hooks/useCharacter';
import { useGameSession } from '../../hooks/useGameSession';
import { useGameEffects } from '../../hooks/useGameEffects';

interface EquipmentScreenProps {
  sessionId: string;
  characterId: string;
  onClose: () => void;
}

type TabType = 'equipment' | 'inventory';

export function EquipmentScreen({ sessionId, characterId, onClose }: EquipmentScreenProps) {
  const { t } = useTranslation();
  const { data: character, isLoading, refetch, isRefetching } = useCharacter(characterId);
  const { executeCommand } = useGameSession(sessionId);
  const { playHaptic } = useGameEffects();

  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Convert character equipment to our format
  const equipment: IEquipmentState = useMemo(() => {
    if (!character?.equipment) return {};

    const convertItem = (item?: Item): IEquippedItem | undefined => {
      if (!item) return undefined;
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        description: item.description,
        value: item.value,
        stats: {
          attack: Math.floor(item.value / 10), // Placeholder stat calculation
          defense: Math.floor(item.value / 15),
        },
      };
    };

    return {
      helmet: convertItem(character.equipment.helmet),
      armor: convertItem(character.equipment.armor),
      gloves: convertItem(character.equipment.gloves),
      boots: convertItem(character.equipment.boots),
      weapon: convertItem(character.equipment.weapon),
      shield: convertItem(character.equipment.shield),
      amulet: convertItem(character.equipment.amulet),
      ring1: convertItem(character.equipment.ring1),
      ring2: convertItem(character.equipment.ring2),
    };
  }, [character?.equipment]);

  // Filter equippable items for selected slot
  const equippableItems = useMemo(() => {
    if (!character?.inventory?.items || !selectedSlot) return [];

    const slotTypeMap: Record<EquipmentSlotType, string[]> = {
      helmet: ['helmet', 'head'],
      armor: ['armor', 'chest'],
      gloves: ['gloves', 'hands'],
      boots: ['boots', 'feet'],
      weapon: ['weapon', 'sword', 'axe', 'staff', 'bow', 'dagger'],
      shield: ['shield'],
      amulet: ['amulet', 'necklace'],
      ring1: ['ring'],
      ring2: ['ring'],
    };

    const validTypes = slotTypeMap[selectedSlot] || [];

    return character.inventory.items.filter((item) =>
      validTypes.some((validType) => item.type.toLowerCase().includes(validType.toLowerCase()))
    );
  }, [character?.inventory?.items, selectedSlot]);

  const handleSlotPress = (slotType: EquipmentSlotType, item?: IEquippedItem) => {
    playHaptic('light');
    setSelectedSlot(slotType);

    if (item) {
      // Show equipped item details with unequip option
      setSelectedItem({
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        description: item.description || '',
        value: item.value,
        quantity: 1,
      });
    } else {
      setSelectedItem(null);
    }
  };

  const handleEquipItem = (item: Item) => {
    if (!selectedSlot) return;

    playHaptic('medium');

    executeCommand.mutate({
      type: 'equip',
      parameters: {
        itemId: item.id,
        slot: selectedSlot,
      },
    });

    setSelectedSlot(null);
    setSelectedItem(null);
  };

  const handleUnequipItem = () => {
    if (!selectedSlot || !selectedItem) return;

    playHaptic('medium');

    executeCommand.mutate({
      type: 'custom',
      parameters: { input: `unequip ${selectedItem.name}` },
    });

    setSelectedSlot(null);
    setSelectedItem(null);
  };

  const handleInventoryItemPress = (item: Item) => {
    playHaptic('light');
    setSelectedItem(item);
  };

  if (isLoading || !character) {
    return (
      <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('equipment.title')}</Text>
        <View style={styles.goldContainer}>
          <Text style={styles.goldText}>💰 {character.inventory?.gold || 0}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
          onPress={() => {
            playHaptic('light');
            setActiveTab('equipment');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.tabTextActive]}>
            {t('equipment.gear')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
          onPress={() => {
            playHaptic('light');
            setActiveTab('inventory');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
            {t('game.inventory')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {activeTab === 'equipment' ? (
          <CharacterPaperdoll
            equipment={equipment}
            characterName={character.name}
            characterClass={character.class}
            onSlotPress={handleSlotPress}
          />
        ) : (
          <InventoryGrid
            items={character.inventory?.items || []}
            onItemPress={handleInventoryItemPress}
          />
        )}
      </ScrollView>

      {/* Slot Selection Modal (for selecting an item to equip) */}
      <Modal
        visible={!!selectedSlot && !selectedItem}
        transparent
        animationType='fade'
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedSlot(null)} />

          <Animated.View entering={FadeIn.springify()} style={styles.slotModal}>
            <LinearGradient colors={[COLORS.secondary, '#1a1a2e']} style={styles.slotModalGradient}>
              <Text style={styles.slotModalTitle}>
                {t('equipment.selectFor')}{' '}
                {EQUIPMENT_SLOTS.find((s) => s.type === selectedSlot)?.label}
              </Text>

              {equippableItems.length > 0 ? (
                <FlatList
                  data={equippableItems}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <Animated.View entering={SlideInRight.delay(index * 50)}>
                      <TouchableOpacity
                        style={[styles.equipItemRow, { borderColor: getRarityColor(item.rarity) }]}
                        onPress={() => handleEquipItem(item)}
                      >
                        <Text style={styles.equipItemIcon}>{getItemIcon(item.type)}</Text>
                        <View style={styles.equipItemInfo}>
                          <Text
                            style={[styles.equipItemName, { color: getRarityColor(item.rarity) }]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.equipItemType}>
                            {item.type} • {item.rarity}
                          </Text>
                        </View>
                        <Text style={styles.equipButton}>{t('equipment.equip')}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                  style={styles.equipItemList}
                />
              ) : (
                <View style={styles.emptyEquipList}>
                  <Text style={styles.emptyText}>{t('equipment.noItems')}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedSlot(null)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Item Detail Modal (for equipped/selected items) */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType='fade'
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedItem(null)} />

          {selectedItem && (
            <Animated.View entering={FadeIn.springify()} style={styles.detailCard}>
              <LinearGradient colors={[COLORS.secondary, '#1a1a2e']} style={styles.detailGradient}>
                <View
                  style={[
                    styles.detailHeader,
                    { borderBottomColor: getRarityColor(selectedItem.rarity) },
                  ]}
                >
                  <Text
                    style={[styles.detailTitle, { color: getRarityColor(selectedItem.rarity) }]}
                  >
                    {selectedItem.name}
                  </Text>
                  <Text style={styles.detailType}>
                    {selectedItem.type} • {selectedItem.rarity}
                  </Text>
                </View>

                <View style={styles.detailBody}>
                  <View style={styles.largeIconContainer}>
                    <Text style={styles.largeIcon}>{getItemIcon(selectedItem.type)}</Text>
                  </View>
                  <Text style={styles.detailDescription}>
                    {selectedItem.description || t('equipment.unknownItem')}
                  </Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>{t('equipment.value')}</Text>
                    <Text style={styles.statValue}>
                      {selectedItem.value} {t('equipment.gold')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  {selectedSlot && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.unequipButton]}
                      onPress={handleUnequipItem}
                    >
                      <Text style={styles.actionButtonText}>{t('equipment.unequip')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeActionButton]}
                    onPress={() => {
                      setSelectedItem(null);
                      setSelectedSlot(null);
                    }}
                  >
                    <Text style={styles.actionButtonText}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Subcomponent: Inventory Grid
function InventoryGrid({
  items,
  onItemPress,
}: {
  items: Item[];
  onItemPress: (item: Item) => void;
}) {
  const { t } = useTranslation();
  const { playHaptic } = useGameEffects();

  if (items.length === 0) {
    return (
      <View style={styles.emptyInventory}>
        <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inventoryGrid}>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(index * 30).springify()}
          style={styles.gridItemWrapper}
        >
          <TouchableOpacity
            style={[styles.gridItem, { borderColor: getRarityColor(item.rarity) }]}
            onPress={() => {
              playHaptic('light');
              onItemPress(item);
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
              style={styles.itemGradient}
            >
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{getItemIcon(item.type)}</Text>
                {item.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.itemName, { color: getRarityColor(item.rarity) }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

function getItemIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'weapon':
    case 'sword':
      return '⚔️';
    case 'armor':
    case 'chest':
      return '🛡️';
    case 'helmet':
    case 'head':
      return '🎩';
    case 'gloves':
    case 'hands':
      return '🧤';
    case 'boots':
    case 'feet':
      return '👢';
    case 'shield':
      return '🛡️';
    case 'amulet':
    case 'necklace':
      return '📿';
    case 'ring':
      return '💍';
    case 'potion':
      return '🧪';
    case 'scroll':
      return '📜';
    case 'material':
      return '💎';
    case 'food':
      return '🍖';
    default:
      return '📦';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.title,
    textShadowColor: COLORS.primary,
    textShadowRadius: 4,
  },
  goldContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  goldText: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  slotModal: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  slotModalGradient: {
    padding: 16,
  },
  slotModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 16,
  },
  equipItemList: {
    maxHeight: 300,
  },
  equipItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    borderWidth: 1,
  },
  equipItemIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  equipItemInfo: {
    flex: 1,
  },
  equipItemName: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  equipItemType: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  equipButton: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(247,207,70,0.2)',
    borderRadius: 4,
  },
  emptyEquipList: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  detailCard: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailGradient: {
    padding: 20,
  },
  detailHeader: {
    borderBottomWidth: 2,
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  detailType: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 4,
  },
  detailBody: {
    alignItems: 'center',
  },
  largeIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeIcon: {
    fontSize: 40,
  },
  detailDescription: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  statValue: {
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  detailActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  unequipButton: {
    backgroundColor: 'rgba(220,80,80,0.3)',
    borderWidth: 1,
    borderColor: '#dc5050',
  },
  closeActionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  emptyInventory: {
    padding: 32,
    alignItems: 'center',
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '31%',
    marginBottom: 12,
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  itemIconContainer: {
    position: 'relative',
  },
  itemIcon: {
    fontSize: 32,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  quantityText: {
    color: COLORS.text,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  itemName: {
    fontSize: 10,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 4,
  },
});
