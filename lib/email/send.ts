import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailTemplates, emailLogs } from "@/lib/db/schema"
import { getSettings } from "@/lib/settings"
import { renderTemplate } from "./render"
import { redis } from "@/lib/redis"

let transporter: Transporter | null = null
let transporterConfigHash = ""

/* -----------  Redis-based SMTP rate limiter (max 2 req/s) ----------- */

const SMTP_RATE_KEY = "smtp:rate"
const SMTP_MAX_PER_SEC = 2
const SMTP_LOCK_KEY = "smtp:lock"
const SMTP_LOCK_TTL = 5 // seconds

async function acquireLock(): Promise<boolean> {
  const res = await redis.set(SMTP_LOCK_KEY, "1", "EX", SMTP_LOCK_TTL, "NX")
  return res === "OK"
}

async function releaseLock(): Promise<void> {
  await redis.del(SMTP_LOCK_KEY)
}

/**
 * Wait until we can send without exceeding 2 emails/second.
 * Uses a Redis counter with 1-second TTL to coordinate across instances.
 */
async function waitForSmtpSlot(maxWaitMs = 15_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    const locked = await acquireLock()
    if (!locked) {
      await new Promise((r) => setTimeout(r, 200))
      continue
    }
    try {
      const count = await redis.incr(SMTP_RATE_KEY)
      if (count === 1) {
        await redis.expire(SMTP_RATE_KEY, 1)
      }
      if (count <= SMTP_MAX_PER_SEC) {
        return // slot acquired
      }
      // Over limit — decrement and wait
      await redis.decr(SMTP_RATE_KEY)
    } finally {
      await releaseLock()
    }
    const ttl = await redis.pttl(SMTP_RATE_KEY)
    const wait = ttl > 0 ? ttl + 50 : 550
    await new Promise((r) => setTimeout(r, wait))
  }
  // Timeout — send anyway rather than drop
}

/**
 * Build a hash of SMTP config to detect changes and recreate the transporter.
 */
function configHash(cfg: Record<string, string>): string {
  return `${cfg["smtp.host"]}:${cfg["smtp.port"]}:${cfg["smtp.user"]}:${cfg["smtp.secure"]}:${cfg["smtp.pass"] ?? ""}`
}

/**
 * Get or create the nodemailer transporter from settings table config.
 * Returns null if SMTP is not configured.
 */
async function getTransporter(): Promise<Transporter | null> {
  const cfg = await getSettings("smtp.")
  if (!cfg["smtp.host"] || !cfg["smtp.port"]) return null

  const hash = configHash(cfg)
  if (transporter && transporterConfigHash === hash) return transporter

  transporter = nodemailer.createTransport({
    host: cfg["smtp.host"],
    port: Number(cfg["smtp.port"]),
    secure: cfg["smtp.secure"] === "true",
    auth:
      cfg["smtp.user"] && cfg["smtp.pass"]
        ? { user: cfg["smtp.user"], pass: cfg["smtp.pass"] }
        : undefined,
  })
  transporterConfigHash = hash
  return transporter
}

/**
 * Central email sending function used by the entire app.
 *
 * - Looks up template by slug (must be active)
 * - Renders subject + body with variables (HTML-escaped by default)
 * - Sends via SMTP
 * - Logs result to email_logs
 * - Never throws — failures are logged silently
 *
 * @param rawKeys - Set of variable keys that should NOT be HTML-escaped
 */
export async function sendEmail(
  to: string,
  templateSlug: string,
  variables: Record<string, string>,
  options?: { rawKeys?: Set<string> },
): Promise<void> {
  try {
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.slug, templateSlug),
        eq(emailTemplates.active, true),
      ),
    })

    if (!template) return

    const mailer = await getTransporter()
    if (!mailer) {
      console.warn("[EMAIL] SMTP not configured, skipping email:", templateSlug)
      return
    }

    const cfg = await getSettings("smtp.")
    const { getSiteConfig } = await import("@/lib/site-config")
    const site = await getSiteConfig()
    const fromName = cfg["smtp.from_name"] || site.name
    const fromEmail = cfg["smtp.from_email"] || cfg["smtp.user"] || ""

    const subject = renderTemplate(template.subject, variables, options?.rawKeys)
    const html = renderTemplate(template.bodyHtml, variables, options?.rawKeys)

    try {
      await waitForSmtpSlot()
      await mailer.sendMail({
        from: `"${fromName.replace(/["\\\n\r]/g, "")}" <${fromEmail}>`,
        to,
        subject,
        html,
      })

      await db.insert(emailLogs).values({
        templateId: template.id,
        to,
        subject,
        bodyHtml: html,
        status: "sent",
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("[EMAIL] Send failed:", errorMsg)

      await db.insert(emailLogs).values({
        templateId: template.id,
        to,
        subject,
        bodyHtml: html,
        status: "failed",
        error: errorMsg,
      })
    }
  } catch (err) {
    console.error("[EMAIL] Unexpected error:", err)
  }
}
