"use server"

import { eq, desc, sql, and, gte, lte, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { eventLogs } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"
import { getTimezone } from "@/lib/timezone"

const PAGE_SIZE = 50

export type LogFilters = {
  search?: string
  category?: string
  level?: string
  from?: string
  to?: string
}

export async function getEventLogs(page = 1, filters: LogFilters = {}) {
  await requireAdmin()
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const conditions = []

  if (filters.category) {
    conditions.push(eq(eventLogs.category, filters.category))
  }

  if (filters.level === "info" || filters.level === "warn" || filters.level === "error") {
    conditions.push(eq(eventLogs.level, filters.level))
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[%_\\]/g, "\\$&")
    const term = `%${escaped}%`
    conditions.push(
      or(
        ilike(eventLogs.action, term),
        ilike(eventLogs.message, term),
        sql`${eventLogs.meta}::text ILIKE ${term}`,
      )!,
    )
  }

  if (filters.from) {
    const t = await getTimezone()
    conditions.push(sql`${eventLogs.createdAt} >= (${filters.from}::date::timestamp AT TIME ZONE ${t})`)
  }

  if (filters.to) {
    const t = await getTimezone()
    conditions.push(sql`${eventLogs.createdAt} < ((${filters.to}::date + interval '1 day') AT TIME ZONE ${t})`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const baseQuery = db.select().from(eventLogs)

  const logs = await (where ? baseQuery.where(where) : baseQuery)
    .orderBy(desc(eventLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventLogs)

  const countResult = await (where ? countQuery.where(where) : countQuery)
  const total = countResult[0]?.count ?? 0

  return { logs, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export async function getLogCounters() {
  await requireAdmin()

  const t = await getTimezone()
  const todayStart = sql`(current_date::timestamp AT TIME ZONE ${t})`

  const [totalTodayR, errorsTodayR, totalR, categoriesR] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventLogs)
      .where(sql`${eventLogs.createdAt} >= ${todayStart}`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventLogs)
      .where(and(eq(eventLogs.level, "error"), sql`${eventLogs.createdAt} >= ${todayStart}`)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventLogs),
    db
      .select({
        category: eventLogs.category,
        count: sql<number>`count(*)::int`,
      })
      .from(eventLogs)
      .groupBy(eventLogs.category)
      .orderBy(desc(sql`count(*)`)),
  ])

  return {
    totalToday: totalTodayR[0]?.count ?? 0,
    errorsToday: errorsTodayR[0]?.count ?? 0,
    total: totalR[0]?.count ?? 0,
    byCategory: categoriesR,
  }
}

export async function getLogCategories() {
  await requireAdmin()
  const rows = await db
    .select({ category: eventLogs.category })
    .from(eventLogs)
    .groupBy(eventLogs.category)
    .orderBy(eventLogs.category)
  return rows.map((r) => r.category)
}

export async function clearLogs(category?: string) {
  await requireAdmin()
  if (category) {
    await db.delete(eventLogs).where(eq(eventLogs.category, category))
  } else {
    await db.delete(eventLogs)
  }
  return { success: true }
}
