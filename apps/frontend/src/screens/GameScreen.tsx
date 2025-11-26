import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useGameSession } from '../hooks/useGameSession';
import { useCharacter } from '../hooks/useCharacter';
import { useGameEffects } from '../hooks/useGameEffects';
import { useScreenShake } from '../hooks/useScreenShake';
import { useCombat } from '../hooks/useCombat';
import { UsageLimits, type UsageLimitData } from '../components/UsageLimits';
import { Skeleton } from '../components/Skeleton';
import { CharacterSheetScreen } from './CharacterSheetScreen';
import { InventoryScreen } from './InventoryScreen';
import { SubscriptionScreen } from './SubscriptionScreen';
import { ProfileScreen } from './ProfileScreen';
import { COLORS, FONTS } from '../theme';
import { socketService } from '../api/socket';

import { DailyRewardModal } from '../components/DailyRewardModal';
import { AIThinkingIndicator } from '../components/AIThinkingIndicator';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { NarrativeEntry, getEntryType } from '../components/NarrativeEntry';
import { CombatUI } from '../components/combat';
import { LevelUpModal } from '../components/LevelUpModal';
import type { CombatActionType, ICombatResult } from '../types/combat';

interface GameEvent {
  category?: string;
  type?: string;
  data?: {
    imageUrl?: string;
    critical?: boolean;
    type?: string;
    damage?: number;
    result?: {
      message?: string;
      logEntries?: GameEvent[];
    };
    commandType?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  message?: string;
  timestamp?: string;
  id?: string;
}

interface GameScreenProps {
  sessionId: string;
  characterId: string;
  token: string;
  onExit: () => void;
}

export function GameScreen({ sessionId, characterId, token, onExit }: GameScreenProps) {
  const { t } = useTranslation();
  // const queryClient = useQueryClient();
  const { startSession, sessionState, executeCommand, undoCommand } = useGameSession(sessionId);
  const { data: character, refetch: refetchCharacter } = useCharacter(characterId);
  const { playCombatEffect, playHaptic } = useGameEffects();
  const { shakeStyle, shake } = useScreenShake();
  const [input, setInput] = useState('');
  const [isDead, setIsDead] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'character' | 'inventory' | 'subscription' | 'profile' | null
  >(null);
  const flatListRef = useRef<FlatList>(null);

  // Combat state management
  const handleCombatStart = useCallback(() => {
    playHaptic('heavy');
    shake('hit', 'medium');
  }, [playHaptic, shake]);

  const handleCombatEnd = useCallback(
    (result: ICombatResult) => {
      if (result.outcome === 'victory') {
        playHaptic('success');
      } else if (result.outcome === 'defeat') {
        shake('death', 'heavy');
      }
      void refetchCharacter();
    },
    [playHaptic, shake, refetchCharacter]
  );

  const {
    inCombat,
    combatState,
    combatResult,
    executeAction: executeCombatAction,
    endCombat,
    isProcessing: isCombatProcessing,
  } = useCombat({
    sessionId,
    onCombatStart: handleCombatStart,
    onCombatEnd: handleCombatEnd,
  });

  // Level up modal state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRewards, setLevelUpRewards] = useState<{
    newLevel: number;
    hpBonus: number;
    manaBonus: number;
    staminaBonus: number;
    attributePoints: number;
    newAbility?: { id: string; name: string; description: string; icon: string };
    title?: string;
  } | null>(null);

  // Usage limits (mock - en producción viene del backend)
  const [usageLimits] = useState<UsageLimitData[]>([
    { feature: 'AI', current: 87, limit: 100, icon: '🧠' },
    { feature: 'Images', current: 8, limit: 10, icon: '🖼️' },
  ]);
  const [userPlan] = useState<'free' | 'basic' | 'premium' | 'supreme'>('free');

