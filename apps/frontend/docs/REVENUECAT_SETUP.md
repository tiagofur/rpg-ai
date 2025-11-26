# RevenueCat Integration Guide

## Overview

RPG-AI Supreme uses RevenueCat for managing in-app purchases on iOS and Android. For web, Stripe is used as a fallback.

## Setup Steps

### 1. Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Create a new project: "RPG-AI Supreme"
3. Note your project ID

### 2. Configure App Store Connect (iOS)

1. In App Store Connect, go to your app → Subscriptions
2. Create subscription groups:
   - **rpgai_subscriptions** (group name)

3. Create products: | Product ID | Reference Name | Duration | Price | |------------|---------------|----------|-------|
   | `rpgai_basic_monthly` | Basic Monthly | 1 Month | $4.99 | | `rpgai_basic_yearly` | Basic Yearly | 1 Year | $39.99 |
   | `rpgai_premium_monthly` | Premium Monthly | 1 Month | $9.99 | | `rpgai_premium_yearly` | Premium Yearly | 1 Year |
   $79.99 | | `rpgai_supreme_monthly` | Supreme Monthly | 1 Month | $19.99 | | `rpgai_supreme_yearly` | Supreme Yearly |
   1 Year | $149.99 |

4. Get your App-Specific Shared Secret:
   - App Store Connect → App → App Information → App-Specific Shared Secret
   - Copy this for RevenueCat

### 3. Configure Google Play Console (Android)

1. In Google Play Console, go to your app → Monetization → Products → Subscriptions
2. Create the same products as iOS with matching IDs
3. Get your Service Account JSON for RevenueCat

### 4. Configure RevenueCat Dashboard

1. **Apps**: Add iOS and Android apps
2. **API Keys**: Get your platform-specific API keys
3. **Entitlements**: Create entitlements:
   - `basic` - Basic tier access
   - `premium` - Premium tier access
   - `supreme` - Supreme tier access

4. **Products**: Link store products to entitlements
5. **Offerings**: Create "default" offering with all packages

### 5. Add API Keys to App

Create/update `.env` in `apps/frontend/`:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_android_key_here
```

### 6. Backend Webhook (Optional)

For real-time subscription status updates:

1. In RevenueCat → Project Settings → Integrations → Webhooks
2. Add endpoint: `https://your-api.com/api/iap/webhook`
3. Select events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`
   - `BILLING_ISSUE`

## Code Usage

### Basic Usage

```tsx
import { useIAP, ENTITLEMENTS } from '../hooks/useIAP';

function SubscriptionScreen() {
  const { packages, isPurchasing, isLoading, subscription, purchasePackage, restorePurchases, hasEntitlement } =
    useIAP();

  // Check current subscription
  if (subscription.isActive) {
    console.log(`User has ${subscription.tier} subscription`);
  }

  // Check specific entitlement
  if (hasEntitlement(ENTITLEMENTS.PREMIUM)) {
    // Show premium features
  }

  // Purchase
  const handlePurchase = async (pack) => {
    const result = await purchasePackage(pack);
    if (result.success) {
      // Purchase successful!
    }
  };

  // Restore
  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      // Restored!
    }
  };
}
```

### Service Direct Usage

```tsx
import { revenueCatService } from '../services/RevenueCatService';

// Initialize at app startup
await revenueCatService.initialize(userId);

// Check subscription
const status = await revenueCatService.checkSubscriptionStatus();

// Listen for updates
const unsubscribe = revenueCatService.addCustomerInfoListener((info) => {
  console.log('Subscription updated:', info);
});
```

## Testing

### Sandbox Testing

1. **iOS**: Use Sandbox tester accounts in App Store Connect
2. **Android**: Use test accounts in Google Play Console
3. Subscriptions renew quickly in sandbox (e.g., monthly = 5 minutes)

### Test Cards (Stripe Web)

For web Stripe integration, use test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Troubleshooting

### Common Issues

1. **"No offerings found"**
   - Ensure products are approved in App Store Connect
   - Check RevenueCat product configuration
   - Verify API key is correct for platform

2. **"Purchase cancelled"**
   - User cancelled - this is normal, not an error

3. **"Network error"**
   - Check device connectivity
   - Verify RevenueCat SDK is initialized

### Debug Mode

The SDK automatically logs in debug mode (`__DEV__`). Check console for RevenueCat logs.

## Architecture

```
┌─────────────────────────────────────────┐
│              App Layer                   │
│    useIAP() hook / Subscription UI      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        RevenueCatService                │
│   (Singleton, platform detection)        │
└─────────────────┬───────────────────────┘
                  │
         ┌───────┴───────┐
         │               │
┌────────▼────┐   ┌──────▼─────┐
│   iOS/Android│   │    Web     │
│  RevenueCat │   │   Stripe   │
│     SDK     │   │  (fallback)│
└─────────────┘   └────────────┘
         │               │
         ▼               ▼
┌─────────────┐   ┌────────────┐
│ App Store / │   │   Stripe   │
│ Play Store  │   │   API      │
└─────────────┘   └────────────┘
```

## Related Files

- `src/services/RevenueCatService.ts` - Core service
- `src/hooks/useIAP.ts` - React hook
- `src/components/Paywall.tsx` - Paywall UI
- `src/routes/iap.ts` (backend) - Webhook handler
