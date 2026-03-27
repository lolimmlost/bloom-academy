---
id: "02-drizzle-setup"
title: "Setting Up Drizzle ORM"
type: "code"
xp: 25
difficulty: 2
order: 2
prerequisites: ["01-why-databases"]
hints:
  - "Start by importing defineConfig from the 'drizzle-kit' package."
  - "The dialect property tells Drizzle which database engine you're using."
  - "dbCredentials takes a url property — use process.env.DATABASE_URL! to read it from your environment."
---

# Setting Up Drizzle ORM

Now that you understand why we need a database and an ORM, let's set up **Drizzle ORM** — the tool that will power every database interaction in our flower shop.

## What Is Drizzle?

Drizzle ORM is a modern TypeScript ORM that takes a fundamentally different approach from older tools. Its philosophy is **"If you know SQL, you know Drizzle."** Instead of inventing a completely new query language, Drizzle's API mirrors SQL closely — so the skills transfer both ways.

Here is what makes Drizzle stand out:

- **Lightweight**: Drizzle has zero dependencies. It adds almost nothing to your bundle size.
- **SQL-like API**: The query syntax reads like SQL, so you are not learning a proprietary abstraction.
- **Type-safe from schema to query**: Your TypeScript types are derived directly from your schema definitions. No separate type generation step.
- **No code generation**: Unlike some ORMs, Drizzle does not require a build step to generate client code. You define your schema in TypeScript and start querying immediately.

## Drizzle vs Prisma

If you have explored the TypeScript ecosystem, you have probably heard of **Prisma**. It is a popular ORM, and it is a solid tool. Here is how they compare:

| | Drizzle | Prisma |
|---|---|---|
| **Query style** | SQL-like (select, from, where) | Custom API (findMany, findFirst) |
| **Type generation** | Automatic from TS schema | Requires `prisma generate` step |
| **Bundle size** | ~50KB | ~2MB+ (includes query engine) |
| **Learning curve** | Low if you know SQL | Low if you prefer abstraction |
| **Schema definition** | TypeScript files | `.prisma` schema file |
| **Migrations** | SQL files you can review | Auto-generated, less transparent |

We chose Drizzle for this course because it keeps you closer to the database. Understanding what SQL your ORM generates makes you a better developer — and if you ever need to debug a slow query or optimize performance, that knowledge pays off.

## The Database URL Pattern

Before we configure Drizzle, let's talk about how your app will connect to the database.

Database connections use a **connection string** (also called a database URL) that encodes everything needed to connect: the username, password, host, port, and database name.

```
postgresql://username:password@hostname:5432/database_name
```

In a real project, you **never** hard-code this string in your source code. Instead, you store it as an **environment variable** — a value that lives outside your code and can be different for each environment (development, staging, production).

```bash
# In your .env file
DATABASE_URL="postgresql://postgres:password@localhost:5432/indigo_sun_florals"
```

Your code reads this value at runtime using `process.env.DATABASE_URL`. This pattern keeps your credentials secure and makes it easy to point your app at different databases without changing any code.

## The Drizzle Config

Drizzle uses a configuration file called `drizzle.config.ts` at the root of your project. This file tells Drizzle:

1. **Which database dialect** you are using (PostgreSQL, MySQL, or SQLite)
2. **Where your schema files** are located
3. **How to connect** to the database

Here is what a complete config looks like:

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

Let's break this down:

- **`defineConfig`** is a helper from `drizzle-kit` that gives you autocompletion and type checking for your config.
- **`dialect`** tells Drizzle you are using PostgreSQL. This affects how it generates SQL.
- **`schema`** points to the file where you will define your database tables. We will create this in the next lesson.
- **`dbCredentials.url`** is your connection string. The `!` at the end is a TypeScript non-null assertion — it tells TypeScript "trust me, this value exists."

## Installing Drizzle

In a real project, you would install two packages:

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

- **`drizzle-orm`** is the runtime library you use in your application code to run queries.
- **`postgres`** is the PostgreSQL driver that actually communicates with the database.
- **`drizzle-kit`** is the development toolkit for migrations and schema management. It only runs during development, so it goes in `devDependencies`.

## Your Task

Write a Drizzle configuration object using `defineConfig`. Your config should:

1. Import `defineConfig` from `"drizzle-kit"`
2. Export a default config using `defineConfig`
3. Set the `dialect` to `"postgresql"`
4. Set the `schema` path to `"./src/database/schema.ts"`
5. Configure `dbCredentials` with a `url` property that reads from `process.env.DATABASE_URL!`
