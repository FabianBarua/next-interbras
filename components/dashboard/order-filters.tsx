"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  useCallback,
  useTransition,
  useState,
  useRef,
  useEffect,
} from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SlidersHorizontal, X, Search, Globe, Check } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────

export interface OrderFiltersState {
  search: string
  status: string
  dateFrom: string
  dateTo: string
  minTotal: string
  maxTotal: string
  transactionId: string
  domains: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700",
  CONFIRMED:
    "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700",
  PROCESSING:
    "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700",
  SHIPPED:
    "bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700",
  DELIVERED:
    "bg-green-500/10 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700",
  CANCELLED:
    "bg-gray-500/10 text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-600",
}

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]

const QUICK_RANGES = [
  { label: "Hoy", hours: 0 },
  { label: "7d", hours: 7 * 24 },
  { label: "30d", hours: 30 * 24 },
  { label: "90d", hours: 90 * 24 },
]

// ─── Helpers ──────────────────────────────────────────────────────

function buildQs(f: OrderFiltersState, page = 1): string {
  const p = new URLSearchParams()
  if (f.search) p.set("search", f.search)
  if (f.status) p.set("status", f.status)
  if (f.dateFrom) p.set("dateFrom", f.dateFrom)
  if (f.dateTo) p.set("dateTo", f.dateTo)
  if (f.minTotal) p.set("minTotal", f.minTotal)
  if (f.maxTotal) p.set("maxTotal", f.maxTotal)
  if (f.transactionId) p.set("transactionId", f.transactionId)
  if (f.domains) p.set("domains", f.domains)
  if (page > 1) p.set("page", String(page))
  return p.toString()
}

function fmtDt(dt: string) {
  if (!dt) return ""
  const [date, time] = dt.split("T")
  const [y, m, d] = (date ?? "").split("-")
  if (!d) return dt
  return time ? `${d}/${m} ${time}` : `${d}/${m}/${y}`
}

function countApplied(f: OrderFiltersState) {
  return [
    f.dateFrom,
    f.dateTo,
    f.minTotal,
    f.maxTotal,
    f.transactionId,
    f.domains,
  ].filter(Boolean).length
}

const EMPTY: OrderFiltersState = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  minTotal: "",
  maxTotal: "",
  transactionId: "",
  domains: "",
}

// ─── Component ────────────────────────────────────────────────────

interface OrderFiltersProps {
  initialFilters: OrderFiltersState
  statusCounts: Record<string, number>
  availableDomains: string[]
}

