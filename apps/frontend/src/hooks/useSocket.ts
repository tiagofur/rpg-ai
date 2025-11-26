import { useState, useEffect, useCallback } from 'react';
import { socketService, ConnectionStatus, ServerToClientEvents } from '../api/socket';

/**
 * Hook para acceder al estado de conexión del WebSocket
 */
export function useSocketStatus() {
    const [status, setStatus] = useState<ConnectionStatus>(socketService.status);

    useEffect(() => {
        const unsubscribe = socketService.onStatusChange(setStatus);
        return unsubscribe;
    }, []);

    return {
        status,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        isDisconnected: status === 'disconnected',
        hasError: status === 'error',
    };
}

/**
 * Hook para suscribirse a eventos del WebSocket
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
) {
    useEffect(() => {
        socketService.on(event, callback);
        return () => {
            socketService.off(event, callback);
        };
    }, [event, callback]);
}

/**
 * Hook para manejar la sesión de juego via WebSocket
 */
export function useGameSocket(sessionId: string | null) {
    const { isConnected } = useSocketStatus();
    const [isJoined, setIsJoined] = useState(false);

    // Join game when connected and sessionId is available
    useEffect(() => {
        if (isConnected && sessionId && !isJoined) {
            socketService.joinGame(sessionId, (response) => {
                if (response) {
                    setIsJoined(true);
                }
            });
        }

        // Leave game when disconnecting
        return () => {
            if (sessionId && isJoined) {
                socketService.leaveGame(sessionId);
                setIsJoined(false);
            }
        };
    }, [isConnected, sessionId, isJoined]);

    const sendAction = useCallback(
        (action: string, params?: unknown) => {
            if (isConnected && isJoined) {
                socketService.sendPlayerAction(action, params);
            }
        },
        [isConnected, isJoined]
    );

    const sendMessage = useCallback(
        (text: string) => {
            if (isConnected && isJoined) {
                socketService.sendMessage(text);
            }
        },
        [isConnected, isJoined]
    );

    return {
        isConnected,
        isJoined,
        sendAction,
        sendMessage,
    };
}

/**
 * Hook para recibir actualizaciones narrativas
 */
export function useNarrative() {
    const [narratives, setNarratives] = useState<
        Array<{
            text: string;
            type: 'narration' | 'dialogue' | 'action' | 'system';
            speaker?: string;
            timestamp: number;
        }>
    >([]);

    const handleNarrative = useCallback(
        (data: { text: string; type: 'narration' | 'dialogue' | 'action' | 'system'; speaker?: string }) => {
            setNarratives((prev) => [
                ...prev,
                {
                    ...data,
                    timestamp: Date.now(),
                },
            ]);
        },
        []
    );

    useSocketEvent('narrative', handleNarrative);

    const clearNarratives = useCallback(() => {
        setNarratives([]);
    }, []);

    return {
        narratives,
        clearNarratives,
    };
}
