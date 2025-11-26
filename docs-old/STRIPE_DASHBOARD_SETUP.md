# 🎯 Stripe Dashboard Setup Guide

> **Guía paso a paso para configurar productos de suscripción en Stripe**  
> **Proyecto:** RPG-AI Supreme  
> **Fecha:** 25 de Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Crear Productos](#crear-productos)
4. [Configurar Webhooks](#configurar-webhooks)
5. [Obtener Claves API](#obtener-claves-api)
6. [Testing](#testing)

---

## ✅ Requisitos Previos

- [ ] Cuenta de Stripe creada ([stripe.com/register](https://dashboard.stripe.com/register))
- [ ] Email verificado
- [ ] Acceso al Dashboard de Stripe

---

## 🚀 Configuración Inicial

### 1. Activar Modo Test

1. En el Dashboard, verifica que estés en **Test Mode** (toggle en la esquina superior derecha)
2. El indicador debe mostrar: `⚡ Test Mode`

### 2. Configurar Información de Negocio

1. Ve a **Settings** → **Account details**
2. Completa:
   - Business name: `RPG-AI Supreme`
   - Business description: `AI-powered RPG game with infinite storytelling`
   - Support email: `tu-email@ejemplo.com`

---

## 💎 Crear Productos

### Producto 1: Hero Tier (Basic)

**Paso 1 - Crear Producto:**

1. Ve a **Products** → **Add product**
2. Llena los campos:
   ```
   Name: Hero Tier
   Description: Unlock the full potential of your journey
   ```
3. Click **Save product**

**Paso 2 - Crear Precio Mensual:**

1. En la sección **Pricing**:
   ```
   Pricing model: Standard pricing
   Price: $4.99 USD
   Billing period: Monthly
   ```
2. **Advanced options**:
   ```
   ID: hero_monthly (opcional pero recomendado)
   Usage type: Licensed
   ```
3. Click **Add price**

**Paso 3 - Crear Precio Anual (opcional):**

1. Click **Add another price**
2. Llena:
   ```
   Price: $49.99 USD (17% descuento vs mensual)
   Billing period: Yearly
   ID: hero_yearly
   ```
3. Click **Add price**

**Paso 4 - Copiar Price ID:**

1. Ve a **View all prices**
2. Copia el **Price ID** (empieza con `price_...`)
3. Guárdalo para configuración:
   ```
   Hero Monthly: price_xxxxxxxxxxxxx
   Hero Yearly: price_xxxxxxxxxxxxx
   ```

---

### Producto 2: Legend Tier (Premium)

**Paso 1 - Crear Producto:**

1. **Products** → **Add product**
2. Llena:
   ```
   Name: Legend Tier
   Description: Become a legend with ultimate power
   ```
3. **Save product**

**Paso 2 - Crear Precio Mensual:**

```
Price: $9.99 USD
Billing period: Monthly
ID: legend_monthly
```

**Paso 3 - Crear Precio Anual:**

```
Price: $99.99 USD
Billing period: Yearly
ID: legend_yearly
```

**Paso 4 - Copiar Price IDs:**

```
Legend Monthly: price_xxxxxxxxxxxxx
Legend Yearly: price_xxxxxxxxxxxxx
```

---

### Resumen de Productos Creados

| Producto    | Plan    | Precio | Price ID               |
| ----------- | ------- | ------ | ---------------------- |
| Hero Tier   | Mensual | $4.99  | `price_hero_monthly`   |
| Hero Tier   | Anual   | $49.99 | `price_hero_yearly`    |
| Legend Tier | Mensual | $9.99  | `price_legend_monthly` |
| Legend Tier | Anual   | $99.99 | `price_legend_yearly`  |

---

## 🔔 Configurar Webhooks

### 1. Crear Endpoint

1. Ve a **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Llena:

   ```
   Endpoint URL: https://tu-dominio.com/api/stripe/webhook

   (Para desarrollo local con ngrok):
   Endpoint URL: https://xxxxx.ngrok.io/api/stripe/webhook
   ```

### 2. Seleccionar Eventos

Marca los siguientes eventos:

#### Subscriptions (Required)

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

#### Checkout (Required)

- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`

#### Payments (Recommended)

- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

#### Customer (Optional)

- ✅ `customer.created`
- ✅ `customer.updated`

### 3. Guardar y Obtener Signing Secret

1. Click **Add endpoint**
2. En la página del endpoint, click **Reveal** en "Signing secret"
3. Copia el valor (empieza con `whsec_...`)
4. Guárdalo para el `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🔑 Obtener Claves API

### Test Mode Keys (Desarrollo)

1. Ve a **Developers** → **API keys**
2. Copia las claves:

**Publishable key (frontend):**

```
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Secret key (backend):**

```
sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Configurar en .env

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Testing

### 1. Tarjetas de Test

Stripe provee tarjetas de prueba:

| Número                | Caso de Uso            |
| --------------------- | ---------------------- |
| `4242 4242 4242 4242` | Pago exitoso           |
| `4000 0025 0000 3155` | Requiere autenticación |
| `4000 0000 0000 9995` | Pago declinado         |

**Datos adicionales (cualquier valor válido):**

- Fecha de expiración: Cualquier fecha futura (ej: 12/34)
- CVC: Cualquier 3 dígitos (ej: 123)
- ZIP: Cualquier código postal (ej: 12345)

### 2. Test de Suscripción

**Flujo de prueba completo:**

1. Inicia el servidor backend:

   ```bash
   cd apps/backend
   pnpm dev
   ```

2. Inicia el frontend:

   ```bash
   cd apps/frontend
   pnpm start
   ```

3. En la app:
   - Click en "⭐ Premium"
   - Selecciona un plan
   - Ingresa tarjeta de test: `4242 4242 4242 4242`
   - Completa pago

4. Verifica en Stripe Dashboard:
   - **Customers**: Debe aparecer nuevo customer
   - **Subscriptions**: Debe aparecer nueva subscription activa
   - **Events**: Debes ver los eventos de webhook

### 3. Test de Webhook

**Opción A: ngrok (Recomendado para desarrollo local)**

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3333
ngrok http 3333

# Usar URL de ngrok en webhook endpoint
# Ejemplo: https://abc123.ngrok.io/api/stripe/webhook
```

**Opción B: Stripe CLI**

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
choco install stripe  # Windows

# Login
stripe login

# Escuchar webhooks
stripe listen --forward-to localhost:3333/api/stripe/webhook

# Ejecutar test
stripe trigger customer.subscription.created
```

### 4. Verificar Logs

En el backend verás logs como:

```
✅ Webhook received: customer.subscription.created
✅ Subscription created for user: user_xxxxx
✅ User role updated to: premium
```

---

## 📊 Dashboard de Producción

### Cuando estés listo para producción:

1. **Activar cuenta:**
   - Ve a **Settings** → **Complete account**
   - Proporciona información legal/fiscal
   - Verifica identidad

2. **Cambiar a Live Mode:**
   - Toggle a **Live Mode** en Dashboard
   - Crea los mismos productos con precios reales
   - Obtén nuevas claves API (empiezan con `pk_live_` y `sk_live_`)

3. **Actualizar .env de producción:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx (nuevo endpoint)
   ```

---

## ✅ Checklist Final

- [ ] Productos creados en Test Mode (Hero Tier, Legend Tier)
- [ ] Precios configurados (mensual y anual)
- [ ] Price IDs copiados y guardados
- [ ] Webhook endpoint configurado
- [ ] Eventos de webhook seleccionados
- [ ] Claves API copiadas al `.env`
- [ ] Test de pago exitoso con tarjeta de prueba
- [ ] Webhooks recibidos correctamente
- [ ] Subscription activa en Dashboard

---

## 🔗 Enlaces Útiles

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Documentación Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhook Events Reference](https://stripe.com/docs/api/events/types)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## 🆘 Troubleshooting

### Error: "No such price"

- Verifica que el Price ID sea correcto
- Asegúrate de estar en el modo correcto (Test/Live)

### Webhook no recibe eventos

- Verifica la URL del endpoint
- Revisa que los eventos estén seleccionados
- Confirma el signing secret en `.env`

### Payment failed

- Usa tarjetas de test válidas
- Verifica que el monto sea > $0.50 USD
- Revisa logs del backend para errores

---

**¡Configuración completa! Tu sistema de pagos está listo para procesar suscripciones.** 💰
