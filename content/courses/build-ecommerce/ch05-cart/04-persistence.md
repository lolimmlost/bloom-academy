---
id: "04-persistence"
title: "Cart Persistence"
type: "info"
xp: 15
difficulty: 2
order: 4
prerequisites: ["03-cart-ui"]
hints: []
---

# Cart Persistence

Your shopping cart works beautifully — as long as the user does not close the tab. Right now, the cart lives entirely in React state, which means it vanishes the moment the page unloads. In this lesson, we will explore how to persist the cart so customers do not lose their selections.

## The Problem

Imagine this scenario: a customer spends 10 minutes browsing your flower shop, carefully selecting a bouquet of red roses, a potted succulent, and a sympathy arrangement. Then they accidentally close the browser tab. When they come back, their cart is empty. They leave and buy from a competitor.

This is not a hypothetical — studies show that **cart abandonment rates exceed 70%**, and friction like lost cart contents makes it worse. Persisting the cart is not a nice-to-have; it is a business necessity.

## localStorage: The Simple Solution

The browser provides `localStorage` — a key-value store that persists across page loads, tab closes, and even browser restarts:

```typescript
// Save cart to localStorage
function saveCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items))
}

// Load cart from localStorage
function loadCart(): CartItem[] {
  const saved = localStorage.getItem("cart")
  return saved ? JSON.parse(saved) : []
}
```

The pattern is straightforward:
1. Whenever the cart changes, serialize it to JSON and save it
2. When the app loads, check localStorage for a saved cart and use it as the initial state

### Integrating with useReducer

You can use a lazy initializer with `useReducer` to load the cart from localStorage on first render:

```typescript
const [items, dispatch] = useReducer(
  cartReducer,
  null,
  () => loadCart() // Only runs once, on initial render
)
```

And sync to localStorage whenever items change:

```typescript
useEffect(() => {
  saveCart(items)
}, [items])
```

This is a classic **local-first** pattern: the client is the primary data store, and persistence is handled as a side effect.

### localStorage Caveats

localStorage is simple but has limitations you should be aware of:

- **Storage limit** — Typically 5-10MB per origin. More than enough for a cart, but not for caching your entire product catalog.
- **Synchronous** — `localStorage.getItem()` blocks the main thread. For a small cart this is negligible, but avoid storing large datasets.
- **No expiration** — Data stays forever until explicitly removed or the user clears their browser data. You might want to add a timestamp and clear stale carts older than, say, 30 days.
- **String only** — You must `JSON.stringify` and `JSON.parse` everything. Complex objects like Dates get flattened to strings.
- **No cross-device sync** — A cart saved on a laptop is not available on a phone.

## The Sync Pattern: Local-First, Server-Second

For authenticated users, you might want to sync the cart to the server. This gives users a consistent experience across devices and protects against data loss. The pattern works like this:

```
User adds item to cart
  → Update local state immediately (fast, no spinner)
  → Save to localStorage (persist locally)
  → If user is logged in, sync to server in the background
```

The key insight is that the **local state is always updated first**. The server sync happens asynchronously — if it fails (network error, server down), the user does not notice because their local cart is still intact. When the sync eventually succeeds, the server has the latest state.

### Loading Order

When the app starts:

1. Load the cart from localStorage (immediate, synchronous)
2. If the user is logged in, also fetch their server-side cart
3. If both exist, **merge** them

This way, the app is usable instantly (from localStorage), and any server data catches up in the background.

## Merging Carts on Login

One of the trickier scenarios in e-commerce is what happens when an anonymous user fills a cart and *then* logs in. They might already have items in their server-side cart from a previous session on another device.

You need a **merge strategy**. Here are the common approaches:

### Strategy 1: Local Wins

Keep the anonymous cart, discard the server cart. Simple but might lose items the user saved from another device.

```typescript
// Just save the local cart to the server
await syncCartToServer(localItems)
```

### Strategy 2: Server Wins

Replace the local cart with the server cart. Simple but discards whatever the user just added before logging in.

```typescript
// Load server cart and replace local
const serverItems = await fetchServerCart()
setItems(serverItems)
```

### Strategy 3: Merge (Recommended)

Combine both carts. If the same product exists in both, take the higher quantity:

```typescript
function mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()

  for (const item of server) {
    merged.set(item.id, item)
  }

  for (const item of local) {
    const existing = merged.get(item.id)
    if (existing) {
      merged.set(item.id, {
        ...item,
        quantity: Math.max(item.quantity, existing.quantity),
      })
    } else {
      merged.set(item.id, item)
    }
  }

  return Array.from(merged.values())
}
```

The merge approach is the most user-friendly because it never loses items. The tradeoff is slightly more complexity, but the code above handles it in about 15 lines.

## Optimistic Updates

Throughout this chapter, we have been using a pattern called **optimistic updates** without explicitly naming it. Let's make it explicit.

An **optimistic update** means updating the UI *before* the server confirms the change. When a user clicks "Add to Cart":

1. **Immediately** add the item to the local cart (the UI updates in the same frame)
2. **Later** sync to the server in the background
3. **If the sync fails**, either retry silently or show a subtle error message

The alternative is **pessimistic updates**: wait for the server to confirm before updating the UI. This is safer but dramatically slower — the user sees a loading spinner every time they add an item to their cart.

For cart operations, optimistic updates are almost always the right choice. The operations are unlikely to fail (there is no complex validation), and the cost of a failed sync is low (you just retry). The UX benefit of instant feedback is enormous.

Compare the user experience:

**Pessimistic (slow):**
```
Click "Add to Cart" → spinner appears → 200ms network request → spinner disappears → item appears in cart
```

**Optimistic (fast):**
```
Click "Add to Cart" → item appears in cart immediately
```

That 200ms difference might seem small, but it is the difference between an interface that feels "snappy" and one that feels "sluggish." Users notice, even if they cannot articulate why.

## Summary

Here is the complete persistence strategy for our shopping cart:

1. **Primary storage**: React state via `useReducer` — the source of truth for the current session
2. **Local persistence**: `localStorage` — survives page reloads and tab closes
3. **Server sync**: Background sync for logged-in users — enables cross-device access
4. **Merge on login**: Combine anonymous and server carts so no items are lost
5. **Optimistic updates**: Always update the UI first, sync later

This layered approach gives users the best possible experience: instant interactions, persistent data, and seamless transitions between devices.

## What's Next

With the cart fully functional and persistent, we are ready for the most exciting part of the project: **taking payments**. In the next chapter, you will integrate Stripe to process real (test) transactions, handle checkout sessions, and build webhook handlers for payment confirmation.
