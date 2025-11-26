import { useCallback, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaywallTrigger } from '../components/Paywall';

/**
 * Usage thresholds for triggering the paywall
 */
interface UsageLimits {
    aiRequests: { current: number; limit: number };
    images: { current: number; limit: number };
    saves: { current: number; limit: number };
    characters: { current: number; limit: number };
}

/**
 * Configuration for smart paywall behavior
 */
interface PaywallConfig {
    /** Minimum time between soft upsells (ms) */
    softUpsellCooldown: number;
    /** Number of actions before showing milestone upsell */
    milestoneActionThreshold: number;
    /** Percentage of limit to show "near limit" warning */
    nearLimitThreshold: number;
    /** Maximum times to show paywall per session */
    maxPaywallsPerSession: number;
}

const DEFAULT_CONFIG: PaywallConfig = {
    softUpsellCooldown: 1000 * 60 * 60 * 24, // 24 hours
    milestoneActionThreshold: 50,
    nearLimitThreshold: 0.8, // 80%
    maxPaywallsPerSession: 3,
};

interface UseSmartPaywallReturn {
    /** Whether paywall should be shown */
    showPaywall: boolean;
    /** Current trigger type */
    paywallTrigger: PaywallTrigger | null;
    /** Current usage for context */
    currentUsage: UsageLimits | null;
    /** Check if user hit a limit and show paywall */
    checkLimit: (type: keyof UsageLimits, current: number, limit: number) => boolean;
    /** Show paywall for premium content access */
    showPremiumContentPaywall: () => void;
    /** Show paywall for locked feature */
    showLockedFeaturePaywall: () => void;
    /** Try to show soft upsell (respects cooldown) */
    trySoftUpsell: () => Promise<boolean>;
    /** Increment action count and check for milestone */
    trackAction: () => Promise<boolean>;
    /** Dismiss the paywall */
    dismissPaywall: () => void;
    /** Handle plan selection */
    handlePlanSelect: (planId: string, isYearly: boolean) => void;
    /** Set custom handler for plan selection */
    setOnPlanSelect: (handler: (planId: string, isYearly: boolean) => void) => void;
}

const STORAGE_KEYS = {
    LAST_SOFT_UPSELL: 'paywall:lastSoftUpsell',
    SESSION_COUNT: 'paywall:sessionCount',
    ACTION_COUNT: 'paywall:actionCount',
    DISMISSED_COUNT: 'paywall:dismissedCount',
};

/**
 * Smart Paywall Hook
 *
 * Manages when and how to show the paywall based on:
 * - Usage limits (AI requests, images, saves, characters)
 * - User behavior (soft upsells, milestones)
 * - Session context (max paywalls per session)
 *
 * Respects cooldowns and doesn't spam the user.
 */
