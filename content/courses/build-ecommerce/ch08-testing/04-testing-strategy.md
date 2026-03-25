---
id: "04-testing-strategy"
title: "Testing Strategy"
type: "info"
xp: 15
difficulty: 2
order: 4
prerequisites: ["03-component-testing"]
hints: []
---

# Testing Strategy

You know how to write unit tests with Vitest and component tests with Testing Library. But knowing the tools is only half the battle. The harder question is: **what should you actually test?** And how do you build a test suite that genuinely helps you ship with confidence without becoming a maintenance burden?

This lesson covers the strategies, patterns, and practical guidelines that experienced developers use.

## What to Test at Each Level

Not every test needs to be written at every level. The key is choosing the right level for each behavior you want to verify.

### Unit Tests: Pure Logic

Unit tests are your workhorse for anything that takes an input and returns an output without side effects:

- **Utility functions**: Price formatting, date formatting, slug generation, validation functions
- **Reducers**: Cart reducer, form state reducer, filter reducer
- **Calculations**: Tax computation, discount application, shipping cost estimation
- **Data transformations**: Mapping API responses to UI-friendly shapes, sorting and filtering logic
- **Validators**: Email validation, password strength checking, form field validation

```typescript
// Perfect for unit tests — pure function, no side effects
describe("applyDiscount", () => {
  it("applies a percentage discount", () => {
    expect(applyDiscount(10000, { type: "percent", value: 20 })).toBe(8000)
  })

  it("applies a fixed discount", () => {
    expect(applyDiscount(10000, { type: "fixed", value: 1500 })).toBe(8500)
  })

  it("never goes below zero", () => {
    expect(applyDiscount(1000, { type: "fixed", value: 5000 })).toBe(0)
  })
})
```

### Component Tests: User-Facing Behavior

Component tests verify that your UI renders correctly and responds to user actions:

- **Does it display the right content?** Product name, price, status badge
- **Does it respond to clicks?** Add to cart, remove, toggle
- **Does it handle different states?** Loading, error, empty, full
- **Does it show/hide elements conditionally?** Admin-only buttons, out-of-stock labels

```typescript
describe("OrderStatusBadge", () => {
  it("shows green badge for delivered orders", () => {
    render(<OrderStatusBadge status="delivered" />)
    const badge = screen.getByText("Delivered")
    expect(badge).toHaveClass("bg-green-100")
  })

  it("shows yellow badge for pending orders", () => {
    render(<OrderStatusBadge status="pending" />)
    const badge = screen.getByText("Pending")
    expect(badge).toHaveClass("bg-yellow-100")
  })
})
```

### Integration Tests: Workflows

Integration tests verify that multiple pieces of your system work together correctly:

- **API routes**: Does the endpoint read from the database and return the right shape?
- **Server functions**: Does the createOrder function validate input, charge the card, and save the order?
- **Data flow**: Does the form submission call the server function, which writes to the database, which updates the UI?

```typescript
describe("createOrder", () => {
  it("creates an order and associated order items", async () => {
    const order = await createOrder({
      userId: testUser.id,
      items: [{ productId: "1", quantity: 2, price: 4500 }],
    })

    expect(order.status).toBe("pending")
    expect(order.total).toBe(9000)

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })
})
```

## Mocking: When and When Not To

**Mocking** means replacing a real dependency with a fake one that you control. It is one of the most powerful and most misused tools in testing.

### When to Mock

Mock things that are **external to your system** or **non-deterministic**:

**External APIs**: You do not want your tests calling Stripe's real API. Mock the Stripe client to return predictable responses.

```typescript
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/test",
        }),
      },
    },
  })),
}))
```

**Timers and dates**: Tests that depend on the current time are flaky. Mock `Date.now()` to return a fixed value.

```typescript
vi.useFakeTimers()
vi.setSystemTime(new Date("2026-03-24"))

// Now Date.now() returns a fixed value
const stats = await getOrdersToday()
expect(stats.count).toBe(5)

vi.useRealTimers()
```

**Network requests**: Mock `fetch` or your HTTP client to avoid making real network calls in tests.

**Random values**: If your code generates random IDs, mock the random function for predictable test output.

### When NOT to Mock

**Your own database in integration tests**: If you are testing that your query function returns the right data, mocking the database defeats the purpose. Use a real test database (SQLite in-memory or a test PostgreSQL instance).

**The module you are testing**: If you mock the function you are supposed to be testing, you are testing the mock, not the function.

**Implementation details**: Do not mock internal helper functions. If `createOrder` internally calls `validateCart`, let it call the real function. Mocking it couples your test to the implementation.

**React rendering**: Do not mock React's rendering. Let components render normally and query the output.

### The Rule of Thumb

Mock at the **boundaries** of your system: network calls, third-party services, timers, and randomness. Let everything inside your system run for real.

## Test Coverage

Test coverage measures what percentage of your code is executed during tests. Vitest can generate coverage reports:

```bash
pnpm vitest run --coverage
```

This shows you something like:

