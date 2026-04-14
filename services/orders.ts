import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  variants as variantsTable,
  products as productsTable,
  externalCodes,
} from "@/lib/db/schema"
import { eq, desc, sql, and, inArray, count } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { Order, OrderItem, OrderStatus, AdminOrder } from "@/types/order"

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapOrder(row: typeof orders.$inferSelect, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.userId ?? "",
    status: row.status as OrderStatus,
    totalAmount: Number(row.total),
    currency: row.currency,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapOrderItem(row: typeof orderItems.$inferSelect): OrderItem {
  return {
    id: row.id,
    productId: row.variantId ?? "",
    variantId: row.variantId ?? undefined,
    productName: row.productName as any,
    quantity: row.quantity,
    price: Number(row.unitPrice),
    currency: row.currency,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getOrders(userId: string): Promise<Order[]> {
  return cachedQuery(`orders:user:${userId}`, async () => {
    const orderRows = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))

    if (orderRows.length === 0) return []

    const orderIds = orderRows.map(o => o.id)
    const itemRows = await db.select().from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))

    const itemsMap = new Map<string, OrderItem[]>()
    for (const item of itemRows) {
      const list = itemsMap.get(item.orderId) ?? []
      list.push(mapOrderItem(item))
      itemsMap.set(item.orderId, list)
    }

    return orderRows.map(o => mapOrder(o, itemsMap.get(o.id) ?? []))
  }, 60)
}

export async function getOrderById(id: string): Promise<Order | null> {
  return cachedQuery(`order:${id}`, async () => {
    const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (orderRows.length === 0) return null

    const itemRows = await db.select().from(orderItems)
      .where(eq(orderItems.orderId, id))

    return mapOrder(orderRows[0], itemRows.map(mapOrderItem))
  }, 60)
}

/** Public tracking — returns only status/items, no customer identity */
export async function getOrderByIdPublic(id: string): Promise<Omit<Order, "userId"> | null> {
  const order = await getOrderById(id)
  if (!order) return null
  const { userId, ...safeOrder } = order
  return safeOrder
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------

function mapAdminOrder(row: typeof orders.$inferSelect, items: OrderItem[]): AdminOrder {
  return {
    ...mapOrder(row, items),
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerDocument: row.customerDocument,
    paymentMethod: row.paymentMethod,
    shippingMethod: row.shippingMethod,
    shippingCost: Number(row.shippingCost),
    subtotal: Number(row.subtotal),
    shippingAddress: row.shippingAddress as AdminOrder["shippingAddress"],
    trackingCode: row.trackingCode,
    notes: row.notes,
  }
}

export async function getAllOrders(opts?: {
  status?: OrderStatus
  page?: number
  perPage?: number
}): Promise<{ orders: AdminOrder[]; total: number }> {
  const page = opts?.page ?? 1
  const perPage = opts?.perPage ?? 50
  const offset = (page - 1) * perPage

  const conditions = opts?.status ? eq(orders.status, opts.status) : undefined

  const [totalResult] = await db.select({ count: count() }).from(orders).where(conditions)
  const total = totalResult.count

  const orderRows = await db.select().from(orders)
    .where(conditions)
    .orderBy(desc(orders.createdAt))
    .limit(perPage)
    .offset(offset)

  if (orderRows.length === 0) return { orders: [], total }

  const orderIds = orderRows.map(o => o.id)
  const itemRows = await db.select().from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))

  const itemsMap = new Map<string, OrderItem[]>()
  for (const item of itemRows) {
    const list = itemsMap.get(item.orderId) ?? []
    list.push(mapOrderItem(item))
    itemsMap.set(item.orderId, list)
  }

  return {
    orders: orderRows.map(o => mapAdminOrder(o, itemsMap.get(o.id) ?? [])),
    total,
  }
}

