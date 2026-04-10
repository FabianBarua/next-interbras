import { db } from "@/lib/db"
import { gatewayConfig } from "@/lib/db/schema"
import { toggleGatewayInstance, deleteGatewayInstance } from "@/lib/actions/admin/gateway-config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PaymentsPage() {
  const instances = await db.query.gatewayConfig.findMany({
    orderBy: (t, { asc }) => [asc(t.type), asc(t.slug)],
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gateways de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Gestione instancias de gateway. Cada instancia puede tener dominios
            específicos o funcionar como fallback.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payments/new">Nuevo Gateway</Link>
        </Button>
      </div>

      {instances.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Ninguna instancia configurada. Cree una para comenzar.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((inst) => {
            const domains = inst.domains as string[]
            return (
              <div
                key={inst.id}
                className={`group relative flex flex-col gap-3 rounded-lg border-l-4 border border-border p-4 transition-colors hover:bg-muted/30 ${
                  inst.active
                    ? "border-l-emerald-500"
                    : "border-l-muted-foreground/30 opacity-60"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">
                      {inst.name || inst.slug}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {inst.displayName}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={inst.active ? "default" : "secondary"}
                      className={`text-[10px] px-1.5 py-0 ${
                        inst.active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                          : ""
                      }`}
                    >
                      {inst.active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge
                      variant={inst.sandbox ? "secondary" : "outline"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {inst.sandbox ? "Sandbox" : "Prod"}
                    </Badge>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge variant="secondary" className="text-[10px]">
                    {inst.type}
                  </Badge>
                  <span className="font-mono text-muted-foreground">{inst.slug}</span>
                </div>

                {/* Domains */}
                <div className="flex flex-wrap gap-1">
                  {domains.length > 0 ? (
                    domains.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px]">
                        {d}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] italic text-muted-foreground">
                      Fallback (todos los dominios)
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t pt-3">
                  <form action={toggleGatewayInstance.bind(null, inst.slug)}>
                    <Button
                      variant="outline"
                      size="sm"
                      type="submit"
                      className="h-7 text-xs"
                    >
                      {inst.active ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/dashboard/payments/${inst.slug}`}>Editar</Link>
                  </Button>
                  <form
                    action={deleteGatewayInstance.bind(null, inst.slug)}
                    className="ml-auto"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      type="submit"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
