import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, theme } from '../theme';

/**
 * Trigger types for the paywall
 * Used to show contextual messaging and track conversion
 */
export type PaywallTrigger =
  | 'ai_limit_reached' // User hit AI request limit
  | 'image_limit_reached' // User hit image generation limit
  | 'save_limit_reached' // User hit save game limit
  | 'character_limit_reached' // User hit character creation limit
  | 'premium_content' // Tried to access premium content
  | 'feature_locked' // Tried to use locked feature
  | 'soft_upsell' // Gentle reminder after positive experience
  | 'session_milestone'; // After completing significant progress

/**
 * Plan configuration for display
 */
interface PlanOption {
  id: 'basic' | 'premium' | 'supreme';
  name: string;
  price: number;
  priceYearly: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    priceYearly: 99.99,
    features: [
      '1,000 AI requests/month',
      '50 images/month',
      '10 saved games',
      '3 characters',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    priceYearly: 299.99,
    highlight: true,
    badge: 'BEST VALUE',
    features: [
      '10,000 AI requests/month',
      '500 images/month',
      '50 saved games',
      '10 characters',
      'Advanced AI models',
      'Priority support',
      'HD images',
    ],
  },
  {
    id: 'supreme',
    name: 'Supreme',
    price: 99.99,
    priceYearly: 999.99,
    badge: '👑 VIP',
    features: [
      'Unlimited AI requests',
      'Unlimited images',
      'Unlimited saved games',
      'Unlimited characters',
      'Exclusive AI models',
      'Custom art styles',
      'Early access features',
      '24/7 VIP support',
    ],
  },
];

interface PaywallProps {
  /** Whether the paywall modal is visible */
  visible: boolean;
  /** What triggered the paywall */
  trigger: PaywallTrigger;
  /** Callback when user dismisses the paywall */
  onDismiss: () => void;
  /** Callback when user selects a plan */
  onSelectPlan: (planId: string, isYearly: boolean) => void;
  /** Current usage data for context (optional) */
  currentUsage?: {
    aiRequests?: { current: number; limit: number };
    images?: { current: number; limit: number };
    saves?: { current: number; limit: number };
  };
  /** Custom style for container */
  style?: ViewStyle;
}

/**
 * Smart Paywall Component
 *
 * Shows contextual upgrade prompts at strategic moments:
 * - When user hits usage limits
 * - When trying to access premium features
 * - After positive experiences (soft upsell)
 *
 * Features:
 * - Animated modal with blur background
 * - Plan comparison with highlighted best value
 * - Monthly/yearly toggle
 * - Contextual messaging based on trigger
 */
