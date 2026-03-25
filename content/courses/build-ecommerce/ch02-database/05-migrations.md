---
id: "05-migrations"
title: "Database Migrations"
type: "info"
xp: 15
difficulty: 2
order: 5
prerequisites: ["04-queries"]
hints: []
---

# Database Migrations

You have defined your schema and learned how to write queries. But there is a crucial question we have not addressed yet: **how does your database actually know about your schema?**

When you write a `pgTable` definition in TypeScript, that only exists in your code. The actual PostgreSQL database has no idea about it until you tell it to create those tables. That is what **migrations** do.

## What Are Migrations?

A migration is a set of SQL instructions that changes your database structure. Think of migrations as **version control for your database schema** — just like Git tracks changes to your code, migrations track changes to your database.

Each migration describes a specific change:
- "Create a `products` table with these columns"
- "Add a `discount_price` column to the `products` table"
- "Rename the `image_url` column to `thumbnail_url`"
- "Create an `orders` table with a foreign key to `users`"

Migrations are applied in order, one at a time. The database keeps track of which migrations have been applied, so it never runs the same migration twice.

## Why Migrations Matter

You might be wondering: "Can't I just drop the whole database and recreate it?" During development, sure. But in production, your database has **real user data**. You cannot delete it and start over.

Imagine your flower shop is live and has 500 customers with order histories. Now you need to add a `phone` column to the `users` table. You need a way to make that change **without losing any existing data**. That is exactly what a migration does:

```sql
ALTER TABLE users ADD COLUMN phone TEXT;
```

This adds the column to every existing row (with a `null` value) without touching anything else.

## Drizzle's Two Approaches

Drizzle gives you two ways to sync your schema with your database, and understanding when to use each one is important.

### drizzle-kit push (Development)

```bash
pnpm drizzle-kit push
```

This command looks at your current TypeScript schema, compares it to the actual database, and applies any changes directly. It is fast and convenient for development because you do not need to deal with migration files — you just change your schema and push.

**Use `push` when:**
- You are developing locally
- You do not care about preserving data (you can always re-seed)
- You want the fastest iteration cycle

**Do not use `push` when:**
- You are deploying to production
- You need to review the SQL before it runs
- You are working on a team and need reproducible changes

### drizzle-kit generate + migrate (Production)

```bash
pnpm drizzle-kit generate
```

This command compares your TypeScript schema to the **last generated migration** and creates a new SQL migration file describing the differences. It does not touch the database — it only generates a file.

The generated file looks something like this:

```sql
-- 0001_create_products.sql
CREATE TABLE "products" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price" integer NOT NULL,
  "image_url" text,
  "category" text NOT NULL,
  "in_stock" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

You then **review** this SQL to make sure it does what you expect. Once you are satisfied, you apply it:

```typescript
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "./db"

await migrate(db, { migrationsFolder: "./drizzle" })
```

Or via the CLI:

```bash
pnpm drizzle-kit migrate
```

**Use `generate` + `migrate` when:**
- You are deploying to staging or production
- You want to review the exact SQL that will run
- You need a reliable audit trail of every database change
- You are working with a team

## The Migration Workflow

Here is the workflow you will follow in a real project:

### 1. Change Your Schema

Edit your TypeScript schema file. For example, adding a new column:

```typescript
export const products = pgTable("products", {
  // ... existing columns ...
  discountPrice: integer("discount_price"), // new column
})
```

### 2. Generate the Migration

```bash
pnpm drizzle-kit generate
```

Drizzle creates a new SQL file in your `drizzle/` folder:

```sql
-- 0002_add_discount_price.sql
ALTER TABLE "products" ADD COLUMN "discount_price" integer;
```

### 3. Review the SQL

Open the generated file and read it. Does it do what you expect? Is it safe? For simple additions, this is usually straightforward. For more complex changes (renaming columns, changing types), you want to be extra careful.

### 4. Apply the Migration

```bash
pnpm drizzle-kit migrate
```

The SQL runs against your database, and the `drizzle` folder now serves as a complete history of every structural change your database has gone through.

## Handling Schema Changes Safely

Not all schema changes are equally safe. Here is a quick guide:

### Safe Changes (No Data Loss)
- **Adding a new table** — does not affect existing tables
- **Adding a nullable column** — existing rows get `null` for the new column
- **Adding a column with a default** — existing rows get the default value
- **Creating an index** — improves query performance, no data change

### Dangerous Changes (Potential Data Loss)
- **Dropping a table** — all data in that table is gone forever
- **Dropping a column** — all data in that column is gone
- **Changing a column type** — might fail if existing data cannot be converted
- **Adding `NOT NULL` to an existing column** — fails if any rows have `null`

For dangerous changes, you often need a multi-step approach. For example, to make an existing nullable column required:

1. Add a default value or backfill existing `null` rows
2. Then add the `NOT NULL` constraint

Drizzle will warn you about potentially destructive changes when you generate migrations.

## Seeding Data

After creating your tables, you often want to populate them with some initial data for development. This is called **seeding**.

You can create a simple seed script:

```typescript
// src/database/seed.ts
import { db } from "./db"
import { products } from "./schema"

const sampleProducts = [
  {
    id: "prod_001",
    name: "Sunrise Rose Bouquet",
    description: "A vibrant arrangement of orange and yellow roses",
    price: 4999,
    category: "bouquets",
  },
  {
    id: "prod_002",
    name: "Lavender Dreams",
    description: "Dried lavender bundles perfect for home fragrance",
    price: 2499,
    category: "dried-flowers",
  },
  {
    id: "prod_003",
    name: "Succulent Trio",
    description: "Three hardy succulents in ceramic pots",
    price: 3499,
    category: "plants",
  },
]

async function seed() {
  console.log("Seeding database...")
  await db.insert(products).values(sampleProducts)
  console.log("Done! Inserted", sampleProducts.length, "products")
}

seed()
```

Run it with:

```bash
pnpm tsx src/database/seed.ts
```

A good seed script should be **idempotent** — meaning you can run it multiple times without creating duplicate data. One approach is to clear the table first:

```typescript
async function seed() {
  await db.delete(products) // clear existing data
  await db.insert(products).values(sampleProducts)
}
```

## What You Have Learned

This chapter covered a lot of ground. Let's recap:

1. **Databases** store your application's persistent data. PostgreSQL is an excellent choice for web apps.
2. **Drizzle ORM** lets you define schemas and write queries in TypeScript with full type safety.
3. **Schemas** define your table structure using `pgTable` and column type functions.
4. **Queries** use a chainable, SQL-like API: `db.select().from().where().orderBy()`.
5. **Migrations** are version control for your database — use `push` for dev, `generate` + `migrate` for production.

In the next chapter, you will put your database to work by building **user authentication** — so people can sign up, log in, and have their own shopping carts and order histories.
