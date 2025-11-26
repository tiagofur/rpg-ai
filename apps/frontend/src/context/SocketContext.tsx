/**
 * SocketContext - Global WebSocket connection state and methods
 *
 * Provides connection status, game session management, and
 * real-time event subscriptions throughout the app.
 */

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import {
  socketService,
  ConnectionStatus,
  NarrativeUpdate,
  CharacterUpdate,
  GameEvent,
} from '../api/socket';
import { useAuth } from './AuthContext';

// ============================================================================
// Types
// ============================================================================

interface SocketState {
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  currentSessionId: string | null;
  isInGame: boolean;
}

interface SocketContextType extends SocketState {
  // Connection actions
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;

  // Game session actions
  joinGame: (sessionId: string) => Promise<boolean>;
  leaveGame: () => void;

  // Game actions
  sendAction: (action: string, params?: unknown) => void;
  sendMessage: (text: string) => void;
  joinLocation: (locationId: string) => void;

  // Event subscription helpers (returns unsubscribe function)
  onNarrative: (callback: (data: NarrativeUpdate) => void) => () => void;
  onCharacterUpdate: (callback: (data: CharacterUpdate) => void) => () => void;
  onGameEvent: (callback: (data: GameEvent) => void) => () => void;
  onError: (callback: (data: { message: string; code?: string }) => void) => () => void;
  onPlayerResolution: (callback: (data: unknown) => void) => () => void;
}

// ============================================================================
// Context
// ============================================================================

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { accessToken, isAuthenticated } = useAuth();

  const [state, setState] = useState<SocketState>({
    status: socketService.status,
    isConnected: socketService.status === 'connected',
    isConnecting: socketService.status === 'connecting',
    hasError: socketService.status === 'error',
    currentSessionId: null,
    isInGame: false,
  });

  // -------------------------------------------------------------------------
  // Subscribe to connection status changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = socketService.onStatusChange((status) => {
      setState((prev) => ({
        ...prev,
        status,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        hasError: status === 'error',
        // Clear game state if disconnected
        isInGame: status === 'connected' ? prev.isInGame : false,
      }));
    });

    return unsubscribe;
  }, []);

  // -------------------------------------------------------------------------
  // Auto-connect when authenticated
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated && accessToken && !state.isConnected && !state.isConnecting) {
      socketService.connect(accessToken);
    }
  }, [isAuthenticated, accessToken, state.isConnected, state.isConnecting]);

  // -------------------------------------------------------------------------
  // Auto-disconnect when logged out
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated && state.isConnected) {
      socketService.disconnect();
      setState((prev) => ({
        ...prev,
        currentSessionId: null,
        isInGame: false,
      }));
    }
  }, [isAuthenticated, state.isConnected]);

  // -------------------------------------------------------------------------
  // Connection Actions
  // -------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (accessToken) {
      socketService.connect(accessToken);
    }
  }, [accessToken]);

  const disconnect = useCallback(() => {
    if (state.currentSessionId) {
      socketService.leaveGame(state.currentSessionId);
    }
    socketService.disconnect();
    setState((prev) => ({
      ...prev,
      currentSessionId: null,
      isInGame: false,
    }));
  }, [state.currentSessionId]);

  const reconnect = useCallback(() => {
    if (accessToken) {
      socketService.reconnect(accessToken);
    }
  }, [accessToken]);

  // -------------------------------------------------------------------------
  // Game Session Actions
  // -------------------------------------------------------------------------
  const joinGame = useCallback(
    (sessionId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!state.isConnected) {
          resolve(false);
          return;
        }

        socketService.joinGame(sessionId, (response) => {
          const success = !!response;
          if (success) {
            setState((prev) => ({
              ...prev,
              currentSessionId: sessionId,
              isInGame: true,
            }));
          }
          resolve(success);
        });
      });
    },
    [state.isConnected]
  );

  const leaveGame = useCallback(() => {
    if (state.currentSessionId) {
      socketService.leaveGame(state.currentSessionId);
    }
    setState((prev) => ({
      ...prev,
      currentSessionId: null,
      isInGame: false,
    }));
  }, [state.currentSessionId]);

  // -------------------------------------------------------------------------
  // Game Actions
  // -------------------------------------------------------------------------
  const sendAction = useCallback(
    (action: string, params?: unknown) => {
      if (state.isConnected && state.isInGame) {
        socketService.sendPlayerAction(action, params);
      }
    },
    [state.isConnected, state.isInGame]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (state.isConnected && state.isInGame) {
        socketService.sendMessage(text);
      }
    },
    [state.isConnected, state.isInGame]
  );

  const joinLocation = useCallback(
    (locationId: string) => {
      if (state.isConnected) {
        socketService.joinLocation(locationId);
      }
    },
    [state.isConnected]
  );

  // -------------------------------------------------------------------------
  // Event Subscription Helpers
  // -------------------------------------------------------------------------
  const onNarrative = useCallback((callback: (data: NarrativeUpdate) => void) => {
    socketService.on('narrative', callback);
    return () => socketService.off('narrative', callback);
  }, []);

  const onCharacterUpdate = useCallback((callback: (data: CharacterUpdate) => void) => {
    socketService.on('character_update', callback);
    return () => socketService.off('character_update', callback);
  }, []);

  const onGameEvent = useCallback((callback: (data: GameEvent) => void) => {
    socketService.on('game:event', callback);
    return () => socketService.off('game:event', callback);
  }, []);

  const onError = useCallback((callback: (data: { message: string; code?: string }) => void) => {
    socketService.on('error', callback);
    return () => socketService.off('error', callback);
  }, []);

  const onPlayerResolution = useCallback((callback: (data: unknown) => void) => {
    socketService.on('player:resolution', callback);
    return () => socketService.off('player:resolution', callback);
  }, []);

  // -------------------------------------------------------------------------
  // Memoized context value
  // -------------------------------------------------------------------------
  const value = useMemo<SocketContextType>(
    () => ({
      // State
      ...state,

      // Connection actions
      connect,
      disconnect,
      reconnect,

      // Game session actions
      joinGame,
      leaveGame,

      // Game actions
      sendAction,
      sendMessage,
      joinLocation,

      // Event subscriptions
      onNarrative,
      onCharacterUpdate,
      onGameEvent,
      onError,
      onPlayerResolution,
    }),
    [
      state,
      connect,
      disconnect,
      reconnect,
      joinGame,
      leaveGame,
      sendAction,
      sendMessage,
      joinLocation,
      onNarrative,
      onCharacterUpdate,
      onGameEvent,
      onError,
      onPlayerResolution,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// ============================================================================
// Selector Hooks (for more specific use cases)
// ============================================================================

/**
 * Hook for connection status only (minimal re-renders)
 */
export function useConnectionStatus() {
  const { status, isConnected, isConnecting, hasError } = useSocket();
  return { status, isConnected, isConnecting, hasError };
}

/**
 * Hook for game session state only
 */
export function useGameSession() {
  const { currentSessionId, isInGame, joinGame, leaveGame } = useSocket();
  return { currentSessionId, isInGame, joinGame, leaveGame };
}

/**
 * Hook for game actions only
 */
export function useGameActions() {
  const { sendAction, sendMessage, joinLocation, isInGame } = useSocket();
  return { sendAction, sendMessage, joinLocation, isInGame };
}
