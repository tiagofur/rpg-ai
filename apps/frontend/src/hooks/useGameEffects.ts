import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSettings } from '../context/SettingsContext';

// Sound assets map - placeholder files included, replace with professional audio
// Files located in: assets/sounds/*.mp3
// To generate new placeholders: scripts/generate-audio-placeholders.ps1
const SOUND_FILES: Record<string, number | undefined> = {
    // Combat sounds
    click: require('../../assets/sounds/click.mp3'),
    attack: require('../../assets/sounds/attack.mp3'),
    hit: require('../../assets/sounds/hit.mp3'),
    death: require('../../assets/sounds/death.mp3'),
    // Progress sounds
    levelUp: require('../../assets/sounds/levelup.mp3'),
    success: require('../../assets/sounds/success.mp3'),
    // UI sounds - mapped to existing files
    buttonPress: require('../../assets/sounds/click.mp3'),
    navigate: require('../../assets/sounds/click.mp3'),
    error: require('../../assets/sounds/death.mp3'),
    reward: require('../../assets/sounds/levelup.mp3'),
    notification: require('../../assets/sounds/success.mp3'),
    menuOpen: require('../../assets/sounds/click.mp3'),
    menuClose: require('../../assets/sounds/click.mp3'),
};

type SoundName =
    | 'click' | 'attack' | 'hit' | 'levelUp' | 'death' | 'success'
    | 'buttonPress' | 'navigate' | 'error' | 'reward' | 'notification' | 'menuOpen' | 'menuClose';

export const useGameEffects = () => {
    const { soundEnabled, hapticsEnabled } = useSettings();
    const [sounds, setSounds] = useState<Record<string, Audio.Sound>>({});

    // Preload sounds
    useEffect(() => {
        const loadSounds = async () => {
            const loadedSounds: Record<string, Audio.Sound> = {};

            for (const [key, file] of Object.entries(SOUND_FILES)) {
                if (!file) continue; // Skip if sound file not configured
                try {
                    const { sound } = await Audio.Sound.createAsync(file);
                    loadedSounds[key] = sound;
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn(`Failed to load sound: ${key}`, error);
                }
            }
            setSounds(loadedSounds);
        };

        void loadSounds();

        return () => {
            // Unload sounds on unmount
            Object.values(sounds).forEach(sound => {
                void sound.unloadAsync();
            });
        };
    }, []);

    const playHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
        if (!hapticsEnabled || Platform.OS === 'web') return;

        switch (type) {
            case 'light':
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            case 'success':
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'error':
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
        }
    }, [hapticsEnabled]);

    const playSound = useCallback(async (soundName: SoundName) => {
        if (!soundEnabled) return;

        try {
            const sound = sounds[soundName];
            if (sound) {
                await sound.replayAsync();
            } else {
                // Try to load on demand if not preloaded (fallback)
                // const { sound: newSound } = await Audio.Sound.createAsync(SOUND_FILES[soundName]);
                // await newSound.playAsync();
                // Note: We avoid on-demand loading for performance in this hook
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Error playing sound: ${soundName}`, error);
        }
    }, [soundEnabled, sounds]);

    const playCombatEffect = useCallback((isCrit: boolean, isMiss: boolean) => {
        if (isMiss) {
            playHaptic('light');
        } else if (isCrit) {
            playHaptic('heavy');
            void playSound('hit');
        } else {
            playHaptic('medium');
            void playSound('attack');
        }
    }, [playHaptic, playSound]);

    // UI-specific sound+haptic combinations
    const playButtonPress = useCallback(() => {
        playHaptic('light');
        void playSound('buttonPress');
    }, [playHaptic, playSound]);

    const playNavigate = useCallback(() => {
        playHaptic('light');
        void playSound('navigate');
    }, [playHaptic, playSound]);

    const playError = useCallback(() => {
        playHaptic('error');
        void playSound('error');
    }, [playHaptic, playSound]);

    const playSuccess = useCallback(() => {
        playHaptic('success');
        void playSound('success');
    }, [playHaptic, playSound]);

    const playReward = useCallback(() => {
        playHaptic('success');
        void playSound('reward');
    }, [playHaptic, playSound]);

    const playMenuOpen = useCallback(() => {
        playHaptic('light');
        void playSound('menuOpen');
    }, [playHaptic, playSound]);

    const playMenuClose = useCallback(() => {
        playHaptic('light');
        void playSound('menuClose');
    }, [playHaptic, playSound]);

    return {
        playHaptic,
        playSound,
        playCombatEffect,
        // UI helpers
        playButtonPress,
        playNavigate,
        playError,
        playSuccess,
        playReward,
        playMenuOpen,
        playMenuClose,
    };
};
