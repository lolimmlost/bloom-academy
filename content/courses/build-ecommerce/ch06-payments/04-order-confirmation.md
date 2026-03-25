---
id: "04-order-confirmation"
title: "Order Confirmation"
type: "info"
xp: 15
difficulty: 2
order: 4
prerequisites: ["03-webhooks"]
hints: []
---

# Order Confirmation

The payment has been processed, the webhook has fired, and the order is safely recorded in your database. Now you need to close the loop with the customer — showing them a confirmation page, sending them a receipt, and giving them a way to track their order.

## The Success Page

After a successful Stripe Checkout, the customer is redirected to your `success_url`. This page serves as immediate reassurance that their purchase went through.

Remember from the previous lessons: the redirect itself is not proof of payment. But since the webhook has already processed the order on your server, the success page can look up the order and display real details:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

const fetchOrder = createServerFn({ method: "GET" })
  .validator((sessionId: string) => sessionId)
  .handler(async ({ data: sessionId }) => {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId))
    return order[0] ?? null
  })

export const Route = createFileRoute("/orders/success")({
  validateSearch: (search) => ({
    session_id: typeof search.session_id === "string"
      ? search.session_id
      : "",
  }),
  loader: ({ search }) => fetchOrder({ data: search.session_id }),
  component: OrderSuccess,
})

