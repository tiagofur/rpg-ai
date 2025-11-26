import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useSubscription, Plan } from '../hooks/useSubscription';
import { useIAP } from '../hooks/useIAP';
import { useGameEffects } from '../hooks/useGameEffects';
import { COLORS, FONTS } from '../theme';

interface SubscriptionScreenProps {
  onClose: () => void;
}

const MOCK_PLANS: Plan[] = [
  {
    id: 'pro_monthly',
    name: 'Hero Tier',
    description: 'Unlock the full potential of your journey.',
    pricing: { monthly: 4.99, yearly: 49.99 },
    features: [
      'Unlimited Energy',
      'Exclusive Daily Rewards',
      'Custom Character Avatar',
      'Guild Creation Access',
    ],
  },
  {
    id: 'legend_monthly',
    name: 'Legend Tier',
    description: 'Become a legend with ultimate power.',
    pricing: { monthly: 9.99, yearly: 99.99 },
    features: ['All Hero Features', '2x XP Gain', 'Legendary Starter Item', 'Priority Support'],
  },
];

export function SubscriptionScreen({ onClose }: SubscriptionScreenProps) {
  const { t } = useTranslation();
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const { playSound, playHaptic } = useGameEffects();

  // IAP Hooks
  const { packages, isPurchasing: isIAPPurchasing, purchasePackage, restorePurchases } = useIAP();

  // Stripe Hooks (Web)
  const { config, subscription, createSubscription } = useSubscription();
  const { createPaymentMethod, confirmPayment } = useStripe();
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  useEffect(() => {
    playSound('click'); // Play a sound when opening
  }, []);

  const handleClose = () => {
    playHaptic('light');
    playSound('click');
    onClose();
  };

  const handleIAPPurchase = async (pack: any) => {
    playHaptic('light');
    playSound('click');
    const success = await purchasePackage(pack);
    if (success) {
      playSound('success');
      Alert.alert(t('subscription.success'), t('subscription.successMessage'));
      onClose();
    }
  };

  const handleStripeSubscribe = async (planId: string) => {
    playHaptic('light');
    playSound('click');

    if (!cardDetailsComplete) {
      Alert.alert(t('common.error'), t('subscription.enterCardDetails'));
      return;
    }

    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    if (!paymentMethod) {
      return;
    }

    createSubscription.mutate(
      {
        plan: planId,
        billingInterval: 'monthly',
        paymentMethodId: paymentMethod.id,
      },
      {
        onSuccess: async (data) => {
          if (data.status === 'requires_action' || data.status === 'requires_confirmation') {
            const { error: confirmError } = await confirmPayment(data.stripeClientSecret);
            if (confirmError) {
              Alert.alert(t('common.error'), confirmError.message);
            } else {
              playSound('success');
              Alert.alert(t('subscription.success'), t('subscription.successMessage'));
            }
          } else {
            playSound('success');
            Alert.alert(t('subscription.success'), t('subscription.successMessage'));
          }
        },
        onError: (_error) => {
          Alert.alert(t('common.error'), t('subscription.errorMessage'));
        },
      }
    );
  };

  // Use mock plans if config is not available or empty (for development/demo)
  const displayPlans =
    config.data?.availablePlans && config.data.availablePlans.length > 0
      ? config.data.availablePlans
      : MOCK_PLANS;

  // Only show loading if we are actually fetching and not just falling back to mock
  const isLoading =
    !isMobile &&
    (config.isLoading || subscription.isLoading) &&
    !config.data?.availablePlans &&
    !config.error;

  if (isLoading || (isMobile && isIAPPurchasing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#f7cf46' />
      </View>
    );
  }

  const currentPlanId = subscription.data?.planId;

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('game.premium')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>{t('subscription.chooseDestiny')}</Text>

        {/* Mobile IAP UI */}
        {isMobile && (
          <View>
            {packages.length > 0 ? (
              packages.map((pack) => (
                <TouchableOpacity
                  key={pack.identifier}
                  style={styles.planCard}
                  onPress={() => handleIAPPurchase(pack)}
                  disabled={isIAPPurchasing}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.planName}>{pack.product.title}</Text>
                    <Text style={styles.planPrice}>{pack.product.priceString}</Text>
                    <Text style={styles.planDescription}>{pack.product.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            ) : (
              // Fallback for Mobile if no packages (e.g. simulator)
              <View>
                <Text style={{ color: COLORS.textDim, textAlign: 'center', marginBottom: 20 }}>
                  (Development Mode: No IAP packages found. Showing Mock Plans)
                </Text>
                {MOCK_PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planCard}
                    onPress={() => {
                      playHaptic('light');
                      playSound('click');
                      Alert.alert('Demo Purchase', `You selected ${plan.name}`);
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                      style={styles.cardGradient}
                    >
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>${plan.pricing.monthly}</Text>
                      <Text style={styles.planDescription}>{plan.description}</Text>
                      <View style={styles.featuresList}>
                        {plan.features.map((feature, index) => (
                          <Text key={index} style={styles.featureItem}>
                            • {feature}
                          </Text>
                        ))}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => {
                playHaptic('light');
                playSound('click');
                restorePurchases();
              }}
              disabled={isIAPPurchasing}
            >
              <Text style={styles.restoreText}>{t('subscription.restore')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Web Stripe UI */}
        {!isMobile && (
          <View>
            {!currentPlanId && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>{t('subscription.paymentDetails')}</Text>
                <CardField
                  postalCodeEnabled={false}
                  style={styles.cardField}
                  cardStyle={{
                    backgroundColor: '#FFFFFF',
                    textColor: '#000000',
                  }}
                  onCardChange={(cardDetails) => {
                    setCardDetailsComplete(cardDetails.complete);
                  }}
                />
              </View>
            )}

            {displayPlans.map((plan: Plan) => {
              const isActive = currentPlanId === plan.id;
              return (
                <LinearGradient
                  key={plan.id}
                  colors={
                    isActive
                      ? ['rgba(247, 207, 70, 0.15)', 'rgba(247, 207, 70, 0.05)']
                      : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                  }
                  style={[styles.planCard, isActive && styles.activePlanCard]}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isActive && (
                      <LinearGradient
                        colors={[COLORS.primary, '#ffd700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeBadge}
                      >
                        <Text style={styles.activeBadgeText}>{t('subscription.active')}</Text>
                      </LinearGradient>
                    )}
                  </View>

                  <Text style={styles.planPrice}>
                    ${plan.pricing.monthly}/{t('subscription.month')}
                  </Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                      <Text key={index} style={styles.featureItem}>
                        • {feature}
                      </Text>
                    ))}
                  </View>

                  {!isActive && (
                    <TouchableOpacity
                      style={[
                        styles.subscribeButton,
                        !cardDetailsComplete && !currentPlanId && styles.disabledButton,
                      ]}
                      onPress={() => handleStripeSubscribe(plan.id)}
                      disabled={
                        createSubscription.isPending || (!cardDetailsComplete && !currentPlanId)
                      }
                    >
                      <Text style={styles.subscribeButtonText}>
                        {createSubscription.isPending
                          ? t('common.loading')
                          : t('subscription.subscribe')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.title,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.body,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  cardSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.title,
    marginBottom: 12,
  },
  cardField: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePlanCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    color: COLORS.text,
    fontSize: 22,
    fontFamily: FONTS.title,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#050510',
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  planPrice: {
    color: COLORS.primary,
    fontSize: 28,
    fontFamily: FONTS.title,
    marginBottom: 8,
  },
  planDescription: {
    color: COLORS.textDim,
    marginBottom: 16,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    color: COLORS.text,
    marginBottom: 6,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  subscribeButtonText: {
    color: '#050510',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  restoreButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  restoreText: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
