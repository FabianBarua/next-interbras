import Link from "@/i18n/link"
import { getSiteConfig } from "@/lib/site-config"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const site = await getSiteConfig()

  return (
    <div className="flex min-h-svh">
      {/* Branded side panel */}
      <div className="hidden w-[45%] flex-col justify-between bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 p-10 text-white lg:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {site.name}
        </Link>
        <div className="space-y-3">
          <blockquote className="text-lg/relaxed font-medium opacity-90">
            "Tecnología que conecta tu vida."
          </blockquote>
          <p className="text-sm opacity-60">{site.name}</p>
        </div>
        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 text-xl font-bold tracking-tight text-foreground lg:hidden"
        >
          {site.name}
        </Link>
        <div className="w-full max-w-105">{children}</div>
      </div>
    </div>
  )
}
