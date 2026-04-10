import { AffiliateNav } from "@/components/dashboard/affiliate-nav"

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Afiliados</h1>
        <p className="text-sm text-muted-foreground">
          Gestione sus afiliados, comisiones y pagos.
        </p>
      </div>

      <AffiliateNav />

      <div>{children}</div>
    </div>
  )
}
