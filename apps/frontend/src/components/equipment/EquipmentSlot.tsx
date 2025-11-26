import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';

import { FONTS } from '../../theme';
import {
  EquipmentSlotType,
  IEquippedItem,
  getRarityColor,
  EQUIPMENT_SLOTS,
} from '../../types/equipment';

interface EquipmentSlotProps {
  slotType: EquipmentSlotType;
  item?: IEquippedItem | undefined;
  onPress: (slotType: EquipmentSlotType, item?: IEquippedItem | undefined) => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const SIZE_MAP = {
  small: 48,
  medium: 64,
  large: 80,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function EquipmentSlot({
  slotType,
  item,
  onPress,
  size = 'medium',
  disabled = false,
}: EquipmentSlotProps) {
  const scale = useSharedValue(1);
  const slotConfig = EQUIPMENT_SLOTS.find((s) => s.type === slotType);
  const slotSize = SIZE_MAP[size];
  const isEmpty = !item;
  const rarityColor = item ? getRarityColor(item.rarity) : '#444';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;

    // Bounce animation on press
    scale.value = withSequence(withSpring(0.9, { damping: 10 }), withSpring(1, { damping: 8 }));

    onPress(slotType, item);
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={disabled}
      style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }]}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.container,
          {
            width: slotSize,
            height: slotSize,
            borderColor: rarityColor,
            borderWidth: isEmpty ? 1 : 2,
          },
        ]}
      >
        <LinearGradient
          colors={
            isEmpty
              ? ['rgba(30,30,40,0.8)', 'rgba(20,20,30,0.9)']
              : ['rgba(50,50,70,0.9)', 'rgba(30,30,50,0.95)']
          }
          style={styles.gradient}
        >
          {isEmpty ? (
            <View style={styles.emptySlot}>
              <Text style={[styles.emptyIcon, { fontSize: slotSize * 0.4 }]}>
                {slotConfig?.emptyIcon || '○'}
              </Text>
              <Text style={[styles.slotLabel, { fontSize: slotSize * 0.14 }]} numberOfLines={1}>
                {slotConfig?.label || slotType}
              </Text>
            </View>
          ) : (
            <View style={styles.filledSlot}>
              <Text style={[styles.itemIcon, { fontSize: slotSize * 0.45 }]}>
                {getItemIcon(item.type)}
              </Text>
              {item.stats?.attack && item.stats.attack > 0 && (
                <View style={[styles.statBadge, styles.attackBadge]}>
                  <Text style={styles.statText}>+{item.stats.attack}</Text>
                </View>
              )}
              {item.stats?.defense && item.stats.defense > 0 && (
                <View style={[styles.statBadge, styles.defenseBadge]}>
                  <Text style={styles.statText}>+{item.stats.defense}</Text>
                </View>
              )}
            </View>
          )}

          {/* Rarity glow effect for equipped items */}
          {!isEmpty && (
            <View
              style={[
                styles.rarityGlow,
                {
                  shadowColor: rarityColor,
                  borderColor: rarityColor,
                },
              ]}
            />
          )}
        </LinearGradient>
      </View>

      {/* Slot type indicator below */}
      {size !== 'small' && (
        <Text
          style={[styles.typeLabel, { color: isEmpty ? '#666' : rarityColor }]}
          numberOfLines={1}
        >
          {item?.name || slotConfig?.label || ''}
        </Text>
      )}
    </AnimatedTouchable>
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
    case 'staff':
      return '🪄';
    case 'bow':
      return '🏹';
    case 'axe':
      return '🪓';
    default:
      return '📦';
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    color: '#555',
    opacity: 0.6,
  },
  slotLabel: {
    color: '#555',
    fontFamily: FONTS.body,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  filledSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  itemIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statBadge: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  attackBadge: {
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,80,80,0.9)',
  },
  defenseBadge: {
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(80,150,255,0.9)',
  },
  statText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
  },
  rarityGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
});
