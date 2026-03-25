---
id: "01-auth-concepts"
title: "Authentication Concepts"
type: "info"
xp: 15
difficulty: 2
order: 1
prerequisites: []
hints: []
---

# Authentication Concepts

Before we write a single line of auth code, let's build a solid mental model of what authentication actually is, why it's hard, and what the security landscape looks like. Understanding these concepts will make every implementation decision in the upcoming lessons feel intuitive rather than arbitrary.

## Authentication vs Authorization

These two terms get mixed up constantly, even by experienced developers. They sound similar, but they solve fundamentally different problems.

**Authentication** answers the question: *"Who are you?"*

When you log into a website with your email and password, you're authenticating. You're proving your identity. The server checks your credentials and says, "Okay, I believe you are Alice."

**Authorization** answers the question: *"What are you allowed to do?"*

Once the server knows you're Alice, it needs to decide what Alice can access. Can Alice view the admin dashboard? Can she delete other users' orders? Can she issue refunds? That's authorization.

Here's a real-world analogy: think of a hotel. When you check in at the front desk and show your ID, that's **authentication** — the hotel verifies who you are. The key card they give you is your **authorization** — it determines which rooms you can enter. Your key opens your room on the 5th floor, but it won't open the penthouse suite or the staff-only areas.

In our e-commerce app, authentication will let customers log in. Authorization will ensure that a regular customer can't access the admin dashboard or modify another customer's orders.

```
Authentication: "I am alice@example.com" → Prove it → Here's my password → OK, verified
Authorization:  Alice wants to access /admin → Is Alice an admin? → No → Access denied
```

We'll implement authentication in this chapter and touch on authorization concepts toward the end.

## How Web Authentication Works

The web is built on HTTP, and HTTP is **stateless**. Every request your browser sends to a server is independent — the server has no built-in memory of previous requests. This creates a fundamental challenge: if the server can't remember anything, how does it know you're logged in on the second page you visit?

The answer involves a few key mechanisms working together.

### The Login Flow

Here's what happens when you log in to a typical website:

1. You submit your email and password via a form.
2. The server receives the request, looks up the email in the database, and checks if the password matches (more on this later).
3. If the credentials are valid, the server creates a **session** — a record that says "this user is logged in."
4. The server sends back a **cookie** containing a session identifier.
5. Your browser automatically attaches that cookie to every subsequent request to the same domain.
6. On each request, the server reads the cookie, looks up the session, and knows who you are.

This is the fundamental pattern that makes "staying logged in" work despite HTTP being stateless. The cookie acts as a persistent identifier that bridges the gap between disconnected requests.

### Cookies — The Browser's Memory

A **cookie** is a small piece of data that a server asks your browser to store. Once set, the browser automatically includes it in every request to that server's domain. You don't have to do anything — it just happens.

Cookies have several important attributes:

```
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

Let's break each one down:

- **HttpOnly** — The cookie is invisible to JavaScript. Code running in the browser (`document.cookie`) cannot read it. This is critical for security because if an attacker manages to inject malicious JavaScript into your page (an XSS attack), they still can't steal the session cookie.
- **Secure** — The cookie is only sent over HTTPS connections, never plain HTTP. This prevents someone snooping on a coffee shop's WiFi from intercepting your session.
- **SameSite** — Controls whether the cookie is sent with cross-site requests. `Strict` means the cookie is only sent when the request originates from your own site. This is a defense against CSRF attacks (more on that shortly).
- **Path** — Which URL paths the cookie applies to. `/` means the entire site.
- **Max-Age** — How long the cookie lasts, in seconds. 604800 seconds is 7 days.

### Sessions — Server-Side State

A **session** is the server's record of a logged-in user. When the server creates a session, it generates a random, unpredictable **session ID** (like `a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5`) and stores it alongside user information:

```
Session Store (Database):
┌──────────────────────┬──────────┬─────────────────────┐
│ session_id           │ user_id  │ expires_at          │
├──────────────────────┼──────────┼─────────────────────┤
│ a3f8b2c1d4e5...      │ 42       │ 2026-03-31 10:00:00 │
│ x7y8z9w0v1u2...      │ 15       │ 2026-04-01 14:30:00 │
└──────────────────────┴──────────┴─────────────────────┘
```

The session ID in the cookie is just a pointer — a reference to the real data stored on the server. This means even if someone could read the cookie, all they'd see is a meaningless random string. The actual user data never leaves the server.

## Session-Based Auth vs JWT

You'll encounter two main approaches to web authentication: **session-based auth** and **JSON Web Tokens (JWTs)**. Both are valid, but they have important tradeoffs.

### Session-Based Authentication

This is the approach we just described. The server stores session data in a database, and the client holds a cookie with the session ID.

**How it works:**
```
Browser                          Server
   │                                │
   │──── Request + session cookie ──→│
   │                                │── Look up session in DB
   │                                │── Find user_id = 42
   │←── Response (user data) ───────│
