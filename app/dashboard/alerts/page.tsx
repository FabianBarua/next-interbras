import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminAlerts } from "@/lib/db/schema"
import { markAlertRead, markAllAlertsRead } from "@/lib/actions/admin/alerts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"

export default async function AlertsPage() {
  const [alerts, tz] = await Promise.all([
    db.query.adminAlerts.findMany({
      orderBy: [desc(adminAlerts.createdAt)],
      limit: 100,
    }),
    getTimezone(),
  ])

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} alerta${unreadCount > 1 ? "s" : ""} sin leer`
              : "Ninguna alerta pendiente"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAlertsRead}>
            <Button variant="outline" size="sm" type="submit">
              Marcar todos como leídos
            </Button>
          </form>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Ninguna alerta registrada.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead className="w-40">Fecha</TableHead>
                <TableHead className="w-28 text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id} className={alert.read ? "opacity-60" : ""}>
                  <TableCell>
                    {!alert.read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alert.type === "paid_no_stock"
                          ? "destructive"
                          : alert.type === "refund"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {alert.type === "paid_no_stock"
                        ? "Sin stock"
                        : alert.type === "refund"
                          ? "Reembolso"
                          : alert.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm">
                    {alert.message}
                    {alert.orderId && (
                      <Link
                        href={`/dashboard/orders/${alert.orderId}`}
                        className="ml-2 text-xs text-primary hover:underline"
                      >
                        Ver pedido
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatInTimeZone(alert.createdAt, tz, "dd/MM, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    {!alert.read && (
                      <form action={markAlertRead.bind(null, alert.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          Marcar leído
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
