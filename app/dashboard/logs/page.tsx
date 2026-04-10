import { getEventLogs, getLogCounters, getLogCategories } from "@/lib/actions/admin/event-logs"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"
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
import { ScrollText, AlertTriangle, Activity, Webhook } from "lucide-react"
import Link from "next/link"
import { ClearLogsButton } from "./clear-button"
import { LogMetaViewer } from "./log-meta-viewer"

type SearchParams = {
  page?: string
  search?: string
  category?: string
  level?: string
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

const CATEGORY_COLORS: Record<string, string> = {
  "webhook-pyxpay": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  sistema: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  auth: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  pedidos: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  email: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  codigos: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
}

const LEVEL_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "bg-red-500/10 text-red-700 dark:text-red-300",
}

function formatDate(d: Date, tz: string) {
  return formatInTimeZone(new Date(d), tz, "dd/MM, HH:mm:ss")
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const filters = {
    search: sp.search || "",
    category: sp.category || "",
    level: sp.level || "",
    from: sp.from || "",
    to: sp.to || "",
  }

  const [{ logs, total, totalPages }, counters, categories, tz] = await Promise.all([
    getEventLogs(page, filters),
    getLogCounters(),
    getLogCategories(),
    getTimezone(),
  ])

  const hasFilters = !!(
    filters.search ||
    filters.category ||
    filters.level ||
    filters.from ||
    filters.to
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs del Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Registro de eventos, webhooks y actividades
          </p>
        </div>
        <ClearLogsButton />
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CounterCard
          label="Eventos hoy"
          value={counters.totalToday}
          icon={<Activity className="size-4 text-primary" />}
          bg="bg-primary/10"
        />
        <CounterCard
          label="Errores hoy"
          value={counters.errorsToday}
          icon={<AlertTriangle className="size-4 text-destructive" />}
          bg="bg-destructive/10"
        />
        <CounterCard
          label="Total registros"
          value={counters.total}
          icon={<ScrollText className="size-4 text-muted-foreground" />}
          bg="bg-muted"
        />
        <CounterCard
          label="Categorías"
          value={counters.byCategory.length}
          icon={<Webhook className="size-4 text-muted-foreground" />}
          bg="bg-muted"
        />
      </div>

      {/* Category breakdown */}
      {counters.byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counters.byCategory.map((c) => (
            <Link
              key={c.category}
              href={`/dashboard/logs?category=${c.category}`}
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className={`gap-1 ${CATEGORY_COLORS[c.category] ?? ""} ${filters.category === c.category ? "ring-2 ring-primary" : ""}`}
              >
                {c.category}
                <span className="ml-0.5 opacity-60">{c.count}</span>
              </Badge>
            </Link>
          ))}
          {filters.category && (
            <Link href="/dashboard/logs">
              <Badge variant="secondary" className="gap-1">
                ✕ Limpiar filtro
              </Badge>
            </Link>
          )}
        </div>
      )}

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex-1 basis-40">
          <label className="mb-1 block text-xs font-medium">Buscar</label>
          <Input
            name="search"
            placeholder="Acción o mensaje..."
            defaultValue={filters.search}
            className="h-9"
          />
        </div>
        <div className="basis-36">
          <label className="mb-1 block text-xs font-medium">Categoría</label>
          <select
            name="category"
            defaultValue={filters.category}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="basis-28">
          <label className="mb-1 block text-xs font-medium">Nivel</label>
          <select
            name="level"
            defaultValue={filters.level}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="basis-36">
          <label className="mb-1 block text-xs font-medium">Desde</label>
          <Input name="from" type="date" defaultValue={filters.from} className="h-9" />
        </div>
        <div className="basis-36">
          <label className="mb-1 block text-xs font-medium">Hasta</label>
          <Input name="to" type="date" defaultValue={filters.to} className="h-9" />
        </div>
        <Button type="submit" size="sm" className="h-9">
          Filtrar
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9" asChild>
            <Link href="/dashboard/logs">Limpiar</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Fecha/Hora</TableHead>
              <TableHead className="w-[120px]">Categoría</TableHead>
              <TableHead className="w-[70px]">Nivel</TableHead>
              <TableHead className="w-[140px]">Acción</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead className="w-[100px]">Datos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {hasFilters
                    ? "Ningún log encontrado con los filtros aplicados."
                    : "Ningún log registrado."}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(log.createdAt, tz)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${CATEGORY_COLORS[log.category] ?? ""}`}
                    >
                      {log.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${LEVEL_COLORS[log.level] ?? ""}`}
                    >
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">
                    {log.message}
                  </TableCell>
                  <TableCell>
                    <LogMetaViewer meta={log.meta} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""} — página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/logs?${buildQs(sp, { page: String(page - 1) })}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/logs?${buildQs(sp, { page: String(page + 1) })}`}
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
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`flex size-8 items-center justify-center rounded-md ${bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