export function Paywall({
  visible,
  trigger,
  onDismiss,
  onSelectPlan,
  currentUsage,
  style,
}: PaywallProps) {
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);

  const getContextualTitle = useCallback((): string => {
    switch (trigger) {
      case 'ai_limit_reached':
        return t('paywall.title.aiLimit', 'Out of AI Power!');
      case 'image_limit_reached':
        return t('paywall.title.imageLimit', 'Out of Image Credits!');
      case 'save_limit_reached':
        return t('paywall.title.saveLimit', 'Save Slots Full!');
      case 'character_limit_reached':
        return t('paywall.title.characterLimit', 'Character Limit Reached!');
      case 'premium_content':
        return t('paywall.title.premium', 'Unlock Premium Content');
      case 'feature_locked':
        return t('paywall.title.locked', 'Feature Locked');
      case 'soft_upsell':
        return t('paywall.title.upsell', 'Enjoying the Adventure?');
      case 'session_milestone':
        return t('paywall.title.milestone', 'Great Progress! Level Up?');
      default:
        return t('paywall.title.default', 'Upgrade Your Adventure');
    }
  }, [trigger, t]);

  const getContextualSubtitle = useCallback((): string => {
    switch (trigger) {
      case 'ai_limit_reached':
        return t(
          'paywall.subtitle.aiLimit',
          `You've used ${currentUsage?.aiRequests?.current ?? 0}/${currentUsage?.aiRequests?.limit ?? 100} AI requests this month. Upgrade to continue your story!`
        );
      case 'image_limit_reached':
        return t(
          'paywall.subtitle.imageLimit',
          'Unlock unlimited stunning AI-generated images for your adventures.'
        );
      case 'save_limit_reached':
        return t(
          'paywall.subtitle.saveLimit',
          'You need more save slots to preserve this adventure. Upgrade now!'
        );
      case 'character_limit_reached':
        return t(
          'paywall.subtitle.characterLimit',
          'Create more heroes and villains for your stories.'
        );
      case 'premium_content':
        return t(
          'paywall.subtitle.premium',
          'This exclusive content is available for premium members.'
        );
      case 'feature_locked':
        return t(
          'paywall.subtitle.locked',
          'Unlock this feature and many more with a subscription.'
        );
      case 'soft_upsell':
        return t(
          'paywall.subtitle.upsell',
          'Take your adventures to the next level with premium features!'
        );
      case 'session_milestone':
        return t(
          'paywall.subtitle.milestone',
          "You've made amazing progress! Ready for even more epic adventures?"
        );
      default:
        return t('paywall.subtitle.default', 'Choose a plan that suits your adventuring style.');
    }
  }, [trigger, currentUsage, t]);

  const handleSelectPlan = useCallback(
    (planId: string) => {
      onSelectPlan(planId, isYearly);
    },
    [isYearly, onSelectPlan]
  );

  const getDiscountPercentage = useCallback((monthly: number, yearly: number): number => {
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <BlurView intensity={80} tint='dark' style={styles.blurContainer}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.container, style]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.emoji}>
                  {trigger === 'soft_upsell' || trigger === 'session_milestone' ? '⭐' : '🔒'}
                </Text>
                <Text style={styles.title}>{getContextualTitle()}</Text>
                <Text style={styles.subtitle}>{getContextualSubtitle()}</Text>
              </View>

              {/* Billing Toggle */}
              <View style={styles.billingToggle}>
                <TouchableOpacity
                  style={[styles.billingOption, !isYearly && styles.billingOptionActive]}
                  onPress={() => setIsYearly(false)}
                >
                  <Text style={[styles.billingText, !isYearly && styles.billingTextActive]}>
                    {t('paywall.monthly', 'Monthly')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.billingOption, isYearly && styles.billingOptionActive]}
                  onPress={() => setIsYearly(true)}
                >
                  <Text style={[styles.billingText, isYearly && styles.billingTextActive]}>
                    {t('paywall.yearly', 'Yearly')}
                  </Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>{t('paywall.save', 'Save')} 17%</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Plans */}
              <View style={styles.plansContainer}>
                {PLANS.map((plan) => {
                  const price = isYearly
                    ? (plan.priceYearly / 12).toFixed(2)
                    : plan.price.toFixed(2);
                  const discount = getDiscountPercentage(plan.price, plan.priceYearly);

                  return (
                    <View
                      key={plan.id}
                      style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
                    >
                      {plan.badge && (
                        <LinearGradient
                          colors={
                            plan.highlight
                              ? [theme.colors.gold, theme.colors.goldDark]
                              : ['#8b3dff', '#6b2ed9']
                          }
                          style={styles.planBadge}
                        >
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </LinearGradient>
                      )}

                      <Text style={styles.planName}>{plan.name}</Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.priceSign}>$</Text>
                        <Text style={styles.priceAmount}>{price}</Text>
                        <Text style={styles.pricePeriod}>/{t('paywall.mo', 'mo')}</Text>
                      </View>

                      {isYearly && (
                        <Text style={styles.yearlyNote}>
                          ${plan.priceYearly}/{t('paywall.year', 'year')} (
                          {t('paywall.save', 'save')} {discount}%)
                        </Text>
                      )}

                      <View style={styles.featuresContainer}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureCheck}>✓</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          plan.highlight && styles.selectButtonHighlight,
                        ]}
                        onPress={() => handleSelectPlan(plan.id)}
                      >
                        {plan.highlight ? (
                          <LinearGradient
                            colors={[theme.colors.gold, theme.colors.goldDark]}
                            style={styles.selectButtonGradient}
                          >
                            <Text style={styles.selectButtonTextHighlight}>
                              {t('paywall.select', 'Select')} {plan.name}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.selectButtonText}>
                            {t('paywall.select', 'Select')} {plan.name}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  🔒 {t('paywall.secure', 'Secure payment with Stripe')}
                </Text>
                <Text style={styles.footerText}>
                  {t('paywall.cancel', 'Cancel anytime, no questions asked')}
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textDim,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  billingOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  billingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  billingTextActive: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.text,
  },
  saveBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.background,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planCardHighlight: {
    borderColor: theme.colors.gold,
    borderWidth: 2,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  priceSign: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: theme.colors.gold,
    marginBottom: 6,
  },
  priceAmount: {
    fontFamily: FONTS.title,
    fontSize: 36,
    color: theme.colors.gold,
  },
  pricePeriod: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 6,
    marginLeft: 2,
  },
  yearlyNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: theme.colors.success,
    marginBottom: 16,
  },
  featuresContainer: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    fontSize: 14,
    color: theme.colors.success,
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textDim,
    flex: 1,
  },
  selectButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  selectButtonHighlight: {
    borderWidth: 0,
  },
  selectButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    paddingVertical: 14,
  },
  selectButtonTextHighlight: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textDim,
  },
});

export default Paywall;
