---
id: "03-webhooks"
title: "Webhook Handling"
type: "code"
xp: 35
difficulty: 4
order: 3
prerequisites: ["02-checkout-session"]
hints:
  - "Use request.text() to get the raw request body — do not parse it as JSON first."
  - "Get the Stripe signature from the 'stripe-signature' header."
  - "Call stripe.webhooks.constructEvent() with the body, signature, and webhook secret to verify the event."
  - "Check event.type === 'checkout.session.completed' to handle successful payments."
---

# Webhook Handling

In the previous lesson, you created a Checkout Session that redirects customers to Stripe's payment page. But how does your server *know* that a payment actually went through? The redirect to your success page is not reliable proof — the customer might close their browser, their network might drop, or someone could manually navigate to the success URL.

**Webhooks** are the answer. They provide server-to-server confirmation that is cryptographically verified and impossible to fake.

## What Are Webhooks?

A webhook is an HTTP POST request that an external service sends to your server when something happens. Instead of your server constantly asking Stripe "Did the payment go through yet?" (polling), Stripe *tells* your server by sending a request the moment an event occurs.

Think of it like the difference between constantly checking your mailbox versus having the mail carrier ring your doorbell. Webhooks are the doorbell.

Stripe sends webhooks for dozens of event types:

- `checkout.session.completed` — A Checkout Session was successfully paid
- `payment_intent.succeeded` — A payment was processed
- `customer.subscription.created` — A new subscription started
- `charge.dispute.created` — A customer filed a chargeback
- `invoice.payment_failed` — A recurring payment failed

For our e-commerce store, the most important event is `checkout.session.completed` — it means a customer has paid and we should create their order.

## Why You Cannot Trust the Client

This point is worth emphasizing: **never rely on client-side redirects to confirm payment**.

Consider this scenario:
1. Customer clicks checkout and is redirected to Stripe
2. Customer completes payment
3. Stripe redirects to `https://yourstore.com/orders/success`
4. Your success page says "Thank you for your order!"

What if someone just navigates directly to `https://yourstore.com/orders/success` without paying? If your success page creates an order based solely on the URL visit, you have a serious security hole.

Even for legitimate payments, the redirect might fail:
- Browser crash during redirect
- Network interruption
- User closes tab after paying but before redirect completes

Webhooks solve all of these problems. Even if the customer never sees the success page, the webhook still fires and your server still processes the order.

## Signature Verification

Webhooks are HTTP requests — and HTTP requests can come from anywhere. How do you know a webhook actually came from Stripe and was not sent by an attacker?

Stripe signs every webhook with a **signature** using a shared secret (your webhook signing secret). The verification process works like this:

1. Stripe computes an HMAC-SHA256 hash of the request body using your webhook secret
2. Stripe includes this hash in the `stripe-signature` header
3. Your server computes the same hash and compares the two
4. If they match, the request is authentic and unmodified

The Stripe SDK provides `stripe.webhooks.constructEvent()` to handle this verification:

```typescript
const event = stripe.webhooks.constructEvent(
  body,       // Raw request body as a string
  signature,  // The stripe-signature header value
  secret      // Your webhook signing secret (whsec_...)
)
```

If verification fails (wrong signature, tampered body, expired timestamp), this function throws an error. If it succeeds, it returns a fully typed Stripe Event object.

**Critical detail**: You must pass the **raw request body** as a string, not a parsed JSON object. If your framework automatically parses the body as JSON, the signature verification will fail because the byte-for-byte representation changes during parsing.

## Building the Webhook Handler

Here is the complete webhook handler:

```typescript
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function handleWebhook(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return new Response("Invalid signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    await createOrder(session)
  }

  return new Response("ok")
}
```

Let's walk through each step:

### 1. Read the Raw Body

```typescript
const body = await request.text()
```

We use `request.text()` instead of `request.json()` because we need the raw string for signature verification.

### 2. Get the Signature Header

```typescript
const signature = request.headers.get("stripe-signature")!
```

Stripe includes the signature in every webhook request. If this header is missing, the request did not come from Stripe.

### 3. Verify and Parse

```typescript
const event = stripe.webhooks.constructEvent(body, signature, secret)
```

This single line verifies the signature AND parses the JSON body into a typed `Stripe.Event` object. If verification fails, it throws an error.

### 4. Handle the Event

```typescript
if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session
  await createOrder(session)
}
```

We check the event type and process accordingly. The `event.data.object` contains the full Checkout Session data — including the line items, customer information, and any metadata you attached when creating the session.

### 5. Respond with 200

```typescript
return new Response("ok")
```

You must respond with a 2xx status code to acknowledge receipt. If Stripe does not receive a 2xx response, it will **retry the webhook** — up to 3 times over several hours. This retry behavior is actually a feature: if your server is temporarily down, the webhook will be delivered when it comes back up.

## Creating the Order

The `createOrder` function processes the completed session and creates records in your database:

```typescript
async function createOrder(session: Stripe.Checkout.Session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

  await db.insert(orders).values({
    id: crypto.randomUUID(),
    stripeSessionId: session.id,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    status: "completed",
    createdAt: new Date(),
  })
}
```

This is where your business logic lives. Depending on your requirements, you might also:

- Create individual order line item records
- Update inventory counts
- Send a confirmation email
- Clear the user's server-side cart
- Update analytics

## Idempotency: Handling Duplicate Webhooks

Stripe guarantees **at-least-once delivery** — a webhook might be sent more than once if your server responds slowly or if there is a network issue. Your handler must be **idempotent**: processing the same webhook twice should not create duplicate orders.

The simplest approach is to check for an existing order before creating one:

```typescript
async function createOrder(session: Stripe.Checkout.Session) {
  // Check if we already processed this session
  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, session.id))

  if (existing.length > 0) {
    return // Already processed, skip
  }

  // Create the order...
}
```

Alternatively, use the Stripe session ID as your order's primary key — the database's unique constraint will reject duplicates automatically.

## Registering the Webhook Endpoint

In your TanStack Start application, you need an API route that Stripe can send webhooks to. This is one of the cases where a traditional API route is more appropriate than a server function:

```typescript
// src/routes/api/webhooks/stripe.ts
import { json } from "@tanstack/react-start"

export const APIRoute = createAPIFileRoute("/api/webhooks/stripe")({
  POST: async ({ request }) => {
    return handleWebhook(request)
  },
})
```

In your Stripe dashboard (or via the Stripe CLI), configure the webhook endpoint URL:

```
https://yourstore.com/api/webhooks/stripe
```

Select the events you want to receive — at minimum, `checkout.session.completed`.

## Local Development with Stripe CLI

During development, Stripe cannot reach your `localhost`. The Stripe CLI solves this by creating a tunnel:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This command:
1. Connects to Stripe's servers
2. Listens for webhook events on your account
3. Forwards them to your local server
4. Prints the webhook signing secret (use this as `STRIPE_WEBHOOK_SECRET` in development)

You can also trigger test events directly:

```bash
stripe trigger checkout.session.completed
```

## Your Task

Write a webhook handler that verifies Stripe webhook signatures and processes the `checkout.session.completed` event.

Your handler should:
1. Import the Stripe library
2. Read the raw request body using `request.text()`
3. Get the `stripe-signature` header from the request
4. Call `stripe.webhooks.constructEvent()` to verify the signature
5. Check for the `checkout.session.completed` event type
6. Return a `Response` to acknowledge receipt
