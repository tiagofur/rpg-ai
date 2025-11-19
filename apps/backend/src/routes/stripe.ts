/**
 * Rutas de Stripe y Premium Features
 * Estándares enterprise - Monetización digna de los dioses
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PremiumFeaturesService } from '../services/PremiumFeaturesService.js';
import { AuthenticationService } from '../services/AuthenticationService.js';
import { RedisClient } from '../utils/redis.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { 
  SubscriptionPlan, 
  BillingInterval,
  PremiumFeature,
  PLAN_CONFIG,
  type CreateSubscriptionResponse,
  type ChangePlanRequest
} from '../types/premium.js';
import { authenticate } from '../plugins/auth.js';

export interface StripeRoutesOptions {
  premiumService: PremiumFeaturesService;
  authService: AuthenticationService;
  redis: RedisClient;
}

/**
 * Validar método de pago
 */
const validatePaymentMethod = (paymentMethodId: string): boolean => {
  return paymentMethodId && paymentMethodId.startsWith('pm_');
};

/**
 * Validar plan de suscripción
 */
const validateSubscriptionPlan = (plan: string): boolean => {
  return Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan);
};

/**
 * Validar intervalo de facturación
 */
const validateBillingInterval = (interval: string): boolean => {
  return Object.values(BillingInterval).includes(interval as BillingInterval);
};

/**
 * Registrar rutas de Stripe
 */
export async function stripeRoutes(
  fastify: FastifyInstance,
  options: StripeRoutesOptions
) {
  const { premiumService, authService, redis } = options;

  /**
   * @route GET /stripe/config
   * @description Obtener configuración pública de Stripe
   */
  fastify.get('/stripe/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_default',
        availablePlans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
          id: key,
          name: config.name,
          description: config.description,
          pricing: config.pricing,
          features: config.features,
          limits: config.limits,
        })),
      };
    } catch (error) {
      console.error('Error getting Stripe config:', error);
      throw new AppError('Failed to get Stripe config', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  });

  /**
   * @route POST /stripe/create-subscription
   * @description Crear una nueva suscripción
   */
  fastify.post('/stripe/create-subscription', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['plan', 'billingInterval', 'paymentMethodId'],
        properties: {
          plan: { type: 'string', enum: Object.values(SubscriptionPlan) },
          billingInterval: { type: 'string', enum: Object.values(BillingInterval) },
          paymentMethodId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: {
    plan: SubscriptionPlan;
    billingInterval: BillingInterval;
    paymentMethodId: string;
  } }>, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const { plan, billingInterval, paymentMethodId } = request.body;

      // Validaciones adicionales
      if (!validatePaymentMethod(paymentMethodId)) {
        throw new AppError('Invalid payment method ID', ErrorCode.VALIDATION_ERROR, 400);
      }

      if (!validateSubscriptionPlan(plan)) {
        throw new AppError('Invalid subscription plan', ErrorCode.VALIDATION_ERROR, 400);
      }

      if (!validateBillingInterval(billingInterval)) {
        throw new AppError('Invalid billing interval', ErrorCode.VALIDATION_ERROR, 400);
      }

      const result = await premiumService.createSubscription(
        userId,
        plan,
        billingInterval,
        paymentMethodId
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Failed to create subscription',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });

  /**
   * @route GET /stripe/subscription
   * @description Obtener suscripción actual del usuario
   */
  fastify.get('/stripe/subscription', {
    preHandler: authenticate,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const subscription = await premiumService.getUserSubscription(userId);

      if (!subscription) {
        return {
          success: true,
          data: null,
        };
      }

      // Obtener estadísticas de uso
      const usageStats = await premiumService.getUsageStats(userId);

      return {
        success: true,
        data: {
          subscription,
          usageStats,
        },
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new AppError(
        'Failed to get subscription',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });

  /**
   * @route POST /stripe/cancel-subscription
   * @description Cancelar suscripción actual
   */
  fastify.post('/stripe/cancel-subscription', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          cancelAtPeriodEnd: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: {
    cancelAtPeriodEnd?: boolean;
  } }>, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const { cancelAtPeriodEnd = true } = request.body;

      await premiumService.cancelSubscription(userId, cancelAtPeriodEnd);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Failed to cancel subscription',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });

  /**
   * @route POST /stripe/webhook
   * @description Webhook de Stripe para eventos de suscripción
   */
  fastify.post('/stripe/webhook', {
    config: {
      rawBody: true,
    },
  }, async (request: FastifyRequest<{ Body: Buffer }>, reply: FastifyReply) => {
    try {
      const signature = request.headers['stripe-signature'] as string;
      
      if (!signature) {
        throw new AppError('Missing Stripe signature', ErrorCode.UNAUTHORIZED, 401);
      }

      await premiumService.processStripeWebhook(signature, request.body);

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        'Failed to process webhook',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });

  /**
   * @route GET /premium/check/:feature
   * @description Verificar acceso a característica premium
   */
  fastify.get('/premium/check/:feature', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          feature: { type: 'string', enum: Object.values(PremiumFeature) },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { feature: PremiumFeature } }>, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const { feature } = request.params;

      const hasAccess = await premiumService.checkPremiumAccess(userId, feature);

      return {
        success: true,
        data: {
          feature,
          hasAccess,
        },
      };
    } catch (error) {
      console.error('Error checking premium access:', error);
      throw new AppError(
        'Failed to check premium access',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });

  /**
   * @route GET /premium/usage
   * @description Obtener estadísticas de uso de características premium
   */
  fastify.get('/premium/usage', {
    preHandler: authenticate,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const usageStats = await premiumService.getUsageStats(userId);

      return {
        success: true,
        data: usageStats,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw new AppError(
        'Failed to get usage stats',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  });
}