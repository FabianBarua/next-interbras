import { cookies } from "next/headers"
import type { Locale } from "./config"
import { locales, defaultLocale } from "./config"

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get("NEXT_LOCALE")?.value
  if (value && (locales as readonly string[]).includes(value)) return value as Locale
  return defaultLocale
}

export async function getDictionary() {
  const locale = await getLocale()
  return (await import(`./dictionaries/${locale}`)).default
}
