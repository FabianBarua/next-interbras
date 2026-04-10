"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Receipt, Wallet, Settings } from "lucide-react"

const links = [
  { href: "/dashboard/affiliates", label: "Afiliados", icon: Users, exact: true },
  { href: "/dashboard/affiliates/commissions", label: "Comisiones", icon: Receipt },
  { href: "/dashboard/affiliates/payouts", label: "Pagos", icon: Wallet },
  { href: "/dashboard/affiliates/settings", label: "Configuración", icon: Settings },
]

export function AffiliateNav() {
  const pathname = usePathname()
  const specificPrefixes = links.filter((l) => !l.exact).map((l) => l.href)

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href ||
            (pathname.startsWith(href + "/") &&
              !specificPrefixes.some((p) => pathname.startsWith(p)))
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
