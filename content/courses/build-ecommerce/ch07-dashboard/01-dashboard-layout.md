---
id: "01-dashboard-layout"
title: "Dashboard Layout"
type: "info"
xp: 20
difficulty: 2
order: 1
prerequisites: []
hints: []
---

# Dashboard Layout

You have built a storefront where customers can browse products, add them to a cart, and pay. But what happens after the order is placed? Someone needs to see that order come in, track fulfillment, and understand how the business is performing. That is the job of a **dashboard**.

In this lesson, you will learn what makes a great dashboard, how to structure its layout, and how to think about role-based access so that admins and customers each see the right information.

## What Makes a Good Dashboard?

A dashboard is not just a page with numbers on it. A good dashboard answers questions at a glance. When a store owner opens the admin panel at 9 AM, they want to immediately know: How many orders came in overnight? What is today's revenue? Are there any orders stuck in processing?

There are a few principles that separate a useful dashboard from a confusing wall of data.

### Data Hierarchy

Not all metrics are created equal. The most important numbers should be the most prominent. This means large type, high contrast, and placement at the top of the page.

Think of it like a newspaper. The headline is the biggest text. The subheadline gives context. The body text provides detail. Your dashboard should follow the same principle:

- **Level 1 — Key metrics**: Total revenue, orders today, active customers. These are large stat cards at the top.
- **Level 2 — Trends**: A chart showing revenue over the past 7 days, or a bar graph of orders by status. These go in the middle.
- **Level 3 — Details**: A table of recent orders, a list of low-stock products. These go at the bottom where users can scroll to find specifics.

### Scanability

Users should not need to read paragraphs of text to find what they need. Dashboards rely on:

- **Numbers with labels**: "142 orders" is instantly understandable. A paragraph explaining that there have been 142 orders is not.
- **Color coding**: Green for positive trends, red for alerts. Use color sparingly but consistently.
- **Whitespace**: Cramming too many elements together makes everything harder to read. Give each section breathing room.
- **Consistent alignment**: Stat cards should be the same height. Table columns should align. Consistency reduces cognitive load.

### Actionable Information

Every piece of data on a dashboard should either inform a decision or link to an action. If a stat card shows "5 pending orders," clicking it should take the user to the pending orders list. Data without a path to action is just noise.

## Layout Patterns

Most dashboards follow a well-established layout pattern. There is no need to reinvent the wheel here — users expect certain conventions, and following them makes your dashboard immediately intuitive.

### The Sidebar Layout

The most common dashboard layout uses a **sidebar** for navigation and a **main content area** for data.

```
+----------+-------------------------------+
|          |  Header / Breadcrumbs         |
|  Logo    +-------------------------------+
|          |                               |
|  Nav     |  Stat Cards (row)             |
|  Links   |                               |
|          +-------------------------------+
|  - Home  |                               |
|  - Orders|  Charts / Graphs              |
|  - Prods |                               |
|  - Users +-------------------------------+
|          |                               |
|          |  Data Table                    |
|          |                               |
+----------+-------------------------------+
```

The sidebar is typically:
- **Fixed width** (around 240-280 pixels)
- **Full height** of the viewport
- **Collapsible** on smaller screens (often to just icons, or hidden behind a hamburger menu)

### The Header Stats Row

At the top of the main content area, you typically see a row of **stat cards** — small boxes each showing one key metric.

```typescript
// A typical stat card component
function StatCard({ label, value, change }: {
  label: string
  value: string
  change?: { amount: string; positive: boolean }
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p className={change.positive ? "text-green-600" : "text-red-600"}>
          {change.positive ? "+" : ""}{change.amount} from last period
        </p>
      )}
    </div>
  )
}
```

A typical admin dashboard might show four stat cards:
- **Total Revenue** ($12,450 this month)
- **Orders Today** (23)
- **Active Customers** (1,847)
- **Conversion Rate** (3.2%)

### Data Tables

Below the stats, you usually find a **data table** showing recent activity. For an e-commerce admin, this is typically a list of recent orders with columns like:

