import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ReactNode } from 'react';

// Mock the auth API
jest.mock('../api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock secure storage
jest.mock('../services/secureStorage', () => ({
  secureStorage: {
    getTokens: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
    saveTokens: jest.fn().mockResolvedValue(undefined),
    saveUser: jest.fn().mockResolvedValue(undefined),
    clearAll: jest.fn().mockResolvedValue(undefined),
    getRefreshToken: jest.fn().mockResolvedValue(null),
  },
}));

// Mock socket service
jest.mock('../api/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

// Wrapper with AuthProvider and SettingsProvider
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>{children}</AuthProvider>
    </SettingsProvider>
  );
}

// Mock navigation callback
const mockOnNavigateToRegister = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the login form correctly', () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      // Check title and subtitle
      expect(screen.getByText('⚔️ RPG-AI')).toBeTruthy();
      expect(screen.getByText('Tu aventura épica te espera')).toBeTruthy();

      // Check form elements
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Contraseña')).toBeTruthy();
      expect(screen.getByPlaceholderText('tu@email.com')).toBeTruthy();
      expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();

      // Check buttons
      expect(screen.getByText('Iniciar Aventura')).toBeTruthy();
      expect(screen.getByText(/¿No tienes cuenta\?/)).toBeTruthy();
    });

    it('shows version number in footer', () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      expect(screen.getByText('Versión 0.1.0-alpha')).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Iniciar Aventura');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/El email es requerido/)).toBeTruthy();
      });
    });

    it('shows error when email is invalid', async () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      fireEvent.changeText(emailInput, 'invalid-email');

      const loginButton = screen.getByText('Iniciar Aventura');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Ingresa un email válido/)).toBeTruthy();
      });
    });

    it('shows error when password is empty', async () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      const loginButton = screen.getByText('Iniciar Aventura');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/La contraseña es requerida/)).toBeTruthy();
      });
    });

    it('shows error when password is too short', async () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');

      const loginButton = screen.getByText('Iniciar Aventura');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe tener al menos 6 caracteres/)).toBeTruthy();
      });
    });

    it('clears error when user starts typing', async () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      // Trigger validation error
      const loginButton = screen.getByText('Iniciar Aventura');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/El email es requerido/)).toBeTruthy();
      });

      // Start typing - error should clear
      const emailInput = screen.getByPlaceholderText('tu@email.com');
      fireEvent.changeText(emailInput, 't');

      await waitFor(() => {
        expect(screen.queryByText(/El email es requerido/)).toBeNull();
      });
    });
  });

  describe('navigation', () => {
    it('calls onNavigateToRegister when register link is pressed', () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const registerLink = screen.getByText(/¿No tienes cuenta\?/);
      fireEvent.press(registerLink);

      expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('form input', () => {
    it('updates email state when typing', () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      fireEvent.changeText(emailInput, 'user@test.com');

      expect(emailInput.props.value).toBe('user@test.com');
    });

    it('updates password state when typing', () => {
      render(
        <TestWrapper>
          <LoginScreen onNavigateToRegister={mockOnNavigateToRegister} />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'secretpassword');

      expect(passwordInput.props.value).toBe('secretpassword');
    });
  });
});
