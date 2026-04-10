"use server"

import { eq, desc, sql, and, ilike, or, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { users, orders, payments, accounts } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"
import { getTimezone } from "@/lib/timezone"
import { fromZonedTime } from "date-fns-tz"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 50

// ───────── Search / List Customers ─────────

interface SearchCustomersParams {
  page?: number
  search?: string
  role?: string
  sort?: string
  provider?: string
  createdFrom?: string
  createdTo?: string
  minOrders?: number
  maxOrders?: number
  minSpent?: number
  maxSpent?: number
}

export async function searchCustomers({
  page = 1,
  search,
  role,
  sort,
  provider,
  createdFrom,
  createdTo,
  minOrders,
  maxOrders,
  minSpent,
  maxSpent,
}: SearchCustomersParams) {
  await requireAdmin()

  const offset = (Math.max(1, page) - 1) * PAGE_SIZE
  const conditions = []

  if (role === "admin" || role === "user" || role === "support") {
    conditions.push(eq(users.role, role as "admin" | "user" | "support"))
  }

  if (provider === "google") {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM "accounts" WHERE "accounts"."userId" = "users"."id" AND "accounts"."provider" = 'google')`,
    )
  } else if (provider === "credentials") {
    conditions.push(
      sql`NOT EXISTS (SELECT 1 FROM "accounts" WHERE "accounts"."userId" = "users"."id")`,
    )
  }

  const tz = await getTimezone()
  const parsedFrom = createdFrom && /^\d{4}-\d{2}-\d{2}$/.test(createdFrom) ? fromZonedTime(createdFrom + "T00:00:00", tz) : null
  const parsedTo   = createdTo   && /^\d{4}-\d{2}-\d{2}$/.test(createdTo)   ? fromZonedTime(createdTo   + "T23:59:59", tz) : null
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000
  const validRange =
    parsedFrom && parsedTo
      ? parsedFrom <= parsedTo && parsedTo.getTime() - parsedFrom.getTime() <= TWO_YEARS_MS
      : true
  if (validRange) {
    if (parsedFrom) conditions.push(gte(users.createdAt, parsedFrom))
    if (parsedTo)   conditions.push(lte(users.createdAt, parsedTo))
  }

  if (search && search.trim().length > 0) {
    const term = search.trim().slice(0, 100).replace(/%/g, "\\%").replace(/_/g, "\\_")
    conditions.push(
      or(
        ilike(users.name, `%${term}%`),
        ilike(users.email, `%${term}%`),
        ilike(users.cpf, `%${term}%`),
        ilike(users.phone, `%${term}%`),
      )!,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const orderCountSq = sql<number>`(SELECT count(*)::int FROM "orders" WHERE "orders"."user_id" = "users"."id")`
  const totalSpentSq = sql<number>`COALESCE((SELECT sum("orders"."total"::numeric)::int FROM "orders" WHERE "orders"."user_id" = "users"."id" AND "orders"."status" IN ('CONFIRMED', 'DELIVERED')), 0)`
  const providerSq = sql<string | null>`(SELECT "accounts"."provider" FROM "accounts" WHERE "accounts"."userId" = "users"."id" LIMIT 1)`

  const orderBy =
    sort === "name"
      ? users.name
      : sort === "orders"
        ? sql`${orderCountSq} DESC`
        : desc(users.createdAt)

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        phone: users.phone,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
        orderCount: orderCountSq,
        totalSpent: totalSpentSq,
        authProvider: providerSq,
      })
      .from(users)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE * 3)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(where),
  ])

  const MAX_SPENT = 999_999_99
  const safeMinOrders = minOrders !== undefined ? Math.max(0, minOrders) : undefined
  const safeMaxOrders = maxOrders !== undefined ? Math.max(0, maxOrders) : undefined
  const safeMinSpent  = minSpent  !== undefined ? Math.max(0, Math.min(minSpent, MAX_SPENT)) : undefined
  const safeMaxSpent  = maxSpent  !== undefined ? Math.max(0, Math.min(maxSpent, MAX_SPENT)) : undefined

  const filtered = rows.filter((c) => {
    if (safeMinOrders !== undefined && c.orderCount < safeMinOrders) return false
    if (safeMaxOrders !== undefined && c.orderCount > safeMaxOrders) return false
    if (safeMinSpent  !== undefined && c.totalSpent  < safeMinSpent)  return false
    if (safeMaxSpent  !== undefined && c.totalSpent  > safeMaxSpent)  return false
    return true
  }).slice(0, PAGE_SIZE)

  return {
    customers: filtered,
    total: countResult[0]?.count ?? 0,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

// ───────── Stats ─────────

export async function getCustomerStats() {
  await requireAdmin()

  const t = await getTimezone()

  const [totalResult, todayResult, weekResult, adminResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(sql`created_at >= (current_date::timestamp AT TIME ZONE ${t})`),
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(sql`created_at >= ((current_date - interval '7 days') AT TIME ZONE ${t})`),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "admin")),
  ])

  return {
    total: totalResult[0]?.count ?? 0,
    today: todayResult[0]?.count ?? 0,
    thisWeek: weekResult[0]?.count ?? 0,
    admins: adminResult[0]?.count ?? 0,
  }
}

// ───────── Customer Detail ─────────

export async function getCustomerDetail(customerId: string) {
  await requireAdmin()
  if (!UUID_RE.test(customerId)) return null

  const user = await db.query.users.findFirst({
    where: eq(users.id, customerId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      role: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      passwordHash: true,
    },
  })
  if (!user) return null

  const [providerRow] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, customerId))
    .limit(1)
  const authProvider = providerRow?.provider ?? (user.passwordHash ? "credentials" : null)

  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      totalSpent: sql<number>`COALESCE(sum(CASE WHEN status IN ('CONFIRMED','DELIVERED') THEN total::numeric ELSE 0 END)::int, 0)`,
      paidCount: sql<number>`count(*) FILTER (WHERE status IN ('CONFIRMED','DELIVERED'))::int`,
      cancelledCount: sql<number>`count(*) FILTER (WHERE status = 'CANCELLED')::int`,
      pendingCount: sql<number>`count(*) FILTER (WHERE status IN ('PENDING','PROCESSING'))::int`,
      lastOrderAt: sql<Date | null>`max(created_at)`,
    })
    .from(orders)
    .where(eq(orders.userId, customerId))

  const recentOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(20)

  const recentPayments = await db
    .select({
      id: payments.id,
      gateway: payments.gateway,
      status: payments.status,
      amount: payments.amount,
      externalId: payments.externalId,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(eq(orders.userId, customerId))
    .orderBy(desc(payments.createdAt))
    .limit(10)

  return {
    user: { ...user, passwordHash: undefined },
    authProvider,
    stats: {
      totalOrders: orderStats?.total ?? 0,
      totalSpent: orderStats?.totalSpent ?? 0,
      paidCount: orderStats?.paidCount ?? 0,
      cancelledCount: orderStats?.cancelledCount ?? 0,
      pendingCount: orderStats?.pendingCount ?? 0,
      lastOrderAt: orderStats?.lastOrderAt ?? null,
    },
    recentOrders,
    recentPayments,
  }
}

// ───────── Update Role ─────────

export async function updateCustomerRole(customerId: string, role: "user" | "admin" | "support") {
  const admin = await requireAdmin()
  if (!UUID_RE.test(customerId)) return { error: "ID inválido" }
  if (customerId === admin.id) return { error: "No puedes cambiar tu propio rol" }
  if (role !== "user" && role !== "admin" && role !== "support") return { error: "Rol inválido" }

  const user = await db.query.users.findFirst({
    where: eq(users.id, customerId),
    columns: { id: true },
  })
  if (!user) return { error: "Cliente no encontrado" }

  await db.update(users).set({ role }).where(eq(users.id, customerId))
  revalidatePath(`/dashboard/customers/${customerId}`)
  revalidatePath("/dashboard/customers")
  return { success: true }
}

// ───────── Update Info ─────────

export async function updateCustomerInfo(
  customerId: string,
  data: { name: string; phone: string; cpf: string },
) {
  await requireAdmin()
  if (!UUID_RE.test(customerId)) return { error: "ID inválido" }

  const name = data.name.trim()
  if (name.length < 2 || name.length > 255) return { error: "Nombre inválido (2-255 caracteres)" }

  const phone = data.phone.replace(/\D/g, "")
  if (phone && (phone.length < 10 || phone.length > 11)) return { error: "Teléfono inválido" }

  const cpf = data.cpf.replace(/\D/g, "")
  if (cpf && cpf.length !== 11) return { error: "CPF debe tener 11 dígitos" }

  const user = await db.query.users.findFirst({
    where: eq(users.id, customerId),
    columns: { id: true },
  })
  if (!user) return { error: "Cliente no encontrado" }

  await db
    .update(users)
    .set({ name, phone: phone || null, cpf: cpf || null })
    .where(eq(users.id, customerId))

  revalidatePath(`/dashboard/customers/${customerId}`)
  revalidatePath("/dashboard/customers")
  return { success: true }
}

// ───────── Delete Customer ─────────

export async function deleteCustomer(customerId: string) {
  const admin = await requireAdmin()
  if (!UUID_RE.test(customerId)) return { error: "ID inválido" }
  if (customerId === admin.id) return { error: "No puedes eliminarte a ti mismo" }

  const user = await db.query.users.findFirst({
    where: eq(users.id, customerId),
    columns: { id: true },
  })
  if (!user) return { error: "Cliente no encontrado" }

  const [activeOrders] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.userId, customerId),
        sql`"orders"."status" IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED')`,
      ),
    )

  if ((activeOrders?.count ?? 0) > 0) {
    return { error: "El cliente tiene pedidos activos. No se puede eliminar." }
  }

  await db.delete(users).where(eq(users.id, customerId))
  revalidatePath("/dashboard/customers")
  return { success: true }
}
