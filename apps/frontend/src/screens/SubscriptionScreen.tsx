import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useSubscription, Plan } from '../hooks/useSubscription';
import { COLORS, FONTS } from '../theme';

interface SubscriptionScreenProps {
  onClose: () => void;
}

export function SubscriptionScreen({ onClose }: SubscriptionScreenProps) {
  const { t } = useTranslation();
  const { config, subscription, createSubscription } = useSubscription();
  const { createPaymentMethod, confirmPayment } = useStripe();
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  const handleSubscribe = async (planId: string) => {
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
              Alert.alert(t('subscription.success'), t('subscription.successMessage'));
            }
          } else {
            Alert.alert(t('subscription.success'), t('subscription.successMessage'));
          }
        },
        onError: (_error) => {
          Alert.alert(t('common.error'), t('subscription.errorMessage'));
        },
      }
    );
  };

  if (config.isLoading || subscription.isLoading) {
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
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>{t('subscription.chooseDestiny')}</Text>

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

        {config.data?.availablePlans.map((plan: Plan) => {
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
                  onPress={() => handleSubscribe(plan.id)}
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
});
