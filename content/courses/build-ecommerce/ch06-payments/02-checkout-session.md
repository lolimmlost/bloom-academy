---
id: "02-checkout-session"
title: "Creating a Checkout Session"
type: "code"
xp: 35
difficulty: 4
order: 2
prerequisites: ["01-payments-intro"]
hints:
  - "Initialize the Stripe client with: new Stripe(process.env.STRIPE_SECRET_KEY!)"
  - "Use stripe.checkout.sessions.create() to create a Checkout Session."
  - "Map your cart items to Stripe's line_items format with price_data and quantity."
  - "Set mode to 'payment' for one-time purchases."
  - "Include success_url and cancel_url for post-checkout redirects."
---

# Creating a Checkout Session

With Stripe set up and our concepts clear, it is time to write the server-side code that kicks off a payment. In this lesson, you will create a **Stripe Checkout Session** — the bridge between your shopping cart and Stripe's hosted payment page.

## The Checkout Flow

Here is the complete user journey for a purchase:

1. Customer fills their cart and clicks "Proceed to Checkout"
2. Your app calls a **server function** that creates a Checkout Session with Stripe
3. Stripe returns a **URL** for a hosted payment page
4. Your app **redirects** the customer to that URL
5. Customer enters payment details on Stripe's page
6. On success, Stripe redirects back to your **success URL**
7. Stripe also sends a **webhook** to confirm the payment (next lesson)

Steps 2-3 are what we are building in this lesson.

## Initializing the Stripe Client

First, you initialize the Stripe SDK on the server. This must happen in server-side code only — the secret key should never be exposed to the browser:

```typescript
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

The `Stripe` constructor takes your secret key and returns a client object with methods for every Stripe API endpoint. The `!` is a TypeScript non-null assertion — it tells the compiler that `STRIPE_SECRET_KEY` is definitely defined in your environment.

In production, you would want to verify this at startup rather than using a non-null assertion. But for development, this keeps the code concise.

## Creating the Server Function

The checkout server function accepts an array of cart items and creates a Checkout Session:

```typescript
import { createServerFn } from "@tanstack/react-start"

type CartItem = { name: string; price: number; quantity: number }

export const createCheckout = createServerFn({ method: "POST" })
  .validator((items: CartItem[]) => items)
  .handler(async ({ data: items }) => {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.BETTER_AUTH_URL}/orders/success`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/cart`,
    })

    return { url: session.url }
  })
```

This is the most important function in our payment system. Let's examine every piece.

## Understanding the Checkout Session Options

### `mode: "payment"`

Stripe Checkout supports three modes:

- **`"payment"`** — One-time payment (what we are using for product purchases)
- **`"subscription"`** — Recurring payments (for subscription boxes or memberships)
- **`"setup"`** — Save a payment method for future use without charging now

For our flower shop's standard purchases, `"payment"` is the right choice.

### `line_items`

This is an array describing what the customer is buying. Each line item has two main parts:

**`price_data`** — Defines the price inline:

```typescript
price_data: {
  currency: "usd",           // ISO 4217 currency code
  product_data: { name: item.name }, // Product info for the receipt
  unit_amount: item.price,   // Price in cents (4999 = $49.99)
}
```

`unit_amount` is in **cents** (the smallest currency unit). This matches how we store prices in our database, so no conversion is needed.

Alternatively, if you have pre-created Price objects in Stripe's dashboard, you can reference them by ID instead of providing `price_data`:

```typescript
line_items: [{ price: "price_1ABC123", quantity: 2 }]
```

Pre-created prices are useful for products with fixed pricing. Inline `price_data` is better for dynamic pricing or when products are managed entirely in your database.

**`quantity`** — How many of this item the customer is buying.

### `success_url` and `cancel_url`

These URLs control where Stripe redirects the customer after the checkout:

- **`success_url`** — Where to go after a successful payment. This is your order confirmation page.
- **`cancel_url`** — Where to go if the customer clicks "Back" or closes the checkout. This is typically the cart page.

You can include a `{CHECKOUT_SESSION_ID}` placeholder in the success URL to receive the session ID:

```typescript
success_url: `${process.env.BETTER_AUTH_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
```

This lets your success page display order details by looking up the session.

**Important**: The success URL redirect is NOT a reliable confirmation of payment. A user could manually navigate to your success URL without paying. Always use webhooks (next lesson) to confirm payments on the server.

## The Redirect Flow

After creating the session, you return the URL to the client:

```typescript
return { url: session.url }
```

On the client side, you redirect the user:

```tsx
function CheckoutButton({ items }) {
  const handleCheckout = async () => {
    const { url } = await createCheckout({ data: items })
    if (url) {
      window.location.href = url
    }
  }

  return (
    <button onClick={handleCheckout}>
      Proceed to Checkout
    </button>
  )
}
```

`window.location.href = url` performs a full-page navigation to Stripe's hosted checkout. This takes the customer to a Stripe-controlled page where they enter their card details, see the order summary, and complete the purchase.

Using Stripe's hosted checkout page has several advantages:

- **PCI compliant** — Card data never touches your server
- **Optimized** — Stripe has A/B tested every pixel of this page for conversion
- **Complete** — Handles card validation, 3D Secure, error messages, and more
- **Maintained** — Stripe updates it automatically as new payment methods and regulations emerge

## Adding Metadata

You can attach custom data to a Checkout Session using `metadata`. This is extremely useful for connecting Stripe data back to your application:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... other options
  metadata: {
    userId: currentUser.id,
    cartId: cartId,
  },
})
```

Metadata appears in webhook payloads, the Stripe dashboard, and API responses. Use it to store your internal user ID, order reference numbers, or any other data you need when processing the webhook.

## Error Handling

What if the Stripe API call fails? Network errors, invalid parameters, and rate limits can all cause failures:

```typescript
export const createCheckout = createServerFn({ method: "POST" })
  .validator((items: CartItem[]) => items)
  .handler(async ({ data: items }) => {
    try {
      const session = await stripe.checkout.sessions.create({
        // ... configuration
      })
      return { url: session.url }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error("Stripe error:", error.message)
        throw new Error("Payment system temporarily unavailable")
      }
      throw error
    }
  })
```

Catching Stripe-specific errors lets you return a user-friendly message instead of exposing internal details.

## Testing with Stripe CLI

During development, you can use the **Stripe CLI** to test your checkout flow locally:

```bash
# Install the CLI and log in
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a test checkout in your browser
# Use card number: 4242 4242 4242 4242
```

The Stripe CLI is invaluable for testing the complete payment flow without deploying your application.

## Your Task

Write a server function that creates a Stripe Checkout Session from an array of cart items.

Your function should:
1. Import and initialize the Stripe client with your secret key
2. Use `createServerFn` to create a server function that accepts cart items
3. Call `stripe.checkout.sessions.create()` with mode set to `"payment"`
4. Map cart items to Stripe's `line_items` format with `price_data` and `quantity`
5. Include `success_url` and `cancel_url` for post-checkout redirects
6. Return the session URL