export function OrderFilters({
  initialFilters,
  statusCounts,
  availableDomains,
}: OrderFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [applied, setApplied] = useState<OrderFiltersState>(initialFilters)
  const [pending, setPending] = useState<OrderFiltersState>(initialFilters)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setApplied(initialFilters)
  }, [initialFilters])

  useEffect(() => {
    if (open) setPending(applied)
  }, [open, applied])

  const navigate = useCallback(
    (f: OrderFiltersState, page = 1) => {
      const params = new URLSearchParams(buildQs(f, page))
      const sb = searchParams.get("sortBy")
      const so = searchParams.get("sortOrder")
      if (sb) params.set("sortBy", sb)
      if (so) params.set("sortOrder", so)
      const qs = params.toString()
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
    },
    [router, pathname, searchParams, startTransition],
  )

  const handleSearch = (value: string) => {
    const next = { ...applied, search: value }
    setApplied(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(next), 400)
  }

  const toggleStatus = (s: string) => {
    const next = { ...applied, status: applied.status === s ? "" : s }
    setApplied(next)
    navigate(next)
  }

  const handleApply = () => {
    setApplied(pending)
    setOpen(false)
    navigate(pending)
  }

  const handlePopoverReset = () => {
    const next = {
      ...applied,
      dateFrom: "",
      dateTo: "",
      minTotal: "",
      maxTotal: "",
      transactionId: "",
    }
    setPending({ ...next })
    setApplied(next)
    setOpen(false)
    navigate(next)
  }

  const clearChip = (key: keyof OrderFiltersState) => {
    const next = { ...applied, [key]: "" }
    setApplied(next)
    navigate(next)
  }

  const appliedCount = countApplied(applied)
  const hasAnything = appliedCount > 0 || applied.search || applied.status

  const selectedDomains = applied.domains
    ? applied.domains.split(",").filter(Boolean)
    : []
  const [domainOpen, setDomainOpen] = useState(false)
  const [domainSearch, setDomainSearch] = useState("")

  const toggleDomain = (domain: string) => {
    const current = new Set(selectedDomains)
    if (current.has(domain)) current.delete(domain)
    else current.add(domain)
    const next = { ...applied, domains: [...current].join(",") }
    setApplied(next)
    navigate(next)
  }

  const clearDomain = (domain: string) => {
    const current = selectedDomains.filter((d) => d !== domain)
    const next = { ...applied, domains: current.join(",") }
    setApplied(next)
    navigate(next)
  }

  const filteredDomains = domainSearch
    ? availableDomains.filter((d) =>
        d.toLowerCase().includes(domainSearch.toLowerCase()),
      )
    : availableDomains

  return (
    <div className="mb-5 space-y-2.5">
      {/* Row 1: search + filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Nombre, email, documento, teléfono..."
            value={applied.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-9 pr-8"
          />
          {applied.search && (
            <button
              onClick={() => {
                const n = { ...applied, search: "" }
                setApplied(n)
                navigate(n)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Domain multiselect */}
        {availableDomains.length > 0 && (
          <Popover
            open={domainOpen}
            onOpenChange={(v) => {
              setDomainOpen(v)
              if (!v) setDomainSearch("")
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant={selectedDomains.length > 0 ? "default" : "outline"}
                size="sm"
                className="gap-1.5 shrink-0 h-9"
              >
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">Dominios</span>
                {selectedDomains.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 h-4 min-w-4 px-1 text-[10px] leading-none bg-background text-foreground"
                  >
                    {selectedDomains.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-0 gap-0"
              sideOffset={6}
            >
              <div className="border-b px-3 py-2">
                <Input
                  placeholder="Buscar dominio..."
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-56 overflow-y-auto p-2 py-3 flex flex-col gap-[2px]">
                {filteredDomains.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Ningún dominio encontrado
                  </p>
                )}
                {filteredDomains.map((domain) => {
                  const isSelected = selectedDomains.includes(domain)
                  return (
                    <button
                      key={domain}
                      onClick={() => toggleDomain(domain)}
                      className="flex w-full items-center rounded-full gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                      <span className="truncate font-mono text-xs">
                        {domain}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedDomains.length > 0 && (
                <div className="border-t px-3 py-2">
                  <button
                    onClick={() => {
                      const next = { ...applied, domains: "" }
                      setApplied(next)
                      navigate(next)
                      setDomainOpen(false)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpiar selección
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={appliedCount > 0 ? "default" : "outline"}
              size="sm"
              className="gap-1.5 shrink-0 h-9"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {appliedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 min-w-4 px-1 text-[10px] leading-none bg-background text-foreground"
                >
                  {appliedCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-[min(420px,calc(100vw-24px))] p-0"
            sideOffset={6}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Filtros avanzados</p>
              <button
                onClick={handlePopoverReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-5 p-4">
              {/* Period */}
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Período
                </Label>
                <div className="mb-3 flex gap-1.5">
                  {QUICK_RANGES.map(({ label, hours }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        const to = new Date()
                        const from = new Date()
                        if (hours === 0) {
                          from.setHours(0, 0, 0, 0)
                        } else {
                          from.setTime(from.getTime() - hours * 3600_000)
                        }
                        const fmt = (d: Date) =>
                          format(d, "yyyy-MM-dd'T'HH:mm")
                        setPending((prev) => ({
                          ...prev,
                          dateFrom: fmt(from),
                          dateTo: fmt(to),
                        }))
                      }}
                      className="flex-1 rounded-md border border-border py-1.5 text-xs text-muted-foreground hover:border-foreground/40 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Desde</p>
                    <Input
                      type="datetime-local"
                      value={pending.dateFrom}
                      onChange={(e) =>
                        setPending((p) => ({
                          ...p,
                          dateFrom: e.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Hasta</p>
                    <Input
                      type="datetime-local"
                      value={pending.dateTo}
                      onChange={(e) =>
                        setPending((p) => ({ ...p, dateTo: e.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Total range */}
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Valor total (US$)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Mínimo
                    </p>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      value={pending.minTotal}
                      onChange={(e) =>
                        setPending((p) => ({
                          ...p,
                          minTotal: e.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Máximo
                    </p>
                    <Input
                      type="number"
                      placeholder="9,999.99"
                      min={0}
                      step={0.01}
                      value={pending.maxTotal}
                      onChange={(e) =>
                        setPending((p) => ({
                          ...p,
                          maxTotal: e.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* PIX E2E */}
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comprobante PIX (E2E ID)
                </Label>
                <Input
                  placeholder="Ej: E00360305202603201320..."
                  value={pending.transactionId ?? ""}
                  onChange={(e) =>
                    setPending((p) => ({
                      ...p,
                      transactionId: e.target.value.trim().slice(0, 100),
                    }))
                  }
                  className="h-9 text-sm font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Búsqueda parcial — bastan los primeros caracteres
                </p>
              </div>
            </div>

            <div className="border-t px-4 py-3">
              <Button size="sm" className="w-full" onClick={handleApply}>
                Aplicar filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 2: status chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
              applied.status === s
                ? STATUS_COLORS[s]
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[s]}
            <span className="opacity-50">({statusCounts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Row 3: filter chips */}
      {(appliedCount > 0 || applied.status) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {applied.status && (
            <Chip
              label={STATUS_LABELS[applied.status] ?? applied.status}
              onRemove={() => clearChip("status")}
            />
          )}
          {selectedDomains.map((d) => (
            <Chip key={d} label={d} onRemove={() => clearDomain(d)} />
          ))}
          {applied.dateFrom && (
            <Chip
              label={`Desde: ${fmtDt(applied.dateFrom)}`}
              onRemove={() => clearChip("dateFrom")}
            />
          )}
          {applied.dateTo && (
            <Chip
              label={`Hasta: ${fmtDt(applied.dateTo)}`}
              onRemove={() => clearChip("dateTo")}
            />
          )}
          {applied.minTotal && (
            <Chip
              label={`Mín US$ ${applied.minTotal}`}
              onRemove={() => clearChip("minTotal")}
            />
          )}
          {applied.maxTotal && (
            <Chip
              label={`Máx US$ ${applied.maxTotal}`}
              onRemove={() => clearChip("maxTotal")}
            />
          )}
          {applied.transactionId && (
            <Chip
              label={`E2E: ${applied.transactionId.slice(0, 12)}…`}
              onRemove={() => clearChip("transactionId")}
            />
          )}
          {hasAnything && (
            <button
              onClick={() => {
                setApplied(EMPTY)
                navigate(EMPTY)
              }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Chip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full transition-colors hover:text-primary/60"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
