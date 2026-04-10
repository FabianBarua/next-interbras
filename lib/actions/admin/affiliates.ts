"use server"

import { eq, desc, and, sql, ilike, or, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  affiliates,
  affiliateCommissions,
  affiliatePayouts,
  orders,
  users,
} from "@/lib/db/schema"
import { requireAdmin, requireAuth } from "@/lib/auth/get-session"
import { affiliateApplicationSchema, affiliateUpdateSchema, affiliateRefCodeSchema } from "@/lib/validations/affiliates"
import { getSetting, setSetting } from "@/lib/settings"
import { getTimezone } from "@/lib/timezone"
import { randomBytes } from "crypto"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 50

function generateRefCode(): string {
  return randomBytes(6)
    .toString("base64url")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase()
}

// ─── Settings ────────────────────────────────

export async function getAffiliateSettings() {
  await requireAdmin()
  const [rate, cookieDays] = await Promise.all([
    getSetting("affiliates.defaultCommissionRate"),
    getSetting("affiliates.cookieDays"),
  ])
  return {
    defaultCommissionRate: rate ? parseInt(rate, 10) : 10,
    cookieDays: cookieDays ? parseInt(cookieDays, 10) : 30,
  }
}

export async function updateAffiliateSettings(data: {
  defaultCommissionRate: number
  cookieDays: number
}) {
  await requireAdmin()
  if (data.defaultCommissionRate < 0 || data.defaultCommissionRate > 100) {
    return { error: "Tasa de comisión debe estar entre 0 y 100%" }
  }
  if (data.cookieDays < 1 || data.cookieDays > 365) {
    return { error: "Duración del cookie debe estar entre 1 y 365 días" }
  }
  await setSetting("affiliates.defaultCommissionRate", String(data.defaultCommissionRate))
  await setSetting("affiliates.cookieDays", String(data.cookieDays))
  revalidatePath("/dashboard/affiliates/settings")
  return { success: true }
}

// ─── User: Apply to become affiliate ─────────

export async function applyAsAffiliate(formData: FormData) {
  const user = await requireAuth()

  const raw = {
    pixKey: (formData.get("pixKey") as string)?.trim() ?? "",
    pixType: (formData.get("pixType") as string)?.trim() ?? "",
  }

  const result = affiliateApplicationSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const existing = await db.query.affiliates.findFirst({
    where: eq(affiliates.userId, user.id),
    columns: { id: true, status: true },
  })

  if (existing) {
    if (existing.status === "approved") return { error: "Ya eres un afiliado aprobado" }
    if (existing.status === "pending") return { error: "Tu solicitud ya está en análisis" }
    await db.update(affiliates).set({
      status: "pending",
      pixKey: result.data.pixKey,
      pixType: result.data.pixType,
    }).where(eq(affiliates.id, existing.id))

    revalidatePath("/account/affiliate")
    return { success: true }
  }

  const defaultRate = await getSetting("affiliates.defaultCommissionRate")
  const commissionRate = defaultRate ? parseInt(defaultRate, 10) : 10

  let refCode = generateRefCode()
  let attempts = 0
  while (attempts < 10) {
    const dup = await db.query.affiliates.findFirst({
      where: eq(affiliates.refCode, refCode),
      columns: { id: true },
    })
    if (!dup) break
    refCode = generateRefCode()
    attempts++
  }

  await db.insert(affiliates).values({
    userId: user.id,
    refCode,
    status: "pending",
    commissionRate,
    pixKey: result.data.pixKey,
    pixType: result.data.pixType,
  })

  revalidatePath("/account/affiliate")
  return { success: true }
}

// ─── User: Get own affiliate data ────────────

export async function getMyAffiliateData() {
  const user = await requireAuth()

  const affiliate = await db
    .select({
      id: affiliates.id,
      refCode: affiliates.refCode,
      status: affiliates.status,
      commissionRate: affiliates.commissionRate,
      pixKey: affiliates.pixKey,
      pixType: affiliates.pixType,
      totalEarned: sql<number>`COALESCE((SELECT sum(commission) FROM affiliates_commissions WHERE affiliate_id = ${affiliates.id} AND status IN ('approved','paid')), 0)::int`,
      totalPaid: sql<number>`COALESCE((SELECT sum(commission) FROM affiliates_commissions WHERE affiliate_id = ${affiliates.id} AND status = 'paid'), 0)::int`,
      createdAt: affiliates.createdAt,
    })
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1)

  return affiliate[0] ?? null
}

