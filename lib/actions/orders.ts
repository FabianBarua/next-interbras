"use server"

import {
  eq,
  desc,
  asc,
  and,
  sql,
  ilike,
  or,
  inArray,
  gte,
  lte,
} from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { fromZonedTime } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"
import {
  orders,
  orderItems,
  orderNotes,
  payments,
  adminAlerts,
  users,
  products,
  orderPaymentDetails,
} from "@/lib/db/schema"
import { requireAdmin, requireSupport } from "@/lib/auth/get-session"
import { sendEmail } from "@/lib/email/send"
import { getSiteUrl } from "@/lib/get-base-url"
import { isValidTransition, getFlowForOrder, getNextStatuses } from "@/lib/order-flow-resolver"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ───────── Search / list orders ─────────

interface SearchOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  minTotal?: string
  maxTotal?: string
  transactionId?: string
  domains?: string[]
  sortBy?: string
  sortOrder?: string
}

export async function searchOrders({
  page = 1,
  limit = 50,
  search,
  status,
  dateFrom,
  dateTo,
  minTotal,
  maxTotal,
  transactionId,
  domains,
  sortBy,
  sortOrder,
}: SearchOrdersParams) {
  await requireAdmin()

  const safeLimit = Math.min(Math.max(1, limit), 100)
  const offset = (Math.max(1, page) - 1) * safeLimit
  const conditions: ReturnType<typeof eq>[] = []

  if (status && typeof status === "string" && status.length <= 50) {
    conditions.push(eq(orders.status, status))
  }

  if (domains && domains.length > 0) {
    const safeDomains = domains
      .slice(0, 20)
      .map((d) => d.trim().slice(0, 255))
      .filter(Boolean)
    if (safeDomains.length === 1) {
      conditions.push(eq(orders.sourceDomain, safeDomains[0]))
    } else if (safeDomains.length > 1) {
      conditions.push(inArray(orders.sourceDomain, safeDomains))
    }
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/
  const tz = await getTimezone()
  const parsedFrom =
    dateFrom && DATE_RE.test(dateFrom)
      ? fromZonedTime(
          dateFrom.includes("T") ? dateFrom + ":00" : dateFrom + "T00:00:00",
          tz,
        )
      : null
  const parsedTo =
    dateTo && DATE_RE.test(dateTo)
      ? fromZonedTime(
          dateTo.includes("T") ? dateTo + ":59" : dateTo + "T23:59:59",
          tz,
        )
      : null

  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000
  const validRange =
    parsedFrom && parsedTo
      ? parsedFrom <= parsedTo &&
        parsedTo.getTime() - parsedFrom.getTime() <= TWO_YEARS_MS
      : true

  if (validRange) {
    if (parsedFrom) conditions.push(gte(orders.createdAt, parsedFrom))
    if (parsedTo) conditions.push(lte(orders.createdAt, parsedTo))
  }

  // Amounts are decimal(10,2) — compare as numeric
  const safeMin = minTotal ? parseFloat(minTotal) : undefined
  const safeMax = maxTotal ? parseFloat(maxTotal) : undefined
  if (safeMin !== undefined && !isNaN(safeMin) && safeMin >= 0) {
    conditions.push(gte(orders.total, String(safeMin)))
  }
  if (safeMax !== undefined && !isNaN(safeMax) && safeMax >= 0) {
    conditions.push(lte(orders.total, String(safeMax)))
  }

  const contains = (value: string) => `%${value}%`
  const hasSearch = search && search.trim().length > 0
  if (hasSearch) {
    const term = search
      .trim()
      .slice(0, 100)
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
    conditions.push(
      or(
        ilike(users.name, contains(term)),
        ilike(users.email, contains(term)),
        ilike(users.documentNumber, contains(term)),
        ilike(users.phone, contains(term)),
        ilike(orders.customerName, contains(term)),
        ilike(orders.customerEmail, contains(term)),
        ilike(orders.customerDocument, contains(term)),
        ilike(
          orderPaymentDetails.transactionEndToEndId,
          contains(term),
        ),
        ilike(orderPaymentDetails.payerName, contains(term)),
        ilike(orderPaymentDetails.payerDocument, contains(term)),
      )!,
    )
  }

  const safeTxId = transactionId
    ? transactionId
        .trim()
        .slice(0, 100)
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
    : null
  const needsDetailsJoin = !!safeTxId || !!hasSearch
  if (safeTxId) {
    conditions.push(
      ilike(
        orderPaymentDetails.transactionEndToEndId,
        contains(safeTxId),
      ),
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const baseQuery = () => {
    const q = db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        discount: orders.discount,
        paymentMethod: orders.paymentMethod,
        sourceDomain: orders.sourceDomain,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
    if (needsDetailsJoin) {
      return (q as ReturnType<typeof q.leftJoin>).leftJoin(
        orderPaymentDetails,
        eq(orderPaymentDetails.orderId, orders.id),
      )
    }
    return q
  }

  const countQuery = () => {
    const q = db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
    if (needsDetailsJoin) {
      return (q as ReturnType<typeof q.leftJoin>).leftJoin(
        orderPaymentDetails,
        eq(orderPaymentDetails.orderId, orders.id),
      )
    }
    return q
  }

  const SORT_COLUMNS: Record<string, unknown> = {
    createdAt: orders.createdAt,
    total: orders.total,
    status: orders.status,
    userName: users.name,
  }
  const safeSortCol = (SORT_COLUMNS[sortBy ?? ""] ?? orders.createdAt) as typeof orders.createdAt
  const orderClause =
    sortOrder === "asc" ? asc(safeSortCol) : desc(safeSortCol)

  const [rows, countResult] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(orderClause)
      .limit(safeLimit)
      .offset(offset),
    countQuery().where(where),
  ])

  return {
    orders: rows,
    total: countResult[0]?.count ?? 0,
    page: Math.max(1, page),
    totalPages: Math.max(
      1,
      Math.ceil((countResult[0]?.count ?? 0) / safeLimit),
    ),
  }
}

// ───────── Payment details (payer info from webhook) ─────────

export async function getOrderPaymentDetails(orderId: string) {
  await requireSupport()
  if (!UUID_RE.test(orderId)) return null
  return (
    (await db.query.orderPaymentDetails.findFirst({
      where: eq(orderPaymentDetails.orderId, orderId),
    })) ?? null
  )
}

// ───────── Status counts for dashboard ─────────

export async function getOrderStatusCounts(filterParams?: {
  search?: string
  dateFrom?: string
  dateTo?: string
  minTotal?: string
  maxTotal?: string
  transactionId?: string
  domains?: string[]
}) {
  await requireAdmin()

  const p = filterParams ?? {}
  const conditions: ReturnType<typeof eq>[] = []

  if (p.domains && p.domains.length > 0) {
    const safeDomains = p.domains
      .slice(0, 20)
      .map((d) => d.trim().slice(0, 255))
      .filter(Boolean)
    if (safeDomains.length === 1) {
      conditions.push(eq(orders.sourceDomain, safeDomains[0]))
    } else if (safeDomains.length > 1) {
      conditions.push(inArray(orders.sourceDomain, safeDomains))
    }
  }

  const DATE_RE_C = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/
  const tzC = await getTimezone()
  const pFrom =
    p.dateFrom && DATE_RE_C.test(p.dateFrom)
      ? fromZonedTime(
          p.dateFrom.includes("T")
            ? p.dateFrom + ":00"
            : p.dateFrom + "T00:00:00",
          tzC,
        )
      : null
  const pTo =
    p.dateTo && DATE_RE_C.test(p.dateTo)
      ? fromZonedTime(
          p.dateTo.includes("T")
            ? p.dateTo + ":59"
            : p.dateTo + "T23:59:59",
          tzC,
        )
      : null
  const TWO_YRS = 2 * 365 * 24 * 60 * 60 * 1000
  const rangeOk =
    pFrom && pTo
      ? pFrom <= pTo && pTo.getTime() - pFrom.getTime() <= TWO_YRS
      : true
  if (rangeOk) {
    if (pFrom) conditions.push(gte(orders.createdAt, pFrom))
    if (pTo) conditions.push(lte(orders.createdAt, pTo))
  }

  const safeMin = p.minTotal ? parseFloat(p.minTotal) : undefined
  const safeMax = p.maxTotal ? parseFloat(p.maxTotal) : undefined
  if (safeMin !== undefined && !isNaN(safeMin) && safeMin >= 0) {
    conditions.push(gte(orders.total, String(safeMin)))
  }
  if (safeMax !== undefined && !isNaN(safeMax) && safeMax >= 0) {
    conditions.push(lte(orders.total, String(safeMax)))
  }

  const hasSearch = !!(p.search && p.search.trim().length > 0)
  if (hasSearch) {
    const t = p
      .search!.trim()
      .slice(0, 100)
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
    conditions.push(
      or(
        ilike(users.name, `%${t}%`),
        ilike(users.email, `%${t}%`),
        ilike(users.documentNumber, `%${t}%`),
        ilike(users.phone, `%${t}%`),
        ilike(orders.customerName, `%${t}%`),
        ilike(orders.customerEmail, `%${t}%`),
        ilike(orders.customerDocument, `%${t}%`),
        ilike(orderPaymentDetails.transactionEndToEndId, `%${t}%`),
        ilike(orderPaymentDetails.payerName, `%${t}%`),
        ilike(orderPaymentDetails.payerDocument, `%${t}%`),
      )!,
    )
  }

  const sTx = p.transactionId
    ? p.transactionId
        .trim()
        .slice(0, 100)
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
    : null
  if (sTx) {
    conditions.push(
      ilike(orderPaymentDetails.transactionEndToEndId, `%${sTx}%`),
    )
  }

  const needsDetailsJoin = !!(sTx || hasSearch)
  const where = conditions.length > 0 ? and(...conditions) : undefined

  let rows: { status: string; count: number }[]
  if (needsDetailsJoin) {
    rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(
        orderPaymentDetails,
        eq(orderPaymentDetails.orderId, orders.id),
      )
      .where(where)
      .groupBy(orders.status)
  } else if (where) {
    rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(where)
      .groupBy(orders.status)
  } else {
    rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status)
  }

  const counts: Record<string, number> = { total: 0 }
  for (const r of rows) {
    counts[r.status] = r.count
    counts.total += r.count
  }
  return counts
}

