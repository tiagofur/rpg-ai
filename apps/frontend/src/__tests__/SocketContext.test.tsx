import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import {
  SocketProvider,
  useSocket,
  useConnectionStatus,
  useGameSession,
  useGameActions,
} from '../context/SocketContext';
import { socketService } from '../api/socket';

// Mock socket service
jest.mock('../api/socket', () => {
  const mockListeners = new Map<string, Set<(data: unknown) => void>>();
  const mockStatusListeners = new Set<(mockStatus: string) => void>();
  let mockCurrentStatus: string = 'disconnected';

  return {
    socketService: {
      get status() {
        return mockCurrentStatus;
      },
      connect: jest.fn(() => {
        mockCurrentStatus = 'connected';
        mockStatusListeners.forEach((cb) => cb('connected'));
      }),
      disconnect: jest.fn(() => {
        mockCurrentStatus = 'disconnected';
        mockStatusListeners.forEach((cb) => cb('disconnected'));
      }),
      reconnect: jest.fn(() => {
        mockCurrentStatus = 'connected';
        mockStatusListeners.forEach((cb) => cb('connected'));
      }),
      onStatusChange: jest.fn((mockCallback: (mockStatus: string) => void) => {
        mockStatusListeners.add(mockCallback);
        mockCallback(mockCurrentStatus);
        return () => mockStatusListeners.delete(mockCallback);
      }),
      joinGame: jest.fn(
        (_mockSessionId: string, mockCallback?: (mockResponse: unknown) => void) => {
          if (mockCallback) mockCallback({ success: true });
        }
      ),
      leaveGame: jest.fn(),
      sendPlayerAction: jest.fn(),
      sendMessage: jest.fn(),
      joinLocation: jest.fn(),
      on: jest.fn((mockEvent: string, mockCallback: (data: unknown) => void) => {
        if (!mockListeners.has(mockEvent)) {
          mockListeners.set(mockEvent, new Set());
        }
        mockListeners.get(mockEvent)?.add(mockCallback);
      }),
      off: jest.fn((mockEvent: string, mockCallback?: (data: unknown) => void) => {
        if (mockCallback) {
          mockListeners.get(mockEvent)?.delete(mockCallback);
        } else {
          mockListeners.delete(mockEvent);
        }
      }),
      // Test helpers
      __setStatus: (mockStatus: string) => {
        mockCurrentStatus = mockStatus;
        mockStatusListeners.forEach((cb) => cb(mockStatus));
      },
      __emit: (mockEvent: string, mockData: unknown) => {
        mockListeners.get(mockEvent)?.forEach((cb) => cb(mockData));
      },
      __reset: () => {
        mockCurrentStatus = 'disconnected';
        mockListeners.clear();
        mockStatusListeners.clear();
      },
    },
    ConnectionStatus: 'disconnected',
  };
});

// Mock auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    accessToken: 'test-token',
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock secure storage
jest.mock('../services/secureStorage', () => ({
  secureStorage: {
    getTokens: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
  },
}));

// Helper to render with provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SocketProvider>{children}</SocketProvider>
);

