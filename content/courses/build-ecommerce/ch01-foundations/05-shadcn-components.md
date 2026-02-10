---
id: "05-shadcn-components"
title: "Using shadcn/ui Components"
type: "code"
xp: 25
difficulty: 3
order: 5
prerequisites: ["04-tailwind-basics"]
hints:
  - "shadcn/ui Button accepts a 'variant' prop like 'default', 'outline', 'secondary'."
  - "Card is composed of CardHeader, CardTitle, CardContent sub-components."
---

# Using shadcn/ui Components

shadcn/ui is a collection of beautifully designed, accessible components built on Radix UI primitives. Unlike traditional component libraries, shadcn/ui gives you the actual source code — you own the components.

## How It Works

Components are added via the CLI:

```bash
pnpm dlx shadcn@latest add button card dialog
```

This copies the component source code into `src/components/ui/`. You can customize them however you want.

## Key Components

### Button

```tsx
<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Product description goes here.</p>
  </CardContent>
</Card>
```

## Your Task

Write a JSX snippet that creates a product card with:
- A `Card` wrapper
- A `CardHeader` containing a `CardTitle` with text "Sunrise Bouquet"
- A `CardContent` containing a paragraph with price "$45.00"
- A `Button` with text "Add to Cart"