```

**Advantages:**
- **Revocable** — You can invalidate a session instantly by deleting it from the database. If a user reports their account as compromised, you delete their sessions and they're immediately logged out everywhere.
- **Small cookie size** — The cookie only contains a session ID (a short string), not the actual user data.
- **Server-controlled** — All session data lives on the server, so you have complete control over it.

**Disadvantages:**
- **Database lookup on every request** — The server must query the session store for each authenticated request. For most applications, this is negligible. For applications handling millions of requests per second, it can matter.
- **Server state** — The server must maintain state, which adds a small amount of complexity to scaling across multiple servers (though this is easily solved with a shared database or Redis).

### JWT (JSON Web Tokens)

A JWT is a **self-contained token** that encodes user information directly into the token itself. The token is cryptographically signed so the server can verify it hasn't been tampered with.

**How it works:**
```
Browser                          Server
   │                                │
   │──── Request + JWT ─────────────→│
   │                                │── Verify JWT signature
   │                                │── Decode user data from token
   │←── Response (user data) ───────│
```

A JWT looks like this (three base64-encoded parts separated by dots):
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0Mn0.signature_here
```

The middle part decodes to something like `{"user_id": 42, "email": "alice@example.com", "exp": 1711900800}`.

**Advantages:**
- **No database lookup** — The server can verify the token using only the secret key, without touching the database. This can be faster at massive scale.
- **Stateless** — The server doesn't need to store anything. This makes horizontal scaling simpler in theory.

**Disadvantages:**
- **Cannot be revoked** — Once issued, a JWT is valid until it expires. If a user's account is compromised, you can't invalidate their existing token. You'd have to implement a blocklist, which... brings back server state, defeating the purpose.
- **Larger payload** — The token contains all the user data, making every request slightly larger.
- **Complexity** — Properly implementing JWT refresh flows, token rotation, and storage is surprisingly tricky. Many tutorials get it wrong.

### Which One Should You Use?

For the vast majority of web applications — including ours — **session-based auth is the better choice**. It's simpler, more secure by default, and the "database lookup on every request" cost is negligible for any app that isn't operating at the scale of Twitter or Netflix.

JWTs have a legitimate use case in distributed systems where multiple services need to verify identity without talking to a central auth server. But for a typical web app with one backend? Sessions win on simplicity and security.

This is the approach Better Auth uses, and it's the approach we'll use in our project.

## Password Hashing — Never Store Plain Passwords

This is one of the most important security principles you'll ever learn: **never, ever store passwords in plain text**.

If you store passwords as-is and your database is breached (and breaches happen to even large companies), every user's password is immediately exposed. Since many people reuse passwords across sites, a breach of your flower shop could compromise their bank account.

Instead, we store a **hash** of the password. A hash is the output of a one-way mathematical function that converts input into a fixed-length string:

