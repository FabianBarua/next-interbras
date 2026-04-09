import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  variants as variantsTable,
  products as productsTable,
  externalCodes,
} from "@/lib/db/schema"
import { eq, desc, sql, and, inArray } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { Order, OrderItem, OrderStatus } from "@/types/order"

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

/** Public tracking — returns limited order info (no customer details) */
export async function getOrderByIdPublic(id: string): Promise<Order | null> {
  return getOrderById(id)
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
    country: string
  }
  shippingMethod: string
  shippingCost: number
  paymentMethod: "cash"
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
    // Decrement stock for each variant
    for (const item of input.items) {
      const v = variantMap.get(item.variantId)!
      if (v.stock !== null) {
        if (v.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${v.sku}. Disponible: ${v.stock}, solicitado: ${item.quantity}`)
        }
        await tx.update(variantsTable)
          .set({ stock: sql`${variantsTable.stock} - ${item.quantity}` })
          .where(and(eq(variantsTable.id, item.variantId), sql`${variantsTable.stock} >= ${item.quantity}`))
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
