import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-session"
import { getCatalogDataset } from "@/lib/pdf/data"
import { getSiteConfig } from "@/lib/site-config"
import { CatalogBuilder } from "@/components/pdf/catalog-builder"
import { HydrationGate } from "@/components/pdf/hydration-gate"

export const dynamic = "force-dynamic"

export default async function PdfCatalogPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") notFound()

  const [{ entries, categories }, site] = await Promise.all([
    getCatalogDataset(),
    getSiteConfig(),
  ])

  return (
    <HydrationGate
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <svg className="size-6 animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading" role="status">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      }
    >
      <CatalogBuilder
        entries={entries}
        categories={categories}
        siteName={site.name}
      />
    </HydrationGate>
  )
}
