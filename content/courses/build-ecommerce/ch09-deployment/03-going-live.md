---
id: "03-going-live"
title: "Going Live"
type: "info"
xp: 20
difficulty: 2
order: 3
prerequisites: ["02-docker-basics"]
hints: []
---

# Going Live

This is the final lesson in the course. You have built a complete e-commerce application from the ground up — database, authentication, product catalog, shopping cart, payments, admin dashboard — and you know how to test it and containerize it. Now it is time to put it in front of real users.

Going live is exciting, but it requires careful preparation. This lesson covers the pre-launch checklist, production database management, monitoring, common issues, and what to learn next.

## Pre-Launch Checklist

Before flipping the switch, work through this checklist. Skipping any of these can lead to downtime, data loss, or security issues.

### Environment Variables

Every environment variable your app needs must be set on the production server. Missing a single one can cause crashes.

Create a list of all required variables and verify each one:

```
DATABASE_URL           ✓ Set, points to production database
STRIPE_SECRET_KEY      ✓ Set, using sk_live_ (not sk_test_!)
STRIPE_WEBHOOK_SECRET  ✓ Set, matches production webhook endpoint
BETTER_AUTH_SECRET     ✓ Set, unique random string (not the dev value)
APP_URL                ✓ Set to https://indigosunflorals.com
NODE_ENV               ✓ Set to "production"
```

Common mistakes:
- Using test API keys in production (Stripe test keys will not process real payments)
- Using the same auth secret across environments (compromises security)
- Forgetting `APP_URL`, which breaks OAuth callbacks and email links

### Database Migrations

Your production database needs the same schema as your development database. This is handled by **migrations**.

### SSL Certificate

Verify HTTPS works on your domain. Open `https://yourdomain.com` and check for the padlock icon. If you are using Railway, Vercel, or Coolify, this is automatic. If you are managing your own server, make sure Certbot or Caddy has issued a certificate.

### Error Tracking

In development, errors show up in your terminal. In production, you need a way to know when errors happen. Services like **Sentry** capture errors automatically and alert you:

```typescript
// sentry.ts
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

Even a basic setup catches unhandled exceptions and gives you stack traces, request details, and user information. This is invaluable when a customer reports "the checkout is broken" and you need to figure out why.

### Stripe Webhooks

If you are using Stripe (which you set up in the payments chapter), you need to create a new webhook endpoint for production:

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Add a new endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
3. Select the events you need (`checkout.session.completed`, `payment_intent.succeeded`, etc.)
4. Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in production

The test webhook secret from development will not work in production. This is one of the most common "works locally but fails in production" issues.

## Database Migrations in Production

Drizzle offers two approaches for managing your database schema in production. Understanding the difference is important.

### drizzle-kit push

```bash
pnpm drizzle-kit push
```

`push` directly applies your schema changes to the database. It compares your TypeScript schema with the current database state and runs the necessary SQL to make them match.

**Pros**: Simple, fast, no migration files to manage.
**Cons**: No record of what changed, difficult to roll back, not suitable for team environments.

**Use `push` for**: Personal projects, prototyping, early development.

### drizzle-kit generate + migrate

```bash
pnpm drizzle-kit generate   # Creates a migration file
pnpm drizzle-kit migrate     # Applies pending migrations
```

`generate` creates a SQL migration file that records exactly what changes need to be made. `migrate` runs all pending migration files in order.

**Pros**: Full history of every schema change, can be reviewed in code review, can be rolled back, safe for teams.
**Cons**: More steps, migration files accumulate over time.

**Use `generate + migrate` for**: Production deployments, team projects, any app that handles real data.

### Migration Workflow

Here is the typical workflow:

1. Change your Drizzle schema in TypeScript
2. Run `pnpm drizzle-kit generate` — this creates a new migration file in `drizzle/` (e.g., `0005_add_order_status.sql`)
3. Review the generated SQL to make sure it does what you expect
4. Commit the migration file to Git
5. In production, run `pnpm drizzle-kit migrate` as part of your deployment process

Most hosting platforms let you run a command before starting your app. Set that to your migration command:

```yaml
# Railway or similar
build_command: pnpm build
start_command: pnpm drizzle-kit migrate && node .output/server/index.mjs
```

### Dangerous Migrations

Some schema changes can cause data loss:
- **Dropping a column**: All data in that column is deleted permanently
- **Renaming a column**: Drizzle might generate a drop + add instead of a rename
- **Changing a column type**: The data might not be convertible

Always review your migration SQL before applying it to production. If a migration drops a column, make sure you have backed up that data or confirmed it is no longer needed.

## Monitoring and Logging

Once your app is live, you need visibility into how it is performing.

### Application Logging

Your app should log important events to stdout:

```typescript
// Log order creation
console.log(JSON.stringify({
  event: "order_created",
  orderId: order.id,
  userId: order.userId,
  total: order.total,
  timestamp: new Date().toISOString(),
}))