// ─── User: Update own ref code ───────────────

export async function updateMyRefCode(formData: FormData) {
  const user = await requireAuth()

  const raw = { refCode: (formData.get("refCode") as string)?.trim() ?? "" }
  const result = affiliateRefCodeSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  const myAffiliate = await db.query.affiliates.findFirst({
    where: and(eq(affiliates.userId, user.id), eq(affiliates.status, "approved")),
    columns: { id: true, refCode: true },
  })
  if (!myAffiliate) return { error: "No eres un afiliado aprobado" }

  if (result.data.refCode === myAffiliate.refCode) return { success: true }

  const dup = await db.query.affiliates.findFirst({
    where: eq(affiliates.refCode, result.data.refCode),
    columns: { id: true },
  })
  if (dup) return { error: "Este código ya está en uso. Elija otro." }

  await db
    .update(affiliates)
    .set({ refCode: result.data.refCode })
    .where(eq(affiliates.id, myAffiliate.id))

  revalidatePath("/account/affiliate")
  return { success: true }
}

// ─── User: Get own commissions ───────────────

export async function getMyCommissions(page = 1) {
  const user = await requireAuth()
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.userId, user.id),
    columns: { id: true },
  })
  if (!affiliate) return { commissions: [], total: 0, page: 1, totalPages: 1 }

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: affiliateCommissions.id,
        orderId: affiliateCommissions.orderId,
        orderTotal: affiliateCommissions.orderTotal,
        commissionRate: affiliateCommissions.commissionRate,
        commission: affiliateCommissions.commission,
        status: affiliateCommissions.status,
        createdAt: affiliateCommissions.createdAt,
      })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliate.id))
      .orderBy(desc(affiliateCommissions.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliate.id)),
  ])

  return {
    commissions: rows,
    total: countResult[0]?.count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

// ─── User: Get referral stats ────────────────

export async function getMyAffiliateStats() {
  const user = await requireAuth()

  const affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.userId, user.id),
    columns: { id: true },
  })
  if (!affiliate) return null

  const [commissionStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'pending')::int`,
      approved: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'approved')::int`,
      paid: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'paid')::int`,
      pendingAmount: sql<number>`COALESCE(sum(${affiliateCommissions.commission}) FILTER (WHERE ${affiliateCommissions.status} IN ('pending','approved')), 0)::int`,
      totalEarned: sql<number>`COALESCE(sum(${affiliateCommissions.commission}) FILTER (WHERE ${affiliateCommissions.status} IN ('approved','paid')), 0)::int`,
      totalPaid: sql<number>`COALESCE(sum(${affiliateCommissions.commission}) FILTER (WHERE ${affiliateCommissions.status} = 'paid'), 0)::int`,
    })
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, affiliate.id))

  return {
    totalEarned: commissionStats?.totalEarned ?? 0,
    totalPaid: commissionStats?.totalPaid ?? 0,
    totalCommissions: commissionStats?.total ?? 0,
    pendingCommissions: commissionStats?.pending ?? 0,
    approvedCommissions: commissionStats?.approved ?? 0,
    paidCommissions: commissionStats?.paid ?? 0,
    pendingAmount: commissionStats?.pendingAmount ?? 0,
  }
}

// ─── Admin: Search affiliates ────────────────

interface SearchAffiliatesParams {
  page?: number
  search?: string
  status?: string
}

export async function searchAffiliates({
  page = 1,
  search,
  status,
}: SearchAffiliatesParams) {
  await requireAdmin()

  const offset = (Math.max(1, page) - 1) * PAGE_SIZE
  const conditions = []

  const validStatuses = ["pending", "approved", "rejected"] as const
  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    conditions.push(eq(affiliates.status, status as (typeof validStatuses)[number]))
  }

  if (search && search.trim().length > 0) {
    const term = search.trim().slice(0, 100).replace(/%/g, "\\%").replace(/_/g, "\\_")
    conditions.push(
      or(
        ilike(users.name, `%${term}%`),
        ilike(users.email, `%${term}%`),
        ilike(affiliates.refCode, `%${term}%`),
      )!,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: affiliates.id,
        userId: affiliates.userId,
        refCode: affiliates.refCode,
        status: affiliates.status,
        commissionRate: affiliates.commissionRate,
        totalEarned: sql<number>`COALESCE((SELECT sum(commission) FROM affiliates_commissions WHERE affiliate_id = ${affiliates.id} AND status IN ('approved','paid')), 0)::int`,
        totalPaid: sql<number>`COALESCE((SELECT sum(commission) FROM affiliates_commissions WHERE affiliate_id = ${affiliates.id} AND status = 'paid'), 0)::int`,
        createdAt: affiliates.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(affiliates)
      .innerJoin(users, eq(affiliates.userId, users.id))
      .where(where)
      .orderBy(desc(affiliates.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliates)
      .innerJoin(users, eq(affiliates.userId, users.id))
      .where(where),
  ])

  return {
    affiliates: rows,
    total: countResult[0]?.count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

// ─── Admin: Get affiliate stats ──────────────

export async function getAffiliateStatusCounts() {
  await requireAdmin()

  const rows = await db
    .select({
      status: affiliates.status,
      count: sql<number>`count(*)::int`,
    })
    .from(affiliates)
    .groupBy(affiliates.status)

  const counts: Record<string, number> = { total: 0 }
  for (const r of rows) {
    counts[r.status] = r.count
    counts.total += r.count
  }
  return counts
}

// ─── Admin: Get affiliate detail ─────────────

export async function getAffiliateDetail(affiliateId: string) {
  await requireAdmin()
  if (!UUID_RE.test(affiliateId)) return null

  const aff = await db
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      refCode: affiliates.refCode,
      status: affiliates.status,
      commissionRate: affiliates.commissionRate,
      pixKey: affiliates.pixKey,
      pixType: affiliates.pixType,
      createdAt: affiliates.createdAt,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      userCpf: users.cpf,
    })
    .from(affiliates)
    .innerJoin(users, eq(affiliates.userId, users.id))
    .where(eq(affiliates.id, affiliateId))
    .limit(1)

  if (!aff[0]) return null

  const [commissionStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'pending')::int`,
      approved: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'approved')::int`,
      paid: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'paid')::int`,
      rejected: sql<number>`count(*) FILTER (WHERE ${affiliateCommissions.status} = 'rejected')::int`,
      totalAmount: sql<number>`COALESCE(sum(${affiliateCommissions.commission}), 0)::int`,
      totalEarned: sql<number>`COALESCE(sum(${affiliateCommissions.commission}) FILTER (WHERE ${affiliateCommissions.status} IN ('approved','paid')), 0)::int`,
      totalPaid: sql<number>`COALESCE(sum(${affiliateCommissions.commission}) FILTER (WHERE ${affiliateCommissions.status} = 'paid'), 0)::int`,
    })
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, affiliateId))

  return {
    ...aff[0],
    totalEarned: commissionStats?.totalEarned ?? 0,
    totalPaid: commissionStats?.totalPaid ?? 0,
    commissionStats: {
      total: commissionStats?.total ?? 0,
      pending: commissionStats?.pending ?? 0,
      approved: commissionStats?.approved ?? 0,
      paid: commissionStats?.paid ?? 0,
      rejected: commissionStats?.rejected ?? 0,
      totalAmount: commissionStats?.totalAmount ?? 0,
    },
  }
}

