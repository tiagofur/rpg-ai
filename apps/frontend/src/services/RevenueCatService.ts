/**
 * RevenueCat Service - RPG-AI Supreme
 *
 * Centralized service for handling in-app purchases via RevenueCat.
 * Supports iOS App Store, Google Play Store, and Stripe (web fallback).
 */

import { Platform } from 'react-native';
import Purchases, {
    PurchasesPackage,
    CustomerInfo,
    PurchasesOfferings,
    LOG_LEVEL,
    PURCHASES_ERROR_CODE,
    PurchasesError,
} from 'react-native-purchases';

// Environment-based API keys
// Set these in your .env file:
// EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
// EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx
const API_KEYS = {
    apple: process.env['EXPO_PUBLIC_REVENUECAT_IOS_KEY'] || '',
    google: process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'] || '',
};

// Entitlement identifiers matching RevenueCat dashboard
export const ENTITLEMENTS = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    SUPREME: 'supreme',
} as const;

export type EntitlementId = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

// Product identifiers matching RevenueCat/Store configuration
export const PRODUCTS = {
    BASIC_MONTHLY: 'rpgai_basic_monthly',
    BASIC_YEARLY: 'rpgai_basic_yearly',
    PREMIUM_MONTHLY: 'rpgai_premium_monthly',
    PREMIUM_YEARLY: 'rpgai_premium_yearly',
    SUPREME_MONTHLY: 'rpgai_supreme_monthly',
    SUPREME_YEARLY: 'rpgai_supreme_yearly',
} as const;

export type ProductId = (typeof PRODUCTS)[keyof typeof PRODUCTS];

export interface SubscriptionStatus {
    isActive: boolean;
    tier: 'free' | 'basic' | 'premium' | 'supreme';
    expirationDate: Date | null;
    willRenew: boolean;
    isTrialing: boolean;
    productId: string | null;
}

export interface PurchaseResult {
    success: boolean;
    customerInfo: CustomerInfo | null;
    error?: PurchaseError;
}

export interface PurchaseError {
    code: string;
    message: string;
    userCancelled: boolean;
}

class RevenueCatService {
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize RevenueCat SDK
     * Should be called once at app startup
     */
    async initialize(userId?: string): Promise<void> {
        // Prevent multiple initializations
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize(userId);
        return this.initPromise;
    }

