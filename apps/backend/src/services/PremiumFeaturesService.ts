/**
 * Servicio de Premium Features con Stripe Integration
 * Estándares enterprise - Monetización digna de los dioses
 */

import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  BillingInterval,
  PremiumFeature,
  PLAN_CONFIG,
  hasPremiumAccess,
  type Subscription,
  type CreateSubscriptionResponse,
  type ChangePlanRequest,
  type StripeWebhookEvent
} from '../types/premium.js';
import { UserRole } from '../types/index.js';
import { AuthenticationService } from './AuthenticationService.js';
import { RedisClient } from '../utils/redis.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export class PremiumFeaturesService {
  private stripe: Stripe;
  private authService: AuthenticationService;
  private redis: RedisClient;
  private webhookSecret: string;

  constructor(
    stripeSecretKey: string,
    webhookSecret: string,
    authService: AuthenticationService,
    redis: RedisClient
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      maxNetworkRetries: 3,
      timeout: 30000,
    });
    this.authService = authService;
    this.redis = redis;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Crear un cliente de Stripe
   */
  async createStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId, createdAt: new Date().toISOString() },
      });

      await this.redis.setex(`stripe:customer:${userId}`, 60 * 60 * 24 * 7, customer.id);
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new AppError('Failed to create Stripe customer', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  /**
   * Crear una suscripción
   */
  async createSubscription(
    userId: string,
    plan: SubscriptionPlan,
    billingInterval: BillingInterval,
    paymentMethodId: string
  ): Promise<CreateSubscriptionResponse> {
    try {
      const user = await this.authService.findUserById(userId);
      if (!user) {
        throw new AppError('User not found', ErrorCode.RESOURCE_NOT_FOUND, 404);
      }

      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
        throw new AppError('User already has an active subscription', ErrorCode.RESOURCE_CONFLICT, 409);
      }

      let customerId = await this.redis.get(`stripe:customer:${userId}`);
      if (!customerId) {
        customerId = await this.createStripeCustomer(userId, user.email, user.displayName || undefined);
      }

      await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      const planConfig = PLAN_CONFIG[plan];
      const priceId = billingInterval === BillingInterval.MONTHLY 
        ? planConfig.pricing.stripePriceId
        : planConfig.pricing.stripePriceId.replace('_monthly', '_yearly');

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, plan, billingInterval },
      });

      const subscriptionRecord: Subscription = {
        id: randomUUID(),
        userId,
        plan,
        status: this.mapStripeStatusToSubscriptionStatus(subscription.status),
        billingInterval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        defaultPaymentMethod: paymentMethodId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.redis.setex(`subscription:active:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(subscriptionRecord));
      await this.updateUserRole(userId, plan);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscriptionRecord.id,
        stripeClientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status === 'requires_action' ? 'requires_confirmation' : 'requires_payment_method',
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create subscription', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  /**
   * Obtener suscripción del usuario
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscriptionData = await this.redis.get(`subscription:active:${userId}`);
      return subscriptionData ? JSON.parse(subscriptionData) as Subscription : null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Verificar acceso a característica premium
   */
  async checkPremiumAccess(userId: string, feature: PremiumFeature): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const userPlan = subscription?.plan || SubscriptionPlan.FREE;
      return hasPremiumAccess(userPlan, feature);
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  async processStripeWebhook(signature: string, payload: Buffer): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret) as StripeWebhookEvent;
      console.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;
        default:
          console.log(`Unhandled webhook type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      throw new AppError('Failed to process webhook', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'canceled': SubscriptionStatus.CANCELLED,
      'past_due': SubscriptionStatus.PAST_DUE,
      'unpaid': SubscriptionStatus.UNPAID,
      'incomplete': SubscriptionStatus.INCOMPLETE,
      'incomplete_expired': SubscriptionStatus.EXPIRED,
    };
    return statusMap[stripeStatus] || SubscriptionStatus.EXPIRED;
  }

  private async updateUserRole(userId: string, plan: SubscriptionPlan): Promise<void> {
    const roleMap: Record<SubscriptionPlan, UserRole> = {
      [SubscriptionPlan.FREE]: UserRole.USER,
      [SubscriptionPlan.BASIC]: UserRole.USER,
      [SubscriptionPlan.PREMIUM]: UserRole.PREMIUM_USER,
      [SubscriptionPlan.SUPREME]: UserRole.PREMIUM_USER,
    };
    await this.authService.updateUserRole(userId, roleMap[plan]);
  }

  private async handleSubscriptionUpdated(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      const currentSubscription = await this.getUserSubscription(userId);
      if (currentSubscription) {
        currentSubscription.status = this.mapStripeStatusToSubscriptionStatus(subscription.status);
        currentSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        currentSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        currentSubscription.updatedAt = new Date().toISOString();
        
        await this.redis.setex(`subscription:active:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(currentSubscription));
      }
    }
  }

  private async handleSubscriptionDeleted(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      await this.updateUserRole(userId, SubscriptionPlan.FREE);
      await this.redis.del(`subscription:active:${userId}`);
    }
  }
}