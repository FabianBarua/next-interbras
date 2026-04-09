"use client"

import { useRouter } from "next/navigation"
import { useDictionary, useCanonicalPathname } from "@/i18n/context"
import { localePath } from "@/i18n/paths"
import { locales, type Locale } from "@/i18n/config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const meta: Record<Locale, { flag: string; label: string }> = {
  es: { flag: "🇪🇸", label: "Español" },
  pt: { flag: "🇧🇷", label: "Português" },
}

function useSwitchLocale() {
  const router = useRouter()
  const canonical = useCanonicalPathname()
  return (target: Locale) => {
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
    router.push(localePath(canonical, target))
  }
}

/* ── Header switcher (shadcn DropdownMenu) ───────────────────── */

export function LanguageSwitcher() {
  const { locale } = useDictionary()
  const switchLocale = useSwitchLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-md h-9 w-9 sm:w-auto sm:px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span className="hidden sm:inline text-sm">{locale.toUpperCase()}</span>
          <span className="sr-only">Idioma</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLocale(l)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-base leading-none">{meta[l].flag}</span>
            <span className="flex-1">{meta[l].label}</span>
            {l === locale && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5" /></svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Footer / mobile inline switcher ─────────────────────────── */

export function LanguageSwitcherInline({ className }: { className?: string }) {
  const { locale } = useDictionary()
  const switchLocale = useSwitchLocale()

  return (
    <div className={`inline-flex items-center rounded-lg border bg-muted/50 p-0.5 ${className ?? ""}`} role="radiogroup" aria-label="Idioma">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          role="radio"
          aria-checked={l === locale}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
            l === locale
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-sm leading-none">{meta[l].flag}</span>
          <span>{meta[l].label}</span>
        </button>
      ))}
    </div>
  )
}
