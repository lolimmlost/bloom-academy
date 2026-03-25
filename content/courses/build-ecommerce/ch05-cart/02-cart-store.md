---
id: "02-cart-store"
title: "Building the Cart Store"
type: "code"
xp: 30
difficulty: 3
order: 2
prerequisites: ["01-state-management"]
hints:
  - "Use a switch statement to handle each action type: 'add', 'remove', and 'updateQuantity'."
  - "For the 'add' action, first check if the item already exists in the cart using state.find()."
  - "If the item exists, use state.map() to increment its quantity. If not, spread the state and add a new item with quantity 1."
  - "For 'remove', use state.filter() to exclude the item with the matching id."
---

# Building the Cart Store

Now it is time to build the engine that powers our shopping cart. We are going to write a **reducer function** — a pure function that takes the current cart state and an action, and returns the new cart state.

## Designing the Cart Data Structure

Before writing any code, let's think about what a cart item looks like:

```typescript
type CartItem = {
  id: string       // Unique product identifier
  name: string     // Product name (for display)
  price: number    // Price in cents
  quantity: number // How many of this item
}
```

We store the `name` and `price` on each cart item (even though they could be looked up from the product catalog) because the cart needs to display this information without making additional database queries. This is a common pattern called **denormalization** — duplicating data for performance.

The cart itself is simply an array of `CartItem` objects:

```typescript
type Cart = CartItem[]
```

An empty cart is `[]`. A cart with two products might look like:

```typescript
[
  { id: "rose-01", name: "Red Roses Bouquet", price: 4999, quantity: 2 },
  { id: "lily-03", name: "White Lilies", price: 3499, quantity: 1 },
]
```

## Defining Cart Actions

Next, we define the actions — the things that can happen to a cart:

```typescript
type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity"> }
  | { type: "remove"; id: string }
  | { type: "updateQuantity"; id: string; quantity: number }
```

Let's examine each action:

- **`add`** — Adds a product to the cart. Notice it uses `Omit<CartItem, "quantity">` — the caller provides the product details but *not* the quantity. The reducer handles quantity logic internally (start at 1, increment if already in cart).
- **`remove`** — Removes a product entirely from the cart. Only needs the item's `id`.
- **`updateQuantity`** — Sets a specific quantity for an item. Useful for the quantity selector in the cart UI (e.g., changing from 1 to 3).

This is a **discriminated union** — TypeScript can narrow the type based on the `type` property. Inside a `switch` statement, TypeScript knows exactly which properties are available for each case.

## The Reducer Pattern

A reducer is a function with this signature:

```typescript
(state: State, action: Action) => State
```

It takes the current state and an action describing what happened, and it returns the **new** state. Critically, it must be **pure**:

- **No side effects** — No API calls, no localStorage writes, no DOM manipulation
- **No mutation** — Never modify the existing state; always return a new object
- **Deterministic** — Same inputs always produce the same output

Why these rules? Because purity makes your code predictable and testable. You can write unit tests for every cart operation without rendering a single component. You can even replay a sequence of actions to reconstruct any cart state — which is powerful for debugging.

## Building the Reducer

Let's implement each action:

### The "add" Action

Adding an item has a subtle complexity: what if the product is already in the cart? If a customer clicks "Add to Cart" on a product they have already added, we should increment the quantity — not add a duplicate entry.

```typescript
case "add": {
  const existing = state.find((item) => item.id === action.item.id)
  if (existing) {
    return state.map((item) =>
      item.id === action.item.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  }
  return [...state, { ...action.item, quantity: 1 }]
}
```

The logic:
1. Search for an existing item with the same `id`
2. If found, create a new array where that item has `quantity + 1` (all other items unchanged)
3. If not found, create a new array with all existing items plus the new item with `quantity: 1`

Notice we never mutate the state. `state.map()` returns a new array. The spread `{ ...item, quantity: item.quantity + 1 }` creates a new object. This is essential for React to detect changes — React compares object references, so mutating an existing object would not trigger a re-render.

### The "remove" Action

Removing is the simplest operation:

```typescript
case "remove":
  return state.filter((item) => item.id !== action.id)
```

`Array.filter()` returns a new array containing only the items that pass the test. Every item whose `id` does not match the one being removed stays in the cart.

### The "updateQuantity" Action

Updating a quantity is similar to the increment logic in "add", but instead of adding 1, we set a specific value:

```typescript
case "updateQuantity":
  return state.map((item) =>
    item.id === action.id ? { ...item, quantity: action.quantity } : item
  )
```

In a production app, you might add validation here — ensuring quantity is at least 1, or removing the item if quantity drops to 0:

```typescript
case "updateQuantity":
  if (action.quantity <= 0) {
    return state.filter((item) => item.id !== action.id)
  }
  return state.map((item) =>
    item.id === action.id ? { ...item, quantity: action.quantity } : item
  )
```

## Calculating Totals

With the cart state in place, calculating totals is a one-liner:

```typescript
const subtotal = items.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
)
```

`Array.reduce()` iterates over every item, multiplying its price by its quantity and accumulating the result. Since prices are in cents, the result is also in cents — divide by 100 and format for display:

```typescript
const displayTotal = `$${(subtotal / 100).toFixed(2)}`
// e.g., "$84.97"
```

## Wiring It Up with React

In a component, you use the reducer with `useReducer`:

```tsx
import { useReducer } from "react"

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  const addItem = (product) => {
    dispatch({ type: "add", item: product })
  }

  const removeItem = (id) => {
    dispatch({ type: "remove", id })
  }

  const updateQuantity = (id, quantity) => {
    dispatch({ type: "updateQuantity", id, quantity })
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity }}>
      {children}
    </CartContext.Provider>
  )
}
```

Components anywhere in the tree can call `addItem`, `removeItem`, or `updateQuantity` without knowing anything about the reducer internals. This is good API design — the implementation details are encapsulated.

## Your Task

Write a `cartReducer` function that handles three action types: `add`, `remove`, and `updateQuantity`.

Your reducer should:
1. Accept `CartItem[]` as state and `CartAction` as the action
2. For `"add"`: check if the item already exists; if so, increment its quantity; if not, add it with `quantity: 1`
3. For `"remove"`: filter out the item with the matching `id`
4. For `"updateQuantity"`: update the quantity of the item with the matching `id`
