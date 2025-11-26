import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../theme';

export type NarrativeEntryType =
  | 'narration'
  | 'combat'
  | 'dialogue'
  | 'system'
  | 'command'
  | 'loot'
  | 'levelup'
  | 'death'
  | 'image';

interface NarrativeEntryProps {
  type: NarrativeEntryType;
  message: string;
  timestamp?: string | undefined;
  speaker?: string | undefined;
  damage?: number | undefined;
  isCritical?: boolean | undefined;
  isMiss?: boolean | undefined;
  imageUrl?: string | undefined;
  commandType?: string | undefined;
  index?: number | undefined;
}

export function NarrativeEntry({
  type,
  message,
  timestamp,
  speaker,
  damage,
  isCritical,
  isMiss,
  commandType,
  index = 0,
}: NarrativeEntryProps) {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : '';

  // Combat entries
  if (type === 'combat') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.entry, styles.combatEntry, isCritical && styles.criticalEntry]}
      >
        <View style={styles.entryHeader}>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeEmoji}>{isCritical ? '💥' : isMiss ? '💨' : '⚔️'}</Text>
          </View>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
        <Text
          style={[
            styles.messageText,
            styles.combatText,
            isCritical && styles.criticalText,
            isMiss && styles.missText,
          ]}
        >
          {message}
        </Text>
        {damage !== undefined && damage > 0 && (
          <View style={styles.damageContainer}>
            <Text style={[styles.damageText, isCritical && styles.criticalDamage]}>
              -{damage} HP
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }

  // Death entries
  if (type === 'death') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 30)}
        style={[styles.entry, styles.deathEntry]}
      >
        <LinearGradient
          colors={['rgba(139, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)']}
          style={styles.deathGradient}
        >
          <Text style={styles.deathEmoji}>💀</Text>
          <Text style={styles.deathText}>{message}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Level up entries
  if (type === 'levelup') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.entry, styles.levelupEntry]}
      >
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.2)', 'rgba(218, 165, 32, 0.1)']}
          style={styles.levelupGradient}
        >
          <Text style={styles.levelupEmoji}>🎉</Text>
          <Text style={styles.levelupText}>{message}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Loot entries
  if (type === 'loot') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.entry, styles.lootEntry]}
      >
        <View style={styles.entryHeader}>
          <View style={styles.typeIndicator}>
            <Text style={styles.typeEmoji}>💰</Text>
          </View>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
        <Text style={[styles.messageText, styles.lootText]}>{message}</Text>
      </Animated.View>
    );
  }

  // Dialogue entries
  if (type === 'dialogue') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.entry, styles.dialogueEntry]}
      >
        <View style={styles.entryHeader}>
          {speaker && <Text style={styles.speakerName}>{speaker}:</Text>}
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
        <Text style={[styles.messageText, styles.dialogueText]}>"{message}"</Text>
      </Animated.View>
    );
  }

  // System entries
  if (type === 'system') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30)}
        style={[styles.entry, styles.systemEntry]}
      >
        <View style={styles.systemContent}>
          <Text style={styles.systemIcon}>ℹ️</Text>
          <Text style={styles.systemText}>{message}</Text>
        </View>
      </Animated.View>
    );
  }

  // Command entries
  if (type === 'command') {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.entry, styles.commandEntry]}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
        {commandType && commandType !== 'process_input' && (
          <Text style={styles.commandLabel}>&gt; {commandType}</Text>
        )}
        <Text style={styles.messageText}>{message}</Text>
      </Animated.View>
    );
  }

  // Default narration entry
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      style={[styles.entry, styles.narrationEntry]}
    >
      <View style={styles.entryHeader}>
        <View style={styles.narratorBadge}>
          <Text style={styles.narratorText}>📜</Text>
        </View>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>
      <Text style={[styles.messageText, styles.narrationText]}>{message}</Text>
    </Animated.View>
  );
}

// Helper to parse a GameEvent and determine its type
export function getEntryType(event: {
  category?: string;
  type?: string;
  data?: {
    type?: string;
    critical?: boolean;
    commandType?: string;
    result?: { message?: string };
  };
}): NarrativeEntryType {
  if (event.category === 'combat' || event.data?.type === 'attack') return 'combat';
  if (event.category === 'loot') return 'loot';
  if (event.category === 'death' || event.data?.type === 'death') return 'death';
  if (event.category === 'levelup' || event.type === 'level_up') return 'levelup';
  if (event.category === 'dialogue') return 'dialogue';
  if (event.category === 'system') return 'system';
  if (event.type === 'command_executed') return 'command';
  return 'narration';
}

const styles = StyleSheet.create({
  entry: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 16,
  },
  timestamp: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  messageText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },

  // Narration
  narrationEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftColor: COLORS.primary,
  },
  narrationText: {
    fontStyle: 'italic',
  },
  narratorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  narratorText: {
    fontSize: 14,
  },

  // Combat
  combatEntry: {
    backgroundColor: 'rgba(50, 0, 0, 0.3)',
    borderLeftColor: '#ff4444',
  },
  criticalEntry: {
    backgroundColor: 'rgba(100, 0, 0, 0.5)',
    borderLeftColor: '#ff0000',
    borderWidth: 1,
    borderColor: '#ffaa00',
  },
  combatText: {
    color: '#ffcccc',
  },
  criticalText: {
    color: '#ffaa00',
    fontWeight: 'bold',
    fontSize: 15,
  },
  missText: {
    color: '#aaaaaa',
    fontStyle: 'italic',
  },
  damageContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  damageText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  criticalDamage: {
    color: '#ffaa00',
    fontSize: 14,
  },

  // Death
  deathEntry: {
    borderLeftColor: '#666666',
    borderLeftWidth: 0,
    overflow: 'hidden',
  },
  deathGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  deathEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  deathText: {
    color: '#ff4444',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 16,
    fontFamily: FONTS.title,
    letterSpacing: 2,
    textAlign: 'center',
  },

  // Level Up
  levelupEntry: {
    borderLeftColor: '#ffd700',
    borderLeftWidth: 0,
    overflow: 'hidden',
  },
  levelupGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelupEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  levelupText: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
  },

  // Loot
  lootEntry: {
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    borderLeftColor: '#daa520',
  },
  lootText: {
    color: '#ffd700',
  },

  // Dialogue
  dialogueEntry: {
    backgroundColor: 'rgba(100, 149, 237, 0.1)',
    borderLeftColor: '#6495ed',
  },
  speakerName: {
    color: '#6495ed',
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dialogueText: {
    color: '#e0e0e0',
    fontStyle: 'italic',
  },

  // System
  systemEntry: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderLeftColor: '#808080',
    paddingVertical: 8,
  },
  systemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemIcon: {
    fontSize: 12,
  },
  systemText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
  },

  // Command
  commandEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftColor: '#bdc3c7',
  },
  commandLabel: {
    color: '#bdc3c7',
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    marginBottom: 4,
  },
});
