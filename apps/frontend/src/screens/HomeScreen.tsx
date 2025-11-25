import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCreateSession } from '../hooks/useCreateSession';
import { COLORS, FONTS } from '../theme';

interface HomeScreenProps {
  onSessionCreated: (sessionId: string, ownerId: string) => void;
}

const DEFAULT_OWNER_ID = '00000000-0000-4000-8000-000000000000';
const UUID_REGEX = /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export function HomeScreen({ onSessionCreated }: HomeScreenProps) {
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createSession = useCreateSession();

  const handleCreateSession = async () => {
    if (!title.trim()) {
      setErrorMessage('El título de la sesión es obligatorio.');
      return;
    }

    if (!UUID_REGEX.test(ownerId.trim())) {
      setErrorMessage('ownerId debe ser un UUID válido.');
      return;
    }

    setErrorMessage(null);
    try {
      const result = await createSession.mutateAsync({
        ownerId: ownerId.trim(),
        title: title.trim(),
        summary: summary.trim() || undefined,
      });

      // Notify parent
      onSessionCreated(result.session.id, ownerId.trim());

      setTitle('');
      setSummary('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMessage(message);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.heroSection}>
        <Text style={styles.gameTitle}>RPG AI SUPREME</Text>
        <Text style={styles.gameSubtitle}>Infinite Worlds. Infinite Stories.</Text>
      </View>

      <View style={styles.sessionPanel}>
        <Text style={styles.panelTitle}>Start New Adventure</Text>
        <TextInput
          value={ownerId}
          onChangeText={setOwnerId}
          placeholder='Player ID (UUID)'
          placeholderTextColor={COLORS.textDim}
          style={styles.input}
          autoCapitalize='none'
          autoCorrect={false}
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder='Adventure Title'
          placeholderTextColor={COLORS.textDim}
          style={styles.input}
        />
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder='Optional Backstory...'
          placeholderTextColor={COLORS.textDim}
          style={[styles.input, styles.multilineInput]}
          multiline
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryButton, createSession.isPending && styles.buttonDisabled]}
          onPress={handleCreateSession}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>ENTER WORLD</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Powered by Gemini 2.5 Flash & Pollinations AI</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    fontFamily: FONTS.title,
    fontSize: 36,
    color: COLORS.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(247, 207, 70, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  gameSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  sessionPanel: {
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  infoText: {
    color: COLORS.textDim,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.body,
    lineHeight: 24,
  },
  panelTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(247, 207, 70, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
