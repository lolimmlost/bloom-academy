---
id: "03-component-testing"
title: "Component Testing"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-vitest-basics"]
hints:
  - "Import render and screen from '@testing-library/react' and userEvent from '@testing-library/user-event'."
  - "Use render(<ProductCard ... />) to mount the component."
  - "Use screen.getByText('text') to find elements by their visible text."
  - "Use screen.getByRole('button') to find the add-to-cart button."
  - "Create a mock function with vi.fn() and pass it as the onAddToCart prop."
---

# Component Testing

Unit tests are great for pure functions, but your application is mostly **components** — React functions that render UI and respond to user interactions. In this lesson, you will learn how to test components using **Testing Library**, a tool designed to test the way your users actually interact with your app.

## What Is Testing Library?

Testing Library is a family of utilities that helps you test UI components. The core philosophy is summed up in its guiding principle:

> The more your tests resemble the way your software is used, the more confidence they can give you.

This means:
- Query elements the way a user would find them — by visible text, by role (button, heading, textbox), by label.
- Do not query by CSS class names, internal state, or component internals.
- Simulate real user interactions — clicking buttons, typing in inputs — not calling internal methods.

### Installation

```bash
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

You also need to tell Vitest to use a browser-like environment. Add this to your `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
})
```

And create a setup file that extends Vitest's matchers with Testing Library's custom matchers:

```typescript
// test/setup.ts
import "@testing-library/jest-dom/vitest"
```

This gives you matchers like `toBeInTheDocument()`, `toBeVisible()`, and `toHaveTextContent()`.

## Rendering Components in Tests

The `render` function from Testing Library mounts your component into a virtual DOM (jsdom) so you can query and interact with it.

```typescript
import { render, screen } from "@testing-library/react"
import { ProductCard } from "./ProductCard"

it("renders the product name", () => {
  render(<ProductCard name="Sunset Tulips" price={3500} onAddToCart={() => {}} />)
  expect(screen.getByText("Sunset Tulips")).toBeDefined()
})
```

After calling `render`, the component's HTML is available through the `screen` object. The `screen` object provides methods for finding elements in the rendered output.

### What render Returns

`render` also returns utilities directly, but the recommended approach is to use `screen`:

```typescript
// Preferred — uses the global screen object
render(<MyComponent />)
screen.getByText("Hello")

// Also works — destructuring from render
const { getByText } = render(<MyComponent />)
getByText("Hello")
```

Using `screen` is preferred because it keeps your tests consistent and avoids variable shadowing when you render multiple components.

## Querying Elements

Testing Library provides several types of queries, each with a specific use case.

### getByText

Finds an element by its visible text content. This is how users identify elements, so it is one of the most common queries.

```typescript
screen.getByText("Add to Cart")
screen.getByText("$35.00")
screen.getByText(/sunset tulips/i) // Case-insensitive regex
```

### getByRole

Finds an element by its ARIA role. This is the most accessible query — it mirrors how screen readers identify elements.

```typescript
screen.getByRole("button")                      // Finds a <button>
screen.getByRole("button", { name: "Add to Cart" }) // Finds a specific button
screen.getByRole("heading", { level: 2 })       // Finds an <h2>
screen.getByRole("textbox")                      // Finds an <input type="text">
screen.getByRole("link", { name: "View Details" }) // Finds an <a> tag
```

Common roles:
- `button` — `<button>` and `<input type="submit">`
- `heading` — `<h1>` through `<h6>`
- `textbox` — `<input>` and `<textarea>`
- `link` — `<a>` tags with `href`
- `img` — `<img>` tags
- `list` — `<ul>` and `<ol>`
- `listitem` — `<li>`

### getByLabelText

Finds a form input by its associated label. This is the recommended way to query form elements.

```typescript
screen.getByLabelText("Email address")
screen.getByLabelText("Password")
```

This works when your HTML has proper label associations:

```html
<label htmlFor="email">Email address</label>
<input id="email" type="email" />
```

### getByTestId

Finds an element by its `data-testid` attribute. This is the last resort — use it only when there is no accessible way to query the element.

```typescript
screen.getByTestId("product-card-skeleton")
```

```tsx
<div data-testid="product-card-skeleton" className="animate-pulse" />
```

### Query Priority

Testing Library recommends this priority order:
1. **getByRole** — the most accessible
2. **getByLabelText** — best for form fields
3. **getByText** — good for non-interactive content
4. **getByTestId** — fallback when nothing else works

### get vs query vs find

Each query type comes in three variants:

| Variant | Behavior when not found |
|---------|------------------------|
| `getBy...` | Throws an error immediately |
| `queryBy...` | Returns `null` (useful for asserting absence) |
| `findBy...` | Returns a Promise — waits for the element to appear (useful for async rendering) |

```typescript
// Assert element exists (throws if not found)
screen.getByText("Hello")

