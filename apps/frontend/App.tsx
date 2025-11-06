import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useCreateSession } from "./src/hooks/useCreateSession";

type StoryEntry = {
  id: string;
  text: string;
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.safeArea}>
        <RootScreen />
      </SafeAreaView>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}

const DEFAULT_OWNER_ID = "00000000-0000-4000-8000-000000000000";
const UUID_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function RootScreen() {
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [logEntries, setLogEntries] = useState<StoryEntry[]>(() => [
    {
      id: "intro",
      text: "¡Bienvenido! Crea una sesión para iniciar la campaña.",
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createSession = useCreateSession();

  const handleCreateSession = async () => {
    if (!title.trim()) {
      setErrorMessage("El título de la sesión es obligatorio.");
      return;
    }

    if (!UUID_REGEX.test(ownerId.trim())) {
      setErrorMessage("ownerId debe ser un UUID válido.");
      return;
    }

    setErrorMessage(null);
    try {
      const result = await createSession.mutateAsync({
        ownerId: ownerId.trim(),
        title: title.trim(),
        summary: summary.trim() || undefined
      });

      setLogEntries((prev) => [
        {
          id: result.session.id,
          text: `Sesión creada: ${result.session.title} (ID ${result.session.id}).`
        },
        ...prev
      ]);

      setTitle("");
      setSummary("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sessionPanel}>
        <Text style={styles.panelTitle}>Nueva Sesión</Text>
        <TextInput
          value={ownerId}
          onChangeText={setOwnerId}
          placeholder="UUID del owner"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título de la sesión"
          style={styles.input}
        />
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Resumen opcional"
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
            <ActivityIndicator color="#050510" />
          ) : (
            <Text style={styles.buttonText}>Crear sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.imagePanel}>
        <Text style={styles.panelTitle}>Imagen en tiempo real</Text>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>La ilustración aparecerá aquí.</Text>
        </View>
      </View>

      <View style={styles.storyPanel}>
        <Text style={styles.panelTitle}>Bitácora</Text>
        <FlatList
          data={logEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.storyEntry}>{item.text}</Text>
          )}
          contentContainerStyle={styles.storyContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050510"
  },
  container: {
    flex: 1,
    backgroundColor: "#050510",
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 24,
  },
  sessionPanel: {
    gap: 12
  },
  imagePanel: {
    flex: 2,
    gap: 12,
  },
  storyPanel: {
    flex: 3,
    gap: 12,
  },
  inputPanel: {
    gap: 12,
  },
  panelTitle: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.6,
  },
  imagePlaceholder: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderText: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  storyContent: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  storyEntry: {
    color: "#f5f5f5",
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    color: "#f5f5f5",
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 60,
  },
  errorText: {
    color: "#ff8080",
    fontSize: 14,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f7cf46",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#050510",
  },
});