// ─── Admin: Get affiliate commissions ────────

export async function getAffiliateCommissions(affiliateId: string, page = 1) {
  await requireAdmin()
  if (!UUID_RE.test(affiliateId)) return { commissions: [], total: 0, page: 1, totalPages: 1 }

  const offset = (Math.max(1, page) - 1) * 20

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: affiliateCommissions.id,
        orderId: affiliateCommissions.orderId,
        orderTotal: affiliateCommissions.orderTotal,
        commissionRate: affiliateCommissions.commissionRate,
        commission: affiliateCommissions.commission,
        status: affiliateCommissions.status,
        createdAt: affiliateCommissions.createdAt,
      })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommissions.createdAt))
      .limit(20)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId)),
  ])

  return {
    commissions: rows,
    total: countResult[0]?.count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / 20)),
  }
}

// ─── Admin: Update affiliate ─────────────────

export async function updateAffiliate(affiliateId: string, formData: FormData) {
  await requireAdmin()
  if (!UUID_RE.test(affiliateId)) return { error: "ID inválido" }

  const raw = {
    status: (formData.get("status") as string) || undefined,
    commissionRate: formData.get("commissionRate")
      ? parseInt(formData.get("commissionRate") as string, 10)
      : undefined,
    refCode: (formData.get("refCode") as string)?.trim() || undefined,
    pixKey: (formData.get("pixKey") as string) || undefined,
    pixType: (formData.get("pixType") as string) || undefined,
  }

  const result = affiliateUpdateSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  const existing = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
    columns: { id: true, refCode: true },
  })
  if (!existing) return { error: "Afiliado no encontrado" }

  if (result.data.refCode && result.data.refCode !== existing.refCode) {
    const dup = await db.query.affiliates.findFirst({
      where: eq(affiliates.refCode, result.data.refCode),
      columns: { id: true },
    })
    if (dup) return { error: "Este código de referencia ya está en uso" }
  }

  const updateData: Record<string, unknown> = {}
  if (result.data.status !== undefined) updateData.status = result.data.status
  if (result.data.commissionRate !== undefined) updateData.commissionRate = result.data.commissionRate
  if (result.data.refCode !== undefined) updateData.refCode = result.data.refCode
  if (result.data.pixKey !== undefined) updateData.pixKey = result.data.pixKey
  if (result.data.pixType !== undefined) updateData.pixType = result.data.pixType

  if (Object.keys(updateData).length === 0) return { error: "Ningún campo para actualizar" }

  await db.update(affiliates).set(updateData).where(eq(affiliates.id, affiliateId))

  revalidatePath(`/dashboard/affiliates/${affiliateId}`)
  revalidatePath("/dashboard/affiliates")
  return { success: true }
}

