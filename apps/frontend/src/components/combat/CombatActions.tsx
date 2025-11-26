/**
 * CombatActions - Combat action buttons (Attack, Defend, Magic, Items, Flee)
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import type { CombatActionType, ICombatantUI } from '../../types/combat';

interface CombatActionsProps {
  availableActions: CombatActionType[];
  onAction: (action: CombatActionType, targetId?: string) => void;
  enemies: ICombatantUI[];
  disabled?: boolean;
  isPlayerTurn: boolean;
  playerStamina: number;
  playerMana: number;
}

interface ActionConfig {
  type: CombatActionType;
  icon: string;
  label: string;
  color: [string, string];
  requiresTarget?: boolean;
  staminaCost?: number;
  manaCost?: number;
}

const ACTIONS: ActionConfig[] = [
  {
    type: 'ATTACK',
    icon: '⚔️',
    label: 'combat.attack',
    color: ['#ef4444', '#b91c1c'],
    requiresTarget: true,
    staminaCost: 10,
  },
  { type: 'DEFEND', icon: '🛡️', label: 'combat.defend', color: ['#3b82f6', '#1d4ed8'] },
  { type: 'SKILL', icon: '✨', label: 'combat.magic', color: ['#a855f7', '#7e22ce'], manaCost: 15 },
  { type: 'ITEM', icon: '🎒', label: 'combat.items', color: ['#22c55e', '#15803d'] },
  { type: 'FLEE', icon: '🏃', label: 'combat.flee', color: ['#f59e0b', '#d97706'] },
];

export function CombatActions({
  availableActions,
  onAction,
  enemies,
  disabled = false,
  isPlayerTurn,
  playerStamina,
  playerMana,
}: CombatActionsProps) {
  const { t } = useTranslation();

  const handleActionPress = (action: ActionConfig) => {
    if (disabled || !isPlayerTurn) return;

    // Check resource costs
    if (action.staminaCost && playerStamina < action.staminaCost) return;
    if (action.manaCost && playerMana < action.manaCost) return;

    if (action.requiresTarget && enemies.length > 0) {
      // For now, auto-target first alive enemy
      const target = enemies.find((e) => e.currentHp > 0);
      if (target) {
        onAction(action.type, target.id);
      }
    } else {
      onAction(action.type);
    }
  };

  const isActionAvailable = (actionType: CombatActionType) => availableActions.includes(actionType);

  const canAfford = (action: ActionConfig) => {
    if (action.staminaCost && playerStamina < action.staminaCost) return false;
    if (action.manaCost && playerMana < action.manaCost) return false;
    return true;
  };

  if (!isPlayerTurn) {
    return (
      <Animated.View entering={FadeInUp.duration(200)} style={styles.waitingContainer}>
        <Text style={styles.waitingText}>⏳ {t('combat.enemyTurn', 'Turno del enemigo...')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.container}>
      <Text style={styles.turnIndicator}>
        ► {t('combat.yourTurn', 'TU TURNO')} - {t('combat.chooseAction', 'Elige una acción')}
      </Text>
      <View style={styles.actionsGrid}>
        {ACTIONS.map((action, index) => {
          const available = isActionAvailable(action.type);
          const affordable = canAfford(action);
          const isDisabled = disabled || !available || !affordable;

          return (
            <ActionButton
              key={action.type}
              action={action}
              onPress={() => handleActionPress(action)}
              disabled={isDisabled}
              index={index}
              t={t}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

interface ActionButtonProps {
  action: ActionConfig;
  onPress: () => void;
  disabled: boolean;
  index: number;
  t: ReturnType<typeof useTranslation>['t'];
}

function ActionButton({ action, onPress, disabled, index, t }: ActionButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(disabled ? 0.95 : 1) }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(200)}
      style={[styles.actionButtonWrapper, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.actionTouchable}
      >
        <LinearGradient
          colors={disabled ? ['#4a4a4a', '#2a2a2a'] : action.color}
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>{action.icon}</Text>
          <Text style={styles.actionLabel}>{t(action.label, action.type)}</Text>
          {action.staminaCost && <Text style={styles.costText}>⚡{action.staminaCost}</Text>}
          {action.manaCost && <Text style={styles.costText}>💧{action.manaCost}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  turnIndicator: {
    fontFamily: theme.fonts.title,
    fontSize: 12,
    color: theme.colors.gold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonWrapper: {
    minWidth: '18%',
    maxWidth: 80,
  },
  actionTouchable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: theme.colors.text,
    textAlign: 'center',
  },
  costText: {
    fontFamily: theme.fonts.body,
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  waitingContainer: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  waitingText: {
    fontFamily: theme.fonts.title,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
