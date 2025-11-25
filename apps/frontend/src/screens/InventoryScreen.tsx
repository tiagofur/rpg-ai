import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '../hooks/useCharacter';
import { Item } from '../types';
import { COLORS, FONTS } from '../theme';

interface InventoryScreenProps {
  characterId: string;
  onClose: () => void;
}

export function InventoryScreen({ characterId, onClose }: InventoryScreenProps) {
  const { t } = useTranslation();
  const { data: character, isLoading, isError } = useCharacter(characterId);

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

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity style={[styles.gridItem, { borderColor: getRarityColor(item.rarity) }]}>
      <View style={styles.itemIconContainer}>
        <Text style={styles.itemIcon}>{getItemIcon(item.type)}</Text>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
      </View>
      <Text style={[styles.itemName, { color: getRarityColor(item.rarity) }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.itemValue}>{item.value}g</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('game.inventory')}</Text>
        <View style={styles.goldContainer}>
          <Text style={styles.goldText}>💰 {character.inventory?.gold || 0}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={character.inventory?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContent}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('inventory.empty')}</Text>}
      />
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
      return '🪵';
    default:
      return '📦';
  }
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common':
      return '#f5f5f5';
    case 'uncommon':
      return '#1eff00';
    case 'rare':
      return '#0070dd';
    case 'epic':
      return '#a335ee';
    case 'legendary':
      return '#ff8000';
    default:
      return '#f5f5f5';
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.title,
  },
  goldContainer: {
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  goldText: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.body,
  },
  gridContent: {
    padding: 16,
  },
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
    aspectRatio: 0.8,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  itemIcon: {
    fontSize: 24,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 4,
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
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemValue: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  emptyText: {
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 32,
    fontFamily: FONTS.body,
  },
  errorText: {
    color: '#ff8080',
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
    fontFamily: FONTS.bodyBold,
  },
});