```
Password: "sunflower123"
Hash:     "$2b$12$LJ3m4ys3Lg6YW1rWG5x8XeZBgN7L6k0dE2v..."
```

Key properties of a good password hash:

- **One-way** — You cannot reverse the hash to get the original password. There's no "decrypt" operation.
- **Deterministic** — The same password always produces the same hash (with the same salt), so you can verify a login attempt.
- **Unique per user** — A random **salt** (extra random data) is mixed in before hashing, so even if two users have the same password, their hashes will be different.
- **Intentionally slow** — Password hashing algorithms like bcrypt and argon2 are designed to be computationally expensive. This means an attacker who gets your database can't just try billions of passwords per second.

### bcrypt vs Argon2

**bcrypt** has been the industry standard for password hashing since 1999. It's well-tested, widely supported, and still considered secure. It has a configurable "work factor" that lets you increase the computational cost as hardware gets faster.

**Argon2** won the Password Hashing Competition in 2015 and is considered the current state of the art. It's resistant to GPU-based attacks (which bcrypt is somewhat vulnerable to) and lets you configure memory usage in addition to computation time, making it harder to crack with specialized hardware.

Both are excellent choices. Better Auth supports both, and you don't need to implement the hashing yourself — the library handles it automatically.

### How Login Verification Works

When a user logs in:

1. They submit their password (e.g., "sunflower123").
2. The server retrieves the stored hash for that user from the database.
3. The server hashes the submitted password with the same algorithm and salt.
4. It compares the resulting hash with the stored hash.
5. If they match, the password is correct. If not, login fails.

At no point does the server need to know or store the original password. This is the beauty of one-way hashing.

## CSRF Protection

**CSRF (Cross-Site Request Forgery)** is an attack where a malicious website tricks your browser into making a request to a different site where you're logged in.

Here's the scenario: you're logged into your bank at `bank.com`. You then visit a malicious site that contains a hidden form:

```html
<!-- On evil-site.com -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="amount" value="10000" />
  <input type="hidden" name="to" value="attacker-account" />
</form>
<script>document.forms[0].submit()</script>
```

Because your browser automatically attaches your `bank.com` cookies to any request to `bank.com`, this request looks legitimate to the bank's server. Without CSRF protection, the transfer would go through.

Modern defenses against CSRF include:

- **SameSite cookies** — Setting `SameSite=Strict` or `SameSite=Lax` prevents the browser from sending cookies with cross-site requests. This is the most effective and simplest defense.
- **CSRF tokens** — The server generates a random token and embeds it in the form. On submission, the server verifies the token matches. An attacker's site can't know the token.
- **Checking the Origin header** — The server verifies that the request's `Origin` or `Referer` header matches the expected domain.

Better Auth implements these protections automatically. You'll get secure defaults without having to configure them manually.

## Why Use a Library?

You might be wondering: if we understand all these concepts, why not implement authentication ourselves? It would be a great learning exercise, right?

Here's the honest truth: **authentication is one of the easiest things to get almost right, and one of the hardest things to get completely right**. The gap between "almost right" and "completely right" is where security vulnerabilities live.

A hand-rolled auth system might work fine 99% of the time. But the 1% of edge cases — timing attacks on password comparison, session fixation, token entropy, race conditions in session creation, proper cookie attributes across different browsers — are where real-world attacks happen.

Libraries like Better Auth exist because security-focused developers have already found and fixed these edge cases. They've:

- Handled timing-safe password comparison to prevent timing attacks
- Implemented proper session rotation to prevent session fixation
- Used cryptographically secure random number generators for session IDs
- Set secure cookie defaults that work across browsers
- Handled edge cases in OAuth flows that would take months to discover on your own

Using a well-maintained auth library isn't laziness — it's good engineering judgment. You wouldn't write your own encryption algorithm either. Some problems are best solved by specialists, freeing you to focus on what makes your application unique.

In the next lesson, we'll set up Better Auth and connect it to our database.