export async function getOrderByIdAdmin(id: string): Promise<AdminOrder | null> {
  const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (orderRows.length === 0) return null

  const itemRows = await db.select().from(orderItems)
    .where(eq(orderItems.orderId, id))

  return mapAdminOrder(orderRows[0], itemRows.map(mapOrderItem))
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  trackingCode?: string,
): Promise<void> {
  const values: Record<string, unknown> = { status }
  if (trackingCode !== undefined) values.trackingCode = trackingCode
  await db.update(orders).set(values).where(eq(orders.id, id))
  await invalidateCache(`order:${id}`, "orders:user:*")
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  userId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerDocument?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode?: string
    countryCode: string
  }
  shippingMethod: string
  shippingCost: number
  paymentMethod: "cash" | "card" | "transfer" | "pix"
  notes?: string
  items: {
    variantId: string
    quantity: number
  }[]
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  // Resolve variant prices
  const variantIds = input.items.map(i => i.variantId)
  const variantRows = await db.select({
    v: variantsTable,
    ec: externalCodes,
    pName: productsTable.name,
  })
    .from(variantsTable)
    .leftJoin(externalCodes, eq(variantsTable.id, externalCodes.variantId))
    .innerJoin(productsTable, eq(variantsTable.productId, productsTable.id))
    .where(inArray(variantsTable.id, variantIds))

  const variantMap = new Map<string, { sku: string; price: number; productName: any; stock: number | null }>()
  for (const row of variantRows) {
    variantMap.set(row.v.id, {
      sku: row.v.sku,
      price: row.ec?.priceUsd ? Number(row.ec.priceUsd) : 0,
      productName: row.pName,
      stock: row.v.stock,
    })
  }

  // Calculate totals
  let subtotal = 0
  const resolvedItems: { variantId: string; quantity: number; unitPrice: number; sku: string; productName: any }[] = []
  for (const item of input.items) {
    const v = variantMap.get(item.variantId)
    if (!v) throw new Error(`Variant ${item.variantId} not found`)
    const unitPrice = v.price
    subtotal += unitPrice * item.quantity
    resolvedItems.push({ variantId: item.variantId, quantity: item.quantity, unitPrice, sku: v.sku, productName: v.productName })
  }
  const total = subtotal + input.shippingCost

  // Insert in transaction
  const orderId = await db.transaction(async (tx) => {
    // Decrement stock for each variant (with atomic check)
    for (const item of input.items) {
      const v = variantMap.get(item.variantId)!
      if (v.stock !== null) {
        const result = await tx.update(variantsTable)
          .set({ stock: sql`${variantsTable.stock} - ${item.quantity}` })
          .where(and(eq(variantsTable.id, item.variantId), sql`${variantsTable.stock} >= ${item.quantity}`))

        // Verify the row was actually updated (stock was sufficient)
        const [check] = await tx.select({ stock: variantsTable.stock })
          .from(variantsTable)
          .where(eq(variantsTable.id, item.variantId))
        if (check && check.stock !== null && check.stock < 0) {
          throw new Error(`Stock insuficiente para ${v.sku}`)
        }
        // If no row was matched by the WHERE clause, stock was insufficient
        // postgres-js returns count of affected rows
        if ((result as any)?.rowCount === 0 || (result as any)?.count === 0) {
          throw new Error(`Stock insuficiente para ${v.sku}. Disponible: ${v.stock}, solicitado: ${item.quantity}`)
        }
      }
    }

    const [order] = await tx.insert(orders).values({
      userId: input.userId,
      status: "PENDING",
      paymentMethod: input.paymentMethod,
      shippingMethod: input.shippingMethod,
      shippingCost: String(input.shippingCost),
      subtotal: String(subtotal),
      total: String(total),
      currency: "USD",
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      customerDocument: input.customerDocument,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
    }).returning({ id: orders.id })

    await tx.insert(orderItems).values(
      resolvedItems.map(item => ({
        orderId: order.id,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        currency: "USD",
      }))
    )

    return order.id
  })

  await invalidateCache(`orders:user:${input.userId}`)
  return orderId
}
