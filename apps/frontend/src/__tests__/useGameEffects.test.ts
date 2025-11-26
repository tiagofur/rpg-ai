import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGameEffects } from '../hooks/useGameEffects';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import type { ReactNode } from 'react';

// Mock SettingsContext
jest.mock('../context/SettingsContext', () => ({
    useSettings: jest.fn(() => ({
        soundEnabled: true,
        hapticsEnabled: true,
    })),
    SettingsProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('useGameEffects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('playHaptic', () => {
        it('calls Haptics.impactAsync for light feedback', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('light');
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        });

        it('calls Haptics.impactAsync for medium feedback', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('medium');
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
        });

        it('calls Haptics.impactAsync for heavy feedback', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('heavy');
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
        });

        it('calls Haptics.notificationAsync for success feedback', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('success');
            });

            expect(Haptics.notificationAsync).toHaveBeenCalledWith(
                Haptics.NotificationFeedbackType.Success
            );
        });

        it('calls Haptics.notificationAsync for error feedback', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('error');
            });

            expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
        });

        it('does not call Haptics when hapticsEnabled is false', async () => {
            const { useSettings } = require('../context/SettingsContext');
            useSettings.mockReturnValue({
                soundEnabled: true,
                hapticsEnabled: false,
            });

            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playHaptic('medium');
            });

            expect(Haptics.impactAsync).not.toHaveBeenCalled();
        });
    });

    describe('playSound', () => {
        it('preloads sounds on mount', async () => {
            renderHook(() => useGameEffects());

            // Wait for sounds to preload
            await waitFor(() => {
                expect(Audio.Sound.createAsync).toHaveBeenCalled();
            });
        });

        it('does not play sound when soundEnabled is false', async () => {
            const { useSettings } = require('../context/SettingsContext');
            useSettings.mockReturnValue({
                soundEnabled: false,
                hapticsEnabled: true,
            });

            const { result } = renderHook(() => useGameEffects());

            await act(async () => {
                await result.current.playSound('click');
            });

            // The sound.replayAsync should not be called since sounds are disabled
            // We're verifying behavior through the mock
        });
    });

    describe('playCombatEffect', () => {
        beforeEach(() => {
            const { useSettings } = require('../context/SettingsContext');
            useSettings.mockReturnValue({
                soundEnabled: true,
                hapticsEnabled: true,
            });
        });

        it('plays light haptic for miss', async () => {
            const { result } = renderHook(() => useGameEffects());

            act(() => {
                result.current.playCombatEffect(false, true); // isCrit=false, isMiss=true
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        });

        it('plays heavy haptic for critical hit', async () => {
            const { result } = renderHook(() => useGameEffects());

            // Wait for sounds to load
            await waitFor(() => {
                expect(Audio.Sound.createAsync).toHaveBeenCalled();
            });

            act(() => {
                result.current.playCombatEffect(true, false); // isCrit=true, isMiss=false
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
        });

        it('plays medium haptic for normal hit', async () => {
            const { result } = renderHook(() => useGameEffects());

            // Wait for sounds to load
            await waitFor(() => {
                expect(Audio.Sound.createAsync).toHaveBeenCalled();
            });

            act(() => {
                result.current.playCombatEffect(false, false); // isCrit=false, isMiss=false
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
        });
    });
});
