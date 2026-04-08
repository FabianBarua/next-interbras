import { db } from "@/lib/db"
import { eventLogs } from "@/lib/db/schema"

export const LOG_CATEGORIES = [
  "sistema",
  "auth",
  "email",
] as const

export const LOG_LEVELS = ["info", "warn", "error"] as const

export type LogCategory = (typeof LOG_CATEGORIES)[number] | (string & {})
export type LogLevel = (typeof LOG_LEVELS)[number]

interface LogEventInput {
  category: LogCategory
  level?: LogLevel
  action: string
  message?: string
  entity?: string
  entityId?: string
  userId?: string
  meta?: Record<string, unknown>
}

/** Insert an event log. Never throws — logs must not break app flows. */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await db.insert(eventLogs).values({
      category: input.category,
      level: input.level ?? "info",
      action: input.action,
      message: input.message ?? null,
      entity: input.entity ?? null,
      entityId: input.entityId ?? undefined,
      userId: input.userId ?? undefined,
      meta: input.meta ?? null,
    })
  } catch {
    // Silent — logging must never break the app
    console.error("[logEvent] Failed to write event log", input.action)
  }
}
