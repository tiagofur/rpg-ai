/**
 * Tipos de suscripción y premium features
 * Estándares enterprise - Monetización digna de los dioses
 */

import type { UUID, ISOTimestamp } from './index.js';

/**
 * Planes de suscripción disponibles
 */
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  SUPREME = 'supreme',
}

/**
 * Estado de la suscripción
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  EXPIRED = 'expired',
}

/**
 * Intervalo de facturación
 */
export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Tipos de eventos de Stripe
 */
export enum StripeEventType {
  PAYMENT_SUCCESS = 'payment_intent.succeeded',
  PAYMENT_FAILED = 'payment_intent.payment_failed',
  SUBSCRIPTION_CREATED = 'customer.subscription.created',
  SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
}

/**
 * Características premium disponibles
 */
export enum PremiumFeature {
  // AI Features
  UNLIMITED_AI_REQUESTS = 'unlimited_ai_requests',
  ADVANCED_AI_MODELS = 'advanced_ai_models',
  CUSTOM_AI_PERSONALITY = 'custom_ai_personality',
  AI_PRIORITY_PROCESSING = 'ai_priority_processing',

  // Game Features
  UNLIMITED_SAVED_GAMES = 'unlimited_saved_games',
  PREMIUM_CHARACTERS = 'premium_characters',
  EXCLUSIVE_ITEMS = 'exclusive_items',
  ADVANCED_CUSTOMIZATION = 'advanced_customization',
  PRIORITY_MATCHMAKING = 'priority_matchmaking',

  // Content Features
  UNLIMITED_IMAGES = 'unlimited_images',
  HD_IMAGES = 'hd_images',
  CUSTOM_ART_STYLES = 'custom_art_styles',
  PREMIUM_TEMPLATES = 'premium_templates',

  // Social Features
  PREMIUM_PROFILE_BADGE = 'premium_profile_badge',
  CUSTOM_USERNAME_COLORS = 'custom_username_colors',
  PRIORITY_SUPPORT = 'priority_support',
  EARLY_ACCESS = 'early_access',
}

/**
 * Límites por plan
 */
export interface PlanLimits {
  aiRequestsPerMonth: number;
  imagesPerMonth: number;
  savedGames: number;
  characters: number;
  storageMB: number;
  maxPartySize: number;
}

/**
 * Configuración de precios por plan
 */
export interface PlanPricing {
  monthly: number;
  yearly: number;
  currency: string;
  stripePriceId: string;
}

/**
 * Suscripción de usuario
 */
export interface Subscription extends BaseEntity {
  userId: UUID;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: ISOTimestamp;
  currentPeriodEnd: ISOTimestamp;
  cancelAtPeriodEnd: boolean;
  canceledAt: ISOTimestamp | null;

  // Stripe
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  defaultPaymentMethod?: string | null;

  // IAP
  iapProvider?: 'apple' | 'google' | null;
  iapTransactionId?: string | null;
  iapOriginalTransactionId?: string | null;
}

/**
 * Entidad base con propiedades comunes
 */
interface BaseEntity {
  readonly id: UUID;
  readonly createdAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
}

/**
 * Uso de características premium por usuario
 */
export interface PremiumUsage extends BaseEntity {
  userId: UUID;
  feature: PremiumFeature;
  usageCount: number;
  limit: number;
  periodStart: ISOTimestamp;
  periodEnd: ISOTimestamp;
  lastUsed: ISOTimestamp;
}

/**
 * Historial de pagos
 */
