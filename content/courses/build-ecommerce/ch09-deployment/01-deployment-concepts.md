---
id: "01-deployment-concepts"
title: "Deployment Concepts"
type: "info"
xp: 20
difficulty: 2
order: 1
prerequisites: []
hints: []
---

# Deployment Concepts

You have built a complete e-commerce application. It runs beautifully on your laptop. But your laptop is not a web server — customers cannot visit `localhost:3000` from their phones. To make your app available to the world, you need to **deploy** it.

Deployment is the process of taking your application from your local development environment and putting it on a server that is always running, always connected to the internet, and always ready to serve requests.

## The Journey from Local to Production

Your app will typically pass through several environments on its way to users:

### Local Development

This is where you are now. You run `pnpm dev`, the app starts on `localhost:3000`, and you can see it in your browser. The database is on your machine (or a local Docker container). Nothing is accessible from the outside world.

### Staging

A staging environment is a copy of production that only your team can access. It runs on a real server with a real database, but it is not exposed to customers. You deploy here first to catch issues that only show up in a production-like setting — things like missing environment variables, database connection limits, or API rate limits.

Not every project needs a staging environment, but for an e-commerce app that handles real money, it is strongly recommended.

### Production

This is the live environment that your customers use. It runs on reliable infrastructure, has a real domain name (`indigosunflorals.com`), uses HTTPS for security, and is monitored for uptime and errors. Downtime here costs money.

## Hosting Options

There are two broad categories of hosting, and understanding the trade-offs will help you make the right choice for your project.

### Platform as a Service (PaaS)

PaaS providers handle the infrastructure for you. You give them your code, and they handle servers, networking, SSL certificates, scaling, and more.

**Vercel** is the most popular option for modern JavaScript/TypeScript apps. It is made by the team behind Next.js, but it works with any framework that supports Node.js. You connect your GitHub repository, and every push triggers an automatic deployment. It is excellent for frontend-heavy apps and serverless functions.

**Railway** is a developer-friendly platform that handles both your app and your database. You can deploy a Node.js app and a PostgreSQL database in the same project, and Railway manages the connection between them. It is one of the easiest ways to deploy a full-stack app.

**Coolify** is a self-hosted alternative to Vercel and Railway. You install it on your own server (a VPS from DigitalOcean, Hetzner, etc.), and it gives you a web UI for deploying applications, databases, and services. It is free and open source, giving you full control without vendor lock-in.

**When to choose PaaS**: You want to focus on building your app, not managing servers. You are okay paying a premium for convenience. Your app fits within the platform's constraints.

### Infrastructure as a Service (IaaS)

IaaS providers give you raw virtual servers. You get a Linux machine in the cloud, and everything else — installing Node.js, configuring Nginx, setting up SSL, managing deployments — is your responsibility.

**DigitalOcean** offers virtual servers called Droplets starting at $4/month. They also have managed databases and a simple control panel.

**AWS (Amazon Web Services)** is the largest cloud provider. It offers every possible service, from virtual servers (EC2) to managed containers (ECS) to serverless functions (Lambda). It is extremely powerful but has a steep learning curve.

**Hetzner** is a European provider known for exceptional value. Their servers are often 2-3x cheaper than equivalent offerings from AWS or DigitalOcean, with comparable performance.

**When to choose IaaS**: You need full control over your server configuration. You have specific compliance requirements. You want to minimize costs at scale. You enjoy system administration (or want to learn it).

### The Practical Choice

For most developers deploying their first production app, **Railway or Coolify** hits the sweet spot. Railway requires zero server management. Coolify gives you the PaaS experience on your own infrastructure. Either way, you can go from code to production in under 30 minutes.

## Environment Variables

One of the most important deployment concepts is **separating configuration from code**. Your app needs different settings in different environments:

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | `postgresql://localhost/dev_db` | `postgresql://prod-server/prod_db` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `APP_URL` | `http://localhost:3000` | `https://indigosunflorals.com` |
| `NODE_ENV` | `development` | `production` |

These values should **never** be committed to your Git repository. Instead, they are set as environment variables on the server.

### The .env File

During development, you store environment variables in a `.env` file at the root of your project:

