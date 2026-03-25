---
id: "01-state-management"
title: "State Management"
type: "info"
xp: 20
difficulty: 3
order: 1
prerequisites: []
hints: []
---

# State Management

Before we build the shopping cart, we need to talk about one of the most important topics in frontend development: **state management**. How you manage state determines how your application behaves, how it performs, and how pleasant it is to work on as it grows.

## What Is State?

**State** is any data that changes over time and affects what the user sees. Some examples:

- The items in a shopping cart
- Whether a dropdown menu is open or closed
- The current user's authentication status
- The text a user has typed into a search box
- Which page of results the user is viewing

Every interactive feature in a web application is driven by state changing and the UI responding to those changes.

## Client State vs Server State

Not all state is created equal. One of the most useful mental models in modern web development is the distinction between **client state** and **server state**.

### Server State

Server state is data that originates from your backend — it lives in a database, and your frontend is just displaying a copy of it. Examples:

- Product listings
- User profiles
- Order history
- Inventory counts

Server state has some distinctive characteristics:
- **It is shared** — multiple users see the same data
- **It can become stale** — someone else might change it while you are viewing it
- **It requires async fetching** — you need to make a network request to get or update it
- **It is the source of truth** — the database version is always "correct"

In our application, TanStack Start's server functions and route loaders handle server state beautifully. When you use `useLoaderData()`, you are accessing server state that was fetched before the component rendered.

### Client State

Client state is data that exists only in the browser. It has not been sent to or received from a server. Examples:

- Whether a modal is open
- The current value of a form input before submission
- UI preferences like dark mode
- **Shopping cart contents** (before checkout)

Client state characteristics:
- **It is local** — only this user, in this browser tab, has it
- **It is synchronous** — no network request needed
- **It is ephemeral** — it disappears when you close the tab (unless you persist it)
- **The client is the source of truth** — there is no server version to compare against

## React's Built-In State Tools

React provides several built-in mechanisms for managing client state. Let's look at each one and when to use it.

### `useState` — Simple Local State

The simplest state tool. Use it for state that belongs to a single component:

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

`useState` is perfect for toggle states, form inputs, and any state that does not need to be shared with other components.

### `useReducer` — Complex Local State

When state logic gets more complex — multiple related values that change together, or updates that depend on the previous state — `useReducer` is a better fit:

```tsx
function cartReducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, action.item]
    case "remove":
      return state.filter((item) => item.id !== action.id)
    default:
      return state
  }
}

function Cart() {
  const [items, dispatch] = useReducer(cartReducer, [])
  // dispatch({ type: "add", item: { ... } })
}
```

A **reducer** is a pure function that takes the current state and an action, and returns the new state. This pattern has several advantages:

- **Predictable** — given the same state and action, you always get the same result
- **Testable** — you can test the reducer in isolation, without rendering any components
- **Centralized** — all state transitions are defined in one place, making it easy to understand how state can change

### `useContext` — Shared State Across Components

When multiple components need access to the same state, you can use React Context to "broadcast" state down the component tree without passing props through every level:

```tsx
const CartContext = createContext(null)

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  return (
    <CartContext.Provider value={{ items, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

function useCart() {
  return useContext(CartContext)
}
```

Now any component inside `CartProvider` can call `useCart()` to access the cart items and dispatch actions — whether it is deeply nested or at the top of the tree.

## When to Reach for External Libraries

React's built-in tools (useState, useReducer, useContext) are sufficient for many applications. But they have limitations that become apparent as your app grows:

- **Context causes re-renders** — Every component that reads from a context re-renders when *any* value in that context changes. If your cart context holds both items and a UI toggle, changing the toggle re-renders every component reading cart items.
- **No built-in persistence** — localStorage integration requires manual work
- **Boilerplate** — Setting up context providers, custom hooks, and reducers for every piece of shared state gets verbose

External libraries like **Zustand** and **nanostores** solve these problems:

```typescript
// Zustand example — a complete store in 10 lines
import { create } from "zustand"

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
}))
```

Zustand avoids the re-render problem by letting components subscribe to specific slices of state. It also has middleware for persistence, devtools integration, and more.

For our flower shop, we will stick with **React's built-in useReducer + useContext** pattern. It is the right level of complexity for a shopping cart, and it teaches you the fundamentals that every other state management library builds on. If you understand useReducer, learning Zustand or Redux later is trivial.

## Why Cart State Lives on the Client

You might wonder: "Should the shopping cart be stored on the server?" There are valid arguments for both approaches, but client-side cart storage is the better default for most e-commerce stores:

1. **Speed** — Adding an item to the cart is instantaneous. No network request, no loading state. The UI updates in the same frame as the click.

2. **Offline-friendly** — If the user's internet drops for a moment, the cart still works. They can browse, add items, adjust quantities — all without connectivity.

3. **Anonymous shopping** — Users should be able to fill a cart before creating an account. Client-side storage makes this trivial.

4. **Reduced server load** — If every "add to cart" click required a database write, your server would handle orders of magnitude more requests.

The tradeoff is that client-side carts are **ephemeral** — they disappear if the user clears their browser data or switches devices. We will address this in a later lesson by persisting the cart to `localStorage` and optionally syncing it to the server when the user logs in.

## What's Next

In the next lesson, you will build the cart store itself — a reducer that handles adding items, removing items, and updating quantities. This is one of the most satisfying pieces of code in the project: a small, pure function that captures all the business logic for a core feature.
