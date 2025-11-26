import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCreateSession } from '../hooks/useCreateSession';
import { useAuth } from '../context/AuthContext';
import { characterApi, type Character } from '../api/character';
import { UsageLimits, type UsageLimitData } from '../components/UsageLimits';
import { FadeIn, SlideIn } from '../components/animations';
import { COLORS, FONTS, theme } from '../theme';

interface HomeScreenProps {
  onSessionCreated: (sessionId: string, ownerId: string, token: string) => void;
  onCharacterSelected?: (character: Character, sessionId: string) => void;
  onOpenSubscription?: () => void;
}

export function HomeScreen({ onSessionCreated, onOpenSubscription }: HomeScreenProps) {
  const { user, accessToken, logout } = useAuth();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Character list state
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Usage limits (mock data - en producción vienen del backend)
  const [usageLimits] = useState<UsageLimitData[]>([
    { feature: 'AI Requests', current: 45, limit: 100, icon: '🧠' },
    { feature: 'Images', current: 3, limit: 10, icon: '🖼️' },
    { feature: 'Saved Games', current: 1, limit: 3, icon: '💾' },
    { feature: 'Characters', current: characters.length, limit: 1, icon: '🧙' },
  ]);
  const [userPlan] = useState<'free' | 'basic' | 'premium' | 'supreme'>('free');

  const createSession = useCreateSession();

  // Load user's characters
  const loadCharacters = async () => {
    try {
      const response = await characterApi.listMyCharacters();
      setCharacters(response.characters);
    } catch {
      // Silently fail - characters list is not critical
      setCharacters([]);
    } finally {
      setIsLoadingCharacters(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadCharacters();
    }
  }, [accessToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCharacters();
  };

  const handleCreateSession = async () => {
    if (!title.trim()) {
      setErrorMessage('El título de la sesión es obligatorio.');
      return;
    }

    if (!user || !accessToken) {
      setErrorMessage('Debes iniciar sesión primero.');
      return;
    }

    setErrorMessage(null);

    try {
      const result = await createSession.mutateAsync({
        ownerId: user.id,
        title: title.trim(),
        summary: summary.trim() || undefined,
      });

      onSessionCreated(result.session.id, user.id, accessToken);

      setTitle('');
      setSummary('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMessage(message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* User Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>¡Bienvenido!</Text>
              <Text style={styles.usernameText}>{user?.username ?? 'Aventurero'}</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            {onOpenSubscription && (
              <TouchableOpacity style={styles.premiumButton} onPress={onOpenSubscription}>
                <Text style={styles.premiumButtonText}>⭐ Premium</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <FadeIn duration={800}>
          <View style={styles.heroSection}>
            <Text style={styles.gameTitle}>RPG AI SUPREME</Text>
            <Text style={styles.gameSubtitle}>Mundos Infinitos. Historias Infinitas.</Text>
          </View>
        </FadeIn>

        {/* Usage Limits */}
        {onOpenSubscription && (
          <SlideIn direction='up' delay={200}>
            <UsageLimits limits={usageLimits} plan={userPlan} onUpgrade={onOpenSubscription} />
          </SlideIn>
        )}

        {/* My Characters Section */}
        {characters.length > 0 && (
          <View style={styles.charactersSection}>
            <Text style={styles.sectionTitle}>👤 Mis Personajes</Text>
            {isLoadingCharacters ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              characters.map((character) => (
                <View key={character.id} style={styles.characterCard}>
                  <View style={styles.characterInfo}>
                    <Text style={styles.characterName}>{character.nombre}</Text>
                    <Text style={styles.characterClass}>
                      {character.raza} {character.clase}
                    </Text>
                    <Text style={styles.characterStatus}>Estado: {character.estado}</Text>
                  </View>
                  <View style={styles.characterStats}>
                    <Text style={styles.statLabel}>Nivel 1</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* New Adventure Panel */}
        <SlideIn direction='up' delay={400}>
          <View style={styles.sessionPanel}>
            <Text style={styles.panelTitle}>🗡️ Nueva Aventura</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder='Nombre de tu aventura'
              placeholderTextColor={COLORS.textDim}
              style={styles.input}
            />
            <TextInput
              value={summary}
              onChangeText={setSummary}
              placeholder='Describe tu historia (opcional)...'
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
                <Text style={styles.buttonText}>⚔️ COMENZAR AVENTURA</Text>
              )}
            </TouchableOpacity>
          </View>
        </SlideIn>

        {/* Info Footer */}
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>Powered by Gemini 2.5 Flash & Pollinations AI</Text>
          <Text style={styles.versionText}>v0.1.1-alpha</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.background,
  },
  welcomeText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
  usernameText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  premiumButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.gold,
  },
  premiumButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.background,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 12,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 4,
  },
  infoText: {
    color: COLORS.textDim,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  versionText: {
    color: COLORS.textDim,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: FONTS.body,
    opacity: 0.6,
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
  // Characters section
  charactersSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  characterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  characterClass: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: theme.colors.gold,
  },
  characterStatus: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },
  characterStats: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.textDim,
  },
});
