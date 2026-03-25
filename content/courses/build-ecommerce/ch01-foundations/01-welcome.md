---
id: "01-welcome"
title: "Welcome to Bloom Academy"
type: "info"
xp: 15
difficulty: 1
order: 1
prerequisites: []
hints: []
---

# Welcome to Bloom Academy!

In this course, you'll build a **complete e-commerce platform** from scratch — a flower shop called **Indigo Sun Florals**.

## What You'll Build

By the end of this course, you'll have created:

- A **product catalog** with search and filtering
- **User authentication** with email/password and social login
- A **shopping cart** with optimistic updates
- **Stripe checkout** with webhook handling
- **Customer and admin dashboards**
- **Subscription management** for recurring flower deliveries
- A full **testing suite** with Vitest and Testing Library

## Why Full-Stack?

You might have heard the term "full-stack" thrown around a lot. But what does it actually mean?

A **full-stack developer** works across the entire application — from what users see and interact with in the browser (the **frontend**) to the servers, databases, and APIs that power everything behind the scenes (the **backend**).

Why does this matter? Because understanding the full picture makes you a dramatically more effective developer. When you know how the database is structured, you write better frontend code. When you understand how the UI consumes data, you design better APIs. Full-stack knowledge gives you **context** — and context is what separates someone who can hack together a feature from someone who can architect a product.

Building a real e-commerce app is the perfect full-stack project because it touches *everything*: rendering pages, handling user input, managing state, authenticating users, talking to databases, processing payments, and deploying to production. By the end of this course, you won't just know how each piece works in isolation — you'll understand how they all fit together.

## The Tech Stack

We'll be using modern, production-ready tools:

| Technology | Purpose |
|---|---|
| **TanStack Start** | Full-stack React framework |
| **React 19** | UI library |
| **Drizzle ORM** | Type-safe database queries |
| **PostgreSQL** | Relational database |
| **Better Auth** | Authentication |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Component library |
| **Stripe** | Payments |

### Why These Technologies?

Every tool in our stack was chosen for a reason. Let's break down the thinking:

**TanStack Start** is a newer full-stack React framework that gives us file-based routing, server-side rendering, and server functions — all with best-in-class TypeScript support. It's built on top of TanStack Router, which is arguably the most type-safe routing solution in the React ecosystem. We chose it over Next.js or Remix because of its outstanding developer experience and its tight integration with other TanStack libraries like TanStack Query.

**React 19** is the latest version of the most widely-used UI library in the world. It introduces powerful features like Server Components and improved Suspense handling. Learning React means learning a skill that's in demand across tens of thousands of companies.

**Drizzle ORM** lets us write database queries in TypeScript that are fully type-safe. If you change a column in your database schema, Drizzle will give you a compile-time error anywhere your code references the old shape. This catches bugs before they ever reach production.

**PostgreSQL** is the industry-standard relational database. It's open-source, battle-tested, and used by companies from startups to Fortune 500s. Learning PostgreSQL gives you skills that transfer to virtually any backend role.

**Better Auth** is a modern authentication library that handles the notoriously tricky parts of auth — session management, password hashing, OAuth flows, and email verification — so we can focus on building features rather than reinventing security.

**Tailwind CSS** takes a utility-first approach to styling that dramatically speeds up development. Instead of writing separate CSS files and coming up with class names, you apply small utility classes directly in your markup. It sounds weird until you try it — then you never want to go back.

**shadcn/ui** gives us beautiful, accessible UI components that we *own*. Unlike traditional component libraries where you install a package and hope the styling fits, shadcn/ui copies the actual source code into your project. Full control, no version lock-in.

**Stripe** is the gold standard for payment processing. Its developer experience is unmatched — clear documentation, excellent APIs, and robust webhook support. Learning Stripe is a highly marketable skill.

## What You'll Learn Along the Way

Beyond building a working e-commerce store, this course teaches you **transferable skills** that apply to any project:

- **TypeScript** — Writing type-safe code that catches errors at compile time instead of in production
- **REST APIs & Server Functions** — How clients and servers communicate, and modern approaches that simplify the process
- **Database Design** — Structuring relational data, writing migrations, and thinking about data integrity
- **Authentication Patterns** — Sessions, tokens, OAuth, and the security considerations that come with each
- **Payment Integration** — Handling real money safely with webhooks, idempotency, and error recovery
- **UI/UX Fundamentals** — Building interfaces that are responsive, accessible, and genuinely pleasant to use
- **Testing** — Writing tests that give you confidence to ship changes without breaking things
- **Deployment** — Getting your app from your laptop to the internet, with proper environment configuration

These aren't just "nice to know" topics — they're the bread and butter of professional web development.

## Prerequisites

To get the most out of this course, you should have:

- **Basic HTML & CSS** — You know what a `<div>` is, how to write a CSS selector, and roughly how the box model works. You don't need to be an expert.
- **JavaScript fundamentals** — Variables, functions, arrays, objects, loops, and basic DOM manipulation. If you've built a small project (a to-do app, a calculator, a simple game), you're in good shape.
- **Comfort with a terminal** — You can open a terminal, navigate directories with `cd`, and run commands. We'll explain everything we run, but you shouldn't be scared of a command line.
- **A code editor** — We recommend [VS Code](https://code.visualstudio.com/) with the Tailwind CSS IntelliSense and ESLint extensions, but any modern editor works.

No prior experience with React, TypeScript, databases, or any of the other tools in our stack is required. We'll teach you everything from the ground up.

## How Lessons Work

Each lesson has:

1. **Reading content** (like this!) explaining concepts
2. **Code challenges** where you write real code
3. **Automated tests** that verify your solution
4. **Hints** if you get stuck (but they cost XP!)

Ready to start building? Let's go!
