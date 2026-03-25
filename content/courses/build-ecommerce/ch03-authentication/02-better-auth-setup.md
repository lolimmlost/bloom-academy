---
id: "02-better-auth-setup"
title: "Better Auth Setup"
type: "code"
xp: 25
difficulty: 3
order: 2
prerequisites: ["01-auth-concepts"]
hints:
  - "The betterAuth() function takes a configuration object with database and auth method settings."
  - "The drizzleAdapter needs three things: the db instance, the provider string, and the schema."
  - "Email/password auth is enabled by setting emailAndPassword.enabled to true."
---

# Setting Up Better Auth

Now that you understand the theory behind authentication, it's time to set up the real thing. We'll be using **Better Auth** — a modern, TypeScript-first authentication library that handles the hard parts while giving us full control over the experience.

## What is Better Auth?

Better Auth is an authentication library built specifically for the modern TypeScript ecosystem. Unlike heavier solutions like NextAuth (which is tightly coupled to Next.js) or Passport.js (which is showing its age), Better Auth is:

- **Framework-agnostic** — It works with TanStack Start, Next.js, Remix, Express, Hono, and more. Your auth logic isn't locked into one framework.
- **Database-backed** — Sessions are stored in your database (not in JWTs), giving you full control and the ability to revoke sessions instantly.
- **TypeScript-first** — Every API is fully typed. You get autocomplete for configuration options and type-safe access to user data throughout your app.
- **Lightweight** — It does authentication well without trying to be an entire identity platform. No vendor lock-in, no monthly fees.

Better Auth gives you the primitives — session management, password hashing, email verification, OAuth — and lets you compose them into whatever auth experience your app needs.

## Server-Side Setup

Authentication begins on the server. The server is the source of truth for who's logged in, and it's where we validate credentials and manage sessions.

The core of Better Auth's server setup is the `betterAuth()` function. This creates an auth instance that handles all the server-side logic:

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/database/db"
import * as schema from "@/database/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
})
```

Let's break down every part of this configuration.

### The `betterAuth()` Function

This is the entry point for configuring your auth system. It returns an `auth` object with methods for creating sessions, verifying credentials, handling OAuth flows, and more. Think of it as the central hub that everything else plugs into.

```typescript
export const auth = betterAuth({
  // All configuration goes here
})
```

The returned `auth` object has an `api` property with methods like:
- `auth.api.getSession()` — Get the current user's session
- `auth.api.signUpEmail()` — Register a new user
- `auth.api.signInEmail()` — Log in an existing user

### The Database Adapter

Better Auth needs a database to store users, sessions, and related data. Instead of implementing its own database layer, it uses **adapters** that connect to whatever database tool you're already using.

Since we set up Drizzle in the previous chapter, we'll use the Drizzle adapter:

```typescript
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/database/db"
import * as schema from "@/database/schema"

// Inside betterAuth():
database: drizzleAdapter(db, {
  provider: "pg",    // We're using PostgreSQL
  schema,            // Our Drizzle schema definitions
})
```

The `drizzleAdapter` takes two arguments:

1. **`db`** — Your Drizzle database instance (the one we created in the database chapter). This gives Better Auth a connection to your actual database.
2. **A configuration object** with:
   - **`provider`** — Which database engine you're using. `"pg"` for PostgreSQL, `"mysql"` for MySQL, or `"sqlite"` for SQLite.
   - **`schema`** — Your Drizzle schema definitions. Better Auth uses these to know the shape of your tables.

When you run Better Auth's CLI to generate migrations, it will create tables like `user`, `session`, `account`, and `verification` in your database. These tables store everything Better Auth needs to manage authentication.

### Enabling Email and Password Auth

Better Auth supports multiple authentication methods (email/password, OAuth, magic links, etc.), but none are enabled by default. You explicitly opt into the methods you want:

```typescript
emailAndPassword: {
  enabled: true,
}
```

This tells Better Auth to:
- Allow users to register with an email and password
- Hash passwords automatically using bcrypt (by default)
- Provide `signUpEmail` and `signInEmail` API methods
- Validate password strength

You can also configure additional options:

```typescript
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,        // Minimum password length (default: 8)
  maxPasswordLength: 128,       // Maximum password length (default: 128)
}
```

## The BETTER_AUTH_SECRET Environment Variable

Better Auth requires a secret key to sign session tokens and other security-sensitive data. This secret must be:

- **Long and random** — At least 32 characters of cryptographically random data
- **Kept secret** — Never committed to version control
- **Unique per environment** — Different secrets for development, staging, and production

You set this in your `.env` file:

```bash
BETTER_AUTH_SECRET=your-very-long-random-secret-key-here-at-least-32-chars
```

To generate a good secret, you can run:

```bash
openssl rand -base64 32
```

This produces 32 bytes of random data, base64-encoded into a string. Better Auth reads this automatically from the `BETTER_AUTH_SECRET` environment variable.

Why is this secret so important? It's used to sign cookies and tokens. If an attacker learned your secret, they could forge session cookies and impersonate any user. Treat it like a database password — never share it, never commit it, and rotate it if it's ever exposed.

## Client-Side Setup

The server handles the heavy lifting, but we also need a client-side auth library to make API calls from the browser. Better Auth provides `createAuthClient()` for this:

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
})
```

The `createAuthClient` function creates an object with methods for:

- **`authClient.signIn.email()`** — Log in with email and password
- **`authClient.signUp.email()`** — Register a new account
- **`authClient.signOut()`** — Log out
- **`authClient.useSession()`** — A React hook that returns the current session

The `baseURL` tells the client where your server is running. In development, that's usually `http://localhost:3000`. In production, it would be your actual domain.

Notice we import from `"better-auth/react"` — this gives us React-specific features like the `useSession()` hook. If you were using a different framework, you'd import from the appropriate subpath.

### Connecting Server and Client

Here's how the pieces fit together:

```
Browser (React)                    Server (TanStack Start)
┌─────────────────┐               ┌──────────────────────┐
│                  │               │                      │
│  authClient      │── HTTP ──────→│  auth (betterAuth)   │
│  .signIn.email() │               │  .api.signInEmail()  │
│                  │               │                      │
│  authClient      │← Cookie ─────│  Creates session      │
│  .useSession()   │               │  Sets secure cookie   │
│                  │               │                      │
└─────────────────┘               └──────────────────────┘
                                         │
                                         ▼
                                  ┌──────────────────────┐
                                  │  PostgreSQL Database   │
                                  │  ┌─────┐ ┌─────────┐ │
                                  │  │users│ │sessions │ │
                                  │  └─────┘ └─────────┘ │
                                  └──────────────────────┘
```

The client makes requests, the server validates them and manages sessions, and the database stores everything persistently. The cookie is the glue that ties browser requests to server-side sessions.

## Auth API Route Handler

Better Auth needs an API route to handle auth requests. In TanStack Start, you'll create an API route that delegates to Better Auth:

```typescript
// src/routes/api/auth/[...all].ts
import { auth } from "@/lib/auth"

export const APIRoute = auth.handler
```

The `[...all]` is a catch-all route — it matches any path under `/api/auth/`, like `/api/auth/sign-in/email` or `/api/auth/sign-up/email`. Better Auth's handler knows how to route each sub-path to the correct logic.

## Your Task

Write the server-side Better Auth configuration. You need to:

1. Import `betterAuth` from `"better-auth"`
2. Import `drizzleAdapter` from `"better-auth/adapters/drizzle"`
3. Import the database instance and schema
4. Create and export an `auth` instance using `betterAuth()`
5. Configure the Drizzle adapter with the PostgreSQL provider
6. Enable email and password authentication