// Assert element does NOT exist
expect(screen.queryByText("Error")).toBeNull()

// Wait for element to appear (async)
const element = await screen.findByText("Loaded!")
```

## User Interactions

Testing Library provides `userEvent` for simulating user interactions. It fires the same events a real browser would — `mousedown`, `mouseup`, `click`, `keydown`, `keyup`, `input`, etc.

### Click

```typescript
import userEvent from "@testing-library/user-event"

it("calls onAddToCart when the button is clicked", async () => {
  const handleClick = vi.fn()
  render(<ProductCard name="Roses" price={4500} onAddToCart={handleClick} />)

  await userEvent.click(screen.getByRole("button"))
  expect(handleClick).toHaveBeenCalledOnce()
})
```

Note that `userEvent` methods are **async** — they return promises. Always `await` them.

### Type

```typescript
it("updates the search input", async () => {
  render(<SearchBar />)

  const input = screen.getByRole("textbox")
  await userEvent.type(input, "roses")
  expect(input).toHaveValue("roses")
})
```

`userEvent.type` simulates typing character by character, firing all the appropriate keyboard events. This is more realistic than directly setting the input value.

### Clear

```typescript
await userEvent.clear(screen.getByRole("textbox"))
```

### Select from a dropdown

```typescript
await userEvent.selectOptions(
  screen.getByRole("combobox"),
  "pending"
)
```

## Mock Functions

When testing components, you often need to verify that a callback was called. Vitest provides `vi.fn()` for creating **mock functions** — special functions that record how they were called.

```typescript
import { vi } from "vitest"

const mockFn = vi.fn()

// Call it
mockFn("hello", 42)

// Check that it was called
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledOnce()
expect(mockFn).toHaveBeenCalledWith("hello", 42)
expect(mockFn).toHaveBeenCalledTimes(1)
```

Mock functions are essential for testing callbacks. Instead of wiring up the full application, you pass a mock function as a prop and verify it was called correctly:

```typescript
const onAddToCart = vi.fn()
render(<ProductCard name="Roses" price={4500} onAddToCart={onAddToCart} />)
await userEvent.click(screen.getByRole("button"))
expect(onAddToCart).toHaveBeenCalledOnce()
```

### Mock Return Values

You can also make mock functions return specific values:

```typescript
const getUser = vi.fn()
getUser.mockReturnValue({ name: "Alice", role: "admin" })

const user = getUser()
expect(user.name).toBe("Alice")
```

For async functions:

```typescript
const fetchProducts = vi.fn()
fetchProducts.mockResolvedValue([{ id: "1", name: "Roses" }])

const products = await fetchProducts()
expect(products).toHaveLength(1)
```

## Putting It Together: Testing a Product Card

Here is a complete, real-world example of testing a product card component:

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductCard } from "./ProductCard"

describe("ProductCard", () => {
  const defaultProps = {
    name: "Sunset Tulips",
    price: 3500,
    image: "/tulips.jpg",
    onAddToCart: vi.fn(),
  }

  it("renders the product name", () => {
    render(<ProductCard {...defaultProps} />)
    expect(screen.getByText("Sunset Tulips")).toBeDefined()
  })

  it("renders the formatted price", () => {
    render(<ProductCard {...defaultProps} />)
    expect(screen.getByText("$35.00")).toBeDefined()
  })

  it("renders the product image", () => {
    render(<ProductCard {...defaultProps} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/tulips.jpg")
    expect(img).toHaveAttribute("alt", "Sunset Tulips")
  })

  it("calls onAddToCart when the button is clicked", async () => {
    const onAddToCart = vi.fn()
    render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} />)
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }))
    expect(onAddToCart).toHaveBeenCalledOnce()
  })

  it("disables the button when out of stock", () => {
    render(<ProductCard {...defaultProps} inStock={false} />)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
```

Notice the pattern:
- Each test is focused on one behavior
- Tests use accessible queries (`getByText`, `getByRole`)
- User interactions use `userEvent`
- Callbacks are verified with `vi.fn()`

## Your Task

Write a component test for a `ProductCard` component. Your test should:

1. Render the component with `name`, `price`, and `onAddToCart` props
2. Verify that the product name and formatted price are visible
3. Create a mock function with `vi.fn()` for the `onAddToCart` callback
4. Simulate a button click using `userEvent`
5. Verify that `onAddToCart` was called