// ───────── Distinct domains for filter ─────────

export async function getDistinctDomains() {
  await requireAdmin()
  const rows = await db
    .selectDistinct({ domain: orders.sourceDomain })
    .from(orders)
    .where(
      sql`${orders.sourceDomain} IS NOT NULL AND ${orders.sourceDomain} != ''`,
    )
    .orderBy(orders.sourceDomain)
  return rows.map((r) => r.domain!).filter(Boolean)
}

// ───────── Bulk update status ─────────

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: string,
) {
  await requireAdmin()

  if (!orderIds.length || orderIds.length > 500)
    return { error: "Seleccione entre 1 y 500 pedidos" }
  if (orderIds.some((id) => !UUID_RE.test(id)))
    return { error: "IDs inválidos" }
  if (!newStatus || typeof newStatus !== "string" || newStatus.length > 50)
    return { error: "Estado inválido" }

  await db
    .update(orders)
    .set({ status: newStatus })
    .where(inArray(orders.id, orderIds))

  for (const id of orderIds) {
    await runStatusSideEffects(id, newStatus)
  }

  revalidatePath("/dashboard/orders")
  return { success: true }
}

// ───────── Side effects when status changes ─────────

async function runStatusSideEffects(
  orderId: string,
  newStatus: string,
) {
  // Check if this step has notify_customer=true in the flow
  const flow = await getFlowForOrder(orderId)
  const step = flow?.steps.find((s) => s.statusSlug === newStatus)
  const shouldNotify = step?.notifyCustomer ?? false

  if (newStatus === "confirmed" && shouldNotify) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { userId: true },
    })
    if (order?.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
        columns: { name: true, email: true },
      })
      if (user) {
        await sendEmail(
          user.email,
          "payment-confirmed",
          {
            nome: user.name,
            pedidoId: orderId.slice(0, 8),
          },
        ).catch((err) =>
          console.error(
            "[updateOrderStatus] payment-confirmed email failed:",
            err,
          ),
        )
      }
    }
  }

  if (newStatus === "cancelled") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(
        and(eq(payments.orderId, orderId), eq(payments.status, "pending")),
      )

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { userId: true },
    })
    if (order?.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
        columns: { name: true, email: true },
      })
      if (user) {
        const siteUrl = getSiteUrl()
        await sendEmail(
          user.email,
          "order-cancelled",
          {
            nome: user.name,
            pedidoId: orderId.slice(0, 8),
            siteUrl,
          },
        ).catch((err) =>
          console.error(
            "[updateOrderStatus] order-cancelled email failed:",
            err,
          ),
        )
      }
    }
  }
}

