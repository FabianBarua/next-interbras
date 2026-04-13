import Link from "next/link"
import { searchCustomers, getCustomerStats } from "@/lib/actions/admin/customers"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, UserPlus, Shield, TrendingUp, Globe, Mail } from "lucide-react"

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDocument(docType: string | null, docNumber: string | null) {
  if (!docNumber) return "—"
  return docType ? `${docType}: ${docNumber}` : docNumber
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-amber-500/10 text-amber-700 border-amber-300",
  support: "bg-blue-500/10 text-blue-700 border-blue-300",
  user: "bg-secondary text-secondary-foreground border-transparent",
}
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  support: "Soporte",
  user: "Usuario",
}

function buildQs(params: Record<string, string>, page: number): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v)
  }
  if (page > 1) qs.set("page", String(page))
  return qs.toString()
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    role?: string
    sort?: string
    provider?: string
  }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const filters = {
    search: (sp.search ?? "").slice(0, 100),
    role: sp.role ?? "",
    sort: sp.sort ?? "",
    provider: sp.provider ?? "",
  }

  const [result, stats, tz] = await Promise.all([
    searchCustomers({
      page,
      search: filters.search || undefined,
      role: filters.role || undefined,
      sort: filters.sort || undefined,
      provider: filters.provider || undefined,
    }),
    getCustomerStats(),
    getTimezone(),
  ])

  const hasFilters = !!(filters.search || filters.role || filters.provider)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {result.total} cliente{result.total !== 1 ? "s" : ""} registrado{result.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Users className="size-4 text-primary" />} bg="bg-primary/10" />
        <StatCard label="Nuevos hoy" value={stats.today} icon={<UserPlus className="size-4 text-emerald-600" />} bg="bg-emerald-500/10" />
        <StatCard label="Esta semana" value={stats.thisWeek} icon={<TrendingUp className="size-4 text-blue-600" />} bg="bg-blue-500/10" />
        <StatCard label="Admins" value={stats.admins} icon={<Shield className="size-4 text-amber-600" />} bg="bg-amber-500/10" />
      </div>

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-muted-foreground">
            Buscar
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={filters.search}
            placeholder="Nombre, email, documento..."
            className="h-9"
          />
        </div>
        <div className="w-36">
          <label htmlFor="role" className="mb-1 block text-xs font-medium text-muted-foreground">
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue={filters.role}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="user">Usuario</option>
            <option value="support">Soporte</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="w-36">
          <label htmlFor="provider" className="mb-1 block text-xs font-medium text-muted-foreground">
            Proveedor
          </label>
          <select
            id="provider"
            name="provider"
            defaultValue={filters.provider}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="credentials">Email/Contraseña</option>
            <option value="google">Google</option>
          </select>
        </div>
        <Button type="submit" size="sm" className="h-9">
          Filtrar
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9" asChild>
            <Link href="/dashboard/customers">Limpiar</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Documento</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="w-20 text-center">Pedidos</TableHead>
              <TableHead className="w-28 text-right">Total gastado</TableHead>
              <TableHead className="w-24 text-center">Rol</TableHead>
              <TableHead className="hidden lg:table-cell w-28">Registro</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  Ningún cliente encontrado con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              result.customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(c.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name ?? "Sin nombre"}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                          {c.authProvider === "google" ? (
                            <span title="Google"><Globe className="size-3 shrink-0 text-muted-foreground" /></span>
                          ) : (
                            <span title="Email/Contraseña"><Mail className="size-3 shrink-0 text-muted-foreground" /></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {formatDocument(c.documentType, c.documentNumber)}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {c.phone || "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm">{c.orderCount}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {c.totalSpent > 0 ? `US$ ${fmt(c.totalSpent)}` : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ROLE_BADGE[c.role] ?? ""}`}
                    >
                      {ROLE_LABEL[c.role] ?? c.role}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatInTimeZone(c.createdAt, tz, "dd/MM/yy")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/customers/${c.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/customers?${buildQs(filters, result.page - 1)}`}>
                  Anterior
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/customers?${buildQs(filters, result.page + 1)}`}>
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

function StatCard({
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