```
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
cart.ts           |   95.00 |    87.50 |  100.00 |   95.00 |
formatPrice.ts    |  100.00 |   100.00 |  100.00 |  100.00 |
checkout.ts       |   72.00 |    60.00 |   80.00 |   72.00 |
```

### Why 100% Coverage Is Not the Goal

This might be surprising, but chasing 100% test coverage is usually counterproductive. Here is why:

- **Diminishing returns**: Getting from 0% to 80% coverage catches the vast majority of bugs. Getting from 80% to 100% takes disproportionate effort for marginal benefit.
- **Coverage does not equal quality**: You can have 100% coverage with terrible tests that assert nothing meaningful. Coverage tells you what code *ran*, not whether it was tested *correctly*.
- **It encourages testing trivial code**: To hit 100%, you end up writing tests for simple getters, constants, and boilerplate that will never have bugs.

### What to Aim For

A good target is **80-90% coverage** for critical paths:
- **95%+** for business logic (cart, pricing, discounts, order processing)
- **80-90%** for components (cover the important states and interactions)
- **70-80%** for utility code (formatters, helpers)
- **Don't worry** about config files, type definitions, or trivial wrappers

Focus on **meaningful coverage**: every line covered should be covered by a test that would fail if the behavior changed.

## CI/CD Integration

Tests are most valuable when they run **automatically** — every time someone pushes code or opens a pull request.

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run
      - run: pnpm vitest run --coverage
```

This workflow runs on every push and pull request. If any test fails, the PR gets a red X and cannot be merged (if you enable branch protection rules).

### Pre-commit Hooks

For faster feedback, you can run tests before every commit using a tool like **lint-staged** and **husky**:

```bash
# Only run tests related to changed files
pnpm vitest related --run $(git diff --name-only)
```

This runs only the tests that import (directly or transitively) the files you changed. It takes seconds instead of minutes.

## Testing Patterns

Over decades of software testing, several patterns have emerged that make tests cleaner and more maintainable.

### AAA: Arrange, Act, Assert

Every test should follow three distinct phases:

```typescript
it("applies the coupon discount to the total", () => {
  // Arrange — set up the test data
  const cart = [
    { id: "1", name: "Roses", price: 4500, quantity: 2 },
  ]
  const coupon = { code: "SPRING20", discount: 20 }

  // Act — perform the action being tested
  const total = calculateTotal(cart, coupon)

  // Assert — verify the result
  expect(total).toBe(7200) // 9000 - 20% = 7200
})
```

Keep the phases clearly separated. If you find yourself asserting in the middle of acting, split it into two tests.

### Given-When-Then

This is the same concept as AAA, but with language that reads like a specification:

```typescript
it("redirects to login when user is not authenticated", () => {
  // Given: no user session
  const session = null

  // When: accessing the dashboard
  const response = loadDashboard(session)

  // Then: redirect to login
  expect(response.redirect).toBe("/login")
})
```

This naming convention is especially common in behavior-driven development (BDD).

### Factory Functions

When many tests need similar test data, create factory functions instead of duplicating setup code:

```typescript
function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: "test-id",
    name: "Test Product",
    price: 1000,
    category: "bouquets",
    inStock: true,
    ...overrides,
  }
}

// Usage in tests
it("shows out of stock label", () => {
  const product = createProduct({ inStock: false })
  render(<ProductCard {...product} />)
  expect(screen.getByText("Out of Stock")).toBeDefined()
})
```

This keeps your tests concise and makes it clear which properties matter for each test case.

### Test One Thing Per Test

Each test should verify one behavior. If a test has three `expect` calls that are checking unrelated things, split it into three tests. When a test fails, you should immediately know what broke.

```typescript
// Bad: testing multiple unrelated things
it("renders correctly", () => {
  render(<ProductCard {...props} />)
  expect(screen.getByText(props.name)).toBeDefined()
  expect(screen.getByText("$45.00")).toBeDefined()
  expect(screen.getByRole("button")).toBeDefined()
  expect(screen.getByRole("img")).toHaveAttribute("alt", props.name)
})

// Good: one behavior per test
it("renders the product name", () => {
  render(<ProductCard {...props} />)
  expect(screen.getByText(props.name)).toBeDefined()
})

it("renders the formatted price", () => {
  render(<ProductCard {...props} />)
  expect(screen.getByText("$45.00")).toBeDefined()
})
```

## What to Learn Next

Testing is a skill that improves with practice. As you build more features, write tests for them. Start with the easy wins — pure functions and reducers — then work your way up to component tests and integration tests.

Some advanced testing topics to explore when you are ready:
- **Snapshot testing**: Capture the rendered output of a component and compare it to a saved snapshot. Useful for catching unexpected UI changes.
- **Visual regression testing**: Tools like Chromatic or Percy that compare screenshots of your UI across builds.
- **Playwright / Cypress**: Full E2E testing frameworks that control a real browser.
- **Test doubles**: Understanding the difference between mocks, stubs, spies, and fakes.

For now, the fundamentals you have learned in this chapter will cover the vast majority of your testing needs. In the next and final chapter, you will learn how to deploy your tested, production-ready application.
