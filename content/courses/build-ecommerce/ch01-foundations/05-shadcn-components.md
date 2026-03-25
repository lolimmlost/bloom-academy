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

## What is Radix UI?

Before we talk about shadcn/ui, we need to understand the foundation it's built on: **Radix UI**.

Building interactive UI components that work correctly is *hard*. Think about a dropdown menu — it needs to:

- Open and close when clicked
- Close when you click outside of it
- Be navigable with the keyboard (arrow keys, Enter, Escape)
- Work with screen readers (proper ARIA attributes)
- Handle focus management (focus the first item when opened, return focus when closed)
- Position itself correctly even near the edge of the screen

Implementing all of that from scratch for every component in your app would be an enormous amount of work. And getting accessibility wrong isn't just annoying — it makes your app unusable for people with disabilities.

**Radix UI** solves this by providing **headless (unstyled) component primitives**. These are components that handle all the behavior, keyboard interaction, and accessibility out of the box — but they have absolutely no visual styling. They're the logic and structure without the paint.

This is a powerful separation of concerns:
- **Radix handles behavior** — open/close states, keyboard navigation, ARIA attributes, focus trapping
- **You handle styling** — apply whatever visual design you want with Tailwind, CSS, or anything else

shadcn/ui takes Radix primitives and adds beautiful default styling with Tailwind CSS. You get the best of both worlds: rock-solid accessibility *and* great-looking components.

## The "Copy, Don't Install" Philosophy

Most component libraries (Material UI, Chakra UI, Ant Design) work like this: you install an npm package, import components, and pass props to customize them. When the library releases a new version, you update the package.

shadcn/ui works fundamentally differently. When you run:

```bash
pnpm dlx shadcn@latest add button card dialog
```

This **copies the actual source code** into `src/components/ui/`. You can open `button.tsx`, read every line, and change anything you want.

Why is this approach better?

- **Full customization** — You're not limited to the props the library author thought to expose. Want to change how the button handles focus rings? Just edit the file.
- **No version lock-in** — You never have a breaking change forced on you by a library update. Your components are *yours*.
- **Smaller bundles** — You only have the components you use, and they contain only the code you need. Traditional component libraries often ship a lot of code you'll never use.
- **Learning opportunity** — You can read the source code to understand how professional UI components are built. It's like getting a masterclass in component architecture for free.
- **No dependency conflicts** — Since the code lives in your project, there are no version mismatches or peer dependency headaches.

The tradeoff is that you're responsible for maintaining your own components — but in practice, well-built components rarely need changes, and when they do, you have full control to make them.

## The Composition Pattern

You'll notice that shadcn/ui components use a **composition pattern** (sometimes called "compound components") rather than a monolithic props approach.

### The Monolithic Approach (What We're Avoiding)

Some component libraries use a single component with many props:

```tsx
// ❌ Monolithic — one component, lots of props
<Card
  title="Product Name"
  subtitle="Fresh flowers"
  body="Product description goes here."
  footer={<Button>Add to Cart</Button>}
  headerIcon={<FlowerIcon />}
  bordered
  shadowed
/>
```

This looks simple at first, but it becomes unwieldy as requirements grow. What if you need custom formatting in the body? What if you want two buttons in the footer? You end up with render props, function-as-children, or ever-growing prop APIs.

### The Composition Approach (What We Use)

shadcn/ui components are broken into small, composable pieces:

```tsx
// ✅ Composition — small pieces that fit together
<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Fresh flowers</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Product description goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>
```

Each sub-component (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) is a simple wrapper that applies consistent styling. The power comes from being able to **put anything you want inside** — regular HTML, other components, conditional logic, whatever your UI requires.

This pattern scales beautifully. Need an image above the header? Just add an `<img>` tag. Need a badge next to the title? Drop in a `<Badge>` component. You're never fighting the component API.

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

### More Components You'll Use

shadcn/ui has a rich set of components. Here are a few more you'll encounter throughout this course:

**Input** — A styled text input with consistent focus states:

```tsx
<Input placeholder="Search flowers..." />
<Input type="email" placeholder="you@example.com" />
```

**Dialog** — A modal that overlays the page, with proper focus trapping and escape-to-close:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Make changes to your account.</DialogDescription>
    </DialogHeader>
    <Input placeholder="Name" />
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Notice how the Dialog follows the same composition pattern — small, meaningful sub-components that you assemble.

**Select** — A dropdown selection menu with keyboard navigation:

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Sort by..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="price-asc">Price: Low to High</SelectItem>
    <SelectItem value="price-desc">Price: High to Low</SelectItem>
    <SelectItem value="newest">Newest First</SelectItem>
  </SelectContent>
</Select>
```

**Toast** — Non-intrusive notifications that appear temporarily:

```tsx
// In your component
const { toast } = useToast()

toast({
  title: "Added to cart!",
  description: "Sunrise Bouquet × 1",
})
```

You don't need to memorize all of these right now — we'll introduce each component when we need it in the course. The important thing is knowing that shadcn/ui has a component for most common UI patterns, and they all follow the same composition-based philosophy.

## Theming with CSS Variables

shadcn/ui uses a clever theming system built on **CSS custom properties** (also called CSS variables) combined with Tailwind. This is what makes light and dark mode — and custom themes — possible without rewriting component styles.

Here's how it works. In your global CSS, you define theme variables:

```css
:root {
  --background: 0 0% 100%;        /* white */
  --foreground: 240 10% 3.9%;     /* near black */
  --primary: 262 83% 58%;         /* purple */
  --primary-foreground: 0 0% 100%; /* white text on purple */
  --card: 0 0% 100%;
  --border: 240 5.9% 90%;
  /* ...more variables */
}

.dark {
  --background: 240 10% 3.9%;     /* near black */
  --foreground: 0 0% 98%;         /* near white */
  --primary: 262 83% 58%;         /* purple stays the same */
  --primary-foreground: 0 0% 100%;
  --card: 240 10% 3.9%;
  --border: 240 3.7% 15.9%;
  /* ...more variables */
}
```

These variables use the **HSL color format** (hue, saturation, lightness). Tailwind is configured to reference them:

```css
/* In tailwind config */
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
}
```

Now when you write `bg-primary` or `text-foreground` in your components, Tailwind resolves them to the current theme's CSS variables. Switching between light and dark mode is as simple as toggling the `.dark` class on the `<html>` element — every component updates automatically because the variables change.

The beauty of this approach is that **component code never changes** between themes. A `<Button>` uses `bg-primary text-primary-foreground` regardless of whether the app is in light or dark mode. The theming is handled entirely at the CSS variable level, which is clean, performant, and easy to extend.

Want a custom brand theme? Just change the CSS variable values. Every component in your app will update to match — no prop drilling, no theme context providers, no manual overrides.

## Your Task

Write a JSX snippet that creates a product card with:
- A `Card` wrapper
- A `CardHeader` containing a `CardTitle` with text "Sunrise Bouquet"
- A `CardContent` containing a paragraph with price "$45.00"
- A `Button` with text "Add to Cart"
