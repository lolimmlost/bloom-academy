---
id: "05-protected-routes"
title: "Protected Routes"
type: "code"
xp: 30
difficulty: 3
order: 5
prerequisites: ["04-sessions"]
hints:
  - "Use redirect() from @tanstack/react-router to send unauthenticated users away."
  - "auth.api.getSession() checks the session on the server — pass it the request headers."
  - "Throw the redirect (don't return it) to stop execution immediately."
  - "Return the user data so the route can access it."
---

# Protected Routes

So far, we have authentication working — users can register, log in, and we can display their info. But there's a critical piece missing: **preventing unauthenticated users from accessing pages they shouldn't see**.

Right now, if someone types `/account/orders` directly into their browser's address bar, they'd see the page even if they aren't logged in. Maybe the data wouldn't load (because the API would reject the request), but the page itself would render. This is a poor experience and a potential security issue.

## Why Route Protection Matters

Route protection isn't just about hiding UI — it's about **enforcing access control at the right level**.

Consider this scenario without route protection:

```
1. User visits /admin/dashboard (not logged in)
2. Page renders, shows empty dashboard layout
3. API calls fail with 401 errors
4. User sees a broken page with error messages
```

With route protection:

```
1. User visits /admin/dashboard (not logged in)
2. Server checks auth BEFORE rendering
3. User is instantly redirected to /auth
4. Clean, professional experience
```

There's also a deeper security consideration. Hiding a page on the client side (like checking `useSession()` and showing a "not authorized" message) is **not real security**. A determined user can:

- Disable JavaScript and see the raw HTML
- Use browser dev tools to modify the client-side auth check
- Directly call your API endpoints

True security means checking authentication on the **server** before any sensitive data or UI is sent to the client. Client-side checks are for user experience; server-side checks are for security.

## `beforeLoad` in TanStack Start

TanStack Start gives us a powerful tool for server-side route protection: the `beforeLoad` function. This function runs on the server **before** the route's component renders or any data is loaded.

Here's the basic concept:

```typescript
// In a route definition
export const Route = createFileRoute("/account")({
  beforeLoad: async ({ request }) => {
    // This runs on the server before the page renders
    // If the user isn't authenticated, redirect them
  },
  component: AccountPage,
})
```

`beforeLoad` is the perfect place for auth checks because:

1. **It runs before rendering** — The user never sees a flash of unauthorized content.
2. **It runs on the server** — It can't be bypassed by client-side manipulation.
3. **It can redirect** — Using TanStack Router's `redirect()` function, you can send users elsewhere.
4. **It can pass data** — Whatever you return from `beforeLoad` is available to the route's component and data loaders.

### How `redirect()` Works

TanStack Router's `redirect()` function creates a special redirect object. When you **throw** it (not return it), it interrupts the current flow and sends the user to a different URL:

```typescript
import { redirect } from "@tanstack/react-router"

// This stops execution and sends the user to /auth
throw redirect({ to: "/auth" })
```

Why throw instead of return? Because throwing immediately stops all code execution in the current function. If you returned, subsequent code might still run, potentially leaking data or causing errors.

## The Auth Guard Pattern

Rather than writing the auth check in every protected route, it's common to create a reusable **auth guard** function:

```typescript
import { redirect } from "@tanstack/react-router"
import { auth } from "@/lib/auth"

export async function authGuard({ request }: { request: Request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    throw redirect({ to: "/auth" })
  }

  return { user: session.user }
}
```

Let's trace through what this function does step by step:

### Step 1: Get the Session

```typescript
const session = await auth.api.getSession({
  headers: request.headers,
})
```

`auth.api.getSession()` is the server-side method for checking if the current request is authenticated. It:

1. Reads the session cookie from the request headers
2. Looks up the session ID in the database
3. Checks if the session is still valid (not expired)
4. Returns the session object (with user data) if valid, or `null` if not

We pass `request.headers` because the session cookie lives in the request headers. The `request` object is provided by TanStack Start in the `beforeLoad` context.

### Step 2: Check and Redirect

```typescript
if (!session) {
  throw redirect({ to: "/auth" })
}
```

If `session` is `null`, the user isn't logged in. We throw a redirect to send them to the auth page where they can sign in. The page they were trying to access never renders.