// Log errors with context
console.error(JSON.stringify({
  event: "payment_failed",
  orderId: order.id,
  error: error.message,
  timestamp: new Date().toISOString(),
}))
```

Using JSON format makes logs parseable by monitoring tools. Most platforms (Railway, Vercel, Coolify) provide a log viewer where you can search and filter these logs.

### Health Checks

A **health check endpoint** lets monitoring tools verify your app is running:

```typescript
// /api/health
export async function GET() {
  try {
    // Verify database connection
    await db.select({ one: sql`1` })
    return Response.json({ status: "healthy", timestamp: new Date().toISOString() })
  } catch (error) {
    return Response.json({ status: "unhealthy", error: error.message }, { status: 503 })
  }
}
```

Monitoring services like **UptimeRobot** or **Better Stack** ping this endpoint every minute and alert you if it returns an error or times out.

### Uptime Monitoring

Set up an external monitoring service that checks your site from multiple locations around the world. If your site goes down, you want to know before your customers tell you.

Free options:
- **UptimeRobot**: 50 monitors with 5-minute intervals
- **Better Stack (Uptime)**: 5 monitors with 3-minute intervals

These services can notify you via email, Slack, SMS, or phone call when your site goes down.

## Common Production Issues

Here are the issues you are most likely to encounter when going live, and how to handle them.

### Database Connection Limits

Your database has a maximum number of simultaneous connections (often 20-100 depending on your plan). Each request to your server opens a connection. Under load, you can exhaust the pool and start getting "too many connections" errors.

**Solution**: Use a **connection pooler**. Tools like **PgBouncer** sit between your app and the database, reusing connections instead of creating new ones for each request.

Railway and Supabase include connection pooling. If you are managing your own database, set up PgBouncer:

```bash
# Connection string without pooler
DATABASE_URL="postgresql://user:pass@db-host:5432/mydb"

# Connection string with pooler (different port)
DATABASE_URL="postgresql://user:pass@db-host:6543/mydb"
```

### Memory Leaks

If your app's memory usage grows steadily over time without leveling off, you have a memory leak. Common causes:
- Caching data without eviction (the cache grows forever)
- Event listeners that are added but never removed
- Closures holding references to large objects

**Solution**: Monitor memory usage over time. If it keeps climbing, use Node.js's `--inspect` flag and Chrome DevTools to find the leak.

### Slow Queries

A query that takes 50ms on your local database might take 500ms in production with real data. The difference is data volume — your test database has 20 products, production has 2,000.

**Solution**: Add database **indexes** on columns you frequently query:

```typescript
// In your Drizzle schema
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.category),
  priceIdx: index("products_price_idx").on(table.price),
}))
```

Indexes speed up `WHERE`, `ORDER BY`, and `JOIN` operations dramatically — often from seconds to milliseconds.

### Environment Variable Mistakes

The most common production bug is a missing or incorrect environment variable. Your app works locally because your `.env` file has everything, but production is missing one variable.

**Solution**: Validate environment variables at startup:

```typescript
function validateEnv() {
  const required = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "BETTER_AUTH_SECRET",
    "APP_URL",
  ]

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

