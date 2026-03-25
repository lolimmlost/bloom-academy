---
id: "02-data-aggregation"
title: "Data Aggregation"
type: "code"
xp: 35
difficulty: 4
order: 2
prerequisites: ["01-dashboard-layout"]
hints:
  - "Import count, sum, and avg from drizzle-orm — these are aggregate functions."
  - "Use db.select({ ... }).from(orders) with the aggregate functions as fields."
  - "The result is an array — destructure the first element with const [stats] = await db.select(...)."
  - "sum() and avg() return strings or null, so convert them to numbers with Number()."
---

# Data Aggregation

Your dashboard layout is designed. Now you need the data to fill it. In this lesson, you will learn how to compute meaningful business metrics from your database using **aggregation queries** — queries that summarize many rows into a single result.

## What Is Aggregation?

When you run a normal `SELECT` query, you get back individual rows. "Show me all orders" returns one row per order. But when a dashboard stat card says "Total Revenue: $12,450," that number does not come from a single row. It comes from adding up the `total` column across *every* order in the database.

That is aggregation: taking a collection of rows and computing a single summary value from them.

## SQL Aggregation Functions

SQL provides several built-in aggregation functions. These are the ones you will use most often.

### COUNT

`COUNT` tells you how many rows match your query.

```sql
-- How many orders are in the database?
SELECT COUNT(id) FROM orders;
-- Result: 142
```

`COUNT(*)` counts all rows, including those with NULL values. `COUNT(column_name)` counts only rows where that column is not NULL. In practice, `COUNT(id)` and `COUNT(*)` give the same result when `id` is a primary key (which is never NULL).

### SUM

`SUM` adds up all values in a numeric column.

```sql
-- What is the total revenue from all orders?
SELECT SUM(total) FROM orders;
-- Result: 1245000 (in cents)
```

If you store prices in cents (which you should — we covered this in the payments chapter), the sum will also be in cents. You will convert to dollars when displaying the value.

### AVG

`AVG` computes the arithmetic mean of a numeric column.

```sql
-- What is the average order value?
SELECT AVG(total) FROM orders;
-- Result: 8767 (about $87.67)
```

This is incredibly useful for business metrics. If your average order value is trending up, it means customers are buying more per order — a positive signal.

### MIN and MAX

`MIN` and `MAX` find the smallest and largest values.

```sql
-- What was the smallest order?
SELECT MIN(total) FROM orders;

-- What was the largest order?
SELECT MAX(total) FROM orders;
```

### GROUP BY

`GROUP BY` is where aggregation gets truly powerful. Instead of computing one summary across all rows, you can compute summaries **for each group**.

```sql
-- How many orders are in each status?
SELECT status, COUNT(id) FROM orders GROUP BY status;
-- Result:
-- pending     | 5
-- processing  | 12
-- shipped     | 28
-- delivered   | 97
```

This one query gives you a complete breakdown of your order pipeline.

```sql
-- Revenue per month
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

## Aggregation in Drizzle

Drizzle provides TypeScript equivalents for all SQL aggregate functions. They are imported directly from `drizzle-orm`.

```typescript
import { count, sum, avg, min, max } from "drizzle-orm"
```

### Basic Aggregation Query

Here is how you compute total orders, total revenue, and average order value in a single query:

```typescript
import { db } from "@/database/db"
import { orders } from "@/database/schema"
import { count, sum, avg } from "drizzle-orm"

const [stats] = await db
  .select({
    totalOrders: count(orders.id),
    totalRevenue: sum(orders.total),
    avgOrderValue: avg(orders.total),
  })
  .from(orders)
