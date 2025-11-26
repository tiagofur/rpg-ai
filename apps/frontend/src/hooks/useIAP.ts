/**
 * useIAP Hook - In-App Purchases via RevenueCat
 *
 * React hook for managing subscriptions and purchases.
 * Uses RevenueCatService for iOS/Android, falls back to Stripe for web.
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import type { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import {
    revenueCatService,
    SubscriptionStatus,
    PurchaseResult,
    ENTITLEMENTS,
    EntitlementId,
} from '../services/RevenueCatService';

interface UseIAPReturn {
    /** Available purchase packages */
    packages: PurchasesPackage[];
    /** Whether a purchase/restore is in progress */
    isPurchasing: boolean;
    /** Whether the SDK is loading */
    isLoading: boolean;
    /** Current customer info from RevenueCat */
    customerInfo: CustomerInfo | null;
    /** Current subscription status */
    subscription: SubscriptionStatus;
    /** Error message if any operation failed */
    error: string | null;
    /** Purchase a package */
    purchasePackage: (pack: PurchasesPackage) => Promise<PurchaseResult>;
    /** Restore previous purchases */
    restorePurchases: () => Promise<PurchaseResult>;
    /** Refresh customer info */
    refreshCustomerInfo: () => Promise<void>;
    /** Check if user has specific entitlement */
    hasEntitlement: (entitlementId: EntitlementId) => boolean;
    /** Whether RevenueCat is available (not web) */
    isAvailable: boolean;
}

const DEFAULT_SUBSCRIPTION: SubscriptionStatus = {
    isActive: false,
    tier: 'free',
    expirationDate: null,
    willRenew: false,
    isTrialing: false,
    productId: null,
};

export const useIAP = (userId?: string): UseIAPReturn => {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionStatus>(DEFAULT_SUBSCRIPTION);
    const [error, setError] = useState<string | null>(null);

    // Initialize RevenueCat on mount
    useEffect(() => {
        const init = async () => {
            // Skip on web
            if (Platform.OS === 'web') {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Initialize SDK
                await revenueCatService.initialize(userId);

                // Fetch packages
                const availablePackages = await revenueCatService.getPackages();
                setPackages(availablePackages);

                // Get customer info
                const info = await revenueCatService.getCustomerInfo();
                setCustomerInfo(info);

                // Check subscription status
                const status = await revenueCatService.checkSubscriptionStatus();
                setSubscription(status);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to initialize IAP';
                setError(message);
                console.error('[useIAP] Initialization error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        void init();
    }, [userId]);

    // Listen for customer info updates
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const unsubscribe = revenueCatService.addCustomerInfoListener(async (info) => {
            setCustomerInfo(info);
            const status = await revenueCatService.checkSubscriptionStatus();
            setSubscription(status);
        });

        return unsubscribe;
    }, []);

    // Purchase a package
    const purchasePackage = useCallback(async (pack: PurchasesPackage): Promise<PurchaseResult> => {
        setIsPurchasing(true);
        setError(null);

        try {
            const result = await revenueCatService.purchasePackage(pack);

            if (result.success && result.customerInfo) {
                setCustomerInfo(result.customerInfo);
                const status = await revenueCatService.checkSubscriptionStatus();
                setSubscription(status);
            } else if (result.error && !result.error.userCancelled) {
                setError(result.error.message);
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Purchase failed';
            setError(message);
            return {
                success: false,
                customerInfo: null,
                error: { code: 'UNKNOWN', message, userCancelled: false },
            };
        } finally {
            setIsPurchasing(false);
        }
    }, []);

    // Restore purchases
    const restorePurchases = useCallback(async (): Promise<PurchaseResult> => {
        setIsPurchasing(true);
        setError(null);

        try {
            const result = await revenueCatService.restorePurchases();

            if (result.success && result.customerInfo) {
                setCustomerInfo(result.customerInfo);
                const status = await revenueCatService.checkSubscriptionStatus();
                setSubscription(status);
            } else if (result.error) {
                setError(result.error.message);
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Restore failed';
            setError(message);
            return {
                success: false,
                customerInfo: null,
                error: { code: 'UNKNOWN', message, userCancelled: false },
            };
        } finally {
            setIsPurchasing(false);
        }
    }, []);

    // Refresh customer info
    const refreshCustomerInfo = useCallback(async () => {
        try {
            const info = await revenueCatService.getCustomerInfo();
            setCustomerInfo(info);
            const status = await revenueCatService.checkSubscriptionStatus();
            setSubscription(status);
        } catch (err) {
            console.error('[useIAP] Refresh error:', err);
        }
    }, []);

    // Check entitlement
    const hasEntitlement = useCallback(
        (entitlementId: EntitlementId): boolean => {
            if (!customerInfo) return false;
            return !!customerInfo.entitlements.active[entitlementId];
        },
        [customerInfo]
    );

    return {
        packages,
        isPurchasing,
        isLoading,
        customerInfo,
        subscription,
        error,
        purchasePackage,
        restorePurchases,
        refreshCustomerInfo,
        hasEntitlement,
        isAvailable: Platform.OS !== 'web',
    };
};

// Re-export entitlements for convenience
export { ENTITLEMENTS };
export type { EntitlementId, SubscriptionStatus, PurchaseResult };