function OrderSuccess() {
  const order = Route.useLoaderData()

  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-gray-600 mt-2">
          Your order may still be processing. Please check back shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <h1 className="text-3xl font-bold text-green-600">
        Thank You for Your Order!
      </h1>
      <p className="text-gray-600 mt-4">
        Order #{order.id.slice(0, 8).toUpperCase()}
      </p>
      <p className="text-xl font-semibold mt-2">
        ${(order.amountTotal / 100).toFixed(2)}
      </p>
      <p className="text-gray-500 mt-4">
        A confirmation email has been sent to {order.customerEmail}
      </p>
    </div>
  )
}
```

### Handling the Timing Gap

There is a subtle race condition: the customer might arrive at the success page *before* the webhook has been processed. This can happen if your webhook handler is slow or if there is a delay in Stripe's webhook delivery.

The "Order Not Found" fallback handles this gracefully. In a production app, you might:

- Poll for the order with a short interval (check every 2 seconds for up to 30 seconds)
- Show a "Processing your order..." state with a spinner
- Use WebSockets or Server-Sent Events for real-time updates

The simplest approach is usually a brief polling loop:

```tsx
function OrderSuccess() {
  const order = Route.useLoaderData()
  const router = useRouter()

  useEffect(() => {
    if (!order) {
      const interval = setInterval(() => {
        router.invalidate() // Re-runs the loader
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [order])

  // ... render
}
```

This re-runs the loader every 2 seconds until the order appears. Once the webhook processes and the order is in the database, the next poll picks it up and the confirmation displays.

## Displaying Order Details

A good order confirmation page includes:

- **Order number** — A reference the customer can use for support inquiries
- **Items purchased** — What they bought, with quantities and prices
- **Total charged** — The final amount
- **Shipping information** — If applicable, the delivery address and estimated timeline
- **Contact information** — How to reach support if something is wrong

For our flower shop, the confirmation might look like this:

```tsx
function OrderDetails({ order, lineItems }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-4xl mb-4">✓</div>
        <h1 className="text-2xl font-bold">Order Confirmed</h1>
        <p className="text-gray-600 mt-1">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {lineItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.description} x {item.quantity}</span>
            <span>${(item.amount_total / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t mt-4 pt-4 flex justify-between font-bold">
        <span>Total</span>
        <span>${(order.amountTotal / 100).toFixed(2)}</span>
      </div>
    </div>
  )
}
```

## Sending Confirmation Emails

Every e-commerce purchase should trigger a confirmation email. This is a critical touchpoint: it reassures the customer, provides a receipt, and gives them a record of the transaction.

There are several approaches to sending transactional emails:

### Stripe Receipts

The simplest option: Stripe can send email receipts automatically. Enable this in your Stripe Dashboard under Settings > Emails. Stripe handles the formatting, delivery, and includes all the purchase details. This is a great starting point.

### Dedicated Email Services

For customized emails that match your brand, use a transactional email service:

- **Resend** — Modern API with React-based email templates
- **SendGrid** — Established service with high deliverability
- **Postmark** — Focused exclusively on transactional email
- **AWS SES** — Cost-effective at scale

The typical pattern is to send the email from your webhook handler, right after creating the order:

```typescript
if (event.type === "checkout.session.completed") {
  const session = event.data.object
  const order = await createOrder(session)
  await sendConfirmationEmail(order)
}
```

### Email Timing

Send the confirmation email from the webhook handler, not from the success page. This ensures the email is sent even if the customer never sees the success page (browser closed, network error, etc.).

## Order History

Customers should be able to view their past orders. This is a straightforward application of the concepts you have already learned:

```typescript
const fetchUserOrders = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
})
```

The order history page fetches all orders for the authenticated user, sorted by date. Each order links to a detail page showing the full breakdown.

## Handling Failed Payments

Not every payment attempt succeeds. Cards get declined, banks flag transactions as suspicious, and customers abandon checkout. You need to handle these cases gracefully.

### Declined at Checkout

If a card is declined during Stripe Checkout, Stripe handles it entirely — showing an error message and letting the customer try a different card. Your server never hears about it unless the customer eventually succeeds.

### Failed After Checkout

In rare cases, a payment might fail *after* the customer completes checkout (e.g., the bank reverses the authorization). Stripe sends a `payment_intent.payment_failed` webhook in this case. Your handler should:

1. Find the associated order
2. Update its status to "payment_failed"
3. Notify the customer via email
4. Optionally prompt them to retry

```typescript
if (event.type === "payment_intent.payment_failed") {
  const paymentIntent = event.data.object
  await db
    .update(orders)
    .set({ status: "payment_failed" })
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
}
```

### Disputes and Chargebacks

A **chargeback** occurs when a customer contacts their bank to reverse a charge. Stripe notifies you via the `charge.dispute.created` webhook. Disputes are a serious matter — they incur fees, and too many can get your Stripe account flagged.

Best practices to minimize disputes:
- Send clear confirmation emails with recognizable business names
- Provide easy-to-find contact information for customer support
- Ship products promptly and provide tracking
- Offer refunds proactively when customers are unhappy

## Refunds

Sometimes you need to issue a refund — the customer changed their mind, the product was damaged, or the order was incorrect. Stripe makes this straightforward:

```typescript
const issueRefund = createServerFn({ method: "POST" })
  .validator((orderId: string) => orderId)
  .handler(async ({ data: orderId }) => {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order[0]) throw new Error("Order not found")

    await stripe.refunds.create({
      payment_intent: order[0].stripePaymentIntentId,
    })

    await db
      .update(orders)
      .set({ status: "refunded" })
      .where(eq(orders.id, orderId))
  })
```

Stripe processes the refund back to the customer's original payment method. It typically takes 5-10 business days for the customer to see the refund on their statement.

## What You Have Built

Stepping back, look at what you have accomplished across this chapter:

1. **Checkout Session** — A server function that creates a Stripe-hosted payment page
2. **Webhook Handler** — A secure endpoint that processes payment confirmations
3. **Order Creation** — Database records created from verified payment data
4. **Order Confirmation** — A success page that displays order details

This is a complete payment flow — the same architecture used by real e-commerce stores processing thousands of transactions daily. The patterns you have learned (webhook verification, idempotent handlers, optimistic UI with server confirmation) are foundational to any payment integration, whether you are using Stripe, PayPal, Square, or any other processor.

## What's Next

With payments working, our e-commerce store has all the core functionality of a real business. In the upcoming chapters, we will build admin tools to manage orders and products, write tests to ensure everything works reliably, and deploy the application to production.
