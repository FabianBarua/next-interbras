import { db } from "@/lib/db"
import { countries, shippingMethodCountries, shippingMethods, shippingPaymentRules, gatewayConfig } from "@/lib/db/schema"
import { eq, asc, and, inArray } from "drizzle-orm"
import { cachedQuery } from "@/lib/cache"
import type { Country } from "@/types/country"
import type { ShippingMethod } from "@/types/shipping-method"
import type { I18nText } from "@/types/common"

function mapCountry(row: typeof countries.$inferSelect): Country {
  return {
    id: row.id,
    code: row.code,
    name: row.name as I18nText,
    flag: row.flag,
    currency: row.currency,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

function mapShippingMethod(row: typeof shippingMethods.$inferSelect): ShippingMethod {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: (row.description as I18nText) ?? null,
    price: Number(row.price),
    active: row.active,
    requiresAddress: row.requiresAddress,
    pickupConfig: row.pickupConfig ?? null,
    sortOrder: row.sortOrder,
  }
}

export async function getActiveCountries(): Promise<Country[]> {
  return cachedQuery("countries:active", async () => {
    const rows = await db.select().from(countries)
      .where(eq(countries.active, true))
      .orderBy(asc(countries.sortOrder))
    return rows.map(mapCountry)
  }, 600)
}

export async function getShippingMethodsByCountry(countryCode: string): Promise<ShippingMethod[]> {
  return cachedQuery(`shipping-by-country:${countryCode}`, async () => {
    const rows = await db
      .select({ sm: shippingMethods })
      .from(shippingMethodCountries)
      .innerJoin(countries, eq(shippingMethodCountries.countryId, countries.id))
      .innerJoin(shippingMethods, eq(shippingMethodCountries.shippingMethodId, shippingMethods.id))
      .where(and(
        eq(countries.code, countryCode),
        eq(shippingMethods.active, true),
      ))
      .orderBy(asc(shippingMethods.sortOrder))

    return rows.map((r) => mapShippingMethod(r.sm))
  }, 300)
}

export interface PaymentOption {
  gatewayType: string
  displayName: string
  slug: string
}

export async function getPaymentOptionsForMethod(shippingMethodId: string): Promise<PaymentOption[]> {
  return cachedQuery(`payment-options:${shippingMethodId}`, async () => {
    // Get allowed gateway types for this shipping method
    const rules = await db.select({ gatewayType: shippingPaymentRules.gatewayType })
      .from(shippingPaymentRules)
      .where(eq(shippingPaymentRules.shippingMethodId, shippingMethodId))

    if (rules.length === 0) return []

    const types = rules.map((r) => r.gatewayType)

    // Get active gateways matching those types
    const gateways = await db.select({
      type: gatewayConfig.type,
      displayName: gatewayConfig.displayName,
      slug: gatewayConfig.slug,
    })
      .from(gatewayConfig)
      .where(and(
        inArray(gatewayConfig.type, types),
        eq(gatewayConfig.active, true),
      ))

    return gateways.map((g) => ({
      gatewayType: g.type,
      displayName: g.displayName,
      slug: g.slug,
    }))
  }, 300)
}
