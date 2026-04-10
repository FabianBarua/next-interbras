import { getSeoPages } from "@/lib/actions/admin/seo"
import { getSiteConfig } from "@/lib/site-config"
import { SeoManager } from "./seo-manager"

const KNOWN_PAGES = [
  { path: "/", label: "Inicio" },
  { path: "/productos", label: "Productos" },
  { path: "/faq", label: "FAQ" },
  { path: "/contacto", label: "Contacto" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Registro" },
  { path: "/checkout", label: "Checkout" },
]

export default async function DashboardSeoPage() {
  const pages = await getSeoPages()
  const site = await getSiteConfig()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">SEO</h1>
        <p className="text-sm text-muted-foreground">
          Gestione títulos, descripciones, Open Graph, robots y datos estructurados de
          cada página.
        </p>
      </div>

      <SeoManager
        pages={pages}
        knownPages={KNOWN_PAGES}
        siteUrl={site.url}
        siteName={site.name}
      />
    </div>
  )
}
