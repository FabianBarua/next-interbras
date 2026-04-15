import type { Locale } from "@/i18n/config"

/**
 * Voltage compatibility rules — only enforced for Brazil (pt).
 *
 * Brazil standard is 110V. If a Brazilian user views a 220V product,
 * warn them. "Bivolt" and any other values are always safe.
 *
 * Paraguay (es) has mixed voltage infrastructure — no warnings needed.
 */

/** The only two voltage values we care about */
const VOLTAGE_110 = "110V"
const VOLTAGE_220 = "220V"

/** Which voltage is native for each locale (only pt triggers warnings) */
export const LOCALE_VOLTAGE: Record<Locale, string> = {
  es: VOLTAGE_220, // Paraguay — for display only, no warnings
  pt: VOLTAGE_110, // Brazil
}

/** Country names per locale (for display) */
export const LOCALE_COUNTRY: Record<Locale, { es: string; pt: string }> = {
  es: { es: "Paraguay", pt: "Paraguai" },
  pt: { es: "Brasil", pt: "Brasil" },
}

/**
 * Returns `true` ONLY when:
 *  - locale is "pt" (Brazil)
 *  - voltage is exactly "110V" or "220V" (not "Bivolt", not null)
 *  - voltage does NOT match Brazil's native 110V
 *
 * In practice this means: pt + 220V → true. Everything else → false.
 */
export function isVoltageMismatch(
  voltage: string | undefined,
  locale: Locale,
): boolean {
  if (locale !== "pt") return false
  if (!voltage) return false
  if (voltage !== VOLTAGE_110 && voltage !== VOLTAGE_220) return false
  return voltage !== VOLTAGE_110
}
