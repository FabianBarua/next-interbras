"use server"

import { z } from "zod/v4"
import { setSetting, getSettings } from "@/lib/settings"
import { requireAdmin } from "@/lib/auth/get-session"
import { logEvent } from "@/lib/logging"
import nodemailer from "nodemailer"

const smtpSchema = z.object({
  host: z.string().min(1, "Host es obligatorio"),
  port: z
    .string()
    .min(1, "Puerto es obligatorio")
    .refine(
      (v) => {
        const n = Number(v)
        return Number.isInteger(n) && n >= 1 && n <= 65535
      },
      "Puerto debe ser un número entre 1 y 65535",
    ),
  user: z.string().optional().default(""),
  pass: z.string().optional().default(""),
  from_email: z
    .string()
    .min(1, "Email de envío es obligatorio")
    .email("Email de envío inválido"),
  from_name: z.string().optional().default(""),
  secure: z.string().optional().default("false"),
})

export async function getSmtpConfig() {
  await requireAdmin()
  const cfg = await getSettings("smtp.")
  return {
    host: cfg["smtp.host"] ?? "",
    port: cfg["smtp.port"] ?? "",
    user: cfg["smtp.user"] ?? "",
    pass: cfg["smtp.pass"] ? "••••••••" : "",
    from_email: cfg["smtp.from_email"] ?? "",
    from_name: cfg["smtp.from_name"] ?? "",
    secure: cfg["smtp.secure"] ?? "false",
    configured: !!(cfg["smtp.host"] && cfg["smtp.port"]),
  }
}

export async function saveSmtpConfig(formData: FormData) {
  const admin = await requireAdmin()

  const raw = {
    host: (formData.get("host") as string)?.trim() ?? "",
    port: (formData.get("port") as string)?.trim() ?? "",
    user: (formData.get("user") as string)?.trim() ?? "",
    pass: (formData.get("pass") as string)?.trim() ?? "",
    from_email: (formData.get("from_email") as string)?.trim() ?? "",
    from_name: (formData.get("from_name") as string)?.trim() ?? "",
    secure: formData.get("secure") === "on" ? "true" : "false",
  }

  const result = smtpSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const data = result.data

  await setSetting("smtp.host", data.host)
  await setSetting("smtp.port", data.port)
  await setSetting("smtp.user", data.user)
  await setSetting("smtp.from_email", data.from_email)
  await setSetting("smtp.from_name", data.from_name)
  await setSetting("smtp.secure", data.secure)

  // Only update password if changed (not the masked placeholder)
  if (data.pass && data.pass !== "••••••••") {
    await setSetting("smtp.pass", data.pass, true)
  }

  logEvent({
    category: "email",
    action: "update_smtp_config",
    userId: admin.id,
  })

  return { success: true }
}

export async function testSmtpConnection() {
  const admin = await requireAdmin()
  const adminEmail = admin.email
  if (!adminEmail) return { error: "Email del admin no encontrado." }

  const cfg = await getSettings("smtp.")
  if (!cfg["smtp.host"] || !cfg["smtp.port"]) {
    return { error: "SMTP no configurado." }
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

  try {
    await transport.verify()
    const { getSiteConfig } = await import("@/lib/site-config")
    const site = await getSiteConfig()
    await transport.sendMail({
      from: `"${(cfg["smtp.from_name"] || site.name).replace(/["\\]/g, "")}" <${cfg["smtp.from_email"] || cfg["smtp.user"]}>`,
      to: adminEmail,
      subject: `Test SMTP — ${site.name}`,
      html: "<h2>Test de email</h2><p>Si estás leyendo esto, la configuración SMTP está funcionando correctamente! ✅</p>",
    })

    logEvent({
      category: "email",
      action: "test_smtp_connection",
      userId: admin.id,
      message: "success",
    })

    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    logEvent({
      category: "email",
      level: "error",
      action: "test_smtp_connection",
      userId: admin.id,
      message: errorMsg,
    })

    return { error: errorMsg }
  }
}
