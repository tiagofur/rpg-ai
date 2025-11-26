import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
    apple: 'appl_your_api_key',
    google: 'goog_your_api_key',
};

export const useIAP = () => {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                if (Platform.OS === 'ios') {
                    await Purchases.configure({ apiKey: API_KEYS.apple });
                } else if (Platform.OS === 'android') {
                    await Purchases.configure({ apiKey: API_KEYS.google });
                }

                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
                    setPackages(offerings.current.availablePackages);
                }

                const info = await Purchases.getCustomerInfo();
                setCustomerInfo(info);
            } catch (error) {
                // console.error('Error initializing IAP:', error);
            }
        };

        void init();
    }, []);

    const purchasePackage = async (pack: PurchasesPackage) => {
        try {
            setIsPurchasing(true);
            const { customerInfo: newCustomerInfo } = await Purchases.purchasePackage(pack);
            setCustomerInfo(newCustomerInfo);

            // Here you would typically sync with your backend
            // await api.post('/iap/verify', { ... });

            return true;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(error as any).userCancelled) {
                // console.error('Purchase error:', error);
            }
            return false;
        } finally {
            setIsPurchasing(false);
        }
    };

    const restorePurchases = async () => {
        try {
            setIsPurchasing(true);
            const info = await Purchases.restorePurchases();
            setCustomerInfo(info);
        } catch (error) {
            // console.error('Restore error:', error);
        } finally {
            setIsPurchasing(false);
        }
    };

    return {
        packages,
        isPurchasing,
        customerInfo,
        purchasePackage,
        restorePurchases,
    };
};
