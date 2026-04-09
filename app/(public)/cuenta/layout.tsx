"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Breadcrumbs } from "@/components/store/breadcrumbs"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { label: "Mi Perfil", href: "/cuenta" },
    { label: "Mis Pedidos", href: "/cuenta/pedidos" },
    { label: "Mi Lista de Deseos", href: "/cuenta/wishlist" },
    { label: "Mis Direcciones", href: "/cuenta/direcciones" },
  ]

  return (
    <div className="container px-4 py-8 mb-16">
      <Breadcrumbs items={[{ label: "Mi Cuenta" }]} />
      
      <div className="flex flex-col md:flex-row gap-8 mt-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="p-4 border rounded-2xl bg-card">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
               <div className="w-12 h-12 bg-primary/10 text-primary font-bold text-xl rounded-full flex items-center justify-center shrink-0">
                 JP
               </div>
               <div>
                 <p className="font-semibold px-1">Juan Pérez</p>
                 <p className="text-xs text-muted-foreground px-1">juan@ejemplo.com</p>
               </div>
            </div>
            
            <nav className="flex flex-col gap-1">
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              
              <button className="px-4 py-3 text-left rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4">
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
