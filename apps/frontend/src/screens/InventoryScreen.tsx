import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useCharacter } from '../hooks/useCharacter';
import { useGameSession } from '../hooks/useGameSession';
import { useGameEffects } from '../hooks/useGameEffects';
import { Item } from '../types';
import { COLORS, FONTS } from '../theme';

interface InventoryScreenProps {
  sessionId: string;
  characterId: string;
  onClose: () => void;
}

const FILTERS = ['All', 'Weapon', 'Armor', 'Potion', 'Material'];

export function InventoryScreen({ sessionId, characterId, onClose }: InventoryScreenProps) {
  const { t } = useTranslation();
  const { data: character, isLoading, isError } = useCharacter(characterId);
  const { executeCommand } = useGameSession(sessionId);
  const { playHaptic } = useGameEffects();

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
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

  const filteredItems =
    character.inventory?.items.filter((item) => {
      if (selectedFilter === 'All') return true;
      return item.type.toLowerCase() === selectedFilter.toLowerCase();
    }) || [];

  const handleUseItem = () => {
    if (!selectedItem) return;

    playHaptic('medium');

    // Determine command based on item type
    const commandType = ['weapon', 'armor'].includes(selectedItem.type.toLowerCase())
      ? 'equip'
      : 'use_item';

    executeCommand.mutate({
      type: commandType,
      parameters: { itemId: selectedItem.id },
    });

    setSelectedItem(null);
  };

  const handleDropItem = () => {
    if (!selectedItem) return;

    playHaptic('medium');

    executeCommand.mutate({
      type: 'custom',
      parameters: { input: `drop ${selectedItem.name}` },
    });

    setSelectedItem(null);
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      style={styles.gridItemWrapper}
    >
      <TouchableOpacity
        style={[styles.gridItem, { borderColor: getRarityColor(item.rarity) }]}
        onPress={() => {
          playHaptic('light');
          setSelectedItem(item);
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
          <Text style={[styles.itemName, { color: getRarityColor(item.rarity) }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemValue}>{item.value}g</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('game.inventory')}</Text>
        <View style={styles.goldContainer}>
          <Text style={styles.goldText}>💰 {character.inventory?.gold || 0}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => {
                playHaptic('light');
                setSelectedFilter(filter);
              }}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContent}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎒</Text>
            <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
          </View>
        }
      />

      {/* Item Detail Modal */}
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
                    {selectedItem.description || 'A mysterious item with unknown properties.'}
                  </Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Value</Text>
                    <Text style={styles.statValue}>{selectedItem.value} gold</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>1.0 kg</Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.useButton]}
                    onPress={handleUseItem}
                  >
                    <Text style={styles.actionButtonText}>
                      {['weapon', 'armor'].includes(selectedItem.type.toLowerCase())
                        ? 'EQUIP'
                        : 'USE'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dropButton]}
                    onPress={handleDropItem}
                  >
                    <Text style={styles.actionButtonText}>DROP</Text>
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

function getItemIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'weapon':
      return '⚔️';
    case 'armor':
      return '🛡️';
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

function getRarityColor(rarity: string): string {
  switch (rarity?.toLowerCase()) {
    case 'common':
      return '#b0b0b0';
    case 'uncommon':
      return '#1eff00';
    case 'rare':
      return '#0070dd';
    case 'epic':
      return '#a335ee';
    case 'legendary':
      return '#ff8000';
    default:
      return '#b0b0b0';
  }
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
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  filterContainer: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  filterTextActive: {
    color: '#000',
    fontFamily: FONTS.bodyBold,
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 12,
  },
  gridItemWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 0.85,
    backgroundColor: '#1a1a2e',
  },
  itemGradient: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  itemIcon: {
    fontSize: 32,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: {
    color: COLORS.text,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  itemName: {
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
    width: '100%',
  },
  itemValue: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    opacity: 0.5,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
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
    fontFamily: FONTS.bodyBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
  },
  detailCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  detailGradient: {
    padding: 24,
  },
  detailHeader: {
    borderBottomWidth: 2,
    paddingBottom: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  detailType: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  detailBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  largeIcon: {
    fontSize: 40,
  },
  detailDescription: {
    color: COLORS.text,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  statValue: {
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButton: {
    backgroundColor: COLORS.primary,
  },
  dropButton: {
    backgroundColor: 'rgba(255, 50, 50, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 50, 50, 0.5)',
  },
  actionButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    letterSpacing: 1,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
});
