---
id: "01-why-testing"
title: "Why Testing?"
type: "info"
xp: 15
difficulty: 1
order: 1
prerequisites: []
hints: []
---

# Why Testing?

Your e-commerce app is getting real. It handles user accounts, product browsing, shopping carts, payments, and order management. Every time you add a new feature or change existing code, there is a risk that something else breaks. Maybe the cart total calculation is off by a cent after you refactored the pricing logic. Maybe the checkout flow crashes when a product goes out of stock.

You could test everything manually — click through every page, add items to the cart, go through checkout — every single time you make a change. But that is slow, error-prone, and soul-crushing. There is a better way: **automated testing**.

## Why Testing Matters

Testing is not about writing extra code to prove something works. It is about building a safety net that catches problems before your users do. Here are the real reasons testing matters.

### Confidence to Ship

When you have a suite of tests that covers your critical flows, you can deploy new code with confidence. The tests tell you "everything that worked before still works." Without tests, every deployment is a gamble.

### Refactoring Safety

Refactoring means improving the structure of your code without changing its behavior. It is one of the most important skills in software development — but it is terrifying without tests. What if you accidentally break something?

With tests, you refactor fearlessly. Change the internal implementation however you want. If the tests still pass, the behavior is preserved. If a test fails, you know exactly what broke and where.

### Living Documentation

Tests describe what your code is supposed to do, in executable form. When a new developer joins the team and wants to understand how the cart works, they can read the cart tests:

```typescript
it("adds a new item to the cart", () => { ... })
it("increments quantity for existing items", () => { ... })
it("removes an item when quantity reaches zero", () => { ... })
it("calculates the correct total", () => { ... })
```

These test names are a spec. They tell you the expected behavior without ambiguity.

### Faster Debugging

When something breaks, a failing test tells you exactly which function, which input, and which expected output is wrong. Compare that to a bug report that says "the checkout is broken" — you would spend hours tracking down the issue.

## Types of Tests

Not all tests are the same. They operate at different levels of your application, and each level has different trade-offs.

### Unit Tests

A **unit test** tests a single function or module in isolation. It does not touch the database, the network, or the DOM. It is fast and focused.

```typescript
// Unit test: does the price formatter work?
it("formats cents to dollars", () => {
  expect(formatPrice(4500)).toBe("$45.00")
  expect(formatPrice(100)).toBe("$1.00")
  expect(formatPrice(0)).toBe("$0.00")
})
```

Unit tests are:
- **Fast**: They run in milliseconds because there are no external dependencies.
- **Precise**: When one fails, you know exactly which function has a bug.
- **Easy to write**: Small inputs, small outputs, no setup.

Good candidates for unit tests:
- Utility functions (formatters, validators, parsers)
- Pure business logic (cart calculations, discount rules, tax computation)
- State reducers
- Data transformations

### Integration Tests

An **integration test** tests how multiple parts of your system work together. It might test that your API endpoint correctly reads from the database and returns the right response.

```typescript
// Integration test: does the API return products from the database?
it("returns products filtered by category", async () => {
  // Seed the test database
  await db.insert(products).values([
    { id: "1", name: "Roses", category: "bouquets", price: 4500 },
    { id: "2", name: "Vase", category: "accessories", price: 2000 },
  ])

  const result = await getProductsByCategory("bouquets")
  expect(result).toHaveLength(1)
  expect(result[0].name).toBe("Roses")
})
```

Integration tests are:
- **More realistic**: They test actual interactions between components.
- **Slower**: They might involve database queries, file reads, or HTTP requests.
- **Broader**: When one fails, the bug could be in any of the components involved.

### End-to-End (E2E) Tests

An **end-to-end test** tests the entire application from the user's perspective. It opens a real browser, navigates to pages, clicks buttons, fills out forms, and checks that the right things happen.

```typescript
// E2E test: can a user complete checkout?
it("completes the checkout flow", async () => {
  await page.goto("/products")
  await page.click("text=Add to Cart")
  await page.click("text=Checkout")
  await page.fill("#email", "test@example.com")
  await page.fill("#card", "4242424242424242")
  await page.click("text=Pay Now")
  await expect(page.locator("text=Order Confirmed")).toBeVisible()
})
```

E2E tests are:
- **Most realistic**: They test exactly what the user experiences.
- **Slowest**: They run a real browser and interact with a real (or staging) server.
- **Most brittle**: They break when the UI changes, even if the functionality is fine.

## The Testing Pyramid

The **testing pyramid** is a model that suggests how many tests of each type you should have:

```
        /\
       /  \
      / E2E \        Few (5-10)
     /--------\
    /Integration\    Some (20-50)
   /--------------\
  /   Unit Tests    \ Many (100+)
 /____________________\
```

The base is wide: you should have **many unit tests** because they are cheap, fast, and reliable. The middle layer has **some integration tests** to verify components work together. The top has **few E2E tests** that cover the most critical user journeys.

### Why This Shape?

It comes down to economics:
- **Unit tests** are cheap to write, fast to run, and easy to maintain. If you have 500 of them and they run in 2 seconds total, there is no downside.
- **Integration tests** take more setup (database seeding, test servers) and run slower. You want enough to cover your key integrations but not so many that your test suite takes 10 minutes.
- **E2E tests** are expensive in every way: slow to run, brittle to maintain, and complex to set up. Reserve them for your most critical paths (signup, checkout, payment).

## What to Test and What Not to Test

This is one of the most common questions developers have, and the answer is nuanced.

### Test This

- **Business logic**: Cart calculations, discount rules, order total computation. These are the core of your application and bugs here cost money.
- **Data transformations**: Functions that take data in one shape and return it in another. These are easy to test and frequently contain edge-case bugs.
- **Edge cases**: What happens with an empty cart? A product with a price of zero? A user with no orders? These are the cases that slip through manual testing.
- **Error handling**: Does your code handle invalid input gracefully? Does it show the right error message?

### Don't Test This

- **Third-party libraries**: You do not need to test that React renders a `<div>` correctly. React's own test suite covers that.
- **Implementation details**: Do not test *how* something works internally. Test *what* it does. If you refactor the internals, your tests should not need to change.
- **Trivial code**: A function that does nothing but return a constant does not need a test.
- **CSS and layout**: Automated tests are bad at verifying visual design. Use visual regression tools or manual review for that.

## Testing Philosophy: Behavior Over Implementation

This is the single most important principle in testing: **test behavior, not implementation**.

Bad test (tests implementation):

```typescript
it("calls setState with the new item", () => {
  const setState = vi.fn()
  addToCart(setState, product)
  expect(setState).toHaveBeenCalledWith(expect.any(Function))
})
```

Good test (tests behavior):

```typescript
it("adds the product to the cart", () => {
  const cart = addToCart([], product)
  expect(cart).toContainEqual({ ...product, quantity: 1 })
})
```

The bad test breaks if you refactor from `setState` to `useReducer` or Zustand, even though the behavior is identical. The good test only breaks if the actual behavior changes.

When you write a test, ask yourself: "Would a user care about what I am testing?" A user cares that the cart has the right items. A user does not care whether you used `setState` or a reducer internally.

In the next lesson, you will set up Vitest and write your first real tests.