  // Initialize session on mount
  useEffect(() => {
    startSession.mutate({ characterId });

    // Connect Socket
    socketService.connect(token);
    socketService.joinGame(sessionId);

    // Listen for events
    socketService.on('game:event', (data) => {
      // console.log('Game Event Received:', data);

      // Handle Effects
      if (data.type === 'combat') {
        const payload = data.payload as { critical?: boolean; type?: string };
        const isCrit = payload?.critical || false;
        const isMiss = payload?.type === 'miss';
        playCombatEffect(isCrit, isMiss);

        // Screen shake on combat hits
        if (!isMiss) {
          shake(isCrit ? 'criticalHit' : 'hit', isCrit ? 'heavy' : 'medium');
        }
      } else if (data.type === 'loot') {
        playHaptic('success');
      } else if (data.type === 'death') {
        shake('death', 'heavy');
      } else if (data.type === 'level_up') {
        shake('levelUp', 'light');
        // Show level up modal with rewards
        const payload = data.payload as {
          newLevel: number;
          hpBonus: number;
          manaBonus: number;
          staminaBonus: number;
          attributePoints: number;
          newAbility?: { id: string; name: string; description: string; icon: string };
          title?: string;
        };
        if (payload) {
          setLevelUpRewards(payload);
          setShowLevelUp(true);
        }
      }

      // In a real app, we would update the React Query cache here
      // queryClient.setQueryData(['session', sessionId], (old: any) => { ... });
      // For now, we rely on polling or just let the user know something happened
      void sessionState.refetch();
    });

    socketService.on('player:resolution', () => {
      void sessionState.refetch();
      void refetchCharacter();
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Refetch character when session updates (to update HP/Mana/XP)
  useEffect(() => {
    if (sessionState.data) {
      void refetchCharacter();
    }
  }, [sessionState.data]);

  // Check for death
  useEffect(() => {
    if (character) {
      if (character.health.current <= 0 || character.status?.includes('dead')) {
        setIsDead(true);
      } else {
        setIsDead(false);
      }
    }
  }, [character]);

  const handleSendCommand = (cmd?: string) => {
    const commandToSend = cmd || input.trim();
    if (!commandToSend) return;

    playHaptic('light'); // Feedback on send

    executeCommand.mutate({
      type: 'custom',
      parameters: { input: commandToSend },
    });
    setInput('');
  };

  const handleUndo = () => {
    undoCommand.mutate();
  };

  const handleRespawn = () => {
    executeCommand.mutate({
      type: 'respawn',
      parameters: {},
    });
  };

  if (sessionState.isLoading || startSession.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Skeleton variant='circle' width={80} />
          <Skeleton variant='text' width={200} height={20} />
          <Skeleton variant='text' width={150} height={16} />
          <Skeleton variant='rect' width={300} height={120} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (sessionState.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.button} onPress={onExit}>
          <Text style={styles.buttonText}>{t('common.exit')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const history = sessionState.data?.history || [];

  // Find latest image from history
  const latestImageEntry = [...history].reverse().find((entry: GameEvent) => {
    // Check direct scene_image event
    if (entry.category === 'scene_image' && entry.data?.imageUrl) return true;
    // Check inside command_executed result
    if (entry.type === 'command_executed' && entry.data?.result?.logEntries) {
      return entry.data.result.logEntries.some(
        (log: GameEvent) => log.category === 'scene_image' && log.data?.imageUrl
      );
    }
    return false;
  });

  let currentSceneImage: string | undefined;
  if (latestImageEntry) {
    const entry = latestImageEntry as GameEvent;
    if (entry.category === 'scene_image') {
      currentSceneImage = entry.data?.imageUrl;
    } else if (entry.type === 'command_executed') {
      const imgLog = entry.data?.result?.logEntries?.find(
        (log: GameEvent) => log.category === 'scene_image'
      );
      currentSceneImage = imgLog?.data?.imageUrl;
    }
  }

  const renderStatusBar = () => {
    if (!character) return null;

    const hpPercent = (character.health.current / character.health.maximum) * 100;
    const manaPercent = (character.mana.current / character.mana.maximum) * 100;
    const nextLevelXp = character.nextLevelExperience || 1000;
    const xpPercent = (character.experience / nextLevelXp) * 100;

    return (
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.charName}>{character.name}</Text>
            <Text style={styles.charLevel}>
              {t('game.level')} {character.level} {character.class}
            </Text>
          </View>
          <View style={styles.barsContainer}>
            {/* HP Bar */}
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={['#ff4444', '#cc0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${hpPercent}%` }]}
              />
              <Text style={styles.barText}>
                {character.health.current}/{character.health.maximum} HP
              </Text>
            </View>
            {/* Mana Bar */}
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={['#4444ff', '#0000cc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${manaPercent}%` }]}
              />
              <Text style={styles.barText}>
                {character.mana.current}/{character.mana.maximum} MP
              </Text>
            </View>
            {/* XP Bar */}
            <View style={[styles.barWrapper, { height: 4, marginTop: 4 }]}>
              <LinearGradient
                colors={['#ffd700', '#b8860b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${xpPercent}%` }]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLogEntry = ({ item, index }: { item: GameEvent; index: number }) => {
    const entryType = getEntryType(item);
    const data = item.data || {};

    // Get message from different sources
    let message = item.message || '';
    if (item.type === 'command_executed' && item.data?.result?.message) {
      message = item.data.result.message;
    }
    if (!message && item.data) {
      message = JSON.stringify(item.data);
    }

    return (
      <NarrativeEntry
        type={entryType}
        message={message}
        timestamp={item.timestamp}
        damage={data.damage}
        isCritical={data.critical}
        isMiss={data.type === 'miss'}
        commandType={data.commandType}
        index={index}
      />
    );
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <Animated.View style={[styles.container, shakeStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onExit} style={styles.backButton}>
              <Text style={styles.backButtonText}>← {t('common.exit')}</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>RPG AI SUPREME</Text>
              <UsageLimits
                limits={usageLimits}
                plan={userPlan}
                onUpgrade={() => setActiveModal('subscription')}
                compact
              />
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleUndo}
                disabled={undoCommand.isPending}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonText}>{t('common.undo')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveModal('profile')}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Status Bar */}
          {renderStatusBar()}
          {/* Visual Scene Area (Placeholder for AI Image) */}
          <View style={styles.sceneContainer}>
            {currentSceneImage ? (
              <Image
                source={{ uri: currentSceneImage }}
                style={styles.sceneImage}
                resizeMode='cover'
              />
            ) : (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.sceneGradient}
              >
                <Text style={styles.scenePlaceholderText}>🔮 Visualizing the Realm...</Text>
              </LinearGradient>
            )}
          </View>
          {/* Game Log */}
          <View style={styles.gameArea}>
            <FlatList
              ref={flatListRef}
              data={[...history].reverse()}
              inverted
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={renderLogEntry}
              contentContainerStyle={styles.logList}
            />
          </View>
          {/* Quick Actions Toolbar */}
          <QuickActionsBar
            onAction={handleSendCommand}
            onOpenInventory={() => setActiveModal('inventory')}
            onOpenCharacter={() => setActiveModal('character')}
            disabled={executeCommand.isPending}
          />
          {/* AI Thinking Indicator */}
          <AIThinkingIndicator visible={executeCommand.isPending} variant='inline' />
          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('game.inputPlaceholder')}
              placeholderTextColor={COLORS.textDim}
              onSubmitEditing={() => handleSendCommand()}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || executeCommand.isPending) && styles.disabledButton,
              ]}
              onPress={() => handleSendCommand()}
              disabled={!input.trim() || executeCommand.isPending}
            >
              <Text style={styles.sendButtonText}>{t('common.send')}</Text>
            </TouchableOpacity>
          </View>
          {/* Modals */}
          <Modal
            visible={isDead}
            transparent={true}
            animationType='fade'
            onRequestClose={() => {}} // Prevent closing by back button
          >
            <View style={styles.gameOverContainer}>
              <View style={styles.gameOverContent}>
                <Text style={styles.gameOverTitle}>YOU DIED</Text>
                <Text style={styles.gameOverText}>Your journey has come to an end... for now.</Text>

                <TouchableOpacity
                  style={styles.respawnButton}
                  onPress={handleRespawn}
                  disabled={executeCommand.isPending}
                >
                  <Text style={styles.respawnButtonText}>
                    {executeCommand.isPending ? 'Resurrecting...' : 'Respawn at Town'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.exitButton} onPress={onExit}>
                  <Text style={styles.exitButtonText}>Return to Main Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            visible={activeModal === 'character'}
            animationType='slide'
            onRequestClose={() => setActiveModal(null)}
          >
            <CharacterSheetScreen characterId={characterId} onClose={() => setActiveModal(null)} />
          </Modal>
          <Modal
            visible={activeModal === 'inventory'}
            animationType='slide'
            onRequestClose={() => setActiveModal(null)}
          >
            <InventoryScreen
              sessionId={sessionId}
              characterId={characterId}
              onClose={() => setActiveModal(null)}
            />
          </Modal>
          <Modal
            visible={activeModal === 'subscription'}
            animationType='slide'
            onRequestClose={() => setActiveModal(null)}
          >
            <SubscriptionScreen onClose={() => setActiveModal(null)} />
          </Modal>
          <Modal
            visible={activeModal === 'profile'}
            animationType='slide'
            onRequestClose={() => setActiveModal(null)}
          >
            <ProfileScreen
              onClose={() => setActiveModal(null)}
              onLogout={onExit}
              username={character?.name || 'Adventurer'}
              onOpenSubscription={() => {
                setActiveModal('subscription');
              }}
            />
          </Modal>
          <DailyRewardModal token={token} />

          {/* Combat UI Overlay */}
          {inCombat && combatState && (
            <CombatUI
              combatState={combatState}
              combatResult={combatResult}
              onAction={(action: CombatActionType, targetId?: string) => {
                executeCombatAction(action, targetId);
              }}
              onCombatEnd={endCombat}
              disabled={isCombatProcessing || executeCommand.isPending}
              playerXp={character?.experience || 0}
              playerXpToNext={character?.nextLevelExperience || 1000}
              playerLevel={character?.level || 1}
            />
          )}

          {/* Level Up Modal */}
          <LevelUpModal
            visible={showLevelUp}
            rewards={levelUpRewards}
            currentAttributes={{
              strength: character?.attributes?.strength || 10,
              dexterity: character?.attributes?.dexterity || 10,
              constitution: character?.attributes?.constitution || 10,
              intelligence: character?.attributes?.intelligence || 10,
              wisdom: character?.attributes?.wisdom || 10,
              charisma: character?.attributes?.charisma || 10,
            }}
            onConfirm={(distribution) => {
              // Send attribute distribution to backend
              executeCommand.mutate({
                type: 'distribute_attributes',
                parameters: { distribution },
              });
              setShowLevelUp(false);
              setLevelUpRewards(null);
            }}
            onClose={() => {
              setShowLevelUp(false);
              setLevelUpRewards(null);
            }}
          />
        </KeyboardAvoidingView>
      </Animated.View>
    </LinearGradient>
  );
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
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontFamily: FONTS.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statusBar: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  charName: {
    color: COLORS.primary,
    fontFamily: FONTS.title,
    fontSize: 16,
  },
  charLevel: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  barsContainer: {
    flex: 1.5,
    gap: 4,
  },
  barWrapper: {
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  barText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
    textAlign: 'center',
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 2,
  },
  sceneContainer: {
    height: 200,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    overflow: 'hidden',
  },
  sceneGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  scenePlaceholderText: {
    color: COLORS.textDim,
    fontFamily: FONTS.title,
    fontSize: 14,
    letterSpacing: 2,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.title,
    fontSize: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.body,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#ff8080',
    fontFamily: FONTS.body,
  },
  headerButtonIcon: {
    fontSize: 18,
  },
  undoButton: {
    padding: 8,
  },
  undoButtonText: {
    color: '#ff8080',
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
  },
  buttonText: {
    color: '#050510',
    fontFamily: FONTS.bodyBold,
  },
  gameArea: {
    flex: 1,
    padding: 16,
  },
  logList: {
    gap: 12,
    paddingBottom: 16,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontFamily: FONTS.body,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.textDim,
  },
  sendButtonText: {
    color: '#050510',
    fontFamily: FONTS.bodyBold,
    textTransform: 'uppercase',
  },
  gameOverContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverContent: {
    width: '80%',
    alignItems: 'center',
    gap: 20,
  },
  gameOverTitle: {
    fontSize: 48,
    fontFamily: FONTS.title,
    color: '#ff0000',
    textShadowColor: '#550000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
  gameOverText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  respawnButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  respawnButtonText: {
    color: '#000',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  exitButton: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#666',
    fontFamily: FONTS.body,
    fontSize: 14,
  },
});
