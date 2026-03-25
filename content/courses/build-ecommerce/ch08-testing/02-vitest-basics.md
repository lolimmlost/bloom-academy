---
id: "02-vitest-basics"
title: "Vitest Basics"
type: "code"
xp: 25
difficulty: 2
order: 2
prerequisites: ["01-why-testing"]
hints:
  - "Start with describe('cartReducer', () => { ... }) to group your tests."
  - "Use it('description', () => { ... }) to define individual test cases."
  - "Use expect(result).toHaveLength(1) to check array length."
  - "Dispatch actions with { type: 'add', item: { ... } } and { type: 'remove', id: '1' }."
---

# Vitest Basics

Now that you understand why testing matters, let's set up a testing framework and write real tests. We are using **Vitest** — a modern test runner built specifically for the Vite ecosystem.

## What Is Vitest?

Vitest is a unit testing framework that runs on top of Vite. Since our project already uses Vite (through TanStack Start), Vitest plugs in with zero extra configuration — it reuses your existing Vite config for module resolution, TypeScript support, and path aliases.

### Why Vitest?

If you have heard of **Jest**, you might wonder why we are not using that. Jest is a great framework, but Vitest has several advantages for Vite-based projects:

- **Native Vite support**: Vitest understands your Vite config out of the box. Path aliases like `@/` work without extra setup.
- **Speed**: Vitest uses Vite's blazing-fast module transformation. Tests start in milliseconds, not seconds.
- **Jest-compatible API**: If you know Jest, you already know Vitest. The `describe`, `it`, `expect` API is identical.
- **Watch mode**: Vitest re-runs only the tests affected by your changes, using Vite's dependency graph.
- **TypeScript out of the box**: No need for `ts-jest` or other adapters.

### Installing Vitest

```bash
pnpm add -D vitest
```

That is it. No config file needed for basic usage. Vitest automatically finds files matching `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`.

To run tests:

```bash
pnpm vitest        # Watch mode (re-runs on file changes)
pnpm vitest run    # Single run (good for CI)
```

## Writing Your First Test

Let's start with the fundamentals. Every test file follows the same structure.

### describe, it, expect

These three functions are the building blocks of every test:

```typescript
import { describe, it, expect } from "vitest"

describe("formatPrice", () => {
  it("formats cents to a dollar string", () => {
    expect(formatPrice(4500)).toBe("$45.00")
  })

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00")
  })
})
```

- **`describe(name, fn)`** creates a test suite — a group of related tests. The name should describe what you are testing (usually a function name or component name).
- **`it(name, fn)`** defines a single test case. The name should describe the expected behavior in plain English. Read it as a sentence: "it formats cents to a dollar string."
- **`expect(value)`** starts an assertion. You give it the actual value, then chain a **matcher** to compare it against the expected value.

You can also use `test()` instead of `it()` — they are identical. Use whichever reads better to you.

### Nesting describe Blocks

For complex subjects, you can nest `describe` blocks to organize your tests:

```typescript
describe("cart", () => {
  describe("adding items", () => {
    it("adds a new item with quantity 1", () => { ... })
    it("increments quantity for existing items", () => { ... })
  })

  describe("removing items", () => {
    it("removes the item from the cart", () => { ... })
    it("does nothing if item is not in cart", () => { ... })
  })
})
```

## Matchers

Matchers are the methods you chain after `expect()` to define what you are checking. Vitest provides a rich set of matchers.

### Equality

```typescript
// Strict equality (===) — for primitives
expect(2 + 2).toBe(4)
expect("hello").toBe("hello")

// Deep equality — for objects and arrays
expect({ name: "Rose" }).toEqual({ name: "Rose" })
expect([1, 2, 3]).toEqual([1, 2, 3])
```

**Important**: `toBe` uses strict equality (`===`), so it fails for objects even if they have the same properties (because they are different references). Use `toEqual` for objects and arrays.

```typescript
// This FAILS:
expect({ a: 1 }).toBe({ a: 1 }) // Different objects in memory

// This PASSES:
expect({ a: 1 }).toEqual({ a: 1 }) // Same structure
```

### Truthiness

```typescript
expect(true).toBeTruthy()
expect(false).toBeFalsy()
expect(null).toBeNull()
expect(undefined).toBeUndefined()
expect("hello").toBeDefined()
```

### Numbers

```typescript
expect(10).toBeGreaterThan(5)
expect(10).toBeGreaterThanOrEqual(10)
expect(10).toBeLessThan(20)
expect(0.1 + 0.2).toBeCloseTo(0.3) // Handles floating-point precision
```

### Strings

```typescript
expect("hello world").toContain("world")
expect("hello world").toMatch(/^hello/)
```

### Arrays

```typescript
expect([1, 2, 3]).toContain(2)
expect([1, 2, 3]).toHaveLength(3)
expect([{ id: 1 }, { id: 2 }]).toContainEqual({ id: 1 })
```

### Exceptions

