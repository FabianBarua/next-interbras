"use client"

import Link from "@/i18n/link"
import { useCanonicalPathname } from "@/i18n/context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Settings,
  ShoppingCart,
  CreditCard,
  Truck,
  Layers,
  Package,
  Box,
  Tags,
  ExternalLink,
  Mail,
  Users,
  Bell,
  Search,
  Activity,
  FileText,
  Globe,
  type LucideIcon,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/dashboard/categories", label: "Categorías", icon: Layers },
      { href: "/dashboard/products", label: "Productos", icon: Package },
      { href: "/dashboard/variants", label: "Variantes", icon: Box },
      { href: "/dashboard/attributes", label: "Atributos", icon: Tags },
      { href: "/dashboard/external-codes", label: "Códigos Externos", icon: ExternalLink },
    ],
  },
  {
    label: "Comercio",
    items: [
      { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingCart },
      { href: "/dashboard/shipping-methods", label: "Métodos de Envío", icon: Truck },
      { href: "/dashboard/countries", label: "Países", icon: Globe },
      { href: "/dashboard/payments", label: "Pagos", icon: CreditCard },
      { href: "/dashboard/customers", label: "Clientes", icon: Users },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/dashboard/status", label: "Estado", icon: Activity },
      { href: "/dashboard/logs", label: "Logs", icon: FileText },
      { href: "/dashboard/emails", label: "Emails", icon: Mail },
      { href: "/dashboard/alerts", label: "Alertas", icon: Bell },
      { href: "/dashboard/seo", label: "SEO", icon: Search },
      { href: "/dashboard/settings", label: "Configuraciones", icon: Settings },
    ],
  },
]

export function SidebarNav({ mobile }: { mobile?: boolean }) {
  const pathname = useCanonicalPathname()

  function isActive(href: string, exact?: boolean) {
    if (exact || href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 mt-3 first:mt-0 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
