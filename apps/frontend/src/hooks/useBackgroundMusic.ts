import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useSettings } from '../context/SettingsContext';

// Ambient music tracks - replace placeholders with real audio (30-60+ seconds recommended)
const MUSIC_TRACKS = {
    exploration: require('../../assets/sounds/ambient_exploration.mp3'),
    combat: require('../../assets/sounds/ambient_combat.mp3'),
} as const;

export type MusicTrack = keyof typeof MUSIC_TRACKS;

interface UseBackgroundMusicOptions {
    /** Initial volume (0-1). Default: 0.3 */
    initialVolume?: number;
    /** Fade duration in ms. Default: 1000 */
    fadeDuration?: number;
}

interface UseBackgroundMusicReturn {
    /** Currently playing track name, or null if stopped */
    currentTrack: MusicTrack | null;
    /** Whether music is currently playing */
    isPlaying: boolean;
    /** Current volume (0-1) */
    volume: number;
    /** Play a specific track (with crossfade if another is playing) */
    playTrack: (track: MusicTrack) => Promise<void>;
    /** Stop music with fade out */
    stopMusic: () => Promise<void>;
    /** Pause music (keeps position) */
    pauseMusic: () => Promise<void>;
    /** Resume paused music */
    resumeMusic: () => Promise<void>;
    /** Set volume (0-1) */
    setVolume: (volume: number) => void;
}

export const useBackgroundMusic = (
    options: UseBackgroundMusicOptions = {}
): UseBackgroundMusicReturn => {
    const { initialVolume = 0.3, fadeDuration = 1000 } = options;
    const { musicEnabled } = useSettings();

    const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(initialVolume);

    const soundRef = useRef<Audio.Sound | null>(null);
    const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Configure audio mode for background music
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Failed to configure audio mode:', error);
            }
        };
        void configureAudio();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
            }
            if (soundRef.current) {
                void soundRef.current.unloadAsync();
            }
        };
    }, []);

    // Stop music when music is disabled in settings
    useEffect(() => {
        if (!musicEnabled && isPlaying) {
            void stopMusic();
        }
    }, [musicEnabled]);

    const clearFadeInterval = useCallback(() => {
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
        }
    }, []);

    const fadeOut = useCallback(async (sound: Audio.Sound): Promise<void> => {
        return new Promise((resolve) => {
            let currentVol = volume;
            const step = volume / (fadeDuration / 50); // 50ms intervals

            clearFadeInterval();
            fadeIntervalRef.current = setInterval(async () => {
                currentVol -= step;
                if (currentVol <= 0) {
                    clearFadeInterval();
                    try {
                        await sound.stopAsync();
                        await sound.unloadAsync();
                    } catch {
                        // Ignore errors during cleanup
                    }
                    resolve();
                } else {
                    try {
                        await sound.setVolumeAsync(currentVol);
                    } catch {
                        // Sound may have been unloaded
                        clearFadeInterval();
                        resolve();
                    }
                }
            }, 50);
        });
    }, [volume, fadeDuration, clearFadeInterval]);

    const fadeIn = useCallback(async (sound: Audio.Sound, targetVolume: number): Promise<void> => {
        return new Promise((resolve) => {
            let currentVol = 0;
            const step = targetVolume / (fadeDuration / 50);

            clearFadeInterval();
            fadeIntervalRef.current = setInterval(async () => {
                currentVol += step;
                if (currentVol >= targetVolume) {
                    clearFadeInterval();
                    try {
                        await sound.setVolumeAsync(targetVolume);
                    } catch {
                        // Ignore
                    }
                    resolve();
                } else {
                    try {
                        await sound.setVolumeAsync(currentVol);
                    } catch {
                        clearFadeInterval();
                        resolve();
                    }
                }
            }, 50);
        });
    }, [fadeDuration, clearFadeInterval]);

    const playTrack = useCallback(async (track: MusicTrack): Promise<void> => {
        if (!musicEnabled) return;

        // If same track is already playing, do nothing
        if (currentTrack === track && isPlaying) return;

        try {
            // Fade out current track if playing
            if (soundRef.current && isPlaying) {
                const oldSound = soundRef.current;
                soundRef.current = null;
                await fadeOut(oldSound);
            }

            // Load and play new track
            const { sound } = await Audio.Sound.createAsync(
                MUSIC_TRACKS[track],
                {
                    isLooping: true,
                    volume: 0, // Start at 0 for fade in
                    shouldPlay: true,
                },
                (status: AVPlaybackStatus) => {
                    if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
                        // Track finished (shouldn't happen with looping, but just in case)
                        setIsPlaying(false);
                    }
                }
            );

            soundRef.current = sound;
            setCurrentTrack(track);
            setIsPlaying(true);

            // Fade in
            await fadeIn(sound, volume);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to play track: ${track}`, error);
            setIsPlaying(false);
            setCurrentTrack(null);
        }
    }, [musicEnabled, currentTrack, isPlaying, volume, fadeOut, fadeIn]);

    const stopMusic = useCallback(async (): Promise<void> => {
        clearFadeInterval();

        if (soundRef.current) {
            try {
                await fadeOut(soundRef.current);
            } catch {
                // Try to force stop
                try {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                } catch {
                    // Ignore cleanup errors
                }
            }
            soundRef.current = null;
        }

        setIsPlaying(false);
        setCurrentTrack(null);
    }, [fadeOut, clearFadeInterval]);

    const pauseMusic = useCallback(async (): Promise<void> => {
        if (soundRef.current && isPlaying) {
            try {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Failed to pause music:', error);
            }
        }
    }, [isPlaying]);

    const resumeMusic = useCallback(async (): Promise<void> => {
        if (!musicEnabled) return;

        if (soundRef.current && !isPlaying) {
            try {
                await soundRef.current.playAsync();
                setIsPlaying(true);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Failed to resume music:', error);
            }
        }
    }, [musicEnabled, isPlaying]);

    const setVolume = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clampedVolume);

        if (soundRef.current) {
            void soundRef.current.setVolumeAsync(clampedVolume);
        }
    }, []);

    return {
        currentTrack,
        isPlaying,
        volume,
        playTrack,
        stopMusic,
        pauseMusic,
        resumeMusic,
        setVolume,
    };
};