```typescript
expect(() => {
  throw new Error("boom")
}).toThrow()

expect(() => {
  throw new Error("invalid email")
}).toThrow("invalid email")
```

### Negation

Any matcher can be negated with `.not`:

```typescript
expect(5).not.toBe(10)
expect([1, 2]).not.toContain(3)
expect("hello").not.toMatch(/goodbye/)
```

## Setup and Teardown

Sometimes you need to prepare something before each test runs, or clean up afterward. Vitest provides lifecycle hooks for this.

### beforeEach and afterEach

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest"

describe("cart operations", () => {
  let cart: CartItem[]

  beforeEach(() => {
    // Runs before EVERY test in this describe block
    cart = [
      { id: "1", name: "Rose Bouquet", price: 4500, quantity: 2 },
      { id: "2", name: "Tulip Bundle", price: 3000, quantity: 1 },
    ]
  })

  afterEach(() => {
    // Runs after EVERY test — useful for cleanup
    cart = []
  })

  it("calculates the total", () => {
    expect(calculateTotal(cart)).toBe(12000)
  })

  it("finds an item by id", () => {
    expect(findItem(cart, "1")?.name).toBe("Rose Bouquet")
  })
})
```

`beforeEach` creates a fresh cart before every test, so tests do not interfere with each other. This is critical — tests should be **independent**. One test should never depend on the side effects of another.

### beforeAll and afterAll

If setup is expensive and can be shared across tests (like creating a test database), use `beforeAll` and `afterAll`:

```typescript
import { beforeAll, afterAll } from "vitest"

let testDb: Database

beforeAll(async () => {
  // Runs ONCE before all tests in this file
  testDb = await createTestDatabase()
})

afterAll(async () => {
  // Runs ONCE after all tests in this file
  await testDb.close()
})
```

Use `beforeAll` sparingly. If tests share mutable state, they can interfere with each other and cause flaky failures.

## Testing a Cart Reducer

Let's put this all together with a realistic example. A **reducer** is a pure function that takes a state and an action, and returns a new state. Reducers are perfect candidates for unit testing because they are pure — no side effects, no network calls, just input and output.

Here is a simple cart reducer:

```typescript
// cart.ts
type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type CartAction =
  | { type: "add"; item: { id: string; name: string; price: number } }
  | { type: "remove"; id: string }
  | { type: "updateQuantity"; id: string; quantity: number }

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
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
    case "remove":
      return state.filter((item) => item.id !== action.id)
    case "updateQuantity":
      return state.map((item) =>
        item.id === action.id ? { ...item, quantity: action.quantity } : item
      )
  }
}
```

And here is how you would test it:

```typescript
// cart.test.ts
import { describe, it, expect } from "vitest"
import { cartReducer } from "./cart"

describe("cartReducer", () => {
  const sampleProduct = { id: "1", name: "Rose Bouquet", price: 4500 }

  describe("add action", () => {
    it("adds a new item with quantity 1", () => {
      const result = cartReducer([], { type: "add", item: sampleProduct })
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ ...sampleProduct, quantity: 1 })
    })

    it("increments quantity for existing items", () => {
      const state = [{ ...sampleProduct, quantity: 1 }]
      const result = cartReducer(state, { type: "add", item: sampleProduct })
      expect(result[0].quantity).toBe(2)
    })

    it("does not modify other items", () => {
      const other = { id: "2", name: "Tulips", price: 3000, quantity: 1 }
      const state = [other]
      const result = cartReducer(state, { type: "add", item: sampleProduct })
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(other) // unchanged
    })
  })

  describe("remove action", () => {
    it("removes the item with the given id", () => {
      const state = [{ ...sampleProduct, quantity: 1 }]
      const result = cartReducer(state, { type: "remove", id: "1" })
      expect(result).toHaveLength(0)
    })

    it("returns the same state if id not found", () => {
      const state = [{ ...sampleProduct, quantity: 1 }]
      const result = cartReducer(state, { type: "remove", id: "999" })
      expect(result).toHaveLength(1)
    })
  })

  describe("updateQuantity action", () => {
    it("updates the quantity of the specified item", () => {
      const state = [{ ...sampleProduct, quantity: 1 }]
      const result = cartReducer(state, {
        type: "updateQuantity",
        id: "1",
        quantity: 5,
      })
      expect(result[0].quantity).toBe(5)
    })
  })
})
```

Notice the pattern:
1. **Arrange**: Set up the initial state and the action
2. **Act**: Call the reducer
3. **Assert**: Check the result

This is the **AAA pattern** (Arrange, Act, Assert), and you will use it in virtually every test you write.

## Your Task

Write tests for a cart reducer. Your tests should cover:

1. **Adding a new item** — verify it appears in the cart with quantity 1
2. **Adding an existing item** — verify the quantity increments
3. **Removing an item** — verify it is removed from the cart

Use `describe` to group the tests, `it` to define each test case, and `expect` for assertions.
