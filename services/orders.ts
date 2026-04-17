import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  payments,
  variants as variantsTable,
  products as productsTable,
  externalCodes,
  shippingMethods,
} from "@/lib/db/schema"
import { eq, desc, sql, and, inArray, count } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import { resolveFlow } from "@/lib/order-flow-resolver"
import type { Order, OrderItem, AdminOrder, DetailOrder, OrderPaymentSummary } from "@/types/order"

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapOrder(row: typeof orders.$inferSelect, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.userId ?? "",
    status: row.status as string,
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
    const [itemRows, paymentRows] = await Promise.all([
      db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
      db.select({
        orderId: payments.orderId,
        status: payments.status,
        gateway: payments.gateway,
        paidAt: payments.paidAt,
        metadata: payments.metadata,
        createdAt: payments.createdAt,
      }).from(payments).where(inArray(payments.orderId, orderIds)).orderBy(desc(payments.createdAt)),
    ])

    const itemsMap = new Map<string, OrderItem[]>()
    for (const item of itemRows) {
      const list = itemsMap.get(item.orderId) ?? []
      list.push(mapOrderItem(item))
      itemsMap.set(item.orderId, list)
    }

    // Keep only the latest payment per order
    const paymentMap = new Map<string, OrderPaymentSummary>()
    for (const p of paymentRows) {
      if (!paymentMap.has(p.orderId)) {
        const meta = p.metadata as Record<string, unknown> | null
        paymentMap.set(p.orderId, {
          status: p.status as OrderPaymentSummary["status"],
          gateway: p.gateway,
          paidAt: p.paidAt ? p.paidAt.toISOString() : null,
          hasReceipt: !!(meta?.receiptUrl),
        })
      }
    }

    return orderRows.map(o => ({
      ...mapOrder(o, itemsMap.get(o.id) ?? []),
      paymentInfo: paymentMap.get(o.id) ?? null,
    }))
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

/** Detail view for authenticated user — includes shipping, payment, subtotal */
export async function getOrderDetailById(id: string): Promise<DetailOrder | null> {
  return cachedQuery(`order-detail:${id}`, async () => {
    const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (orderRows.length === 0) return null
    const row = orderRows[0]

    const [itemRows, payment] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.query.payments.findFirst({
        where: eq(payments.orderId, id),
        orderBy: [desc(payments.createdAt)],
        columns: { status: true, gateway: true, paidAt: true, metadata: true },
      }),
    ])

    let paymentInfo: OrderPaymentSummary | null = null
    if (payment) {
      const meta = payment.metadata as Record<string, unknown> | null
      paymentInfo = {
        status: payment.status as OrderPaymentSummary["status"],
        gateway: payment.gateway,
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        hasReceipt: !!(meta?.receiptUrl),
      }
    }

    return {
      ...mapOrder(row, itemRows.map(mapOrderItem)),
      paymentMethod: row.paymentMethod,
      shippingMethod: row.shippingMethod,
      shippingCost: Number(row.shippingCost),
      subtotal: Number(row.subtotal),
      shippingAddress: row.shippingAddress as DetailOrder["shippingAddress"],
      trackingCode: row.trackingCode,
      paymentInfo,
    }
  }, 60)
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
  status?: string
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
  status: string,
  trackingCode?: string,
): Promise<void> {
  const values: Record<string, unknown> = { status }
  if (trackingCode !== undefined) values.trackingCode = trackingCode
  await db.update(orders).set(values).where(eq(orders.id, id))
  await invalidateCache(`order:${id}`, `order-detail:${id}`, "orders:user:*")
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
  shippingMethodId?: string
  gatewayType?: string
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
      stock: row.ec?.stock ?? null,
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

  // Verify shipping cost from DB if a shipping method ID is provided
  let verifiedShippingCost = input.shippingCost
  if (input.shippingMethodId) {
    const method = await db.query.shippingMethods.findFirst({
      where: eq(shippingMethods.id, input.shippingMethodId),
      columns: { price: true },
    })
    if (method) {
      verifiedShippingCost = Number(method.price)
    }
  }
  const verifiedTotal = subtotal + verifiedShippingCost

  // Insert in transaction
  // Resolve order flow before transaction
  const flow = await resolveFlow(input.shippingMethodId ?? null, input.gatewayType ?? null)

  const orderId = await db.transaction(async (tx) => {
    // Decrement stock for each variant's external code (with atomic check)
    for (const item of input.items) {
      const v = variantMap.get(item.variantId)!
      if (v.stock !== null) {
        const result = await tx.update(externalCodes)
          .set({ stock: sql`${externalCodes.stock} - ${item.quantity}` })
          .where(and(eq(externalCodes.variantId, item.variantId), sql`${externalCodes.stock} >= ${item.quantity}`))
          .returning({ id: externalCodes.id })

        // If no row was returned, stock was insufficient
        if (result.length === 0) {
          throw new Error(`Stock insuficiente para ${v.sku}. Disponible: ${v.stock}, solicitado: ${item.quantity}`)
        }
      }
    }

    const [order] = await tx.insert(orders).values({
      userId: input.userId,
      status: "pending",
      flowId: flow?.id ?? null,
      paymentMethod: input.paymentMethod,
      shippingMethod: input.shippingMethod,
      shippingCost: String(verifiedShippingCost),
      subtotal: String(subtotal),
      total: String(verifiedTotal),
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
