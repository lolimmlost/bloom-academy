---
id: "03-defining-schemas"
title: "Defining Database Schemas"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-drizzle-setup"]
hints:
  - "Import pgTable along with the column types you need from 'drizzle-orm/pg-core'."
  - "Store price as an integer in cents (e.g., $12.99 = 1299) to avoid floating point issues."
  - "Use .notNull() to mark required columns and .default(true) for default values."
  - "The createdAt column can use .defaultNow() to automatically set the current timestamp."
---

# Defining Database Schemas

With Drizzle configured, it is time to define **what data your database will actually store**. This is where schemas come in.

## What Is a Schema?

A database schema is the **blueprint** for your tables. It defines:

- What tables exist
- What columns each table has
- What type of data each column holds
- What constraints and defaults apply

Think of it like a TypeScript `interface`, but for your database. Just as an interface tells TypeScript what shape an object should have, a schema tells your database what shape your data should have.

In Drizzle, you define schemas using plain TypeScript. This means your database structure and your TypeScript types stay perfectly in sync — no manual type definitions, no code generation, no drift between what your code expects and what the database actually contains.

## The pgTable API

Drizzle provides a `pgTable` function for defining PostgreSQL tables. Here is a simple example:

```typescript
import { pgTable, text, integer } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  age: integer("age"),
})
```

Let's break down the pattern:

1. **`pgTable("users", {...})`** — The first argument is the **table name** in your database. The second is an object defining the columns.
2. **`text("id")`** — Each column is created by calling a type function with the **column name** as it will appear in the database. Notice that the JavaScript property name (`id`) and the database column name (`"id"`) can be different — this is useful for converting between camelCase (JavaScript) and snake_case (SQL convention).
3. **Chained methods** like `.primaryKey()`, `.notNull()`, and `.default()` add constraints.

The variable name (`users`) is what you will reference in your TypeScript code. The string (`"users"`) is what the table will be called in PostgreSQL.

## Column Types

Drizzle provides functions for every PostgreSQL column type. Here are the ones you will use most often:

### text

For strings of any length. Use this for names, emails, descriptions, URLs, and IDs.

```typescript
name: text("name").notNull()
```

### integer

For whole numbers. Perfect for quantities, counts, and — importantly — **prices stored in cents**.

```typescript
price: integer("price").notNull()
```

**Why cents?** Storing prices as integers (1299 instead of 12.99) avoids floating-point precision issues. JavaScript's `0.1 + 0.2 === 0.30000000000000004` is a real problem when dealing with money. By working in cents, every calculation stays exact.

### boolean

For true/false values. Great for flags like "is this product in stock?" or "is this user an admin?"

```typescript
inStock: boolean("in_stock").notNull().default(true)
```

### timestamp

For dates and times. Perfect for tracking when records are created or updated.

```typescript
createdAt: timestamp("created_at").notNull().defaultNow()
```

The `.defaultNow()` method tells PostgreSQL to automatically set this column to the current date and time when a new row is inserted.

### jsonb

For storing JSON data directly in a column. Useful when you have semi-structured data that does not need its own table.

```typescript
metadata: jsonb("metadata")
```

## Constraints and Defaults

Constraints are rules that the database enforces on your data. They prevent invalid data from ever being stored.

### .notNull()

Marks a column as required. Any attempt to insert a row without this column will fail.

```typescript
email: text("email").notNull()
```

### .primaryKey()

Marks a column as the table's primary key — the unique identifier for every row.

```typescript
id: text("id").primaryKey()
```

### .default(value)

Sets a default value that is used when no value is provided during insertion.

```typescript
inStock: boolean("in_stock").notNull().default(true)
```

### .defaultNow()

A special default for timestamp columns that sets the value to the current time.

```typescript
createdAt: timestamp("created_at").notNull().defaultNow()
```

### .$defaultFn()

Lets you provide a JavaScript function that generates the default value. This is useful for generating IDs on the application side:

```typescript
import { createId } from "@paralleldrive/cuid2"

id: text("id").primaryKey().$defaultFn(() => createId())
```

## Foreign Keys and References

Relationships between tables are what make relational databases powerful. A **foreign key** is a column in one table that points to the primary key of another table.

```typescript
import { pgTable, text, integer } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
})

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  total: integer("total").notNull(),
})
```

The `.references(() => users.id)` tells PostgreSQL: "This column must contain a value that exists in the `users.id` column." If you try to create an order with a `userId` that does not match any user, the database will reject it. This guarantees **referential integrity** — you can never have orphaned orders pointing to users that do not exist.

Notice the arrow function syntax `() => users.id` instead of just `users.id`. This is intentional — it avoids circular dependency issues when tables reference each other.

## A Real-World Example

Here is what a more complete schema might look like for our flower shop:

```typescript
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

This single table definition gives you:
- A fully typed `Product` type in TypeScript (Drizzle infers it automatically)
- Database-level validation (required fields cannot be null, price must be an integer)
- Sensible defaults (new products are in stock, creation time is set automatically)

## Your Task

Define a `products` table for the Indigo Sun Florals flower shop. The table should have these columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | text | primary key |
| `name` | text | not null |
| `description` | text | not null |
| `price` | integer (in cents) | not null |
| `imageUrl` | text | nullable (optional) |
| `category` | text | not null |
| `inStock` | boolean | not null, default true |
| `createdAt` | timestamp | not null, default now |

Remember to:
- Import `pgTable` and the necessary column types from `"drizzle-orm/pg-core"`
- Use snake_case for the database column names (the string arguments)
- Export the table definition