export interface PaymentHistory extends BaseEntity {
  userId: UUID;
  subscriptionId: UUID;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  stripePaymentIntentId: string;
  stripeInvoiceId: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Configuración de Stripe
 */
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Respuesta de creación de suscripción
 */
export interface CreateSubscriptionResponse {
  subscriptionId: UUID;
  stripeClientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'active';
}

/**
 * Solicitud de cambio de plan
 */
export interface ChangePlanRequest {
  newPlan: SubscriptionPlan;
  billingInterval: BillingInterval;
  prorate: boolean;
}

/**
 * Webhook de Stripe
 */
export interface StripeWebhookEvent {
  id: string;
  type: StripeEventType;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}

/**
 * Configuración de planes
 */
export const PLAN_CONFIG = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    description: 'Perfecto para comenzar tu aventura',
    limits: {
      aiRequestsPerMonth: 100,
      imagesPerMonth: 10,
      savedGames: 3,
      characters: 1,
      storageMB: 100,
      maxPartySize: 2,
    },
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD',
      stripePriceId: '',
    },
    features: [
      'Acceso básico a IA',
      '3 partidas guardadas',
      '1 personaje',
      'Soporte comunitario',
    ],
  },
  [SubscriptionPlan.BASIC]: {
    name: 'Basic',
    description: 'Para aventureros ocasionales',
    limits: {
      aiRequestsPerMonth: 1000,
      imagesPerMonth: 50,
      savedGames: 10,
      characters: 3,
      storageMB: 500,
      maxPartySize: 4,
    },
    pricing: {
      monthly: 9.99,
      yearly: 99.99,
      currency: 'USD',
      stripePriceId: 'price_basic_monthly',
    },
    features: [
      '1000 peticiones IA/mes',
      '50 imágenes/mes',
      '10 partidas guardadas',
      '3 personajes',
      'Soporte por email',
    ],
  },
  [SubscriptionPlan.PREMIUM]: {
    name: 'Premium',
    description: 'Para aventureros serios',
    limits: {
      aiRequestsPerMonth: 10_000,
      imagesPerMonth: 500,
      savedGames: 50,
      characters: 10,
      storageMB: 2000,
      maxPartySize: 8,
    },
    pricing: {
      monthly: 29.99,
      yearly: 299.99,
      currency: 'USD',
      stripePriceId: 'price_premium_monthly',
    },
    features: [
      '10000 peticiones IA/mes',
      '500 imágenes/mes',
      '50 partidas guardadas',
      '10 personajes',
      'Modelos IA avanzados',
      'Soporte prioritario',
    ],
  },
  [SubscriptionPlan.SUPREME]: {
    name: 'Supreme',
    description: 'Para los dioses del RPG',
    limits: {
      aiRequestsPerMonth: -1, // Ilimitado
      imagesPerMonth: -1, // Ilimitado
      savedGames: -1, // Ilimitado
      characters: -1, // Ilimitado
      storageMB: 10_000,
      maxPartySize: 16,
    },
    pricing: {
      monthly: 99.99,
      yearly: 999.99,
      currency: 'USD',
      stripePriceId: 'price_supreme_monthly',
    },
    features: [
      'IA ilimitada',
      'Imágenes ilimitadas',
      'Partidas ilimitadas',
      'Personajes ilimitados',
      'Modelos IA exclusivos',
      'Personalización avanzada',
      'Acceso anticipado',
      'Soporte VIP 24/7',
    ],
  },
} as const;

/**
 * Verifica si un usuario tiene acceso a una característica premium
 */
export const hasPremiumAccess = (
  userPlan: SubscriptionPlan,
  feature: PremiumFeature
): boolean => {
  // Características gratuitas
  const freeFeatures = [
    PremiumFeature.PREMIUM_PROFILE_BADGE, // Solo el badge es premium
  ];

  if (userPlan === SubscriptionPlan.FREE) {
    return freeFeatures.includes(feature);
  }

  // Características básicas
  const basicFeatures = [
    ...freeFeatures,
    PremiumFeature.PRIORITY_SUPPORT,
    PremiumFeature.AI_PRIORITY_PROCESSING,
  ];

  if (userPlan === SubscriptionPlan.BASIC) {
    return basicFeatures.includes(feature);
  }

  // Características premium
  const premiumFeatures = [
    ...basicFeatures,
    PremiumFeature.ADVANCED_AI_MODELS,
    PremiumFeature.UNLIMITED_IMAGES,
    PremiumFeature.HD_IMAGES,
    PremiumFeature.PREMIUM_TEMPLATES,
    PremiumFeature.CUSTOM_USERNAME_COLORS,
    PremiumFeature.PREMIUM_CHARACTERS,
    PremiumFeature.EXCLUSIVE_ITEMS,
    PremiumFeature.EARLY_ACCESS,
  ];

  if (userPlan === SubscriptionPlan.PREMIUM) {
    return premiumFeatures.includes(feature);
  }

  // Supreme tiene todo
  return true;
};