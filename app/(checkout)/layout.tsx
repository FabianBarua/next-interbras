import Link from "next/link"
import Image from "next/image"
import { getSiteConfig } from "@/lib/site-config"
import { isEcommerceEnabled } from "@/lib/settings"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ecommerce = await isEcommerceEnabled()
  if (!ecommerce) redirect("/")

  const site = await getSiteConfig()
  const locale = await getLocale()
  const dict = await getDictionary()

  const backLabel = dict.checkout?.backToStore ?? (locale === "pt" ? "Voltar à loja" : "Volver a la tienda")

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b sticky top-0  border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            {site.logo ? (
              <Image
                src={site.logo}
                alt={site.name}
                width={120}
                height={32}
                className="h-7 w-auto"
              />
            ) : (
              <span className="text-lg font-bold tracking-tight">{site.name}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
