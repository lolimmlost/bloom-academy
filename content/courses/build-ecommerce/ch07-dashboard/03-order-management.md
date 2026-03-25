---
id: "03-order-management"
title: "Order Management"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-data-aggregation"]
hints:
  - "Calculate offset from the page number: const offset = (page - 1) * limit"
  - "Use .orderBy(desc(orders.createdAt)) to show newest orders first."
  - "Chain .limit(limit).offset(offset) for pagination."
  - "Use a conditional to only apply .where() when a status filter is provided."
---

# Order Management

Aggregated stats tell the big picture, but the day-to-day work of running a store happens in the **order management** interface. In this lesson, you will learn how to build the backend for listing, filtering, and updating orders — the bread and butter of any admin dashboard.

## Listing Orders with Pagination

Your flower shop might have hundreds or thousands of orders. Loading all of them at once would be slow and wasteful. Instead, you load them in **pages** — typically 20 or 50 at a time.

### How Pagination Works

Pagination uses two SQL concepts: `LIMIT` and `OFFSET`.

- **LIMIT** controls how many rows to return. `LIMIT 20` means "give me at most 20 rows."
- **OFFSET** controls how many rows to skip. `OFFSET 40` means "skip the first 40 rows."

Together, they let you slice through your data:

| Page | LIMIT | OFFSET | Rows returned |
|------|-------|--------|---------------|
| 1 | 20 | 0 | Rows 1-20 |
| 2 | 20 | 20 | Rows 21-40 |
| 3 | 20 | 40 | Rows 41-60 |

The formula is straightforward:

```typescript
const limit = 20
const offset = (page - 1) * limit
```

Page 1 has offset 0 (skip nothing). Page 2 has offset 20 (skip the first 20). Page 3 has offset 40. And so on.

### Basic Paginated Query

```typescript
import { db } from "@/database/db"
import { orders } from "@/database/schema"
import { desc } from "drizzle-orm"

export async function getOrders(page: number) {
  const limit = 20
  const offset = (page - 1) * limit

  return db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
}
```

Notice the `.orderBy(desc(orders.createdAt))`. You almost always want to show the **most recent orders first**. The `desc()` function sorts in descending order — newest at the top.

### Providing Total Count

For the pagination UI to show "Page 2 of 7," you also need to know the total number of orders. This requires a separate count query:

```typescript
import { count } from "drizzle-orm"

export async function getOrdersWithCount(page: number) {
  const limit = 20
  const offset = (page - 1) * limit

  const [data, [{ total }]] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ total: count(orders.id) }).from(orders),
  ])

  return {
    orders: data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  }
}
```

Running both queries in parallel with `Promise.all` keeps the response fast.

## Order Status Workflow

Every order in an e-commerce system moves through a series of states. This is called a **status workflow** or **state machine**. For our flower shop, the workflow looks like this:

```
pending → processing → shipped → delivered
                ↘
              cancelled
```

### Status Definitions

- **Pending**: The order has been placed and payment received, but no one has started working on it yet. This is the initial state for every new order.
- **Processing**: Someone on the team has started preparing the order — in our case, arranging the flowers.
- **Shipped**: The order has been handed off to a delivery service or is out for delivery.
- **Delivered**: The customer has received their order. This is the final happy state.
- **Cancelled**: The order was cancelled, either by the customer or the admin. This can happen from `pending` or `processing` but not after shipping.

### Defining Valid Transitions

Not every status change makes sense. You should not be able to go from "delivered" back to "pending." Defining valid transitions prevents bugs and data inconsistency:

```typescript
const validTransitions: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
}

export function canTransition(current: string, next: string): boolean {
  return validTransitions[current]?.includes(next) ?? false
}
```

This is a simple but effective pattern. Before updating an order's status, check if the transition is valid:

```typescript
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))

  if (!order) throw new Error("Order not found")
  if (!canTransition(order.status, newStatus)) {
    throw new Error(`Cannot change status from ${order.status} to ${newStatus}`)
  }

  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
}
```

## Updating Order Status