export function useSmartPaywall(
    config: Partial<PaywallConfig> = {}
): UseSmartPaywallReturn {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger | null>(null);
    const [currentUsage, setCurrentUsage] = useState<UsageLimits | null>(null);

    const sessionPaywallCount = useRef(0);
    const onPlanSelectRef = useRef<((planId: string, isYearly: boolean) => void) | null>(null);

    /**
     * Check if we can show another paywall this session
     */
    const canShowPaywall = useCallback(
        (): boolean => sessionPaywallCount.current < finalConfig.maxPaywallsPerSession,
        [finalConfig.maxPaywallsPerSession]
    );

    /**
     * Show the paywall with a specific trigger
     */
    const triggerPaywall = useCallback(
        (trigger: PaywallTrigger, usage?: Partial<UsageLimits>) => {
            if (!canShowPaywall()) return false;

            sessionPaywallCount.current += 1;
            setPaywallTrigger(trigger);
            if (usage) {
                setCurrentUsage((prev) => ({
                    aiRequests: usage.aiRequests ?? prev?.aiRequests ?? { current: 0, limit: 100 },
                    images: usage.images ?? prev?.images ?? { current: 0, limit: 10 },
                    saves: usage.saves ?? prev?.saves ?? { current: 0, limit: 3 },
                    characters: usage.characters ?? prev?.characters ?? { current: 0, limit: 1 },
                }));
            }
            setShowPaywall(true);
            return true;
        },
        [canShowPaywall]
    );

    /**
     * Check if user hit a usage limit
     */
    const checkLimit = useCallback(
        (type: keyof UsageLimits, current: number, limit: number): boolean => {
            // -1 means unlimited
            if (limit === -1) return false;

            const usageData = { [type]: { current, limit } };

            // Hard limit reached
            if (current >= limit) {
                const triggerMap: Record<keyof UsageLimits, PaywallTrigger> = {
                    aiRequests: 'ai_limit_reached',
                    images: 'image_limit_reached',
                    saves: 'save_limit_reached',
                    characters: 'character_limit_reached',
                };
                return triggerPaywall(triggerMap[type], usageData);
            }

            return false;
        },
        [triggerPaywall]
    );

    /**
     * Show paywall for premium content
     */
    const showPremiumContentPaywall = useCallback(() => {
        triggerPaywall('premium_content');
    }, [triggerPaywall]);

    /**
     * Show paywall for locked feature
     */
    const showLockedFeaturePaywall = useCallback(() => {
        triggerPaywall('feature_locked');
    }, [triggerPaywall]);

    /**
     * Try to show a soft upsell (respects cooldown)
     */
    const trySoftUpsell = useCallback(async (): Promise<boolean> => {
        try {
            const lastUpsell = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SOFT_UPSELL);
            const now = Date.now();

            if (lastUpsell) {
                const timeSince = now - parseInt(lastUpsell, 10);
                if (timeSince < finalConfig.softUpsellCooldown) {
                    return false;
                }
            }

            const shown = triggerPaywall('soft_upsell');
            if (shown) {
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_SOFT_UPSELL, now.toString());
            }
            return shown;
        } catch {
            return false;
        }
    }, [finalConfig.softUpsellCooldown, triggerPaywall]);

    /**
     * Track user action and check for milestone upsell
     */
    const trackAction = useCallback(async (): Promise<boolean> => {
        try {
            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.ACTION_COUNT);
            const count = countStr ? parseInt(countStr, 10) + 1 : 1;

            await AsyncStorage.setItem(STORAGE_KEYS.ACTION_COUNT, count.toString());

            // Check for milestone
            if (count > 0 && count % finalConfig.milestoneActionThreshold === 0) {
                return triggerPaywall('session_milestone');
            }

            return false;
        } catch {
            return false;
        }
    }, [finalConfig.milestoneActionThreshold, triggerPaywall]);

    /**
     * Dismiss the paywall
     */
    const dismissPaywall = useCallback(() => {
        setShowPaywall(false);
        setPaywallTrigger(null);

        // Track dismissal for analytics
        void AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_COUNT).then((countStr) => {
            const count = countStr ? parseInt(countStr, 10) + 1 : 1;
            void AsyncStorage.setItem(STORAGE_KEYS.DISMISSED_COUNT, count.toString());
        });
    }, []);

    /**
     * Handle plan selection
     */
    const handlePlanSelect = useCallback((planId: string, isYearly: boolean) => {
        setShowPaywall(false);
        setPaywallTrigger(null);

        // Reset action count after conversion
        void AsyncStorage.setItem(STORAGE_KEYS.ACTION_COUNT, '0');

        if (onPlanSelectRef.current) {
            onPlanSelectRef.current(planId, isYearly);
        }
    }, []);

    /**
     * Set custom handler for plan selection
     */
    const setOnPlanSelect = useCallback(
        (handler: (planId: string, isYearly: boolean) => void) => {
            onPlanSelectRef.current = handler;
        },
        []
    );

    return {
        showPaywall,
        paywallTrigger,
        currentUsage,
        checkLimit,
        showPremiumContentPaywall,
        showLockedFeaturePaywall,
        trySoftUpsell,
        trackAction,
        dismissPaywall,
        handlePlanSelect,
        setOnPlanSelect,
    };
}

export default useSmartPaywall;
