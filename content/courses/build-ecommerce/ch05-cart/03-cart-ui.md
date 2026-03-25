---
id: "03-cart-ui"
title: "Cart UI"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-cart-store"]
hints:
  - "Use items.reduce() to calculate the total price by summing price * quantity for each item."
  - "Handle the empty cart case by checking items.length === 0."
  - "Map over items to render each one with its name, quantity, and price."
  - "Format prices by dividing by 100 and calling .toFixed(2)."
---

# Cart UI

You have the cart reducer — the logic engine. Now it is time to build the **visual layer**: a component that displays cart contents, shows quantities and prices, and handles the empty state gracefully.

## Designing for Cart States

A shopping cart has two fundamental states that need distinct UI treatments:

### Empty State

When the cart has no items, showing a blank page or an empty table is a poor experience. A good empty state:
- Clearly communicates that the cart is empty
- Optionally provides a call-to-action (like "Browse Products")
- Does not make the user feel like something is broken

```tsx
if (items.length === 0) {
  return <p>Your cart is empty</p>
}
```

This seems simple, but handling empty states well is one of the hallmarks of thoughtful UI design. In production, you might add an illustration, a friendly message, and a link back to the product catalog.

### Active State

When the cart has items, the UI needs to show:
- **What** is in the cart (product names)
- **How many** of each item (quantities)
- **How much** each line costs (price times quantity)
- **The total** cost of everything

This is essentially a table, but we will build it with flexbox for a cleaner, more modern look.

## Anatomy of a Cart Item Row

Each item in the cart needs to display several pieces of information in a compact row:

```tsx
<div key={item.id} className="flex justify-between py-2">
  <span>{item.name} x {item.quantity}</span>
  <span>${(item.price * item.quantity / 100).toFixed(2)}</span>
</div>
```

Let's break down the design decisions:

- **`flex justify-between`** — Places the product info on the left and the price on the right. This is a natural layout for line items — your eyes scan from left (what) to right (how much).
- **`py-2`** — Adds vertical padding between rows. Without it, items would be crammed together.
- **`item.name x item.quantity`** — Shows both the product name and count in a concise format like "Red Roses x 2".
- **`item.price * item.quantity`** — The line total. If roses are $49.99 each and you have 2, this shows "$99.98".

## Calculating the Total

The total is the sum of all line item prices:

```typescript
const total = items.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
)
```

Let's trace through this with an example cart:

```
Red Roses:  price=4999, quantity=2 → 4999 * 2 = 9998
White Lilies: price=3499, quantity=1 → 3499 * 1 = 3499
                                        Total: 13497 cents = $134.97
```

`reduce` starts with `sum = 0`, adds `4999 * 2 = 9998`, then adds `3499 * 1 = 3499`, giving `13497`. Divide by 100 and format: `$134.97`.

## The Cart Summary Component

Putting it all together, a `CartSummary` component combines the empty state check, the item list, and the total:

```tsx
export function CartSummary({ items }: { items: CartItem[] }) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  if (items.length === 0) {
    return <p>Your cart is empty</p>
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between py-2">
          <span>{item.name} x {item.quantity}</span>
          <span>${(item.price * item.quantity / 100).toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t pt-2 font-bold">
        Total: ${(total / 100).toFixed(2)}
      </div>
    </div>
  )
}
```

A few design details worth noting:

- **`border-t`** — Adds a top border above the total, visually separating the line items from the summary. This is a classic receipt/invoice pattern.
- **`font-bold`** — Makes the total stand out as the most important number on the page.
- **`pt-2`** — Adds breathing room between the border and the total text.

## Adding Interactive Controls

In a full cart UI, each item row would also have controls for adjusting quantity and removing items:

```tsx
<div key={item.id} className="flex items-center justify-between py-2">
  <div>
    <span className="font-medium">{item.name}</span>
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={() => updateQuantity(item.id, item.quantity - 1)}
        className="px-2 py-1 border rounded"
      >
        -
      </button>
      <span>{item.quantity}</span>
      <button
        onClick={() => updateQuantity(item.id, item.quantity + 1)}
        className="px-2 py-1 border rounded"
      >
        +
      </button>
      <button
        onClick={() => removeItem(item.id)}
        className="text-red-500 text-sm ml-2"
      >
        Remove
      </button>
    </div>
  </div>
  <span className="font-medium">
    ${(item.price * item.quantity / 100).toFixed(2)}
  </span>
</div>
```

The increment/decrement buttons call `updateQuantity` with the current quantity plus or minus one. The "Remove" button calls `removeItem`. Both of these dispatch actions to the cart reducer we built in the previous lesson.

## Where to Display the Cart

E-commerce stores typically show the cart in one of these patterns:

- **Cart page** (`/cart`) — A dedicated page showing all items. Best for stores with complex checkout flows.
- **Slide-out drawer** — A panel that slides in from the right side. Great for keeping the user on the current page while reviewing their cart.
- **Dropdown** — A small dropdown from a cart icon in the header. Good for quick glances but limited space.

Most modern stores use a combination: a slide-out drawer for quick access and a full cart page for detailed review before checkout. For our app, we will use the cart summary component in both contexts.

## Accessibility Considerations

A few accessibility touches that make a big difference:

- Use `<button>` elements (not `<div>` or `<span>`) for interactive controls — they are keyboard-focusable and announce correctly to screen readers
- Add `aria-label` attributes to icon-only buttons (like "+" and "-" without text context)
- Ensure the total is announced to screen readers when it updates using `aria-live="polite"`

These details matter. Accessible design is not an afterthought — it is part of building quality software.

## Your Task

Create a `CartSummary` component that displays cart items with their quantities and prices, and shows the total.

Your component should:
1. Accept an `items` array of `CartItem` objects as a prop
2. Calculate the total using `reduce`
3. Show "Your cart is empty" when there are no items
4. Map over items to display each item's name, quantity, and price
5. Display the total at the bottom