// ─── Admin: Approve / Reject affiliate ───────

export async function updateAffiliateStatus(
  affiliateId: string,
  newStatus: "approved" | "rejected",
) {
  await requireAdmin()
  if (!UUID_RE.test(affiliateId)) return { error: "ID inválido" }

  const existing = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
    columns: { id: true },
  })
  if (!existing) return { error: "Afiliado no encontrado" }

  await db
    .update(affiliates)
    .set({ status: newStatus })
    .where(eq(affiliates.id, affiliateId))

  revalidatePath(`/dashboard/affiliates/${affiliateId}`)
  revalidatePath("/dashboard/affiliates")
  return { success: true }
}

// ─── Admin: Search all commissions ───────────

interface SearchCommissionsParams {
  page?: number
  search?: string
  status?: string
  affiliateId?: string
}

export async function searchCommissions({
  page = 1,
  search,
  status,
  affiliateId,
}: SearchCommissionsParams) {
  await requireAdmin()

  const offset = (Math.max(1, page) - 1) * PAGE_SIZE
  const conditions = []

  const validStatuses = ["pending", "approved", "rejected", "paid"] as const
  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    conditions.push(eq(affiliateCommissions.status, status as (typeof validStatuses)[number]))
  }

  if (affiliateId && UUID_RE.test(affiliateId)) {
    conditions.push(eq(affiliateCommissions.affiliateId, affiliateId))
  }

  if (search && search.trim().length > 0) {
    const term = search.trim().slice(0, 100).replace(/%/g, "\\%").replace(/_/g, "\\_")
    conditions.push(
      or(
        ilike(users.name, `%${term}%`),
        ilike(users.email, `%${term}%`),
        ilike(affiliates.refCode, `%${term}%`),
      )!,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: affiliateCommissions.id,
        affiliateId: affiliateCommissions.affiliateId,
        orderId: affiliateCommissions.orderId,
        orderTotal: affiliateCommissions.orderTotal,
        commissionRate: affiliateCommissions.commissionRate,
        commission: affiliateCommissions.commission,
        status: affiliateCommissions.status,
        createdAt: affiliateCommissions.createdAt,
        affiliateName: users.name,
        affiliateEmail: users.email,
        refCode: affiliates.refCode,
      })
      .from(affiliateCommissions)
      .innerJoin(affiliates, eq(affiliateCommissions.affiliateId, affiliates.id))
      .innerJoin(users, eq(affiliates.userId, users.id))
      .where(where)
      .orderBy(desc(affiliateCommissions.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateCommissions)
      .innerJoin(affiliates, eq(affiliateCommissions.affiliateId, affiliates.id))
      .innerJoin(users, eq(affiliates.userId, users.id))
      .where(where),
  ])

  return {
    commissions: rows,
    total: countResult[0]?.count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

// ─── Admin: Get commission status counts ─────

export async function getCommissionStatusCounts() {
  await requireAdmin()

  const rows = await db
    .select({
      status: affiliateCommissions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(affiliateCommissions)
    .groupBy(affiliateCommissions.status)

  const counts: Record<string, number> = { total: 0 }
  for (const r of rows) {
    counts[r.status] = r.count
    counts.total += r.count
  }
  return counts
}

// ─── Admin: Update commission status ─────────

export async function updateCommissionStatus(
  commissionId: string,
  newStatus: "approved" | "rejected" | "paid",
) {
  await requireAdmin()
  if (!UUID_RE.test(commissionId)) return { error: "ID inválido" }

  const commission = await db.query.affiliateCommissions.findFirst({
    where: eq(affiliateCommissions.id, commissionId),
    columns: { id: true, status: true, affiliateId: true, commission: true },
  })
  if (!commission) return { error: "Comisión no encontrada" }
  if (commission.status === "paid") return { error: "Las comisiones pagadas no pueden modificarse" }

  await db
    .update(affiliateCommissions)
    .set({ status: newStatus })
    .where(eq(affiliateCommissions.id, commissionId))

  if (newStatus === "paid") {
    await db
      .update(affiliates)
      .set({
        totalPaid: sql`${affiliates.totalPaid} + ${commission.commission}`,
      })
      .where(eq(affiliates.id, commission.affiliateId))
  }

  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true }
}

// ─── Admin: Bulk update affiliate status ─────

export async function bulkUpdateAffiliateStatus(
  affiliateIds: string[],
  newStatus: "approved" | "rejected",
) {
  await requireAdmin()
  if (!affiliateIds.length || affiliateIds.length > 500)
    return { error: "Seleccione entre 1 y 500 afiliados" }
  if (affiliateIds.some((id) => !UUID_RE.test(id)))
    return { error: "IDs inválidos" }

  await db
    .update(affiliates)
    .set({ status: newStatus })
    .where(inArray(affiliates.id, affiliateIds))

  revalidatePath("/dashboard/affiliates")
  return { success: true as const, count: affiliateIds.length }
}

// ─── Admin: Delete affiliate ──────────────────

export async function deleteAffiliate(affiliateId: string) {
  await requireAdmin()
  if (!UUID_RE.test(affiliateId)) return { error: "ID inválido" }

  const aff = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, affiliateId),
    columns: { id: true, status: true },
  })
  if (!aff) return { error: "Afiliado no encontrado" }

  const [paidComm] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateCommissions)
    .where(and(
      eq(affiliateCommissions.affiliateId, affiliateId),
      eq(affiliateCommissions.status, "paid"),
    ))
  if ((paidComm?.count ?? 0) > 0)
    return { error: "No se pueden eliminar afiliados con comisiones pagadas" }

  await db.delete(affiliateCommissions).where(eq(affiliateCommissions.affiliateId, affiliateId))
  await db.delete(affiliates).where(eq(affiliates.id, affiliateId))

  revalidatePath("/dashboard/affiliates")
  return { success: true as const }
}