| Order ID | Customer | Total | Status | Date |
|----------|----------|-------|--------|------|
| #1042 | Sarah M. | $89.00 | Shipped | Mar 23 |
| #1041 | James K. | $145.50 | Processing | Mar 23 |
| #1040 | Lin W. | $32.00 | Delivered | Mar 22 |

The table should support:
- **Sorting** by any column (click the column header)
- **Pagination** (show 20 rows at a time with next/previous controls)
- **Filtering** (dropdown to show only "pending" orders, for example)

## Role-Based Views

Not every user should see the same dashboard. An **admin** needs full visibility into business operations. A **customer** only needs to see their own orders and account info.

### Admin Dashboard

The admin sees the full picture:
- Revenue and order metrics across all customers
- All orders from all customers, with the ability to update status
- Product inventory management
- Customer list and their order history
- Low stock alerts and trending products

### Customer Dashboard

A customer sees a personalized view:
- Their own order history
- The status of their current orders
- Their saved addresses and payment methods
- A quick "reorder" button for past purchases

### Implementing Role-Based Access

The simplest approach is to check the user's role when rendering the page:

```typescript
// In your dashboard route loader
export async function loader() {
  const session = await getSession()
  if (!session) throw redirect("/login")

  const user = await getUser(session.userId)

  if (user.role === "admin") {
    return {
      view: "admin",
      stats: await getAdminStats(),
      recentOrders: await getAllRecentOrders(),
    }
  }

  return {
    view: "customer",
    orders: await getUserOrders(user.id),
    profile: user,
  }
}
```

This pattern keeps the logic clean: one route, one loader, but different data depending on who is asking. The component then renders the appropriate view based on the `view` field.

## Responsive Dashboard Considerations

Dashboards are traditionally designed for desktop screens, but plenty of store owners check their stats on their phone. Here is how to make a dashboard work across screen sizes.

### Sidebar Behavior

- **Desktop (1024px+)**: Full sidebar visible at all times
- **Tablet (768-1023px)**: Sidebar collapsed to icons only, expands on hover or click
- **Mobile (<768px)**: Sidebar hidden, accessible via a hamburger menu

### Stat Cards

- **Desktop**: 4 cards in a row using a CSS grid (`grid-cols-4`)
- **Tablet**: 2 cards per row (`grid-cols-2`)
- **Mobile**: 1 card per row, stacked vertically

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard label="Revenue" value="$12,450" />
  <StatCard label="Orders" value="23" />
  <StatCard label="Customers" value="1,847" />
  <StatCard label="Conversion" value="3.2%" />
</div>
```

### Data Tables on Mobile

Tables are notoriously difficult on small screens. You have a few options:

1. **Horizontal scroll**: Wrap the table in a container with `overflow-x-auto`. The user scrolls sideways to see all columns. Simple but not ideal.
2. **Card layout**: On mobile, transform each row into a card that stacks the columns vertically. This is more work but much more readable.
3. **Priority columns**: Hide less important columns on mobile (like the date) and only show the essentials (order ID, status, total).

The card layout approach tends to work best for order lists:

```tsx
{/* Desktop: table row */}
<tr className="hidden md:table-row">
  <td>{order.id}</td>
  <td>{order.customer}</td>
  <td>{order.total}</td>
  <td>{order.status}</td>
</tr>

{/* Mobile: card */}
<div className="md:hidden rounded-lg border p-4">
  <div className="flex justify-between">
    <span className="font-medium">#{order.id}</span>
    <StatusBadge status={order.status} />
  </div>
  <p className="text-muted-foreground">{order.customer}</p>
  <p className="font-bold">{order.total}</p>
</div>
```

## Putting It All Together

When you build a dashboard, start with the questions it needs to answer. For our flower shop admin:

1. **How is the business doing today?** — Stat cards with today's numbers
2. **What needs attention?** — Pending orders, low stock alerts
3. **What are the trends?** — Revenue chart over time
4. **What are the details?** — Searchable, filterable order table

For a customer:

1. **Where are my orders?** — Active orders with status tracking
2. **What have I ordered before?** — Order history
3. **What are my account details?** — Profile, addresses, payment methods

In the next lesson, you will write the server-side code to compute the actual metrics that power these dashboard views.
