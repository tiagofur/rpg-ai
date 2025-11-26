import { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../theme';
import { useGameEffects } from '../hooks/useGameEffects';

interface QuickAction {
  id: string;
  emoji: string;
  labelKey: string;
  command: string;
  category: 'exploration' | 'combat' | 'social' | 'utility';
  highlight?: boolean;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'look', emoji: '👁️', labelKey: 'game.quickLook', command: 'look', category: 'exploration' },
  {
    id: 'search',
    emoji: '🔍',
    labelKey: 'game.quickSearch',
    command: 'search',
    category: 'exploration',
  },
  {
    id: 'move',
    emoji: '🚶',
    labelKey: 'game.quickMove',
    command: 'move forward',
    category: 'exploration',
  },
  {
    id: 'attack',
    emoji: '⚔️',
    labelKey: 'game.quickAttack',
    command: 'attack',
    category: 'combat',
    highlight: true,
  },
  {
    id: 'defend',
    emoji: '🛡️',
    labelKey: 'game.quickDefend',
    command: 'defend',
    category: 'combat',
  },
  { id: 'talk', emoji: '💬', labelKey: 'game.quickTalk', command: 'talk', category: 'social' },
  { id: 'rest', emoji: '💤', labelKey: 'game.quickRest', command: 'rest', category: 'utility' },
  {
    id: 'inventory',
    emoji: '🎒',
    labelKey: 'game.quickBag',
    command: '__inventory__',
    category: 'utility',
  },
  {
    id: 'character',
    emoji: '👤',
    labelKey: 'game.quickHero',
    command: '__character__',
    category: 'utility',
  },
];

interface QuickActionsBarProps {
  onAction: (command: string) => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  inCombat?: boolean;
  disabled?: boolean;
  contextualActions?: QuickAction[];
}

export function QuickActionsBar({
  onAction,
  onOpenInventory,
  onOpenCharacter,
  inCombat = false,
  disabled = false,
  contextualActions,
}: QuickActionsBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { playButtonPress, playMenuOpen } = useGameEffects();

  // Use contextual actions if provided, otherwise default
  const actions = contextualActions || DEFAULT_ACTIONS;

  // Sort by relevance based on context
  const sortedActions = [...actions].sort((a, b) => {
    if (inCombat) {
      if (a.category === 'combat' && b.category !== 'combat') return -1;
      if (a.category !== 'combat' && b.category === 'combat') return 1;
    } else {
      if (a.category === 'exploration' && b.category !== 'exploration') return -1;
      if (a.category !== 'exploration' && b.category === 'exploration') return 1;
    }
    return 0;
  });

  const handleAction = (action: QuickAction) => {
    if (disabled) return;

    if (action.command === '__inventory__') {
      playMenuOpen();
      onOpenInventory();
    } else if (action.command === '__character__') {
      playMenuOpen();
      onOpenCharacter();
    } else {
      playButtonPress();
      onAction(action.command);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedActions.map((action, index) => (
          <QuickActionButton
            key={action.id}
            action={action}
            index={index}
            onPress={() => handleAction(action)}
            disabled={disabled}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface QuickActionButtonProps {
  action: QuickAction;
  index: number;
  onPress: () => void;
  disabled: boolean;
}

function QuickActionButton({ action, index, onPress, disabled }: QuickActionButtonProps) {
  const { t } = useTranslation();
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (action.highlight) {
      pulseValue.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
    }
  }, [action.highlight, pulseValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: action.highlight ? pulseValue.value : 1 }],
  }));

  const categoryColors = {
    exploration: ['rgba(100, 149, 237, 0.2)', 'rgba(65, 105, 225, 0.1)'] as const,
    combat: ['rgba(220, 20, 60, 0.2)', 'rgba(178, 34, 34, 0.1)'] as const,
    social: ['rgba(255, 215, 0, 0.2)', 'rgba(218, 165, 32, 0.1)'] as const,
    utility: ['rgba(128, 128, 128, 0.2)', 'rgba(105, 105, 105, 0.1)'] as const,
  };

  const colors = categoryColors[action.category];

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()} style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[styles.actionButton, disabled && styles.disabledButton]}
      >
        <LinearGradient colors={colors} style={styles.actionGradient}>
          <Text style={styles.actionEmoji}>{action.emoji}</Text>
          <Text style={styles.actionLabel}>{t(action.labelKey, action.id)}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Category headers for when we want to show grouped actions
export function QuickActionCategories({
  onAction,
  onOpenInventory,
  onOpenCharacter,
  disabled = false,
}: Omit<QuickActionsBarProps, 'contextualActions' | 'inCombat'>) {
  const categories = [
    {
      key: 'exploration',
      label: '🗺️ Explore',
      actions: DEFAULT_ACTIONS.filter((a) => a.category === 'exploration'),
    },
    {
      key: 'combat',
      label: '⚔️ Combat',
      actions: DEFAULT_ACTIONS.filter((a) => a.category === 'combat'),
    },
    {
      key: 'social',
      label: '💬 Social',
      actions: DEFAULT_ACTIONS.filter((a) => a.category === 'social'),
    },
    {
      key: 'utility',
      label: '🔧 Utility',
      actions: DEFAULT_ACTIONS.filter((a) => a.category === 'utility'),
    },
  ];

  const handleAction = (command: string) => {
    if (command === '__inventory__') {
      onOpenInventory();
    } else if (command === '__character__') {
      onOpenCharacter();
    } else {
      onAction(command);
    }
  };

  return (
    <View style={styles.categoriesContainer}>
      {categories.map((category) => (
        <Animated.View
          key={category.key}
          entering={FadeIn.delay(100)}
          style={styles.categorySection}
        >
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <View style={styles.categoryActions}>
            {category.actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handleAction(action.command)}
                disabled={disabled}
                style={[styles.compactButton, disabled && styles.disabledButton]}
              >
                <Text style={styles.compactEmoji}>{action.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(247, 207, 70, 0.3)',
  },
  actionGradient: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  actionLabel: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  disabledButton: {
    opacity: 0.4,
  },

  // Categories variant
  categoriesContainer: {
    padding: 16,
    gap: 16,
  },
  categorySection: {
    gap: 8,
  },
  categoryLabel: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compactEmoji: {
    fontSize: 20,
  },
});