```bash
# .env — NEVER commit this file
DATABASE_URL="postgresql://postgres:password@localhost:5432/indigo_sun_florals"
STRIPE_SECRET_KEY="sk_test_abc123"
STRIPE_WEBHOOK_SECRET="whsec_abc123"
BETTER_AUTH_SECRET="my-secret-key"
APP_URL="http://localhost:3000"
```

Your `.gitignore` file should include `.env` to prevent it from being committed. Most frameworks (including Vite) automatically load `.env` files during development.

### Setting Environment Variables in Production

Every hosting platform has a way to set environment variables:

- **Railway**: Settings panel in the web dashboard, or `railway variables set KEY=value`
- **Vercel**: Project Settings > Environment Variables
- **Coolify**: Application settings in the web UI
- **Linux server**: Set in the service file, Docker compose file, or the shell profile

The key principle: your code reads `process.env.DATABASE_URL` and does not care whether that value came from a `.env` file or a production server's configuration. Same code, different config.

## The Twelve-Factor App

The **Twelve-Factor App** is a methodology for building modern web applications. It was written by engineers at Heroku and has become the standard set of best practices for deployable apps. Here are the factors most relevant to your deployment.

### Factor III: Config

Store config in the environment. We just covered this — never hard-code connection strings, API keys, or environment-specific settings.

### Factor V: Build, Release, Run

Strictly separate the build stage, the release stage, and the run stage.

- **Build**: Convert your source code into an executable bundle. `pnpm build` turns your TypeScript into optimized JavaScript.
- **Release**: Combine the build with the environment's config. This is when environment variables are applied.
- **Run**: Start the application. `node .output/server/index.mjs` runs your built app.

This separation means you can rebuild without re-releasing, and you can roll back a release without rebuilding.

### Factor XI: Logs

Treat logs as event streams. Your app should write logs to `stdout` (standard output), and the environment should collect and route them. Do not write log files inside your application — let the platform handle log storage and searching.

```typescript
// Good: write to stdout
console.log(`Order ${orderId} created successfully`)
console.error(`Payment failed for order ${orderId}: ${error.message}`)

// Bad: write to a file
fs.appendFileSync("app.log", `Order ${orderId} created\n`)
```

In development, these logs appear in your terminal. In production, the platform captures them and makes them searchable through its dashboard.

## HTTPS, Domains, and DNS

When your app goes live, users will access it through a domain name like `indigosunflorals.com` instead of an IP address. Here is how that works.

### DNS (Domain Name System)

DNS is the internet's phone book. It translates human-readable domain names into IP addresses that computers use to find each other.

When a user types `indigosunflorals.com` into their browser:
1. Their computer asks a DNS server "What IP address is `indigosunflorals.com`?"
2. The DNS server responds with something like `143.198.45.123`
3. The browser connects to that IP address and requests the page

You configure DNS through your **domain registrar** (the company where you bought the domain). You create DNS records that point your domain to your server's IP address:

- **A Record**: Points a domain to an IPv4 address. `indigosunflorals.com → 143.198.45.123`
- **CNAME Record**: Points a domain to another domain. `www.indigosunflorals.com → indigosunflorals.com`

### HTTPS and SSL

HTTPS encrypts the connection between the user's browser and your server. This is **mandatory** for any site that handles passwords, payment information, or personal data — which means it is mandatory for your e-commerce app.

HTTPS uses an **SSL/TLS certificate** to establish the encrypted connection. In the past, certificates were expensive. Today, **Let's Encrypt** provides them for free, and most hosting platforms (Vercel, Railway, Coolify) set up HTTPS automatically.

If you are deploying to your own server, tools like **Caddy** (a web server) handle SSL certificates automatically. Nginx can also be configured with Let's Encrypt using **Certbot**.

### Custom Domain Setup

The typical process for connecting a custom domain:
1. Buy a domain from a registrar (Namecheap, Cloudflare, Google Domains)
2. In your hosting platform, add the custom domain to your project
3. The platform gives you DNS records to add (usually an A record or CNAME)
4. Add those records in your registrar's DNS settings
5. Wait for DNS propagation (usually 5-30 minutes, sometimes up to 48 hours)
6. HTTPS is automatically configured

Once DNS propagation completes, your app is live at your custom domain with HTTPS. In the next lesson, you will learn how to containerize your app with Docker so it runs the same way everywhere.
