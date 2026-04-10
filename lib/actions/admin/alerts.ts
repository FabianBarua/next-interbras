"use server"

import { eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { adminAlerts } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getAlerts(onlyUnread = false) {
  await requireAdmin()

  const where = onlyUnread ? eq(adminAlerts.read, false) : undefined

  return db.query.adminAlerts.findMany({
    where,
    orderBy: [desc(adminAlerts.createdAt)],
    limit: 100,
  })
}

export async function markAlertRead(alertId: string) {
  await requireAdmin()
  if (!UUID_RE.test(alertId)) return

  await db
    .update(adminAlerts)
    .set({ read: true })
    .where(eq(adminAlerts.id, alertId))

  revalidatePath("/dashboard/alerts")
}

export async function markAllAlertsRead() {
  await requireAdmin()

  await db
    .update(adminAlerts)
    .set({ read: true })
    .where(eq(adminAlerts.read, false))

  revalidatePath("/dashboard/alerts")
}

export async function getUnreadAlertCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(adminAlerts)
    .where(eq(adminAlerts.read, false))

  return result[0]?.count ?? 0
}
