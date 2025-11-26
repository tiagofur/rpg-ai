/**
 * EnemyStatusPanel - Shows enemy HP, intentions, and status effects
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import type { ICombatantUI } from '../../types/combat';

interface EnemyStatusPanelProps {
  enemies: ICombatantUI[];
  currentTurnId: string;
}

export function EnemyStatusPanel({ enemies, currentTurnId }: EnemyStatusPanelProps) {
  if (enemies.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <Text style={styles.sectionTitle}>ENEMIGOS</Text>
      <View style={styles.enemyList}>
        {enemies.map((enemy, index) => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            isActive={enemy.id === currentTurnId}
            index={index}
          />
        ))}
      </View>
    </Animated.View>
  );
}

interface EnemyCardProps {
  enemy: ICombatantUI;
  isActive: boolean;
  index: number;
}

function EnemyCard({ enemy, isActive, index }: EnemyCardProps) {
  const { name, level, currentHp, maxHp, hpPercent, statusEffects, isDefending, intention } = enemy;

  // Determine HP bar color based on percentage
  const getHpColors = (): [string, string] => {
    if (hpPercent > 50) return ['#4caf50', '#2e7d32'];
    if (hpPercent > 25) return ['#ff9800', '#f57c00'];
    return ['#ef4444', '#c62828'];
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100).duration(300)}
      style={[styles.enemyCard, isActive && styles.activeCard]}
    >
      {isActive && (
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.2)', 'transparent']}
          style={styles.activeGlow}
        />
      )}

      {/* Header with name and level */}
      <View style={styles.enemyHeader}>
        <View style={styles.enemyInfo}>
          <Text style={styles.enemyIcon}>👹</Text>
          <Text style={[styles.enemyName, isActive && styles.activeName]}>{name}</Text>
        </View>
        <Text style={styles.enemyLevel}>Nv. {level}</Text>
      </View>

      {/* HP Bar */}
      <View style={styles.hpContainer}>
        <View style={styles.hpBarBackground}>
          <LinearGradient
            colors={getHpColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.hpBarFill, { width: `${Math.max(hpPercent, 0)}%` }]}
          />
        </View>
        <Text style={styles.hpText}>
          {currentHp}/{maxHp}
        </Text>
      </View>

      {/* Status Effects */}
      {statusEffects.length > 0 && (
        <View style={styles.statusEffects}>
          {statusEffects.map((effect, i) => (
            <Animated.View
              key={`${effect.name}-${i}`}
              entering={FadeIn.delay(i * 50)}
              style={styles.statusEffect}
            >
              <Text style={styles.statusIcon}>{effect.icon}</Text>
              <Text style={styles.statusDuration}>{effect.duration}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Defending indicator */}
      {isDefending && (
        <View style={styles.defendingBadge}>
          <Text style={styles.defendingText}>🛡️ Defendiendo</Text>
        </View>
      )}

      {/* Enemy Intention */}
      {intention && (
        <View style={styles.intentionContainer}>
          <Text style={styles.intentionIcon}>{intention.icon}</Text>
          <Text style={styles.intentionText}>{intention.description}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontFamily: theme.fonts.title,
    fontSize: 11,
    color: theme.colors.danger,
    letterSpacing: 2,
    marginBottom: 8,
  },
  enemyList: {
    gap: 8,
  },
  enemyCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  activeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  enemyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enemyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enemyIcon: {
    fontSize: 18,
  },
  enemyName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  activeName: {
    color: theme.colors.danger,
  },
  enemyLevel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.text,
    minWidth: 50,
    textAlign: 'right',
  },
  statusEffects: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  statusEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusDuration: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  defendingBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  defendingText: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.info,
  },
  intentionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  intentionIcon: {
    fontSize: 14,
  },
  intentionText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
});
