"use client"

import Link from "@/i18n/link"
import { useCanonicalPathname } from "@/i18n/context"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard/emails", label: "Configuración", exact: true },
  { href: "/dashboard/emails/templates", label: "Templates" },
  { href: "/dashboard/emails/history", label: "Historial" },
]

export function EmailNav() {
  const pathname = useCanonicalPathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="mb-6 flex gap-1 rounded-lg border bg-muted/50 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isActive(tab.href, tab.exact)
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
