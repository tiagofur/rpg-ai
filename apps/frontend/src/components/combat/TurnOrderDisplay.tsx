/**
 * TurnOrderDisplay - Shows the turn order in combat
 * Visual: [Tú ►] → [Lobo] → [Rata]
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import type { ITurnOrderEntry } from '../../types/combat';

interface TurnOrderDisplayProps {
  turnOrder: ITurnOrderEntry[];
  currentTurnId: string;
  round: number;
}

export function TurnOrderDisplay({ turnOrder, currentTurnId, round }: TurnOrderDisplayProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundText}>RONDA {round}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.orderContainer}
      >
        {turnOrder.map((participant, index) => {
          const { id, name: participantName, isPlayer } = participant;
          const isActive = id === currentTurnId;

          return (
            <React.Fragment key={id}>
              <Animated.View
                entering={FadeInLeft.delay(index * 100).duration(200)}
                style={[
                  styles.participant,
                  isActive && styles.activeParticipant,
                  isPlayer && styles.playerParticipant,
                ]}
              >
                {isActive && (
                  <LinearGradient
                    colors={isPlayer ? ['#f7cf46', '#b8982f'] : ['#ff6b6b', '#cc0000']}
                    style={styles.activeGlow}
                  />
                )}
                <View style={styles.participantContent}>
                  <Text style={styles.participantIcon}>{isPlayer ? '⚔️' : '👹'}</Text>
                  <Text
                    style={[
                      styles.participantName,
                      isActive && styles.activeName,
                      isPlayer && styles.playerName,
                    ]}
                    numberOfLines={1}
                  >
                    {isPlayer ? 'Tú' : participantName}
                  </Text>
                  {isActive && <Text style={styles.activeIndicator}>►</Text>}
                </View>
              </Animated.View>
              {index < turnOrder.length - 1 && <Text style={styles.arrow}>→</Text>}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  header: {
    marginBottom: 8,
  },
  roundText: {
    fontFamily: theme.fonts.title,
    fontSize: 12,
    color: theme.colors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  orderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  participant: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
    overflow: 'hidden',
  },
  activeParticipant: {
    borderColor: theme.colors.gold,
    borderWidth: 2,
  },
  playerParticipant: {
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
  },
  activeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  participantIcon: {
    fontSize: 14,
  },
  participantName: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.text,
    maxWidth: 60,
  },
  activeName: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.gold,
  },
  playerName: {
    color: theme.colors.gold,
  },
  activeIndicator: {
    fontSize: 10,
    color: theme.colors.gold,
    marginLeft: 2,
  },
  arrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginHorizontal: 6,
  },
});
