import Link from "next/link"
import { getSiteConfig } from "@/lib/site-config"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const site = await getSiteConfig()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-10 text-lg font-bold tracking-tight text-foreground"
      >
        {site.name}
      </Link>
      {children}
    </div>
  )
}