validateEnv()
```

This crashes the app immediately on startup with a clear error message, instead of failing mysteriously when a request tries to use the missing variable.

## Scaling Considerations

Your flower shop probably will not need to handle millions of requests on day one. But it is good to know where the bottlenecks will appear as you grow.

### Connection Pooling

Already covered above — use a pooler when you start hitting connection limits.

### Caching

Repeated queries for the same data can be cached. If 100 users visit the product catalog page in the same minute, you do not need to run the same database query 100 times.

```typescript
import { unstable_cache } from "next/cache" // or your framework's caching

const getProducts = unstable_cache(
  async () => db.select().from(products).where(eq(products.inStock, true)),
  ["products-list"],
  { revalidate: 60 } // Cache for 60 seconds
)
```

Or use Redis for a framework-agnostic cache:

```typescript
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL)

export async function getCachedProducts() {
  const cached = await redis.get("products")
  if (cached) return JSON.parse(cached)

  const products = await db.select().from(products)
  await redis.set("products", JSON.stringify(products), "EX", 60)
  return products
}
```

### CDN (Content Delivery Network)

A CDN caches your static assets (images, CSS, JavaScript) on servers around the world. When a user in Tokyo requests your product image, it is served from a nearby CDN server instead of your origin server in New York. This dramatically reduces load times for global users.

**Cloudflare** offers a free CDN that also provides DDoS protection. Simply point your domain's DNS through Cloudflare, and static assets are cached automatically.

### Horizontal Scaling

When a single server cannot handle the load, you add more servers. A load balancer distributes incoming requests across multiple instances of your app. Each instance connects to the same database.

This is where Docker truly shines — spinning up another instance is as simple as running another container:

```bash
# Run 3 instances behind a load balancer
docker compose up --scale app=3
```

Most PaaS platforms handle this with a slider in the dashboard.

## What to Learn Next

Congratulations. You have built a complete, production-ready e-commerce application. Here is what to explore next to continue growing as a developer.

### Deeper Into the Stack

- **Advanced SQL**: Window functions, CTEs (Common Table Expressions), recursive queries. These let you write sophisticated analytics queries.
- **WebSockets**: For real-time features like live order tracking, chat support, or inventory updates.
- **Background jobs**: Processing that should not happen during a request — sending emails, generating reports, processing images. Tools like **BullMQ** or **Trigger.dev** handle this.

### DevOps and Infrastructure

- **CI/CD pipelines**: Automate testing and deployment with GitHub Actions. Every push to main automatically runs tests and deploys if they pass.
- **Kubernetes**: Container orchestration for large-scale applications. Overkill for most projects, but valuable knowledge for large teams.
- **Infrastructure as Code**: Tools like **Terraform** or **Pulumi** let you define your infrastructure in code and version it alongside your app.

### Product and Business

- **Analytics**: Track user behavior with Plausible or PostHog to understand how customers use your store.
- **SEO**: Server-side rendering, meta tags, structured data, and sitemaps to drive organic traffic.
- **Email marketing**: Transactional emails (order confirmation, shipping updates) and marketing campaigns with tools like Resend or Postmark.
- **A/B testing**: Test different product page layouts, pricing, or checkout flows to optimize conversion.

### Architecture

- **Microservices**: Splitting your monolith into smaller, independently deployable services. Wait until your team and codebase are large enough to need this.
- **Event-driven architecture**: Using message queues (RabbitMQ, Kafka) to decouple services and handle asynchronous processing.
- **API design**: Building public APIs for mobile apps, third-party integrations, or headless commerce.

You now have the foundation to build, test, and deploy real web applications. The technologies and patterns you have learned in this course transfer to almost any web project. Keep building, keep shipping, and keep learning.
