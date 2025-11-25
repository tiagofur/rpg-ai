import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useGameSession } from '../hooks/useGameSession';
import { useCharacter } from '../hooks/useCharacter';
import { CharacterSheetScreen } from './CharacterSheetScreen';
import { InventoryScreen } from './InventoryScreen';
import { SubscriptionScreen } from './SubscriptionScreen';
import { COLORS, FONTS } from '../theme';

interface GameScreenProps {
  sessionId: string;
  characterId: string;
  onExit: () => void;
}

interface CommandData {
  commandType?: string;
  result?: {
    message?: string;
  };
}

export function GameScreen({ sessionId, characterId, onExit }: GameScreenProps) {
  const { t } = useTranslation();
  const { startSession, sessionState, executeCommand, undoCommand } = useGameSession(sessionId);
  const { data: character, refetch: refetchCharacter } = useCharacter(characterId);
  const [input, setInput] = useState('');
  const [isDead, setIsDead] = useState(false);
  const [activeModal, setActiveModal] = useState<'character' | 'inventory' | 'subscription' | null>(
    null
  );
  const flatListRef = useRef<FlatList>(null);

  // Initialize session on mount
  useEffect(() => {
    startSession.mutate({ characterId });
  }, []);

  // Refetch character when session updates (to update HP/Mana/XP)
  useEffect(() => {
    if (sessionState.data) {
      refetchCharacter();
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
        <ActivityIndicator size='large' color='#f7cf46' />
        <Text style={styles.loadingText}>{t('game.loadingWorld')}</Text>
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
  const latestImageEntry = [...history]
    .reverse()
    .find((entry) => entry.category === 'scene_image' && entry.data?.imageUrl);
  const currentSceneImage = latestImageEntry?.data?.imageUrl as string | undefined;

  const renderStatusBar = () => {
    if (!character) return null;
    const hpPercent = (character.health.current / character.health.maximum) * 100;
    const mpPercent = (character.mana.current / character.mana.maximum) * 100;

    return (
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.charName}>{character.name}</Text>
            <Text style={styles.charLevel}>
              Lvl {character.level} {character.class}
            </Text>
          </View>
          <View style={styles.barsContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: COLORS.hp }]}
              />
              <Text style={styles.barText}>
                {character.health.current}/{character.health.maximum} HP
              </Text>
            </View>
            <View style={styles.barWrapper}>
              <View
                style={[styles.barFill, { width: `${mpPercent}%`, backgroundColor: COLORS.mp }]}
              />
              <Text style={styles.barText}>
                {character.mana.current}/{character.mana.maximum} MP
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLogEntry = ({ item }: { item: any }) => {
    const isCombat = item.category === 'combat';
    const data = item.data || {};

    // Combat Log Styling
    if (isCombat) {
      const isCrit = data.critical;
      const isMiss = data.type === 'miss';
      const isDeath = data.type === 'death';

      return (
        <View
          style={[
            styles.logEntry,
            styles.combatLogEntry,
            isCrit && styles.critLogEntry,
            isDeath && styles.deathLogEntry,
          ]}
        >
          <Text style={styles.logTimestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          <Text
            style={[
              styles.logText,
              isCrit && styles.critText,
              isMiss && styles.missText,
              isDeath && styles.deathText,
            ]}
          >
            {item.message}
          </Text>
          {data.damage && <Text style={styles.damageText}>-{data.damage} HP</Text>}
        </View>
      );
    }

    // Standard Log
    return (
      <View style={styles.logEntry}>
        <Text style={styles.logTimestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
        <Text style={styles.logText}>
          {item.type === 'command_executed'
            ? `> ${(item.data as unknown as CommandData).commandType}`
            : (item.data as unknown as CommandData).result?.message ||
              item.message ||
              JSON.stringify(item.data)}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('common.exit')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>RPG AI SUPREME</Text>
          <TouchableOpacity
            onPress={handleUndo}
            disabled={undoCommand.isPending}
            style={styles.undoButton}
          >
            <Text style={styles.undoButtonText}>{t('common.undo')}</Text>
          </TouchableOpacity>
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
        // ...existing code...
        {/* Quick Actions Toolbar */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSendCommand('look')}>
            <Text style={styles.actionButtonText}>👁️ Look</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSendCommand('attack')}>
            <Text style={styles.actionButtonText}>⚔️ Attack</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveModal('inventory')}>
            <Text style={styles.actionButtonText}>🎒 Bag</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveModal('character')}>
            <Text style={styles.actionButtonText}>👤 Hero</Text>
          </TouchableOpacity>
        </View>
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
          <InventoryScreen characterId={characterId} onClose={() => setActiveModal(null)} />
        </Modal>
        <Modal
          visible={activeModal === 'subscription'}
          animationType='slide'
          onRequestClose={() => setActiveModal(null)}
        >
          <SubscriptionScreen onClose={() => setActiveModal(null)} />
        </Modal>
      </KeyboardAvoidingView>
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
  logEntry: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  combatLogEntry: {
    backgroundColor: 'rgba(50, 0, 0, 0.3)',
    borderLeftColor: '#ff4444',
  },
  critLogEntry: {
    backgroundColor: 'rgba(100, 0, 0, 0.5)',
    borderLeftColor: '#ff0000',
    borderWidth: 1,
    borderColor: '#ffaa00',
  },
  deathLogEntry: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderLeftColor: '#666',
    borderWidth: 1,
    borderColor: '#999',
  },
  logTimestamp: {
    color: COLORS.textDim,
    fontSize: 10,
    marginBottom: 4,
    fontFamily: FONTS.body,
  },
  logText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  critText: {
    color: '#ffaa00',
    fontWeight: 'bold',
    fontSize: 15,
  },
  missText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  deathText: {
    color: '#ff4444',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  damageText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 207, 70, 0.3)',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
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
