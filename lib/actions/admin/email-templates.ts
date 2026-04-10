"use server"

import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { emailTemplates } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth/get-session"
import { logEvent } from "@/lib/logging"

export async function getTemplates() {
  await requireAdmin()
  return db.query.emailTemplates.findMany({
    orderBy: [desc(emailTemplates.createdAt)],
  })
}

export async function getTemplate(slug: string) {
  await requireAdmin()
  if (!slug || slug.length > 100) return null
  return db.query.emailTemplates.findFirst({
    where: eq(emailTemplates.slug, slug),
  })
}

export async function updateTemplate(
  slug: string,
  data: { subject: string; bodyHtml: string },
) {
  const admin = await requireAdmin()
  if (!slug || slug.length > 100) return { error: "Slug inválido" }

  const subject = data.subject.trim()
  if (!subject) return { error: "Asunto es obligatorio" }
  if (subject.length > 255) return { error: "Asunto muy largo" }

  const bodyHtml = data.bodyHtml
  if (!bodyHtml) return { error: "HTML es obligatorio" }
  if (bodyHtml.length > 500_000) return { error: "HTML muy grande (máx 500KB)" }

  await db
    .update(emailTemplates)
    .set({ subject, bodyHtml })
    .where(eq(emailTemplates.slug, slug))

  revalidatePath("/dashboard/emails/templates")
  revalidatePath(`/dashboard/emails/templates/${slug}`)

  logEvent({
    category: "email",
    action: "update_template",
    entity: "email_template",
    userId: admin.id,
    meta: { slug },
  })

  return { success: true }
}

export async function toggleTemplate(slug: string) {
  const admin = await requireAdmin()
  if (!slug || slug.length > 100) return

  const template = await db.query.emailTemplates.findFirst({
    where: eq(emailTemplates.slug, slug),
    columns: { active: true },
  })
  if (!template) return

  await db
    .update(emailTemplates)
    .set({ active: !template.active })
    .where(eq(emailTemplates.slug, slug))

  revalidatePath("/dashboard/emails/templates")

  logEvent({
    category: "email",
    action: "toggle_template",
    entity: "email_template",
    userId: admin.id,
    meta: { slug, active: !template.active },
  })
}