```

A few things to notice:

1. **Named fields**: The object passed to `.select()` defines the shape of the result. Each key becomes a property on the returned object.
2. **Single row result**: Aggregation queries without `GROUP BY` always return a single row. We destructure it with `const [stats]` to get the object directly instead of an array.
3. **Return types**: `count()` returns a number, but `sum()` and `avg()` return strings (because SQL numeric types can be very large). You will typically convert them with `Number()`.

### Handling NULL Values

When there are no orders in the database (or no orders matching your filter), `sum()` and `avg()` return `null`. Your code should handle this gracefully:

```typescript
return {
  totalOrders: stats.totalOrders,
  totalRevenue: Number(stats.totalRevenue ?? 0),
  avgOrderValue: Number(stats.avgOrderValue ?? 0),
}
```

The **nullish coalescing operator** (`??`) provides a fallback value of `0` when the result is `null` or `undefined`. This is safer than using `||` because `||` would also replace the value `0` (which is falsy but valid).

### GROUP BY in Drizzle

To group results, chain the `.groupBy()` method:

```typescript
import { eq } from "drizzle-orm"

const ordersByStatus = await db
  .select({
    status: orders.status,
    count: count(orders.id),
  })
  .from(orders)
  .groupBy(orders.status)
```

This returns an array like:

```typescript
[
  { status: "pending", count: 5 },
  { status: "processing", count: 12 },
  { status: "shipped", count: 28 },
  { status: "delivered", count: 97 },
]
```

## Computing Key Dashboard Metrics

Let's look at the specific metrics you would compute for an e-commerce dashboard.

### Revenue Metrics

```typescript
export async function getRevenueStats() {
  const [stats] = await db
    .select({
      totalRevenue: sum(orders.total),
      avgOrderValue: avg(orders.total),
      orderCount: count(orders.id),
    })
    .from(orders)

  return {
    totalRevenue: Number(stats.totalRevenue ?? 0),
    avgOrderValue: Number(stats.avgOrderValue ?? 0),
    orderCount: stats.orderCount,
  }
}
```

### Time-Based Queries

Business owners care about trends. "What were sales this week?" is more useful than "What were total sales ever?" Drizzle supports date comparisons using the `gte` (greater than or equal) and `lte` (less than or equal) operators:

```typescript
import { gte, and } from "drizzle-orm"

export async function getOrdersToday() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [stats] = await db
    .select({
      count: count(orders.id),
      revenue: sum(orders.total),
    })
    .from(orders)
    .where(gte(orders.createdAt, startOfDay))

  return {
    count: stats.count,
    revenue: Number(stats.revenue ?? 0),
  }
}
```

For "this week" or "this month" queries, adjust the start date:

```typescript
// Start of this week (Monday)
const startOfWeek = new Date()
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
startOfWeek.setHours(0, 0, 0, 0)

// Start of this month
const startOfMonth = new Date()
startOfMonth.setDate(1)
startOfMonth.setHours(0, 0, 0, 0)
```

### Popular Products

Finding which products sell the most requires joining the `orderItems` table and grouping by product:

```typescript
import { orderItems, products } from "@/database/schema"

export async function getPopularProducts(limit = 5) {
  const popular = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      totalSold: sum(orderItems.quantity),
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(orderItems.productId, products.name)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(limit)

  return popular
}
```

This query joins `orderItems` with `products` to get the product name, groups by product, sums the quantities, and orders by the most sold. The `.limit(5)` ensures you only get the top 5.

## Combining Metrics Into a Dashboard Function

In practice, you will bundle all your dashboard queries into a single server function:

```typescript
export async function getDashboardData() {
  const [revenue, todayOrders, popularProducts, ordersByStatus] =
    await Promise.all([
      getRevenueStats(),
      getOrdersToday(),
      getPopularProducts(),
      getOrdersByStatus(),
    ])

  return { revenue, todayOrders, popularProducts, ordersByStatus }
}
```

Using `Promise.all` runs all four queries in parallel instead of sequentially, which is significantly faster. Each query might take 20-50ms. Running them sequentially would take 80-200ms. Running them in parallel keeps the total time closer to 50ms.

## Your Task

Write a `getDashboardStats` function that computes three key metrics from the `orders` table:

1. **Total orders** — using `count()`
2. **Total revenue** — using `sum()`
3. **Average order value** — using `avg()`

The function should return an object with `totalOrders`, `totalRevenue`, and `avgOrderValue`. Make sure to convert `sum` and `avg` results to numbers using `Number()`, and handle null values with the `??` operator.