// ───────── Update single order status ─────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }
  if (!newStatus || typeof newStatus !== "string" || newStatus.length > 50)
    return { error: "Estado inválido" }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true },
  })
  if (!order) return { error: "Pedido no encontrado" }

  await db
    .update(orders)
    .set({ status: newStatus })
    .where(eq(orders.id, orderId))

  await runStatusSideEffects(orderId, newStatus)

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath("/dashboard/orders")
  return { success: true }
}

// ───────── Get full order detail ─────────

export async function getOrderDetail(orderId: string) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return null

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })
  if (!order) return null

  const user = order.userId
    ? await db.query.users.findFirst({
        where: eq(users.id, order.userId),
        columns: { name: true, email: true, documentNumber: true, phone: true },
      })
    : null

  const items = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      sku: orderItems.sku,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      currency: orderItems.currency,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  })

  const notes = await db.query.orderNotes.findMany({
    where: eq(orderNotes.orderId, orderId),
    orderBy: [desc(orderNotes.createdAt)],
  })

  return { order, items, payment, notes, user }
}

// ───────── Add order note ─────────

export async function addOrderNote(orderId: string, content: string) {
  const admin = await requireAdmin()
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const trimmed = content.trim()
  if (!trimmed) return { error: "La nota no puede estar vacía" }
  if (trimmed.length > 2000)
    return { error: "Nota demasiado larga (máx 2000 caracteres)" }

  await db.insert(orderNotes).values({
    orderId,
    content: trimmed,
    createdBy: admin.id,
  })

  revalidatePath(`/dashboard/orders/${orderId}`)
}