// ─── Admin: Preview payout ───────────────────

interface PayoutPreviewParams {
  dateUntil?: string
  minAmount: number
  affiliateIds?: string[]
}

export async function previewPayout(params: PayoutPreviewParams) {
  await requireAdmin()
  const tz = await getTimezone()

  const conditions = [
    eq(affiliateCommissions.status, "approved"),
    eq(affiliates.status, "approved"),
    or(
      sql`${affiliateCommissions.payoutId} IS NULL`,
      sql`${affiliateCommissions.payoutId} IN (SELECT id FROM affiliates_payouts WHERE status = 'cancelled')`,
    )!,
  ]

  if (params.dateUntil) {
    conditions.push(sql`${affiliateCommissions.createdAt} < ((${params.dateUntil}::date + interval '1 day') AT TIME ZONE ${tz})`)
  }

  if (params.affiliateIds && params.affiliateIds.length > 0) {
    if (params.affiliateIds.some((id) => !UUID_RE.test(id)))
      return { error: "IDs de afiliados inválidos" }
    conditions.push(inArray(affiliateCommissions.affiliateId, params.affiliateIds))
  }

  const rows = await db
    .select({
      affiliateId: affiliateCommissions.affiliateId,
      totalCommission: sql<number>`sum(${affiliateCommissions.commission})::int`,
      commissionCount: sql<number>`count(*)::int`,
      affiliateName: users.name,
      affiliateEmail: users.email,
      refCode: affiliates.refCode,
      pixKey: affiliates.pixKey,
      pixType: affiliates.pixType,
    })
    .from(affiliateCommissions)
    .innerJoin(affiliates, eq(affiliateCommissions.affiliateId, affiliates.id))
    .innerJoin(users, eq(affiliates.userId, users.id))
    .where(and(...conditions))
    .groupBy(
      affiliateCommissions.affiliateId,
      users.name,
      users.email,
      affiliates.refCode,
      affiliates.pixKey,
      affiliates.pixType,
    )

  const minCents = Math.max(0, params.minAmount)
  const filtered = rows.filter((r) => r.totalCommission >= minCents)

  const totalAmount = filtered.reduce((s, r) => s + r.totalCommission, 0)
  const totalCommissions = filtered.reduce((s, r) => s + r.commissionCount, 0)

  return {
    affiliates: filtered,
    totalAmount,
    totalCommissions,
    affiliatesCount: filtered.length,
  }
}

