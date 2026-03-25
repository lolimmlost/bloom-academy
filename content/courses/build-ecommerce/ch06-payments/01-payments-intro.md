---
id: "01-payments-intro"
title: "Introduction to Payments"
type: "info"
xp: 20
difficulty: 2
order: 1
prerequisites: []
hints: []
---

# Introduction to Payments

You have built a product catalog, a shopping cart, and user authentication. Now comes the moment of truth: actually accepting money. Payment processing is one of the most critical parts of any e-commerce application — and one of the most important to get right, because real money and real trust are on the line.

## Why Use a Payment Processor?

You might wonder: "Why not just collect credit card numbers and charge them ourselves?" The short answer: **you should never do this**. Here is why.

### PCI Compliance

**PCI DSS** (Payment Card Industry Data Security Standard) is a set of security requirements that any business handling credit card data must follow. The requirements are extensive:

- Encrypted storage of card data
- Regular security audits
- Network segmentation
- Access controls and monitoring
- Penetration testing
- And dozens more requirements

Achieving PCI compliance costs tens of thousands of dollars for small businesses and millions for larger ones. More importantly, if you store card data and get breached, you face fines, lawsuits, and the kind of reputation damage that can end a business.

When you use a payment processor like Stripe, **card numbers never touch your server**. Stripe collects card details directly from the customer's browser, processes the payment, and sends you a confirmation. Your server never sees, stores, or transmits sensitive card data — which means you operate at the lowest level of PCI compliance (SAQ-A), requiring minimal effort.

### Fraud Protection

Payment processors employ teams of engineers and data scientists dedicated to detecting fraud. Stripe's fraud detection system, Radar, uses machine learning trained on billions of transactions to identify suspicious activity. Building anything remotely comparable in-house would be impractical.

### Global Payments

Accepting payments from customers worldwide involves:

- Supporting dozens of card networks (Visa, Mastercard, Amex, JCB, UnionPay...)
- Handling multiple currencies and conversion rates
- Supporting local payment methods (iDEAL in the Netherlands, Bancontact in Belgium, PIX in Brazil...)
- Complying with regional regulations (Strong Customer Authentication in Europe)

Stripe handles all of this behind a single API.

## How Stripe Works

At a high level, the Stripe payment flow for our e-commerce store looks like this:

```
Customer clicks "Checkout"
  → Your server creates a Checkout Session with Stripe
  → Stripe returns a URL for a hosted payment page
  → Customer is redirected to Stripe's payment page
  → Customer enters card details (on Stripe's servers, not yours)
  → Stripe processes the payment
  → Customer is redirected back to your success page
  → Stripe sends a webhook to your server confirming payment
  → Your server creates the order in the database
```

Notice that your server never handles card details. The customer enters their payment information directly on Stripe's hosted page, and you receive confirmation via a webhook after the payment succeeds.

## Key Stripe Concepts

Before we start coding, let's understand the core objects in Stripe's system:

### Customers

A **Customer** object in Stripe represents a buyer. It stores:
- Email address
- Payment methods (saved cards)
- Transaction history
- Subscription information

You typically create a Stripe Customer when a user registers on your platform and store the Stripe customer ID in your database alongside the user record.

### Checkout Sessions

A **Checkout Session** is a temporary object that represents a single checkout attempt. When you create one, you specify:
- What the customer is buying (line items)
- Where to redirect on success or cancellation
- Payment mode (one-time or subscription)
- Any discounts or tax settings

Stripe generates a hosted payment page for the session. This page handles card input, validation, 3D Secure authentication, and error display — all without you writing a single line of frontend payment UI.

### Payment Intents

Behind every Checkout Session is a **Payment Intent** — Stripe's representation of an attempt to collect payment. Payment Intents track the lifecycle of a payment:

- Created → Requires payment method → Processing → Succeeded (or Failed)

For most e-commerce use cases, Checkout Sessions abstract away Payment Intents entirely. You only need to interact with Payment Intents directly for more advanced flows (like saving cards for later or handling complex multi-step payments).

### Webhooks

A **webhook** is an HTTP request that Stripe sends to your server when something happens — a payment succeeds, a subscription renews, a dispute is filed, etc. Webhooks are essential because they are the **only reliable way** to know that a payment has been completed.

Why not just check the redirect? Because redirects are unreliable:
- The customer might close their browser before being redirected
- The redirect might fail due to a network error
- A malicious user could fake a redirect to your success page

Webhooks solve this by providing a server-to-server confirmation that is cryptographically signed and verifiable.

## The Stripe Dashboard

Stripe provides an excellent web dashboard at [dashboard.stripe.com](https://dashboard.stripe.com) where you can:

- View all transactions, customers, and subscriptions
- Issue refunds
- Manage disputes
- View real-time analytics
- Configure webhook endpoints
- Access API logs for debugging

### Test Mode

One of Stripe's best developer features is **test mode**. When test mode is active:

- No real money moves
- You can use test card numbers (like `4242 4242 4242 4242`)
- Webhooks fire with test data
- Everything behaves exactly like production, minus the real charges

You can toggle between test and live mode in the dashboard. During development, you work exclusively in test mode. When you are ready to launch, you switch to live mode and use production API keys.

## API Keys: Secret vs Publishable

Stripe provides two types of API keys:

### Publishable Key (`pk_test_...` or `pk_live_...`)

- Safe to expose in client-side code (the browser can see it)
- Used to initialize Stripe.js in the browser
- Can only perform limited operations (creating tokens, confirming payments)
- Cannot read customer data or create charges

### Secret Key (`sk_test_...` or `sk_live_...`)

- **Must never be exposed to the client**
- Used on your server to create Checkout Sessions, process refunds, manage customers
- Has full access to your Stripe account
- Store it as an environment variable, never in source code

```bash
# .env file
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_...
```

The webhook secret is a third key used to verify that incoming webhook requests actually come from Stripe and have not been tampered with.

## Setting Up Stripe

To follow along with the coding lessons, you will need a Stripe account:

1. Sign up at [stripe.com](https://stripe.com) (free, no credit card required)
2. Navigate to the Developers section
3. Copy your test mode API keys
4. Add them to your `.env` file

In test mode, you can use these test card numbers:
- **`4242 4242 4242 4242`** — Successful payment
- **`4000 0000 0000 9995`** — Declined payment
- **`4000 0025 0000 3155`** — Requires 3D Secure authentication

Use any future expiration date, any 3-digit CVC, and any postal code.

## What's Next

In the next lesson, you will write a server function that creates a Stripe Checkout Session — the first step in accepting payments. You will learn how to convert your cart items into Stripe line items, configure success and cancel URLs, and handle the redirect flow.
