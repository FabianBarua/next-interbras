"use server"

import { eq, desc, sql, and, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailLogs, emailTemplates } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"
import { getTimezone } from "@/lib/timezone"
import { getSettings } from "@/lib/settings"
import { logEvent } from "@/lib/logging"
import nodemailer from "nodemailer"

const PAGE_SIZE = 30

export type EmailLogFilters = {
  search?: string
  status?: "sent" | "failed" | ""
  template?: string
  from?: string
  to?: string
}

export async function getEmailLogs(page = 1, filters: EmailLogFilters = {}) {
  await requireAdmin()
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const conditions = []

  if (filters.status === "sent" || filters.status === "failed") {
    conditions.push(eq(emailLogs.status, filters.status))
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[%_\\]/g, "\\$&")
    const term = `%${escaped}%`
    conditions.push(
      or(ilike(emailLogs.to, term), ilike(emailLogs.subject, term))!,
    )
  }

  if (filters.template) {
    conditions.push(eq(emailTemplates.slug, filters.template))
  }

  if (filters.from) {
    const t = await getTimezone()
    conditions.push(
      sql`${emailLogs.sentAt} >= (${filters.from}::date::timestamp AT TIME ZONE ${t})`,
    )
  }

  if (filters.to) {
    const t = await getTimezone()
    conditions.push(
      sql`${emailLogs.sentAt} < ((${filters.to}::date + interval '1 day') AT TIME ZONE ${t})`,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const baseQuery = db
    .select({
      id: emailLogs.id,
      to: emailLogs.to,
      subject: emailLogs.subject,
      status: emailLogs.status,
      error: emailLogs.error,
      sentAt: emailLogs.sentAt,
      templateSlug: emailTemplates.slug,
    })
    .from(emailLogs)
    .leftJoin(emailTemplates, eq(emailLogs.templateId, emailTemplates.id))

  const logs = await (where ? baseQuery.where(where) : baseQuery)
    .orderBy(desc(emailLogs.sentAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailLogs)
    .leftJoin(emailTemplates, eq(emailLogs.templateId, emailTemplates.id))

  const countResult = await (where ? countQuery.where(where) : countQuery)
  const total = countResult[0]?.count ?? 0

  return {
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}

export async function getEmailCounters() {
  await requireAdmin()

  const t = await getTimezone()
  const todayStart = sql`(current_date::timestamp AT TIME ZONE ${t})`

  const [sentTodayR, failedTodayR, sentTotalR, failedTotalR] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(
          and(
            eq(emailLogs.status, "sent"),
            sql`${emailLogs.sentAt} >= ${todayStart}`,
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(
          and(
            eq(emailLogs.status, "failed"),
            sql`${emailLogs.sentAt} >= ${todayStart}`,
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(eq(emailLogs.status, "sent")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(eq(emailLogs.status, "failed")),
    ])

  return {
    sentToday: sentTodayR[0]?.count ?? 0,
    failedToday: failedTodayR[0]?.count ?? 0,
    sentTotal: sentTotalR[0]?.count ?? 0,
    failedTotal: failedTotalR[0]?.count ?? 0,
  }
}

export async function getTemplateSlugList() {
  await requireAdmin()
  const rows = await db
    .select({ slug: emailTemplates.slug })
    .from(emailTemplates)
    .orderBy(emailTemplates.slug)
  return rows.map((r) => r.slug)
}

export async function resendEmail(logId: string) {
  const admin = await requireAdmin()

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(logId)) return { error: "ID inválido" }

  const log = await db.query.emailLogs.findFirst({
    where: eq(emailLogs.id, logId),
  })
  if (!log) return { error: "Log no encontrado" }
  if (!log.bodyHtml)
    return { error: "Email sin contenido guardado — no se puede reenviar" }

  const cfg = await getSettings("smtp.")
  if (!cfg["smtp.host"] || !cfg["smtp.port"]) {
    return { error: "SMTP no configurado" }
  }

  const transport = nodemailer.createTransport({
    host: cfg["smtp.host"],
    port: Number(cfg["smtp.port"]),
    secure: cfg["smtp.secure"] === "true",
    auth:
      cfg["smtp.user"] && cfg["smtp.pass"]
        ? { user: cfg["smtp.user"], pass: cfg["smtp.pass"] }
        : undefined,
  })

  const { getSiteConfig } = await import("@/lib/site-config")
  const site = await getSiteConfig()
  const fromName = (cfg["smtp.from_name"] || site.name).replace(
    /["\\\/\n\r]/g,
    "",
  )
  const fromEmail = cfg["smtp.from_email"] || cfg["smtp.user"] || ""

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: log.to,
      subject: log.subject,
      html: log.bodyHtml,
    })

    await db.insert(emailLogs).values({
      templateId: log.templateId,
      to: log.to,
      subject: log.subject,
      bodyHtml: log.bodyHtml,
      status: "sent",
    })

    logEvent({
      category: "email",
      action: "resend_email",
      userId: admin.id,
      meta: { logId, to: log.to },
    })

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    await db.insert(emailLogs).values({
      templateId: log.templateId,
      to: log.to,
      subject: log.subject,
      bodyHtml: log.bodyHtml,
      status: "failed",
      error: errorMsg,
    })

    return { error: errorMsg }
  }
}
