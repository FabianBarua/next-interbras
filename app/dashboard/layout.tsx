import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-session"

export const dynamic = "force-dynamic"
import { logout } from "@/lib/auth/actions/logout"
import { getSiteConfig } from "@/lib/site-config"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { ExternalLink, LogOut } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") redirect("/")
  const site = await getSiteConfig()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/40 bg-muted/20 md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-border/40 px-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
              {site.name.charAt(0).toUpperCase()}
            </span>
            {site.name}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav />
        </div>

        <div className="shrink-0 border-t border-border/40 p-4">
          <div className="mb-3 rounded-md bg-muted/50 px-3 py-2">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3 px-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Ver sitio
            </Link>
            <span className="text-border">|</span>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-3 w-3" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile + breadcrumb area) */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 px-4 md:px-6">
          <MobileNav siteName={site.name} />
          <div className="flex flex-1 items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground md:hidden">
              {site.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium md:hidden">{site.name}</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