The status update itself is a simple `UPDATE` query in Drizzle:

```typescript
import { eq } from "drizzle-orm"

await db
  .update(orders)
  .set({ status: "shipped", updatedAt: new Date() })
  .where(eq(orders.id, orderId))
```

In a production app, you would also want to:

1. **Log the change**: Record who changed the status and when, in a separate `order_events` or `order_history` table.
2. **Notify the customer**: Send an email when the order ships or is delivered.
3. **Handle side effects**: When an order is cancelled, you might need to issue a refund through Stripe and restore product inventory.

### Server Function for Status Updates

In TanStack Start, you would expose this as a server function:

```typescript
import { createServerFn } from "@tanstack/start"

export const updateStatus = createServerFn("POST", async (input: {
  orderId: string
  status: string
}) => {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  await updateOrderStatus(input.orderId, input.status)
  return { success: true }
})
```

Notice the authorization check. Only admins should be able to change order statuses. Always verify permissions on the server, even if the UI hides the button from non-admin users.

## Filtering Orders

An admin with 500 orders needs to find specific ones quickly. Filtering lets them narrow down the list by status, date range, or customer.

### Status Filter

The most common filter is by status. "Show me all pending orders" is a question admins ask constantly.

```typescript
import { eq, desc } from "drizzle-orm"

export async function getOrders(page: number, status?: string) {
  const limit = 20
  const offset = (page - 1) * limit

  let query = db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  if (status) {
    query = query.where(eq(orders.status, status)) as typeof query
  }

  return query
}
```

The `status` parameter is optional. When it is `undefined`, the query returns all orders. When provided, it adds a `WHERE` clause to filter by that status.

The `as typeof query` cast is needed because Drizzle's TypeScript types for dynamic query building can get complex. This tells TypeScript that the query shape has not changed after adding the `WHERE` clause.

### Date Range Filter

To filter orders by date, use the `gte` (greater than or equal) and `lte` (less than or equal) operators:

```typescript
import { gte, lte, and } from "drizzle-orm"

export async function getOrdersByDateRange(
  startDate: Date,
  endDate: Date,
  page: number,
) {
  const limit = 20
  const offset = (page - 1) * limit

  return db
    .select()
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
    ))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
}
```

The `and()` function combines multiple conditions. Both must be true for a row to be included.

### Combining Multiple Filters

In a real application, the admin might want to filter by status *and* date *and* customer all at once. Here is a pattern for building dynamic queries with multiple optional filters:

```typescript
import { eq, gte, lte, and, like, SQL } from "drizzle-orm"

interface OrderFilters {
  status?: string
  startDate?: Date
  endDate?: Date
  customerEmail?: string
}

export async function getFilteredOrders(filters: OrderFilters, page: number) {
  const limit = 20
  const offset = (page - 1) * limit

  const conditions: SQL[] = []

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status))
  }
  if (filters.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate))
  }
  if (filters.endDate) {
    conditions.push(lte(orders.createdAt, filters.endDate))
  }
  if (filters.customerEmail) {
    conditions.push(like(orders.customerEmail, `%${filters.customerEmail}%`))
  }

  return db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
}
```

This pattern collects all active filter conditions into an array, then spreads them into `and()`. If no filters are active, the `where` clause is `undefined`, which means no filtering at all.

The `like()` function with `%` wildcards performs a substring search — `%sarah%` matches any email containing "sarah."

## Pagination UI Patterns

On the frontend, pagination typically looks like this:

```tsx
function OrdersPagination({ currentPage, totalPages }: {
  currentPage: number
  totalPages: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  )
}
```

For URL-based pagination (which is better for bookmarking and sharing), use search params:

```
/admin/orders?page=2&status=pending
```

Your route loader reads these params and passes them to the query function.

## Your Task

Write a `getOrders` function that fetches paginated orders with an optional status filter. The function should:

1. Accept a `page` number and an optional `status` string
2. Use a page size of 20
3. Calculate the correct offset from the page number
4. Order results by `createdAt` in descending order (newest first)
5. Apply a status filter only when the `status` parameter is provided