// ─── Admin: Create payout ────────────────────

export async function createPayout(params: PayoutPreviewParams & { notes?: string }) {
  const admin = await requireAdmin()
  const tz = await getTimezone()

  const preview = await previewPayout(params)
  if ("error" in preview) return preview
  if (preview.affiliatesCount === 0) return { error: "Ningún afiliado elegible para pago" }

  const qualifyingAffiliateIds = preview.affiliates.map((a) => a.affiliateId)

  const result = await db.transaction(async (tx) => {
    const qualifyingCommissions = await tx
      .select({ id: affiliateCommissions.id })
      .from(affiliateCommissions)
      .innerJoin(affiliates, eq(affiliateCommissions.affiliateId, affiliates.id))
      .where(
        and(
          eq(affiliateCommissions.status, "approved"),
          eq(affiliates.status, "approved"),
          inArray(affiliateCommissions.affiliateId, qualifyingAffiliateIds),
          params.dateUntil
            ? sql`${affiliateCommissions.createdAt} < ((${params.dateUntil}::date + interval '1 day') AT TIME ZONE ${tz})`
            : undefined,
        ),
      )

    const commissionIds = qualifyingCommissions.map((c) => c.id)

    const [payout] = await tx.insert(affiliatePayouts).values({
      createdBy: admin.id,
      totalAmount: preview.totalAmount,
      affiliatesCount: preview.affiliatesCount,
      commissionsCount: preview.totalCommissions,
      status: "completed",
      notes: params.notes?.trim().slice(0, 2000) || null,
      commissionIds,
    }).returning({ id: affiliatePayouts.id })

    if (commissionIds.length > 0) {
      await tx
        .update(affiliateCommissions)
        .set({ status: "paid", payoutId: payout.id })
        .where(inArray(affiliateCommissions.id, commissionIds))
    }

    for (const aff of preview.affiliates) {
      await tx
        .update(affiliates)
        .set({
          totalPaid: sql`${affiliates.totalPaid} + ${aff.totalCommission}`,
        })
        .where(eq(affiliates.id, aff.affiliateId))
    }

    return { success: true as const, payoutId: payout.id }
  })

  revalidatePath("/dashboard/affiliates/payouts")
  revalidatePath("/dashboard/affiliates/commissions")
  revalidatePath("/dashboard/affiliates")
  return result
}

// ─── Admin: List payouts ─────────────────────

export async function searchPayouts(page = 1) {
  await requireAdmin()

  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: affiliatePayouts.id,
        totalAmount: affiliatePayouts.totalAmount,
        affiliatesCount: affiliatePayouts.affiliatesCount,
        commissionsCount: affiliatePayouts.commissionsCount,
        status: affiliatePayouts.status,
        notes: affiliatePayouts.notes,
        createdAt: affiliatePayouts.createdAt,
        createdByName: users.name,
      })
      .from(affiliatePayouts)
      .innerJoin(users, eq(affiliatePayouts.createdBy, users.id))
      .orderBy(desc(affiliatePayouts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliatePayouts),
  ])

  return {
    payouts: rows,
    total: countResult[0]?.count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

// ─── Admin: Get approved affiliates for selection ────

export async function getApprovedAffiliates() {
  await requireAdmin()

  return db
    .select({
      id: affiliates.id,
      refCode: affiliates.refCode,
      userName: users.name,
      userEmail: users.email,
    })
    .from(affiliates)
    .innerJoin(users, eq(affiliates.userId, users.id))
    .where(eq(affiliates.status, "approved"))
    .orderBy(users.name)
}

// ─── Commission creation (called from order flow) ────

export async function createAffiliateCommission(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, affiliateId: true, total: true, status: true },
  })

  if (!order || !order.affiliateId) return
  if (!["CONFIRMED", "DELIVERED"].includes(order.status)) return

  const existing = await db.query.affiliateCommissions.findFirst({
    where: eq(affiliateCommissions.orderId, orderId),
    columns: { id: true },
  })
  if (existing) return

  const affiliate = await db.query.affiliates.findFirst({
    where: and(
      eq(affiliates.id, order.affiliateId),
      eq(affiliates.status, "approved"),
    ),
    columns: { id: true, commissionRate: true },
  })
  if (!affiliate) return

  const orderTotalCents = Math.round(Number(order.total) * 100)
  const commission = Math.round(orderTotalCents * (affiliate.commissionRate / 100))

  await db.insert(affiliateCommissions).values({
    affiliateId: affiliate.id,
    orderId: order.id,
    orderTotal: orderTotalCents,
    commissionRate: affiliate.commissionRate,
    commission,
    status: "approved",
  })

  await db
    .update(affiliates)
    .set({ totalEarned: sql`${affiliates.totalEarned} + ${commission}` })
    .where(eq(affiliates.id, affiliate.id))
}

