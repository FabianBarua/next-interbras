// Shared constants and helpers for order display across dashboard and client pages.
// Single source of truth — avoid hardcoding labels/colors elsewhere.

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  succeeded: "Aprobado",
  failed: "Fallido",
  refunded: "Reembolsado",
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  succeeded: "#22c55e",
  failed: "#ef4444",
  refunded: "#8b5cf6",
}

/** Client-facing labels (more descriptive for end users) */
export const PAYMENT_STATUS_LABELS_CLIENT: Record<string, string> = {
  pending: "Pago pendiente",
  processing: "Procesando pago",
  succeeded: "Pagado",
  failed: "Pago fallido",
  refunded: "Reembolsado",
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia bancaria",
  pix: "PIX",
}

/** Format a numeric value as US$ X,XXX.XX */
export function formatUSD(value: string | number): string {
  return `US$ ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Format a date as localized string */
export function formatDate(
  date: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  })
}

/** Format a date in short form */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Extract localized product name from i18n object */
export function productName(name: unknown): string {
  if (!name || typeof name !== "object") return "—"
  const n = name as Record<string, string>
  return n.es || n.pt || n.en || "—"
}
