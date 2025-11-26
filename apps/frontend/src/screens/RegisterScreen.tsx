import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    // Email
    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Ingresa un email válido');
      return false;
    }

    // Username
    if (!username.trim()) {
      setError('El nombre de usuario es requerido');
      return false;
    }
    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (username.trim().length > 20) {
      setError('El nombre de usuario no puede tener más de 20 caracteres');
      return false;
    }
    if (!/^\w+$/.test(username.trim())) {
      setError('El nombre de usuario solo puede contener letras, números y guiones bajos');
      return false;
    }

    // Password
    if (!password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe contener al menos una mayúscula');
      return false;
    }
    if (!/\d/.test(password)) {
      setError('La contraseña debe contener al menos un número');
      return false;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(email.trim().toLowerCase(), username.trim(), password);
      // Navigation happens automatically via AuthContext state change
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Error al crear la cuenta';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏰 Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a la aventura</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder='tu@email.com'
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder='HeroeEpico123'
              placeholderTextColor={theme.colors.textMuted}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearError();
              }}
              autoCapitalize='none'
              autoCorrect={false}
              editable={!isLoading}
            />
            <Text style={styles.hint}>3-20 caracteres. Solo letras, números y _</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder='••••••••'
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              secureTextEntry
              editable={!isLoading}
            />
            <Text style={styles.hint}>Mínimo 8 caracteres, una mayúscula y un número</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder='••••••••'
              placeholderTextColor={theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError();
              }}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={onNavigateToLogin}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.footer}>
          <Text style={styles.termsText}>
            Al crear una cuenta, aceptas nuestros{' '}
            <Text style={styles.termsLink}>Términos de Servicio</Text> y{' '}
            <Text style={styles.termsLink}>Política de Privacidad</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 28,
    color: theme.colors.gold,
    textShadowColor: 'rgba(247, 207, 70, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: theme.colors.text,
  },
  hint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  button: {
    backgroundColor: theme.colors.gold,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 16,
    color: theme.colors.background,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  linkTextBold: {
    fontFamily: 'Lato_700Bold',
    color: theme.colors.gold,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.gold,
    textDecorationLine: 'underline',
  },
});
