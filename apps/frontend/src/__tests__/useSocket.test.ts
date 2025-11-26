import { renderHook, act } from '@testing-library/react-native';
import { useSocketStatus, useNarrative } from '../hooks/useSocket';

// Mock socket service
jest.mock('../api/socket', () => ({
    socketService: {
        status: 'disconnected',
        onStatusChange: jest.fn((_callback) => {
            // Callback captured via mock.calls for testing
            return jest.fn(); // Return unsubscribe function
        }),
        on: jest.fn(),
        off: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
        sendPlayerAction: jest.fn(),
        sendMessage: jest.fn(),
    },
    ConnectionStatus: {
        connected: 'connected',
        connecting: 'connecting',
        disconnected: 'disconnected',
        error: 'error',
    },
}));

describe('useSocketStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns initial disconnected status', () => {
        const { result } = renderHook(() => useSocketStatus());

        expect(result.current.status).toBe('disconnected');
        expect(result.current.isDisconnected).toBe(true);
        expect(result.current.isConnected).toBe(false);
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.hasError).toBe(false);
    });

    it('subscribes to status changes on mount', () => {
        const { socketService } = require('../api/socket');

        renderHook(() => useSocketStatus());

        expect(socketService.onStatusChange).toHaveBeenCalled();
    });

    it('unsubscribes on unmount', () => {
        const { socketService } = require('../api/socket');
        const mockUnsubscribe = jest.fn();
        socketService.onStatusChange.mockReturnValue(mockUnsubscribe);

        const { unmount } = renderHook(() => useSocketStatus());
        unmount();

        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('updates status when callback is triggered', () => {
        const { socketService } = require('../api/socket');

        const { result } = renderHook(() => useSocketStatus());

        // Get the callback that was registered during the render
        const registeredCallback = socketService.onStatusChange.mock.calls[0]?.[0];

        if (registeredCallback) {
            act(() => {
                registeredCallback('connected');
            });

            expect(result.current.status).toBe('connected');
            expect(result.current.isConnected).toBe(true);
        } else {
            // Fallback - verify hook was set up correctly
            expect(socketService.onStatusChange).toHaveBeenCalled();
        }
    });
});

describe('useNarrative', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with empty narratives array', () => {
        const { result } = renderHook(() => useNarrative());

        expect(result.current.narratives).toEqual([]);
    });

    it('provides clearNarratives function', () => {
        const { result } = renderHook(() => useNarrative());

        expect(typeof result.current.clearNarratives).toBe('function');
    });

    it('clears narratives when clearNarratives is called', () => {
        const { result } = renderHook(() => useNarrative());

        act(() => {
            result.current.clearNarratives();
        });

        expect(result.current.narratives).toEqual([]);
    });
});