// ─── Admin: Cancel payout ────────────────────

export async function cancelPayout(payoutId: string) {
  await requireAdmin()
  if (!UUID_RE.test(payoutId)) return { error: "ID inválido" }

  const payout = await db.query.affiliatePayouts.findFirst({
    where: eq(affiliatePayouts.id, payoutId),
    columns: { id: true, status: true, commissionIds: true },
  })
  if (!payout) return { error: "Pago no encontrado" }
  if (payout.status === "cancelled") return { error: "Pago ya fue cancelado" }

  const commissionIdsToRestore = payout.commissionIds?.length
    ? payout.commissionIds
    : (await db
        .select({ id: affiliateCommissions.id })
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.payoutId, payoutId))
      ).map((r) => r.id)

  const commissionsForRevert = commissionIdsToRestore.length > 0
    ? await db
        .select({ affiliateId: affiliateCommissions.affiliateId, commission: affiliateCommissions.commission })
        .from(affiliateCommissions)
        .where(inArray(affiliateCommissions.id, commissionIdsToRestore))
    : []

  try {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(affiliatePayouts)
        .set({ status: "cancelled" })
        .where(and(eq(affiliatePayouts.id, payoutId), sql`${affiliatePayouts.status} != 'cancelled'`))
        .returning({ id: affiliatePayouts.id })

      if (!updated) throw new Error("CONCURRENT_MODIFICATION")

      if (commissionIdsToRestore.length > 0) {
        await tx
          .update(affiliateCommissions)
          .set({ status: "approved" })
          .where(inArray(affiliateCommissions.id, commissionIdsToRestore))
      }

      const byAffiliate = new Map<string, number>()
      for (const c of commissionsForRevert) {
        byAffiliate.set(c.affiliateId, (byAffiliate.get(c.affiliateId) ?? 0) + c.commission)
      }
      for (const [affiliateId, amount] of byAffiliate) {
        await tx
          .update(affiliates)
          .set({ totalPaid: sql`${affiliates.totalPaid} - ${amount}` })
          .where(eq(affiliates.id, affiliateId))
      }
    })
  } catch (e) {
    if (e instanceof Error && e.message === "CONCURRENT_MODIFICATION")
      return { error: "Pago ya fue procesado por otro administrador" }
    throw e
  }

  revalidatePath("/dashboard/affiliates/payouts")
  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}

// ─── Admin: Delete commission ────────────────

export async function deleteCommission(commissionId: string) {
  await requireAdmin()
  if (!UUID_RE.test(commissionId)) return { error: "ID inválido" }

  const comm = await db.query.affiliateCommissions.findFirst({
    where: eq(affiliateCommissions.id, commissionId),
    columns: { id: true, status: true, payoutId: true },
  })
  if (!comm) return { error: "Comisión no encontrada" }
  if (comm.status === "paid")
    return { error: "Las comisiones pagadas no pueden eliminarse" }
  if (comm.payoutId)
    return { error: "Las comisiones vinculadas a un pago no pueden eliminarse" }

  await db.delete(affiliateCommissions).where(eq(affiliateCommissions.id, commissionId))

  revalidatePath("/dashboard/affiliates/commissions")
  revalidatePath("/dashboard/affiliates")
  return { success: true as const }
}

// ─── Admin: Delete payout ────────────────────

