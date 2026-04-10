import Link from "@/i18n/link"
import {
  getEmailLogs,
  getEmailCounters,
  getTemplateSlugList,
} from "@/lib/actions/admin/email-logs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResendButton } from "./resend-button"
import { Mail, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"

type SearchParams = {
  page?: string
  search?: string
  status?: string
  template?: string
  from?: string
  to?: string
}

function buildQs(
  params: SearchParams,
  overrides: Record<string, string | undefined> = {},
) {
  const merged = { ...params, ...overrides }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) qs.set(k, v)
  }
  return qs.toString()
}

export default async function EmailHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const filters = {
    search: sp.search || "",
    status: (
      sp.status === "sent" || sp.status === "failed" ? sp.status : ""
    ) as "sent" | "failed" | "",
    template: sp.template || "",
    from: sp.from || "",
    to: sp.to || "",
  }

  const [{ logs, total, totalPages }, counters, templateSlugs, tz] =
    await Promise.all([
      getEmailLogs(page, filters),
      getEmailCounters(),
      getTemplateSlugList(),
      getTimezone(),
    ])

  const hasFilters = !!(
    filters.search ||
    filters.status ||
    filters.template ||
    filters.from ||
    filters.to
  )

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CounterCard
          label="Enviados hoy"
          value={counters.sentToday}
          icon={<CheckCircle className="h-4 w-4 text-primary" />}
          bg="bg-primary/10"
        />
        <CounterCard
          label="Fallos hoy"
          value={counters.failedToday}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          bg="bg-destructive/10"
        />
        <CounterCard
          label="Total enviados"
          value={counters.sentTotal}
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          bg="bg-muted"
        />
        <CounterCard
          label="Total fallos"
          value={counters.failedTotal}
          icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
          bg="bg-muted"
        />
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex-1 basis-48">
          <label
            htmlFor="search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={filters.search}
            placeholder="Email o asunto..."
            className="h-9"
          />
        </div>

        <div className="basis-32">
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="sent">Enviado</option>
            <option value="failed">Fallido</option>
          </select>
        </div>

        <div className="basis-40">
          <label
            htmlFor="template"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Template
          </label>
          <select
            id="template"
            name="template"
            defaultValue={filters.template}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            {templateSlugs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="basis-36">
          <label
            htmlFor="from"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Desde
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from}
            className="h-9"
          />
        </div>

        <div className="basis-36">
          <label
            htmlFor="to"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Hasta
          </label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to}
            className="h-9"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-9">
            Filtrar
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9" asChild>
              <Link href="/dashboard/emails/history">Limpiar</Link>
            </Button>
          )}
        </div>
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "resultado" : "resultados"}
          {hasFilters && " (filtrado)"}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinatario</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead className="w-20 text-center">Estado</TableHead>
              <TableHead className="w-44">Fecha</TableHead>
              <TableHead className="w-24 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "No hay resultados para esos filtros."
                    : "No se han enviado emails aún."}
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="max-w-[180px] truncate text-sm">
                  {log.to}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.templateSlug ?? "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">
                  {log.subject}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={log.status === "sent" ? "default" : "destructive"}
                  >
                    {log.status === "sent" ? "Enviado" : "Fallido"}
                  </Badge>
                  {log.error && (
                    <p
                      className="mt-1 max-w-[120px] truncate text-[10px] text-destructive"
                      title={log.error}
                    >
                      {log.error}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatInTimeZone(log.sentAt, tz, "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <ResendButton logId={log.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/emails/history?${buildQs(sp, { page: String(page - 1) })}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/emails/history?${buildQs(sp, { page: String(page + 1) })}`}
                >
                  Siguiente
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CounterCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string
  value: number
  icon: React.ReactNode
  bg: string
}) {
  return (
    <div className={`rounded-lg ${bg} p-4`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold">
        {value.toLocaleString("es-PY")}
      </p>
    </div>
  )
}