describe('SocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (socketService as unknown as { __reset: () => void }).__reset();
  });

  describe('useSocket', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSocket());
      }).toThrow('useSocket must be used within a SocketProvider');

      consoleSpy.mockRestore();
    });

    it('should auto-connect when authenticated', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Since mock auth returns authenticated=true with token,
      // and auto-connect is triggered, status should be 'connected'
      expect(result.current.status).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.currentSessionId).toBeNull();
      expect(result.current.isInGame).toBe(false);
    });

    it('should update state when connection status changes', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus(
          'connecting'
        );
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connecting');
        expect(result.current.isConnecting).toBe(true);
      });

      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should connect when calling connect', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      act(() => {
        result.current.connect();
      });

      expect(socketService.connect).toHaveBeenCalledWith('test-token');
    });

    it('should disconnect when calling disconnect', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // First connect
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      act(() => {
        result.current.disconnect();
      });

      expect(socketService.disconnect).toHaveBeenCalled();
    });

    it('should reconnect when calling reconnect', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      act(() => {
        result.current.reconnect();
      });

      expect(socketService.reconnect).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Game session management', () => {
    it('should join game successfully', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Set connected state
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      let joinResult: boolean | undefined;

      await act(async () => {
        joinResult = await result.current.joinGame('session-123');
      });

      expect(joinResult).toBe(true);
      expect(result.current.currentSessionId).toBe('session-123');
      expect(result.current.isInGame).toBe(true);
    });

    it('should call joinGame on socket service when connected', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Auto-connected, should succeed
      expect(result.current.isConnected).toBe(true);

      let joinResult: boolean | undefined;

      await act(async () => {
        joinResult = await result.current.joinGame('session-456');
      });

      // Since connected, joinGame should be called and succeed
      expect(socketService.joinGame).toHaveBeenCalled();
      expect(joinResult).toBe(true);
      expect(result.current.isInGame).toBe(true);
      expect(result.current.currentSessionId).toBe('session-456');
    });

    it('should leave game', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Connect and join
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      await act(async () => {
        await result.current.joinGame('session-123');
      });

      act(() => {
        result.current.leaveGame();
      });

      expect(socketService.leaveGame).toHaveBeenCalledWith('session-123');
      expect(result.current.currentSessionId).toBeNull();
      expect(result.current.isInGame).toBe(false);
    });
  });

  describe('Game actions', () => {
    it('should send action when in game', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Connect and join
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      await act(async () => {
        await result.current.joinGame('session-123');
      });

      act(() => {
        result.current.sendAction('attack', { targetId: 'enemy-1' });
      });

      expect(socketService.sendPlayerAction).toHaveBeenCalledWith('attack', {
        targetId: 'enemy-1',
      });
    });

    it('should not send action when not in game', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      act(() => {
        result.current.sendAction('attack', { targetId: 'enemy-1' });
      });

      expect(socketService.sendPlayerAction).not.toHaveBeenCalled();
    });

    it('should send message when in game', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Connect and join
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      await act(async () => {
        await result.current.joinGame('session-123');
      });

      act(() => {
        result.current.sendMessage('Hello world');
      });

      expect(socketService.sendMessage).toHaveBeenCalledWith('Hello world');
    });

    it('should join location when connected', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      act(() => {
        result.current.joinLocation('forest-clearing');
      });

      expect(socketService.joinLocation).toHaveBeenCalledWith('forest-clearing');
    });
  });

  describe('Event subscriptions', () => {
    it('should subscribe to narrative events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();

      act(() => {
        result.current.onNarrative(callback);
      });

      expect(socketService.on).toHaveBeenCalledWith('narrative', callback);
    });

    it('should unsubscribe from narrative events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();
      let unsubscribe: (() => void) | undefined;

      act(() => {
        unsubscribe = result.current.onNarrative(callback);
      });

      act(() => {
        unsubscribe?.();
      });

      expect(socketService.off).toHaveBeenCalledWith('narrative', callback);
    });

    it('should subscribe to character update events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();

      act(() => {
        result.current.onCharacterUpdate(callback);
      });

      expect(socketService.on).toHaveBeenCalledWith('character_update', callback);
    });

    it('should subscribe to game events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();

      act(() => {
        result.current.onGameEvent(callback);
      });

      expect(socketService.on).toHaveBeenCalledWith('game:event', callback);
    });

    it('should subscribe to error events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();

      act(() => {
        result.current.onError(callback);
      });

      expect(socketService.on).toHaveBeenCalledWith('error', callback);
    });

    it('should subscribe to player resolution events', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      const callback = jest.fn();

      act(() => {
        result.current.onPlayerResolution(callback);
      });

      expect(socketService.on).toHaveBeenCalledWith('player:resolution', callback);
    });
  });

  describe('Selector hooks', () => {
    it('useConnectionStatus should return only connection state', () => {
      const { result } = renderHook(() => useConnectionStatus(), { wrapper });

      expect(result.current.status).toBeDefined();
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.isConnecting).toBeDefined();
      expect(result.current.hasError).toBeDefined();
    });

    it('useGameSession should return session state and actions', () => {
      const { result } = renderHook(() => useGameSession(), { wrapper });

      expect(result.current.currentSessionId).toBeDefined();
      expect(result.current.isInGame).toBeDefined();
      expect(typeof result.current.joinGame).toBe('function');
      expect(typeof result.current.leaveGame).toBe('function');
    });

    it('useGameActions should return game action functions', () => {
      const { result } = renderHook(() => useGameActions(), { wrapper });

      expect(typeof result.current.sendAction).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.joinLocation).toBe('function');
      expect(result.current.isInGame).toBeDefined();
    });
  });

  describe('Auto-connection behavior', () => {
    it('should clear game state when disconnected', async () => {
      const { result } = renderHook(() => useSocket(), { wrapper });

      // Connect and join a game
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus('connected');
      });

      await act(async () => {
        await result.current.joinGame('session-123');
      });

      expect(result.current.isInGame).toBe(true);

      // Disconnect
      act(() => {
        (socketService as unknown as { __setStatus: (s: string) => void }).__setStatus(
          'disconnected'
        );
      });

      await waitFor(() => {
        expect(result.current.isInGame).toBe(false);
      });
    });
  });
});
