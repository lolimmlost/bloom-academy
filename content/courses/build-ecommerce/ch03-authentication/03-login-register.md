---
id: "03-login-register"
title: "Login & Registration"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-better-auth-setup"]
hints:
  - "The authClient object has signIn and signUp methods for email-based auth."
  - "signIn.email() takes an object with email and password properties."
  - "The response contains data and error — destructure both."
  - "Check the error property to handle failed login attempts."
---

# Login & Registration

With Better Auth configured on the server, it's time to build the user-facing forms that let people create accounts and log in. This is where authentication becomes tangible — real users interacting with real UI.

## The Registration Flow

When a new customer wants to buy flowers from Indigo Sun Florals, they need an account. The registration flow looks like this:

1. User fills out a form with their email, name, and password.
2. Client-side validation checks the inputs immediately (is the email valid? is the password long enough?).
3. The form submits the data to the server via `authClient.signUp.email()`.
4. The server validates the data again (never trust the client).
5. If the email isn't already taken, the server hashes the password and creates a new user record.
6. The server creates a session and sets a session cookie.
7. The user is now logged in and redirected to the app.

### Why Validate on Both Client AND Server?

You might wonder: if we validate on the server, why bother with client-side validation?

**Client-side validation** gives instant feedback. When a user types an invalid email, they see the error immediately without waiting for a network round-trip. This makes the form feel responsive and polished.

**Server-side validation** is the real security boundary. Client-side code can be bypassed entirely — anyone can open their browser's dev tools and send whatever data they want to your API. A malicious user could skip your JavaScript validation completely and send a POST request directly. The server must validate everything because it's the only piece you truly control.

Think of it this way: client-side validation is for **user experience**, server-side validation is for **security**. You need both.

## Building the Registration Form

Here's what a registration form looks like with Better Auth:

```tsx
import { authClient } from "@/lib/auth-client"
import { useState } from "react"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const { data, error } = await authClient.signUp.email({
      email,
      name,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    // Success! User is now logged in.
    // Redirect to the home page or dashboard.
    window.location.href = "/"
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        minLength={8}
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Create Account</button>
    </form>
  )
}
```

### The `signUp.email()` Method

The `signUp.email()` method is your primary tool for creating new accounts. It takes an object with the user's details:

```typescript
const { data, error } = await authClient.signUp.email({
  email: "alice@example.com",
  name: "Alice Johnson",
  password: "secure-password-123",
})
```

Behind the scenes, this method:
1. Sends a POST request to `/api/auth/sign-up/email` on your server
2. The server validates the email format and password strength
3. Checks if the email is already registered
4. Hashes the password using bcrypt
5. Creates a `user` record and an `account` record in the database
6. Creates a new session
7. Sets the session cookie in the response
8. Returns the session data (or an error)

The return value is always an object with `data` and `error`. Exactly one of these will be populated — if the signup succeeds, `data` contains the session; if it fails, `error` contains the details.

## Building the Login Form

The login form is similar but simpler — we only need email and password:

```tsx
import { authClient } from "@/lib/auth-client"
import { useState } from "react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    window.location.href = "/"
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  )
}
```

### The `signIn.email()` Method

This method authenticates an existing user:

```typescript
const { data, error } = await authClient.signIn.email({
  email: "alice@example.com",
  password: "secure-password-123",
})
```

The server-side flow:
1. Looks up the user by email in the database
2. Retrieves the stored password hash
3. Hashes the submitted password and compares it to the stored hash
4. If they match, creates a new session and sets the cookie
5. If they don't match, returns an error

Note that the error message for a failed login should be vague on purpose — something like "Invalid email or password" rather than "No user found with that email" or "Incorrect password." Why? Because specific error messages let attackers enumerate which emails are registered on your site. A vague message gives nothing away.

## Error Handling

Robust error handling is what separates a prototype from a production app. Here are the common errors you should handle:

### Registration Errors

```typescript
const { data, error } = await authClient.signUp.email({
  email,
  name,
  password,
})

if (error) {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
      setError("An account with this email already exists. Try signing in instead.")
      break
    case "INVALID_EMAIL":
      setError("Please enter a valid email address.")
      break
    case "PASSWORD_TOO_SHORT":
      setError("Password must be at least 8 characters.")
      break
    default:
      setError("Something went wrong. Please try again.")
  }
  return
}
```

### Login Errors

```typescript
const { data, error } = await authClient.signIn.email({
  email,
  password,
})

if (error) {
  // Don't reveal whether the email exists
  setError("Invalid email or password.")
  return
}
```

### Network Errors

Sometimes the request itself fails — the server is down, the user lost internet, or there's a timeout. You should wrap your auth calls in a try/catch:

```typescript
try {
  const { data, error } = await authClient.signIn.email({ email, password })

  if (error) {
    setError(error.message)
    return
  }

  window.location.href = "/"
} catch (e) {
  setError("Unable to connect. Please check your internet and try again.")
}
```

## Combining Login and Registration

In practice, many apps combine login and registration on a single page with a tab switcher. This is a good user experience because people don't always remember whether they've created an account:

```tsx
import { useState } from "react"

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("login")}
          className={mode === "login" ? "font-bold" : "text-gray-500"}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode("register")}
          className={mode === "register" ? "font-bold" : "text-gray-500"}
        >
          Create Account
        </button>
      </div>

      {mode === "login" ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}
```

## Form Validation Best Practices

Here are some practical tips for building auth forms:

1. **Use `type="email"` on email inputs** — This triggers the email keyboard on mobile and enables built-in browser validation.
2. **Use `type="password"` on password inputs** — This masks the input and triggers password manager autofill.
3. **Add `required` to required fields** — The browser will prevent form submission if these are empty.
4. **Use `minLength` for passwords** — Provides client-side length validation.
5. **Disable the submit button while loading** — Prevents double submissions.
6. **Show loading state** — Let users know their request is being processed.

```tsx
const [isLoading, setIsLoading] = useState(false)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setIsLoading(true)
  try {
    // ... auth logic
  } finally {
    setIsLoading(false)
  }
}

<button type="submit" disabled={isLoading}>
  {isLoading ? "Signing in..." : "Sign In"}
</button>
```

## Your Task

Write a login handler function using the auth client. The function should:

1. Import the `authClient`
2. Accept email and password parameters
3. Call `authClient.signIn.email()` with the credentials
4. Handle the error case by throwing an error
5. Return the data on success
