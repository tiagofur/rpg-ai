import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Audio } from 'expo-av';

import './src/i18n';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { CharacterCreationScreen } from './src/screens/CharacterCreationScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { useSubscription } from './src/hooks/useSubscription';
import { useNotifications } from './src/hooks/useNotifications';
import { retentionApi } from './src/api/retention';
import type { Character } from './src/api/character';

import { SettingsProvider } from './src/context/SettingsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const queryClient = new QueryClient();

// Configure audio for iOS (plays in silent mode)
async function configureAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    // Audio configuration is non-critical, fail silently
    console.warn('Failed to configure audio mode:', error);
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  // Configure audio on app start
  useEffect(() => {
    void configureAudio();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <SafeAreaView style={styles.safeArea}>
            <RootNavigator />
          </SafeAreaView>
          <StatusBar style='light' />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
      </View>
    );
  }

  // Not authenticated - show auth screens
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Authenticated - show main app with Stripe
  return (
    <StripeContainer>
      <MainNavigator token={accessToken} />
    </StripeContainer>
  );
}

// Auth flow navigator (Login/Register)
function AuthNavigator() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');

  if (screen === 'register') {
    return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
  }

  return <LoginScreen onNavigateToRegister={() => setScreen('register')} />;
}

// Stripe provider wrapper
function StripeContainer({ children }: { children: React.ReactNode }) {
  const { config } = useSubscription();

  if (config.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={config.data?.publishableKey ?? ''}>
      <View style={{ flex: 1 }}>{children}</View>
    </StripeProvider>
  );
}

// Main app navigator (Home/CharacterCreation/Game/Subscription)
type AppScreen = 'home' | 'create-character' | 'game' | 'subscription';

function MainNavigator({ token }: { token: string | null }) {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [currentSession, setCurrentSession] = useState<{
    id: string;
    ownerId: string;
  } | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (token && expoPushToken) {
      retentionApi.registerPushToken(expoPushToken, token).catch(() => {
        // Silently fail - push notifications are not critical
      });
    }
  }, [token, expoPushToken]);

  const handleSessionCreated = (sessionId: string, ownerId: string, _token: string) => {
    setCurrentSession({ id: sessionId, ownerId });
    // Go to character creation after session is created
    setCurrentScreen('create-character');
  };

  const handleCharacterCreated = (createdCharacter: Character) => {
    setCharacterId(createdCharacter.id);
    setCurrentScreen('game');
  };

  const handleCancelCharacterCreation = () => {
    setCurrentSession(null);
    setCurrentScreen('home');
  };

  const handleExit = () => {
    setCurrentSession(null);
    setCharacterId(null);
    setCurrentScreen('home');
  };

  const handleOpenSubscription = () => {
    setCurrentScreen('subscription');
  };

  const handleCloseSubscription = () => {
    setCurrentScreen('home');
  };

  // Subscription Screen
  if (currentScreen === 'subscription') {
    return <SubscriptionScreen onClose={handleCloseSubscription} />;
  }

  // Character Creation Screen
  if (currentScreen === 'create-character' && currentSession && user) {
    return (
      <CharacterCreationScreen
        sessionId={currentSession.id}
        playerId={user.id}
        onCharacterCreated={handleCharacterCreated}
        onCancel={handleCancelCharacterCreation}
      />
    );
  }

  // Game Screen
  if (currentScreen === 'game' && currentSession && characterId && token) {
    return (
      <GameScreen
        sessionId={currentSession.id}
        characterId={characterId}
        token={token}
        onExit={handleExit}
      />
    );
  }

  // Home Screen (default)
  return (
    <HomeScreen
      onSessionCreated={handleSessionCreated}
      onOpenSubscription={handleOpenSubscription}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050510',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050510',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