### Step 3: Return User Data

```typescript
return { user: session.user }
```

If the session is valid, we return the user data. This becomes available in the route's component and loaders, so you don't need to fetch the user again:

```typescript
export const Route = createFileRoute("/account")({
  beforeLoad: authGuard,
  component: AccountPage,
})

function AccountPage() {
  const { user } = Route.useRouteContext()
  return <h1>Welcome, {user.name}!</h1>
}
```

## Using the Auth Guard

Once you have the `authGuard` function, applying it to routes is straightforward:

```typescript
// src/routes/account/index.tsx
import { createFileRoute } from "@tanstack/react-router"
import { authGuard } from "@/lib/auth-guard"

export const Route = createFileRoute("/account/")({
  beforeLoad: authGuard,
  component: AccountPage,
})

function AccountPage() {
  const { user } = Route.useRouteContext()

  return (
    <div>
      <h1>Your Account</h1>
      <p>Email: {user.email}</p>
      <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  )
}
```

### Protecting a Group of Routes

If you have a whole section that requires authentication (like everything under `/account`), you can apply the guard at the layout route level:

```typescript
// src/routes/account/route.tsx (layout route for /account/*)
import { createFileRoute } from "@tanstack/react-router"
import { authGuard } from "@/lib/auth-guard"

export const Route = createFileRoute("/account")({
  beforeLoad: authGuard,
})
```

Now every route under `/account` — `/account/orders`, `/account/settings`, `/account/addresses` — is automatically protected. If a user tries to access any of them without being logged in, they get redirected to `/auth`.

This is one of the powerful aspects of TanStack Router's nested routing. The `beforeLoad` guard on a parent route applies to all its children.

## Redirect Back After Login

A nice UX touch is redirecting users back to where they were trying to go after they log in. You can do this by including the original URL in the redirect:

```typescript
export async function authGuard({ request }: { request: Request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    const url = new URL(request.url)
    throw redirect({
      to: "/auth",
      search: { redirect: url.pathname },
    })
  }

  return { user: session.user }
}
```

Then in your login handler, after successful authentication:

```typescript
const searchParams = new URLSearchParams(window.location.search)
const redirectTo = searchParams.get("redirect") || "/"
window.location.href = redirectTo
```

This way, if someone tries to visit `/account/orders`, gets redirected to `/auth?redirect=/account/orders`, and then logs in, they'll land right back on the orders page.

## Role-Based Access Control

So far we've been checking "is the user logged in?" But sometimes you need more granular control: "is the user an **admin**?"

Role-based access control (RBAC) adds another layer. Users have roles (like `customer`, `admin`, `staff`), and different routes require different roles:

```typescript
export async function adminGuard({ request }: { request: Request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    throw redirect({ to: "/auth" })
  }

  if (session.user.role !== "admin") {
    throw redirect({ to: "/" })
  }

  return { user: session.user }
}
```

For our Indigo Sun Florals app, we'll have at least two roles:

- **customer** — Can browse products, manage their cart, place orders, and view their order history
- **admin** — Can do everything a customer can, plus manage products, view all orders, and access the admin dashboard

We'll implement full role-based access later in the dashboard chapter. For now, the important concept is that **authorization builds on authentication**. You must first know *who* someone is (authentication) before you can decide *what they're allowed to do* (authorization).

## Security Checklist

Before moving on, let's make sure we understand the full picture of route protection:

- **Always check auth on the server** — `beforeLoad` runs server-side, making it a secure check point
- **Never rely solely on client-side checks** — Hiding a component isn't security
- **Use `throw redirect()`** — Throwing ensures no code after the check runs
- **Return user data from the guard** — Avoids redundant database lookups in the route
- **Apply guards at the layout level** — Protects entire sections with a single guard
- **Handle the redirect URL** — Send users back where they were going after login

## Your Task

Write a `beforeLoad` auth guard function that:

1. Imports `redirect` from `@tanstack/react-router`
2. Imports the `auth` instance from your auth configuration
3. Uses `auth.api.getSession()` with the request headers to check for a valid session
4. Throws a redirect to `/auth` if there is no session
5. Returns `{ user: session.user }` if the session is valid
