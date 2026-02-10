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

## Why Tailwind?

- **No naming** — no need to invent class names like `.hero-section-title`
- **Consistency** — uses a design system (spacing scale, color palette)
- **Responsive** — prefix classes with `sm:`, `md:`, `lg:` for breakpoints
- **Dark mode** — prefix with `dark:` for dark theme styles
- **Tiny bundles** — unused styles are purged at build time

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

## Your Task

Write a CSS class string (just the Tailwind classes) that would create a centered container with:
- Maximum width of `max-w-4xl`
- Horizontal auto margins (`mx-auto`)
- Padding of `p-6`
- A flex column layout (`flex flex-col`)
- A gap of `gap-4`
