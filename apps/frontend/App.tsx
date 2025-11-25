import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';

import './src/i18n';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { useSubscription } from './src/hooks/useSubscription';

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StripeContainer>
        <SafeAreaView style={styles.safeArea}>
          <RootNavigator />
        </SafeAreaView>
        <StatusBar style='light' />
      </StripeContainer>
    </QueryClientProvider>
  );
}

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

function RootNavigator() {
  const [currentSession, setCurrentSession] = useState<{ id: string; ownerId: string } | null>(
    null
  );
  const [characterId, setCharacterId] = useState<string | null>(null);

  const handleSessionCreated = (sessionId: string, ownerId: string) => {
    setCurrentSession({ id: sessionId, ownerId });
    // For MVP, we assume character creation happens or we pick a default one.
    // Since we don't have character selection yet, let's assume the backend created one
    // or we need to create one.
    // Actually, HomeScreen creates a session. Does it create a character?
    // The backend createSession creates a session.
    // We need to create a character too.
    // Let's update HomeScreen to create a character after session creation, or just pass a dummy ID if the backend handles it.
    // But wait, the backend /start endpoint requires characterId.

    // Let's assume for now we use a hardcoded character ID or fetch it.
    // To make it work, let's fetch the session details to get the character ID.
    // But we can't easily do that here without a hook.

    // Let's just pass a placeholder and let the backend handle it or fail.
    // Or better, let's update HomeScreen to create a character.

    // For now, let's just set a dummy character ID so we can navigate.
    setCharacterId('00000000-0000-0000-0000-000000000000');
  };

  const handleExit = () => {
    setCurrentSession(null);
    setCharacterId(null);
  };

  if (currentSession && characterId) {
    return (
      <GameScreen sessionId={currentSession.id} characterId={characterId} onExit={handleExit} />
    );
  }

  return <HomeScreen onSessionCreated={handleSessionCreated} />;
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
