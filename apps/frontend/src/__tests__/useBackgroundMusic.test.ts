import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Audio } from 'expo-av';

// Mock SettingsContext
const mockSettings = {
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    notificationsEnabled: true,
    toggleSound: jest.fn(),
    toggleMusic: jest.fn(),
    toggleHaptics: jest.fn(),
    toggleNotifications: jest.fn(),
};

jest.mock('../context/SettingsContext', () => ({
    useSettings: () => mockSettings,
}));

// Import after mocks
import { useBackgroundMusic, MusicTrack } from '../hooks/useBackgroundMusic';

describe('useBackgroundMusic', () => {
    const mockSound = {
        playAsync: jest.fn().mockResolvedValue(undefined),
        pauseAsync: jest.fn().mockResolvedValue(undefined),
        stopAsync: jest.fn().mockResolvedValue(undefined),
        unloadAsync: jest.fn().mockResolvedValue(undefined),
        setVolumeAsync: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSettings.musicEnabled = true;
        (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
            sound: mockSound,
            status: { isLoaded: true },
        });
    });

    describe('initialization', () => {
        it('should initialize with no track playing', () => {
            const { result } = renderHook(() => useBackgroundMusic());

            expect(result.current.currentTrack).toBeNull();
            expect(result.current.isPlaying).toBe(false);
        });

        it('should have default volume of 0.3', () => {
            const { result } = renderHook(() => useBackgroundMusic());

            expect(result.current.volume).toBe(0.3);
        });

        it('should accept custom initial volume', () => {
            const { result } = renderHook(() =>
                useBackgroundMusic({ initialVolume: 0.5 })
            );

            expect(result.current.volume).toBe(0.5);
        });

        it('should configure audio mode on mount', () => {
            renderHook(() => useBackgroundMusic());

            expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
        });
    });

    describe('playTrack', () => {
        it('should play exploration track', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            await waitFor(() => {
                expect(result.current.currentTrack).toBe('exploration');
                expect(result.current.isPlaying).toBe(true);
            });
        });

        it('should play combat track', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('combat');
            });

            await waitFor(() => {
                expect(result.current.currentTrack).toBe('combat');
                expect(result.current.isPlaying).toBe(true);
            });
        });

        it('should not play when music is disabled', async () => {
            mockSettings.musicEnabled = false;
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            expect(result.current.currentTrack).toBeNull();
            expect(result.current.isPlaying).toBe(false);
        });

        it('should load audio with correct options', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
                expect.anything(), // The require() asset
                expect.objectContaining({
                    isLooping: true,
                    volume: 0,
                    shouldPlay: true,
                }),
                expect.any(Function)
            );
        });
    });

    describe('stopMusic', () => {
        it('should stop playing and reset state', async () => {
            const { result } = renderHook(() =>
                useBackgroundMusic({ fadeDuration: 0 })
            );

            // Start playing
            await act(async () => {
                await result.current.playTrack('exploration');
            });

            // Stop
            await act(async () => {
                await result.current.stopMusic();
            });

            await waitFor(() => {
                expect(result.current.currentTrack).toBeNull();
                expect(result.current.isPlaying).toBe(false);
            });
        });
    });

    describe('pauseMusic and resumeMusic', () => {
        it('should pause playing music', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            await act(async () => {
                await result.current.pauseMusic();
            });

            await waitFor(() => {
                expect(result.current.isPlaying).toBe(false);
                expect(mockSound.pauseAsync).toHaveBeenCalled();
            });
        });

        it('should resume paused music', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            await act(async () => {
                await result.current.pauseMusic();
            });

            await act(async () => {
                await result.current.resumeMusic();
            });

            await waitFor(() => {
                expect(result.current.isPlaying).toBe(true);
                expect(mockSound.playAsync).toHaveBeenCalled();
            });
        });

        it('should not resume when music is disabled', async () => {
            mockSettings.musicEnabled = false;
            const { result } = renderHook(() => useBackgroundMusic());

            // Try to resume without playing first - should not work
            await act(async () => {
                await result.current.resumeMusic();
            });

            // isPlaying should still be false since music is disabled
            expect(result.current.isPlaying).toBe(false);
            expect(mockSound.playAsync).not.toHaveBeenCalled();
        });
    });

    describe('setVolume', () => {
        it('should update volume state', () => {
            const { result } = renderHook(() => useBackgroundMusic());

            act(() => {
                result.current.setVolume(0.7);
            });

            expect(result.current.volume).toBe(0.7);
        });

        it('should clamp volume between 0 and 1', () => {
            const { result } = renderHook(() => useBackgroundMusic());

            act(() => {
                result.current.setVolume(1.5);
            });
            expect(result.current.volume).toBe(1);

            act(() => {
                result.current.setVolume(-0.5);
            });
            expect(result.current.volume).toBe(0);
        });

        it('should update sound volume when playing', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            await act(async () => {
                await result.current.playTrack('exploration');
            });

            act(() => {
                result.current.setVolume(0.8);
            });

            expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.8);
        });
    });

    describe('track types', () => {
        it('should accept valid track names', async () => {
            const { result } = renderHook(() => useBackgroundMusic());

            const validTracks: MusicTrack[] = ['exploration', 'combat'];

            for (const track of validTracks) {
                await act(async () => {
                    await result.current.playTrack(track);
                });

                expect(result.current.currentTrack).toBe(track);
            }
        });
    });
});
