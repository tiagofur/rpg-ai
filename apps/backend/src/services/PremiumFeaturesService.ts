/**
 * Servicio de Premium Features con Stripe Integration
 * Estándares enterprise - Monetización digna de los dioses
 */

import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  PremiumFeature,
  PLAN_CONFIG,
  hasPremiumAccess,
  type Subscription,
  type CreateSubscriptionResponse,
  type StripeWebhookEvent
} from '../types/premium.js';
import { UserRole } from '../types/index.js';
import { AuthenticationService } from './AuthenticationService.js';
import { RedisClient } from '../utils/redis.js';
import { GameError as AppError, ErrorCode } from '../errors/GameError.js';

export interface IUsageStats {
  aiRequests: number;
  storageUsed: number;
  charactersCreated: number;
}

export class PremiumFeaturesService {
  private readonly stripe: Stripe;

  private readonly authService: AuthenticationService;

  private readonly redis: RedisClient;

  private readonly prisma: PrismaClient;

  private readonly webhookSecret: string;

  public constructor(
    stripeSecretKey: string,
    webhookSecret: string,
    authService: AuthenticationService,
    redis: RedisClient,
    prisma: PrismaClient
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: 3,
      timeout: 30_000,
    });
    this.authService = authService;
    this.redis = redis;
    this.prisma = prisma;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Crear un cliente de Stripe
   */
  public async createStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        ...(name ? { name } : {}),
        metadata: { userId, createdAt: new Date().toISOString() },
      });

      // Update user with stripeCustomerId
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      await this.redis.set(`stripe:customer:${userId}`, customer.id, 'EX', 60 * 60 * 24 * 7);
      return customer.id;
    } catch (error) {
      // console.error('Error creating Stripe customer:', error);
      throw new AppError('Failed to create Stripe customer', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  /**
   * Crear una suscripción
   */
  public async createSubscription(
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

      let customerId = user.stripeCustomerId || await this.redis.get(`stripe:customer:${userId}`);
      if (!customerId) {
        customerId = await this.createStripeCustomer(userId, user.email, user.username || undefined);
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

      const subscriptionRecord = this.createSubscriptionRecord(subscription, userId, plan, billingInterval, customerId, paymentMethodId);

      // Save to DB
      await this.saveSubscriptionToDb(subscriptionRecord);

      await this.redis.set(`subscription:active:${userId}`, JSON.stringify(subscriptionRecord), 'EX', 60 * 60 * 24 * 7);
      await this.updateUserRole(userId, plan);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscriptionRecord.id,
        stripeClientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status === 'requires_action' ? 'requires_confirmation' : 'requires_payment_method',
      };
    } catch (error) {
      // console.error('Error creating subscription:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create subscription', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private createSubscriptionRecord(
    subscription: Stripe.Subscription,
    userId: string,
    plan: SubscriptionPlan,
    billingInterval: BillingInterval,
    customerId: string,
    paymentMethodId: string
  ): Subscription {
    return {
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
  }

  private async saveSubscriptionToDb(subscriptionRecord: Subscription): Promise<void> {
    await this.prisma.subscription.create({
      data: {
        userId: subscriptionRecord.userId,
        plan: subscriptionRecord.plan as any,
        status: subscriptionRecord.status as any,
        billingInterval: subscriptionRecord.billingInterval as any,
        currentPeriodStart: new Date(subscriptionRecord.currentPeriodStart),
        currentPeriodEnd: new Date(subscriptionRecord.currentPeriodEnd),
        cancelAtPeriodEnd: subscriptionRecord.cancelAtPeriodEnd,
        canceledAt: subscriptionRecord.canceledAt ? new Date(subscriptionRecord.canceledAt) : null,
        stripeSubscriptionId: subscriptionRecord.stripeSubscriptionId,
        stripeCustomerId: subscriptionRecord.stripeCustomerId,
        defaultPaymentMethod: subscriptionRecord.defaultPaymentMethod,
      }
    });
  }

  /**
   * Obtener suscripción del usuario
   */
  public async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // Try cache first
      const subscriptionData = await this.redis.get(`subscription:active:${userId}`);
      if (subscriptionData) {
        return JSON.parse(subscriptionData) as Subscription;
      }

      // Fallback to DB
      const databaseSub = await this.prisma.subscription.findUnique({
        where: { userId }
      });

      if (databaseSub) {
        const sub: Subscription = {
          id: databaseSub.id,
          userId: databaseSub.userId,
          plan: databaseSub.plan as SubscriptionPlan,
          status: databaseSub.status as SubscriptionStatus,
          billingInterval: databaseSub.billingInterval as BillingInterval,
          currentPeriodStart: databaseSub.currentPeriodStart.toISOString(),
          currentPeriodEnd: databaseSub.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: databaseSub.cancelAtPeriodEnd,
          canceledAt: databaseSub.canceledAt ? databaseSub.canceledAt.toISOString() : null,
          stripeSubscriptionId: databaseSub.stripeSubscriptionId,
          stripeCustomerId: databaseSub.stripeCustomerId,
          defaultPaymentMethod: databaseSub.defaultPaymentMethod,
          createdAt: databaseSub.createdAt.toISOString(),
          updatedAt: databaseSub.updatedAt.toISOString(),
        };
        // Cache it
        await this.redis.set(`subscription:active:${userId}`, JSON.stringify(sub), 'EX', 60 * 60 * 24 * 7);
        return sub;
      }

      return null;
    } catch {
      // console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Verificar acceso a característica premium
   */
  public async checkPremiumAccess(userId: string, feature: PremiumFeature): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const userPlan = subscription?.plan || SubscriptionPlan.FREE;
      return hasPremiumAccess(userPlan, feature);
    } catch {
      // console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  public async processStripeWebhook(signature: string, payload: Buffer): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret) as unknown as StripeWebhookEvent;
      // console.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.updated': {
          await this.handleSubscriptionUpdated(event);
          break;
        }
        case 'customer.subscription.deleted': {
          await this.handleSubscriptionDeleted(event);
          break;
        }
        default: {
          // console.log(`Unhandled webhook type: ${event.type}`);
        }
      }
    } catch (error) {
      // console.error('Error processing Stripe webhook:', error);
      throw new AppError('Failed to process webhook', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  /**
   * Cancelar suscripción
   */
  public async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new AppError('No active subscription found', ErrorCode.RESOURCE_NOT_FOUND, 404);
    }

    try {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      // Update DB
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd }
      });

      // Update Cache
      subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
      await this.redis.set(`subscription:active:${userId}`, JSON.stringify(subscription), 'EX', 60 * 60 * 24 * 7);
    } catch (error) {
      // console.error('Error canceling subscription:', error);
      throw new AppError('Failed to cancel subscription', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }

  /**
   * Obtener estadísticas de uso
   */
  public async getUsageStats(_userId: string): Promise<IUsageStats> {
    // Implementación dummy por ahora
    // TODO: Implementar lógica real de estadísticas
    // console.log(`Getting usage stats for user ${userId}`);
    return {
      aiRequests: 0,
      storageUsed: 0,
      charactersCreated: 0
    };
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
    const subscription = event.data.object as unknown as Stripe.Subscription;
    const userId = subscription.metadata?.['userId'];

    if (userId) {
      const status = this.mapStripeStatusToSubscriptionStatus(subscription.status);
      const currentPeriodStart = new Date(subscription.current_period_start * 1000);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      // Update DB
      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: status as any,
          currentPeriodStart,
          currentPeriodEnd,
          updatedAt: new Date()
        }
      });

      // Update Cache
      const currentSubscription = await this.getUserSubscription(userId);
      if (currentSubscription) {
        currentSubscription.status = status;
        currentSubscription.currentPeriodStart = currentPeriodStart.toISOString();
        currentSubscription.currentPeriodEnd = currentPeriodEnd.toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (currentSubscription as any).updatedAt = new Date().toISOString();

        await this.redis.set(`subscription:active:${userId}`, JSON.stringify(currentSubscription), 'EX', 60 * 60 * 24 * 7);
      }
    }
  }

  private async handleSubscriptionDeleted(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as unknown as Stripe.Subscription;
    const userId = subscription.metadata?.['userId'];

    if (userId) {
      await this.updateUserRole(userId, SubscriptionPlan.FREE);

      // Update DB
      await this.prisma.subscription.delete({
        where: { stripeSubscriptionId: subscription.id }
      });

      await this.redis.del(`subscription:active:${userId}`);
    }
  }
}