export async function deletePayout(payoutId: string) {
  await requireAdmin()
  if (!UUID_RE.test(payoutId)) return { error: "ID inválido" }

  const payout = await db.query.affiliatePayouts.findFirst({
    where: eq(affiliatePayouts.id, payoutId),
    columns: { id: true, status: true },
  })
  if (!payout) return { error: "Pago no encontrado" }
  if (payout.status === "completed")
    return { error: "Pagos completados no pueden eliminarse. Cancele primero." }

  if (payout.status === "pending") {
    await db
      .update(affiliateCommissions)
      .set({ payoutId: null, status: "approved" })
      .where(eq(affiliateCommissions.payoutId, payoutId))
  }

  await db.delete(affiliatePayouts).where(eq(affiliatePayouts.id, payoutId))

  revalidatePath("/dashboard/affiliates/payouts")
  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}

// ─── Admin: Bulk delete affiliates ────────────────────

export async function bulkDeleteAffiliates(ids: string[]) {
  await requireAdmin()
  if (!ids.length) return { error: "Ningún afiliado seleccionado" }
  for (const id of ids) {
    if (!UUID_RE.test(id)) return { error: "ID inválido" }
  }

  const hasPaid = await db.query.affiliateCommissions.findFirst({
    where: and(inArray(affiliateCommissions.affiliateId, ids), eq(affiliateCommissions.status, "paid")),
    columns: { id: true },
  })
  if (hasPaid) return { error: "No se pueden eliminar afiliados con comisiones pagadas." }

  await db.delete(affiliateCommissions).where(inArray(affiliateCommissions.affiliateId, ids))
  await db.delete(affiliates).where(inArray(affiliates.id, ids))

  revalidatePath("/dashboard/affiliates")
  return { success: true as const }
}

// ─── Admin: Bulk update commission status ────────────

export async function bulkUpdateCommissionStatus(
  ids: string[],
  newStatus: "approved" | "rejected",
) {
  await requireAdmin()
  if (!ids.length) return { error: "Ninguna comisión seleccionada" }
  for (const id of ids) {
    if (!UUID_RE.test(id)) return { error: "ID inválido" }
  }

  await db
    .update(affiliateCommissions)
    .set({ status: newStatus })
    .where(
      and(
        inArray(affiliateCommissions.id, ids),
        sql`${affiliateCommissions.status} NOT IN ('paid')`,
      ),
    )

  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}

// ─── Admin: Bulk delete commissions ────────────────────

export async function bulkDeleteCommissions(ids: string[]) {
  await requireAdmin()
  if (!ids.length) return { error: "Ninguna comisión seleccionada" }
  for (const id of ids) {
    if (!UUID_RE.test(id)) return { error: "ID inválido" }
  }

  await db
    .delete(affiliateCommissions)
    .where(
      and(
        inArray(affiliateCommissions.id, ids),
        sql`${affiliateCommissions.status} NOT IN ('paid')`,
        sql`${affiliateCommissions.payoutId} IS NULL`,
      ),
    )

  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}

// ─── Admin: Bulk delete payouts ────────────────────

export async function bulkDeletePayouts(ids: string[]) {
  await requireAdmin()
  if (!ids.length) return { error: "Ningún pago seleccionado" }
  for (const id of ids) {
    if (!UUID_RE.test(id)) return { error: "ID inválido" }
  }

  for (const payoutId of ids) {
    const payout = await db.query.affiliatePayouts.findFirst({
      where: eq(affiliatePayouts.id, payoutId),
      columns: { id: true, status: true },
    })
    if (!payout || payout.status === "completed") continue
    if (payout.status === "pending") {
      await db
        .update(affiliateCommissions)
        .set({ payoutId: null, status: "approved" })
        .where(eq(affiliateCommissions.payoutId, payoutId))
    }
    await db.delete(affiliatePayouts).where(eq(affiliatePayouts.id, payoutId))
  }

  revalidatePath("/dashboard/affiliates/payouts")
  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}

// ─── Admin: Complete payout ────────────────────

export async function completePayout(payoutId: string) {
  await requireAdmin()
  if (!UUID_RE.test(payoutId)) return { error: "ID inválido" }

  const payout = await db.query.affiliatePayouts.findFirst({
    where: eq(affiliatePayouts.id, payoutId),
    columns: { id: true, status: true },
  })
  if (!payout) return { error: "Pago no encontrado" }
  if (payout.status !== "pending")
    return { error: "Solo pagos pendientes pueden completarse." }

  await db
    .update(affiliatePayouts)
    .set({ status: "completed" })
    .where(eq(affiliatePayouts.id, payoutId))

  await db
    .update(affiliateCommissions)
    .set({ status: "paid" })
    .where(eq(affiliateCommissions.payoutId, payoutId))

  revalidatePath("/dashboard/affiliates/payouts")
  revalidatePath("/dashboard/affiliates/commissions")
  return { success: true as const }
}
