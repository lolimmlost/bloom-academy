---
id: "04-sessions"
title: "Sessions & User State"
type: "code"
xp: 25
difficulty: 2
order: 4
prerequisites: ["03-login-register"]
hints:
  - "The useSession() hook from authClient returns an object with a data property containing the session."
  - "Check session?.user to determine if someone is logged in."
  - "Use authClient.signOut() to log the user out."
---

# Sessions & User State

Your users can now register and log in. But how does your app *know* they're logged in as they navigate from page to page? How do you show their name in the header, or hide the "Sign In" button once they've authenticated? The answer is **sessions**.

## What is a Session?

A session is a server-side record that links a browser to a logged-in user. When someone logs in, Better Auth creates a session in the database and sends a cookie to the browser. From that point on, every request from that browser includes the cookie, and the server can look up the session to identify the user.

Think of it like a wristband at a concert. When you enter (log in), you get a wristband (session cookie). As you move between stages (pages), security can glance at your wristband and know you're authorized to be there. When you leave (log out), the wristband is removed.

Here's what the session looks like in the database:

```sql
SELECT * FROM session WHERE user_id = 42;
```

```
┌────────────────────────────────────────┬─────────┬─────────────────────┬──────────────────┐
│ id                                     │ user_id │ expires_at          │ ip_address       │
├────────────────────────────────────────┼─────────┼─────────────────────┼──────────────────┤
│ abc123def456...                        │ 42      │ 2026-04-07 10:00:00 │ 192.168.1.100    │
└────────────────────────────────────────┴─────────┴─────────────────────┴──────────────────┘
```

Better Auth tracks additional metadata like the IP address and user agent, which can be useful for security features like "sign out of all other devices."

## How Better Auth Manages Sessions

Better Auth's session management is database-backed, which gives us several advantages:

1. **Sessions can be revoked instantly** — Delete the row from the database and the user is logged out. No waiting for a token to expire.
2. **Multiple sessions per user** — A user can be logged in on their phone and laptop simultaneously. Each device gets its own session.
3. **Session metadata** — You can track when and where sessions were created, useful for security auditing.
4. **Automatic expiration** — Sessions have an `expires_at` timestamp. Better Auth automatically cleans up expired sessions.

### Session Lifecycle

```
User logs in
    │
    ▼
Server creates session record in DB
    │
    ▼
Server sets session cookie in response
    │
    ▼
Browser stores cookie automatically
    │
    ▼
Every subsequent request includes the cookie
    │
    ▼
Server reads cookie → looks up session → identifies user
    │
    ▼
User logs out (or session expires)
    │
    ▼
Server deletes session record from DB
    │
    ▼
Cookie is cleared
```

## Getting the Current Session: `useSession()`

On the client side, Better Auth provides a React hook called `useSession()` that gives you access to the current user's session data. This is the primary way you'll check if someone is logged in and access their information.

```typescript
import { authClient } from "@/lib/auth-client"

function MyComponent() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div>Loading...</div>
  }

  if (!session?.user) {
    return <div>Not logged in</div>
  }

  return <div>Hello, {session.user.name}!</div>
}
```

Let's break down the return value:

- **`data`** (aliased to `session` via destructuring) — The session object, containing `user` and `session` properties. This is `null` if the user isn't logged in.
- **`isPending`** — A boolean that's `true` while the initial session check is in progress. This prevents a flash of "Not logged in" before the session loads.

### The Session Object Shape

When a user is logged in, the session object looks like this:

```typescript
{
  user: {
    id: "user_abc123",
    email: "alice@example.com",
    name: "Alice Johnson",
    image: null,
    emailVerified: true,
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
  },
  session: {
    id: "session_xyz789",
    userId: "user_abc123",
    expiresAt: "2026-04-07T10:00:00.000Z",
    token: "...",
  }
}
```

You'll most commonly access `session.user.email`, `session.user.name`, and `session.user.id`.

## Displaying User Information

A common pattern is showing the user's email or name in the site header, along with a way to sign out. Here's a practical example:

```tsx
import { authClient } from "@/lib/auth-client"

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!session?.user) {
    return (
      <a href="/auth" className="text-sm font-medium">
        Sign In
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{session.user.email}</span>
      <button
        onClick={() => authClient.signOut()}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign Out
      </button>
    </div>
  )
}
```

This component handles three states:

1. **Loading** — Shows a skeleton placeholder while the session is being fetched. This avoids a jarring flash between states.
2. **Not logged in** — Shows a "Sign In" link that takes the user to the auth page.
3. **Logged in** — Shows the user's email and a "Sign Out" button.

## Logging Out: `signOut()`

The `signOut()` method tells the server to destroy the session:

```typescript
await authClient.signOut()
```

When this runs:
1. The client sends a request to the server's sign-out endpoint.
2. The server deletes the session record from the database.
3. The server clears the session cookie in the response.
4. The client's `useSession()` hook updates to reflect the logged-out state.

You can also redirect the user after signing out:

```typescript
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      window.location.href = "/"
    },
  },
})
```

### Signing Out of All Devices

Since sessions are stored in the database, you can easily revoke all of a user's sessions. This is useful as a security feature — "Sign out everywhere":

```typescript
// On the server side
await auth.api.revokeSessions({
  headers: request.headers,
})
```

This deletes every session for the authenticated user, logging them out of every device and browser simultaneously.

## Handling the Loading State

One subtle but important detail is handling the loading state properly. When your React app first loads, it doesn't immediately know if the user is logged in. The `useSession()` hook needs to make a request to the server to check.

If you don't handle this, you'll see a flash of the "logged out" state before the session loads. This is called a **flash of unauthenticated content (FOUC)**, and it looks unprofessional.

There are several strategies:

### 1. Show a Loading Skeleton

```tsx
if (isPending) {
  return <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
}
```

### 2. Delay Rendering Until Session is Loaded

```tsx
if (isPending) return null // Render nothing until we know
```

### 3. Use Server-Side Rendering

The best approach is to fetch the session on the server during rendering, so the initial HTML already includes the correct state. We'll explore this pattern in the next lesson on protected routes, where `beforeLoad` lets us check auth before the page renders.

## Session Persistence Across Page Refreshes

One question you might have: does the session survive a page refresh or closing the browser?

**Yes.** The session cookie is stored by the browser and persists based on the `Max-Age` or `Expires` attribute set by the server. By default, Better Auth creates sessions that last for 7 days. This means:

- Refreshing the page: still logged in
- Closing and reopening the browser: still logged in
- Coming back 3 days later: still logged in
- Coming back 8 days later: session expired, need to log in again

The session duration is configurable:

```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    updateAge: 60 * 60 * 24,       // Refresh session every 24 hours
  },
  // ... rest of config
})
```

The `updateAge` setting is a nice optimization — it automatically extends the session expiration each time the user is active, so frequently-active users never get logged out unexpectedly.

## Your Task

Create a `UserStatus` component that:

1. Uses the `useSession()` hook from `authClient` to get the current session
2. If the user is NOT logged in (`!session?.user`), renders a "Sign In" link pointing to `/auth`
3. If the user IS logged in, renders their email and a "Sign Out" button
4. The "Sign Out" button should call `authClient.signOut()` when clicked
