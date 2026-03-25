---
id: "01-why-databases"
title: "Why Databases?"
type: "info"
xp: 15
difficulty: 1
order: 1
prerequisites: []
hints: []
---

# Why Databases?

So far, you have a project that can render pages and style them beautifully. But there is a problem: where does the *data* live? If your flower shop has 200 products, you are not going to hard-code them all into React components. You need a **database**.

## What Is a Database?

A database is an organized system for storing, retrieving, and managing data. Think of it as a highly optimized filing cabinet that your application can read from and write to in milliseconds.

Every serious web application uses one. When you sign up for an account, your email and password go into a database. When you add an item to a cart, that gets stored in a database. When you search for products, the database finds them for you.

Without a database, your app would lose all its data the moment the server restarts.

## Relational vs Non-Relational

There are two broad families of databases, and understanding the difference will help you make good architectural decisions throughout your career.

### Relational Databases (SQL)

Relational databases store data in **tables** — structured grids of rows and columns, similar to a spreadsheet. Each table has a defined **schema** that enforces what kind of data can go in each column.

The key feature is **relationships**. You can link tables together. For example, an `orders` table can reference a `users` table, so every order is associated with the user who placed it.

Popular relational databases include **PostgreSQL**, **MySQL**, and **SQLite**.

```sql
-- A simple table definition in SQL
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  in_stock BOOLEAN DEFAULT true
);
```

### Non-Relational Databases (NoSQL)

Non-relational databases take a more flexible approach. Instead of rigid tables, they might store data as JSON-like documents, key-value pairs, or graphs.

Popular options include **MongoDB** (documents), **Redis** (key-value), and **DynamoDB** (key-value/document).

### When to Use Which?

For most web applications — especially e-commerce — **relational databases are the better choice**. Here is why:

- E-commerce data is naturally relational: users *have* orders, orders *contain* products, products *belong to* categories.
- You need **data integrity**. If someone places an order, you need to guarantee the order and the payment record are both saved, or neither is. This is called a **transaction**.
- SQL databases enforce structure, which prevents bugs caused by inconsistent data.

NoSQL databases shine when you need extreme flexibility in your data shape, massive horizontal scaling, or when your data does not have natural relationships (like caching, real-time chat messages, or logging).

For Indigo Sun Florals, a relational database is the clear choice.

## Why PostgreSQL?

We are using **PostgreSQL** (often called "Postgres") for this project, and it is one of the best choices you can make for a web application. Here is why:

- **Battle-tested**: PostgreSQL has been in active development since 1996. It powers companies like Instagram, Spotify, and Twitch.
- **ACID compliance**: This guarantees that database transactions are processed reliably. If something fails midway, the database rolls back to a consistent state. (ACID stands for Atomicity, Consistency, Isolation, Durability.)
- **JSON support**: PostgreSQL has first-class `jsonb` columns, giving you the flexibility of a document database when you need it while keeping all the relational guarantees.
- **Free and open source**: No licensing fees, no vendor lock-in, and a massive community behind it.
- **Excellent tooling**: Every ORM, every hosting provider, and every deployment platform supports PostgreSQL.

## SQL Concepts You Need to Know

Before we start writing code, let's make sure you are comfortable with the core vocabulary. You do not need to memorize SQL syntax — our ORM will handle that — but understanding these concepts is essential.

### Tables

A table is a collection of related data organized into rows and columns. In our flower shop, we will have tables like `products`, `users`, `orders`, and `order_items`.

### Rows and Columns

Each **column** defines a piece of data (like `name`, `price`, or `email`). Each **row** is a single record — one product, one user, one order.

### Primary Keys

Every table needs a way to uniquely identify each row. That is the **primary key**. It is usually a column called `id` that contains a unique value for every row.

```sql
-- The id column is the primary key
id TEXT PRIMARY KEY
```

### Foreign Keys

A **foreign key** is a column in one table that references the primary key of another table. This is how you create relationships between tables.

```sql
-- This order belongs to a specific user
user_id TEXT REFERENCES users(id)
```

When the `orders` table has a `user_id` column that points to the `users` table, you have established a **one-to-many relationship**: one user can have many orders.

## What Is an ORM?

An **ORM** (Object-Relational Mapping) is a library that lets you interact with your database using your programming language instead of writing raw SQL strings.

Without an ORM, you might write:

```typescript
const result = await client.query(
  "SELECT * FROM products WHERE category = $1 ORDER BY price ASC",
  [category]
)
```

This works, but there are problems:
- **No type safety**. TypeScript has no idea what `result` contains.
- **Easy to make mistakes**. A typo in your SQL string will not be caught until runtime.
- **Harder to maintain**. As your queries get complex, raw SQL strings become difficult to read and refactor.

With an ORM, you write:

```typescript
const result = await db
  .select()
  .from(products)
  .where(eq(products.category, category))
  .orderBy(asc(products.price))
```

This gives you:
- **Full type safety**. TypeScript knows exactly what fields `result` contains.
- **Autocompletion**. Your editor suggests column names, methods, and operators.
- **Compile-time error checking**. If you reference a column that does not exist, TypeScript catches it before your code even runs.
- **Database migrations**. ORMs can automatically generate the SQL needed to update your database schema when you make changes.

In the next lesson, we will set up **Drizzle ORM** — the tool that gives us all of these benefits while staying close to the SQL you would write by hand.
