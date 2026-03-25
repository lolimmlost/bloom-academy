---
id: "04-tailwind-basics"
title: "Tailwind CSS Basics"
type: "code"
xp: 25
difficulty: 2
order: 4
prerequisites: ["03-tanstack-start"]
hints:
  - "Tailwind uses utility classes like 'text-center', 'font-bold', 'bg-blue-500'."
  - "Container classes like 'max-w-4xl' and 'mx-auto' center content."
---

# Tailwind CSS Basics

Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS, you apply pre-built utility classes directly in your HTML/JSX.

## Traditional CSS vs Utility-First

To understand what "utility-first" really means, let's compare two approaches to styling the same component — a simple product card.

### The Traditional CSS Approach

With traditional CSS, you create semantic class names and write styles in a separate file:

```html
<div class="product-card">
  <h3 class="product-card__title">Sunrise Bouquet</h3>
  <p class="product-card__price">$45.00</p>
</div>
```

```css
/* styles.css */
.product-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.product-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.product-card__price {
  color: #6b7280;
  font-size: 0.875rem;
}
```

This works, but you spend a lot of time **naming things** (`.product-card__title`? `.product-card-title`? `.productCardTitle`?), and your CSS file grows endlessly. Every new component means inventing new class names and writing more styles.

### The Utility-First Approach

With Tailwind, you apply small, single-purpose utility classes directly in your markup:

```html
<div class="bg-white rounded-lg p-6 shadow-sm">
  <h3 class="text-xl font-bold mb-2">Sunrise Bouquet</h3>
  <p class="text-gray-500 text-sm">$45.00</p>
</div>
```

No CSS file needed. No class names to invent. You can look at the HTML and immediately understand how it's styled. At first, this might look cluttered — but once you get used to it, you'll find that **keeping styles next to the markup they affect** is incredibly productive. You never have to switch files or hunt for the right CSS rule.

## Why Tailwind?

- **No naming** — no need to invent class names like `.hero-section-title`
- **Consistency** — uses a design system (spacing scale, color palette)
- **Responsive** — prefix classes with `sm:`, `md:`, `lg:` for breakpoints
- **Dark mode** — prefix with `dark:` for dark theme styles
- **Tiny bundles** — unused styles are purged at build time

## The Spacing Scale

Tailwind uses a consistent **spacing scale** that maps numbers to `rem` values. This creates visual harmony across your entire app because everything snaps to the same grid:

| Class | Value | Pixels (at 16px base) |
|-------|-------|-----------------------|
| `p-0` | `0` | 0px |
| `p-1` | `0.25rem` | 4px |
| `p-2` | `0.5rem` | 8px |
| `p-3` | `0.75rem` | 12px |
| `p-4` | `1rem` | 16px |
| `p-5` | `1.25rem` | 20px |
| `p-6` | `1.5rem` | 24px |
| `p-8` | `2rem` | 32px |
| `p-10` | `2.5rem` | 40px |
| `p-12` | `3rem` | 48px |

This scale applies to padding (`p-`), margin (`m-`), gap (`gap-`), width (`w-`), height (`h-`), and more. The same number always means the same size — `gap-4` and `p-4` are both `1rem`.

Notice the pattern: each step is `0.25rem`. So `p-4` = 4 × 0.25rem = 1rem. Once you internalize this, you can calculate any spacing value in your head.

## The Color System

Tailwind ships with a carefully crafted color palette. Each color has **shades from 50 to 950**, going from very light to very dark:

```
bg-blue-50   → very light blue (almost white)
bg-blue-100  → light blue
bg-blue-200  → ...
bg-blue-500  → medium blue (the "base" shade)
bg-blue-700  → dark blue
bg-blue-900  → very dark blue
bg-blue-950  → nearly black blue
```

The naming is consistent across all colors: `red-500`, `green-500`, `purple-500` are all the "base" shade of their respective colors. Lower numbers are lighter, higher numbers are darker.

Here's how you typically use the scale:

- **50–100**: Backgrounds and subtle fills (`bg-blue-50` for a light blue card background)
- **200–300**: Borders and dividers (`border-gray-200`)
- **400–500**: Icons and secondary text
- **500–700**: Primary buttons and interactive elements (`bg-blue-600`)
- **800–950**: Headings and body text (`text-gray-900`)

Tailwind also includes colors with semantic meaning that you'll recognize: `slate`, `gray`, `zinc`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, and `rose`.

## Common Utilities

```
text-center       → text-align: center
font-bold         → font-weight: 700
bg-blue-500       → background-color: #3b82f6
p-4               → padding: 1rem
mx-auto           → margin-left: auto; margin-right: auto
rounded-lg        → border-radius: 0.5rem
shadow-md         → box-shadow: medium
flex              → display: flex
gap-4             → gap: 1rem
```

## Responsive Design

Tailwind makes responsive design intuitive with **breakpoint prefixes**. Instead of writing media queries in a CSS file, you prefix utility classes with a screen size:

| Prefix | Min-width | Typical device |
|--------|-----------|----------------|
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

**Important**: Tailwind is **mobile-first**. Unprefixed classes apply to all screen sizes, and prefixed classes apply at that breakpoint *and above*.

Here's a concrete example — a product grid that adapts to screen size:

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Product 1</div>
  <div>Product 2</div>
  <div>Product 3</div>
  <div>Product 4</div>
  <div>Product 5</div>
  <div>Product 6</div>
</div>
```

This creates:
- **Mobile** (default): 1 column — products stack vertically
- **Small screens and up** (`sm:`): 2 columns — products form a 2-column grid
- **Large screens and up** (`lg:`): 3 columns — products spread into a 3-column grid

No media queries, no separate CSS files. The responsive behavior is right there in the markup where you can see it.

## How Purging Works

You might be wondering: "If Tailwind has thousands of utility classes, won't my CSS file be enormous?"

Great instinct — but no. Tailwind uses a process often called **purging** (or tree-shaking) to keep your production CSS tiny.

Here's how it works:

1. **During development**, Tailwind generates styles on-demand as you use classes, so the dev experience is fast and you have access to everything.
2. **At build time**, Tailwind scans all of your source files (HTML, JSX, TSX, etc.) to find every class name you've actually used.
3. It generates a production CSS file that contains **only the styles for classes that appear in your code**.
4. Everything else is discarded.

The result? A typical Tailwind production CSS file is **5–15 KB** gzipped, even for a large application. That's smaller than most traditional CSS files because you're not shipping unused styles.

This is why you should always write Tailwind classes as **complete, static strings**. Don't construct class names dynamically like `` `bg-${color}-500` `` — the purge tool can't detect dynamic strings. Instead, write the full class name: `bg-blue-500`.

## Your Task

Write a CSS class string (just the Tailwind classes) that would create a centered container with:
- Maximum width of `max-w-4xl`
- Horizontal auto margins (`mx-auto`)
- Padding of `p-6`
- A flex column layout (`flex flex-col`)
- A gap of `gap-4`
