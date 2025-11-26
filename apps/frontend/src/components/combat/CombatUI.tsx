/**
 * CombatUI - Main combat interface component
 * Integrates TurnOrderDisplay, EnemyStatusPanel, and CombatActions
 */

import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { TurnOrderDisplay } from './TurnOrderDisplay';
import { EnemyStatusPanel } from './EnemyStatusPanel';
import { CombatActions } from './CombatActions';
import { VictoryScreen } from './VictoryScreen';
import type { ICombatUIState, ICombatResult, CombatActionType } from '../../types/combat';

interface CombatUIProps {
  combatState: ICombatUIState;
  combatResult: ICombatResult | null;
  onAction: (action: CombatActionType, targetId?: string) => void;
  onCombatEnd: () => void;
  disabled?: boolean;
  // Player XP info for victory screen
  playerXp?: number;
  playerXpToNext?: number;
  playerLevel?: number;
}

export function CombatUI({
  combatState,
  combatResult,
  onAction,
  onCombatEnd,
  disabled = false,
  playerXp = 0,
  playerXpToNext = 1000,
  playerLevel = 1,
}: CombatUIProps) {
  const {
    round,
    phase,
    isPlayerTurn,
    player,
    enemies,
    turnOrder,
    currentTurnId,
    availableActions,
  } = combatState;

  const isCombatOver = phase === 'VICTORY' || phase === 'DEFEAT' || phase === 'FLED';

  // Show victory/defeat screen if combat ended
  if (isCombatOver && combatResult) {
    return (
      <VictoryScreen
        visible={true}
        result={combatResult}
        onContinue={onCombatEnd}
        currentXp={playerXp}
        xpToNextLevel={playerXpToNext}
        currentLevel={playerLevel}
      />
    );
  }

  return (
    <Animated.View entering={SlideInUp.duration(400)} style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.95)', 'rgba(10, 10, 26, 0.98)']}
        style={styles.gradient}
      >
        {/* Turn Order Display */}
        <TurnOrderDisplay turnOrder={turnOrder} currentTurnId={currentTurnId} round={round} />

        {/* Enemy Status Panel */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.enemySection}>
          <EnemyStatusPanel enemies={enemies} currentTurnId={currentTurnId} />
        </Animated.View>

        {/* Player Status (Brief) */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.playerStatus}>
          <View style={styles.playerInfo}>
            <View style={styles.playerBar}>
              <View style={styles.barLabel}>
                <View style={[styles.barIcon, { backgroundColor: theme.colors.hp }]} />
                <LinearGradient
                  colors={['#ff4d4d', '#cc0000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${player.hpPercent}%` }]}
                />
              </View>
            </View>
            <View style={styles.playerBar}>
              <View style={styles.barLabel}>
                <View style={[styles.barIcon, { backgroundColor: theme.colors.stamina }]} />
                <LinearGradient
                  colors={['#4caf50', '#2e7d32']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${player.staminaPercent}%` }]}
                />
              </View>
            </View>
            <View style={styles.playerBar}>
              <View style={styles.barLabel}>
                <View style={[styles.barIcon, { backgroundColor: theme.colors.mp }]} />
                <LinearGradient
                  colors={['#4d79ff', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${player.manaPercent}%` }]}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Combat Actions */}
        <CombatActions
          availableActions={availableActions}
          onAction={onAction}
          enemies={enemies}
          disabled={disabled}
          isPlayerTurn={isPlayerTurn}
          playerStamina={player.currentStamina}
          playerMana={player.currentMana}
        />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.gold,
  },
  gradient: {
    flex: 1,
  },
  enemySection: {
    maxHeight: 250,
  },
  playerStatus: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playerInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  playerBar: {
    flex: 1,
  },
  barLabel: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  barIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 2,
    zIndex: 1,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

// Export all combat components for individual use
export { TurnOrderDisplay } from './TurnOrderDisplay';
export { EnemyStatusPanel } from './EnemyStatusPanel';
export { CombatActions } from './CombatActions';
export { VictoryScreen } from './VictoryScreen';
