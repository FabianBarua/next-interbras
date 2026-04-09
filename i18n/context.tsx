"use client"

import { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import type { Locale } from "./config"
import { locales, defaultLocale } from "./config"
import { localePath as localePathFn, toCanonicalPath } from "./paths"
import type { Dictionary } from "./dictionaries/es"

// ── Helpers ──────────────────────────────────────────────────────────

function localeFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/(es|pt)(?:\/|$)/)
  if (match && (locales as readonly string[]).includes(match[1])) return match[1] as Locale
  return defaultLocale
}

async function loadDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case "pt": return (await import("./dictionaries/pt")).default
    default:   return (await import("./dictionaries/es")).default
  }
}

// ── Context ──────────────────────────────────────────────────────────

interface DictionaryContextValue {
  dict: Dictionary
  locale: Locale
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null)

/**
 * Provides dictionary + locale to the tree.
 * Reacts to URL pathname changes — when the locale prefix switches,
 * the new dictionary is loaded and the context updates without a full page reload.
 */
export function DictionaryProvider({
  dictionary: serverDict,
  locale: serverLocale,
  children,
}: {
  dictionary: Dictionary
  locale: Locale
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const urlLocale = localeFromPathname(pathname)

  const [dict, setDict] = useState(serverDict)
  const [locale, setLocale] = useState(serverLocale)

  useEffect(() => {
    if (urlLocale !== locale) {
      let cancelled = false
      loadDictionary(urlLocale).then((d) => {
        if (!cancelled) {
          setDict(d)
          setLocale(urlLocale)
        }
      })
      return () => { cancelled = true }
    }
  }, [urlLocale, locale])

  const value = useMemo(() => ({ dict, locale }), [dict, locale])

  return (
    <DictionaryContext.Provider value={value}>
      {children}
    </DictionaryContext.Provider>
  )
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useDictionary() {
  const ctx = useContext(DictionaryContext)
  if (!ctx) throw new Error("useDictionary must be used within DictionaryProvider")
  return ctx
}

/** Converts canonical paths to locale-prefixed paths for the active locale */
export function useLocalePath() {
  const { locale } = useDictionary()
  return useCallback((path: string) => localePathFn(path, locale), [locale])
}

/** Current pathname stripped of locale prefix, translated back to canonical (ES) form */
export function useCanonicalPathname() {
  const pathname = usePathname()
  const stripped = pathname.replace(/^\/(es|pt)/, "") || "/"
  return toCanonicalPath(stripped)
}
