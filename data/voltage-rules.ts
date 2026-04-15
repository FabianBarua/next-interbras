import type { Locale } from "@/i18n/config"

/**
 * Voltage compatibility rules.
 *
 * Strict mode:
 * - Only 110V and 220V are evaluated.
 * - Bivolt/other values are ignored.
 * - Warning appears when selected voltage does not match locale standard.
 */

/** The only two voltage values we care about */
const VOLTAGE_110 = "110V"
const VOLTAGE_220 = "220V"

/** Which voltage is native for each locale */
export const LOCALE_VOLTAGE: Record<Locale, string> = {
  es: VOLTAGE_220, // Paraguay
  pt: VOLTAGE_110, // Brazil
}

/** Country names per locale (for display) */
export const LOCALE_COUNTRY: Record<Locale, { es: string; pt: string }> = {
  es: { es: "Paraguay", pt: "Paraguai" },
  pt: { es: "Brasil", pt: "Brasil" },
}

function normalizeVoltage(voltage: string | undefined): string | null {
  if (!voltage) return null
  const v = voltage.trim().toUpperCase()
  if (v === VOLTAGE_110 || v === VOLTAGE_220) return v
  return null
}

/**
 * Returns `true` only when voltage is 110V/220V and mismatches locale standard.
 * Examples:
 * - es + 110V => true
 * - es + 220V => false
 * - pt + 220V => true
 * - pt + 110V => false
 * - any locale + BIVOLT => false
 */
export function isVoltageMismatch(
  voltage: string | undefined,
  locale: Locale,
): boolean {
  const normalized = normalizeVoltage(voltage)
  if (!normalized) return false
  return normalized !== LOCALE_VOLTAGE[locale]
}