    private async _doInitialize(userId?: string): Promise<void> {
        if (this.isInitialized) return;

        // Skip on web - use Stripe instead
        if (Platform.OS === 'web') {
            console.log('[RevenueCat] Web platform - using Stripe instead');
            return;
        }

        const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

        if (!apiKey) {
            console.warn('[RevenueCat] API key not configured for platform:', Platform.OS);
            return;
        }

        try {
            // Configure with optional user ID for cross-platform identification
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            await Purchases.configure({
                apiKey,
                appUserID: userId ?? null,
                // Enable observer mode if you want to manage subscriptions server-side
                // observerMode: true,
            });

            this.isInitialized = true;
            console.log('[RevenueCat] Initialized successfully');
        } catch (error) {
            console.error('[RevenueCat] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Login user to RevenueCat (links purchases to user account)
     */
    async login(userId: string): Promise<CustomerInfo> {
        if (Platform.OS === 'web') {
            throw new Error('RevenueCat not available on web');
        }

        const { customerInfo } = await Purchases.logIn(userId);
        return customerInfo;
    }

    /**
     * Logout user from RevenueCat
     */
    async logout(): Promise<CustomerInfo> {
        if (Platform.OS === 'web') {
            throw new Error('RevenueCat not available on web');
        }

        return await Purchases.logOut();
    }

    /**
     * Get available subscription offerings
     */
    async getOfferings(): Promise<PurchasesOfferings | null> {
        if (Platform.OS === 'web') return null;

        try {
            const offerings = await Purchases.getOfferings();
            return offerings;
        } catch (error) {
            console.error('[RevenueCat] Failed to get offerings:', error);
            return null;
        }
    }

    /**
     * Get available packages from current offering
     */
    async getPackages(): Promise<PurchasesPackage[]> {
        const offerings = await this.getOfferings();

        if (!offerings?.current?.availablePackages) {
            return [];
        }

        return offerings.current.availablePackages;
    }

    /**
     * Get customer info (subscription status, entitlements)
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (Platform.OS === 'web') return null;

        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('[RevenueCat] Failed to get customer info:', error);
            return null;
        }
    }

    /**
     * Purchase a package
     */
    async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
        if (Platform.OS === 'web') {
            return {
                success: false,
                customerInfo: null,
                error: {
                    code: 'WEB_NOT_SUPPORTED',
                    message: 'In-app purchases not available on web. Use Stripe instead.',
                    userCancelled: false,
                },
            };
        }

        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            return {
                success: true,
                customerInfo,
            };
        } catch (error) {
            const purchaseError = error as PurchasesError;

            return {
                success: false,
                customerInfo: null,
                error: {
                    code: purchaseError.code?.toString() || 'UNKNOWN',
                    message: purchaseError.message || 'Purchase failed',
                    userCancelled: purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
                },
            };
        }
    }

    /**
     * Restore previous purchases
     */
    async restorePurchases(): Promise<PurchaseResult> {
        if (Platform.OS === 'web') {
            return {
                success: false,
                customerInfo: null,
                error: {
                    code: 'WEB_NOT_SUPPORTED',
                    message: 'Restore not available on web.',
                    userCancelled: false,
                },
            };
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            return {
                success: true,
                customerInfo,
            };
        } catch (error) {
            const purchaseError = error as PurchasesError;

            return {
                success: false,
                customerInfo: null,
                error: {
                    code: purchaseError.code?.toString() || 'UNKNOWN',
                    message: purchaseError.message || 'Restore failed',
                    userCancelled: false,
                },
            };
        }
    }

    /**
     * Check if user has an active subscription
     */
    async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
        const defaultStatus: SubscriptionStatus = {
            isActive: false,
            tier: 'free',
            expirationDate: null,
            willRenew: false,
            isTrialing: false,
            productId: null,
        };

        if (Platform.OS === 'web') {
            return defaultStatus;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();

            // Check entitlements in order of priority (highest first)
            const entitlementChecks: Array<{ id: string; tier: SubscriptionStatus['tier'] }> = [
                { id: ENTITLEMENTS.SUPREME, tier: 'supreme' },
                { id: ENTITLEMENTS.PREMIUM, tier: 'premium' },
                { id: ENTITLEMENTS.BASIC, tier: 'basic' },
            ];

            for (const { id, tier } of entitlementChecks) {
                const entitlement = customerInfo.entitlements.active[id];
                if (entitlement) {
                    return {
                        isActive: true,
                        tier,
                        expirationDate: entitlement.expirationDate
                            ? new Date(entitlement.expirationDate)
                            : null,
                        willRenew: entitlement.willRenew,
                        isTrialing: entitlement.periodType === 'TRIAL',
                        productId: entitlement.productIdentifier,
                    };
                }
            }

            return defaultStatus;
        } catch (error) {
            console.error('[RevenueCat] Failed to check subscription:', error);
            return defaultStatus;
        }
    }

    /**
     * Check if user has a specific entitlement
     */
    async hasEntitlement(entitlementId: EntitlementId): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return !!customerInfo.entitlements.active[entitlementId];
        } catch {
            return false;
        }
    }

    /**
     * Add listener for customer info updates
     */
    addCustomerInfoListener(
        listener: (customerInfo: CustomerInfo) => void
    ): () => void {
        if (Platform.OS === 'web') {
            return () => { };
        }

        Purchases.addCustomerInfoUpdateListener(listener);
        return () => {
            // RevenueCat SDK manages listener cleanup internally
        };
    }

    /**
     * Sync purchases with backend
     * Call this after successful purchase to update server-side status
     */
    async syncWithBackend(apiEndpoint: string, authToken: string): Promise<void> {
        const customerInfo = await this.getCustomerInfo();
        if (!customerInfo) return;

        const status = await this.checkSubscriptionStatus();

        try {
            await fetch(`${apiEndpoint}/iap/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    revenueCatUserId: customerInfo.originalAppUserId,
                    activeSubscriptions: customerInfo.activeSubscriptions,
                    entitlements: Object.keys(customerInfo.entitlements.active),
                    tier: status.tier,
                    expirationDate: status.expirationDate?.toISOString(),
                }),
            });
        } catch (error) {
            console.error('[RevenueCat] Backend sync failed:', error);
        }
    }

    /**
     * Check if RevenueCat is available on current platform
     */
    isAvailable(): boolean {
        return Platform.OS !== 'web' && this.isInitialized;
    }
}

// Singleton instance
export const revenueCatService = new RevenueCatService();

export default revenueCatService;