// ───────── Register manual refund ─────────

export async function registerRefund(orderId: string, reason: string) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const safeReason = (reason || "").slice(0, 500)

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true },
  })

  if (!order) return { error: "Pedido no encontrado" }
  if (!["confirmed", "shipped", "delivered"].includes(order.status)) {
    return { error: "El pedido no se puede reembolsar en este estado" }
  }

  await db
    .update(orders)
    .set({ status: "refunded" })
    .where(eq(orders.id, orderId))

  await db
    .update(payments)
    .set({ status: "refunded" })
    .where(eq(payments.orderId, orderId))

  await db.insert(adminAlerts).values({
    type: "refund",
    message: `Reembolso manual registrado: ${safeReason || "Sin motivo informado"}`,
    orderId,
  })

  await db.insert(orderNotes).values({
    orderId,
    content: `Reembolso registrado manualmente. Motivo: ${safeReason || "No informado"}`,
  })

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

// ───────── Confirm payment manually (admin) ─────────

export async function confirmPaymentManually(orderId: string) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true, paymentMethod: true },
  })
  if (!order) return { error: "Pedido no encontrado" }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
    orderBy: [desc(payments.createdAt)],
    columns: { id: true, status: true },
  })

  if (!payment) return { error: "No existe registro de pago para este pedido" }
  if (payment.status === "succeeded") return { error: "El pago ya fue confirmado" }
  if (payment.status === "refunded") return { error: "El pago fue reembolsado" }

  await db
    .update(payments)
    .set({ status: "succeeded", paidAt: new Date() })
    .where(eq(payments.id, payment.id))

  // Transition order to confirmed
  if (order.status === "pending" || order.status === "processing") {
    await db
      .update(orders)
      .set({ status: "confirmed" })
      .where(eq(orders.id, orderId))

    await runStatusSideEffects(orderId, "confirmed")
  }

  await db.insert(orderNotes).values({
    orderId,
    content: "Pago confirmado manualmente por administrador.",
  })

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath("/dashboard/orders")
  return { success: true }
}

// ───────── Cancel order (admin) ─────────

export async function cancelOrderAdmin(orderId: string, reason: string) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const safeReason = (reason || "").slice(0, 500)

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true },
  })
  if (!order) return { error: "Pedido no encontrado" }
  if (["cancelled", "refunded"].includes(order.status)) {
    return { error: "El pedido ya está cancelado o reembolsado" }
  }

  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(eq(orders.id, orderId))

  await runStatusSideEffects(orderId, "cancelled")

  await db.insert(orderNotes).values({
    orderId,
    content: `Pedido cancelado por administrador. Motivo: ${safeReason || "No informado"}`,
  })

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath("/dashboard/orders")
  return { success: true }
}

// ───────── Get payment info for client order ─────────

export async function getOrderPaymentInfo(orderId: string) {
  if (!UUID_RE.test(orderId)) return null
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
    orderBy: [desc(payments.createdAt)],
    columns: { id: true, status: true, gateway: true, paidAt: true, metadata: true },
  })
  return payment ?? null
}

// ───────── Valid statuses for order (flow-aware) ─────────

export async function getValidStatusesForOrder(orderId: string) {
  await requireAdmin()
  if (!UUID_RE.test(orderId)) return []

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true },
  })
  if (!order) return []

  const { getAllStatusesForDisplay } = await import("@/lib/order-status-helpers")
  const [nextSlugs, allStatuses] = await Promise.all([
    getNextStatuses(orderId),
    getAllStatusesForDisplay("es"),
  ])

  const validSlugs = new Set([order.status, ...nextSlugs])
  return allStatuses
    .filter((s) => validSlugs.has(s.slug))
    .map((s) => ({ slug: s.slug, label: s.label, color: s.color }))
}
