"use client"

import { useState, useMemo, useCallback, useRef, useEffect, createElement } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, X, Loader2 } from "lucide-react"
import type { IconType } from "react-icons"

interface IconPickerProps {
  value: string | null
  meta: { library: string; name: string } | null
  onChange: (svg: string | null, meta: { library: string; name: string } | null) => void
}

const ICONS_PER_PAGE = 150

/* ------------------------------------------------------------------ */
/*  Library registry – lazy-loaded from react-icons                   */
/* ------------------------------------------------------------------ */

const LIBRARIES = [
  { id: "lu", label: "Lucide",           loader: () => import("react-icons/lu") },
  { id: "tb", label: "Tabler",           loader: () => import("react-icons/tb") },
  { id: "pi", label: "Phosphor",         loader: () => import("react-icons/pi") },
  { id: "fa6", label: "Font Awesome",    loader: () => import("react-icons/fa6") },
  { id: "md", label: "Material Design",  loader: () => import("react-icons/md") },
  { id: "hi2", label: "Heroicons",       loader: () => import("react-icons/hi2") },
  { id: "bs", label: "Bootstrap",        loader: () => import("react-icons/bs") },
  { id: "ri", label: "Remix",            loader: () => import("react-icons/ri") },
] as const

type LibId = (typeof LIBRARIES)[number]["id"]

type IconEntry = { name: string; lib: LibId; Icon: IconType }

const LIB_COLORS: Record<string, string> = {
  lu: "bg-blue-400",
  tb: "bg-cyan-400",
  pi: "bg-emerald-400",
  fa6: "bg-orange-400",
  md: "bg-purple-400",
  hi2: "bg-pink-400",
  bs: "bg-yellow-400",
  ri: "bg-red-400",
}

// Backward-compat mapping for old meta stored as "lucide"/"phosphor"
const LEGACY_LIB_MAP: Record<string, { lib: LibId; prefix: string }> = {
  lucide: { lib: "lu", prefix: "Lu" },
  phosphor: { lib: "pi", prefix: "Pi" },
}

/* ---------- global cache ------------------------------------------ */

let cachedIcons: IconEntry[] | null = null
let loadPromise: Promise<IconEntry[]> | null = null

function isComponent(val: unknown): val is IconType {
  return (
    typeof val === "function" ||
    (typeof val === "object" && val !== null && "$$typeof" in val)
  )
}

async function loadAllIcons(): Promise<IconEntry[]> {
  if (cachedIcons) return cachedIcons
  if (loadPromise) return loadPromise

  loadPromise = Promise.all(
    LIBRARIES.map(async (lib) => {
      const mod = await lib.loader()
      const entries: IconEntry[] = []
      for (const [name, Component] of Object.entries(mod)) {
        if (name !== "default" && isComponent(Component)) {
          entries.push({ name, lib: lib.id, Icon: Component })
        }
      }
      return entries
    }),
  ).then((results) => {
    const all = results.flat().sort((a, b) => a.name.localeCompare(b.name))
    cachedIcons = all
    return all
  })

  return loadPromise
}

/* ---------- single-icon resolver (for CategoryIcon) --------------- */

const singleIconCache = new Map<string, IconType | null>()

async function resolveIcon(library: string, name: string): Promise<IconType | null> {
  let lib = library
  let iconName = name

  // Handle legacy meta format
  const legacy = LEGACY_LIB_MAP[library]
  if (legacy) {
    lib = legacy.lib
    iconName = name.startsWith(legacy.prefix) ? name : `${legacy.prefix}${name}`
  }

  const key = `${lib}:${iconName}`
  if (singleIconCache.has(key)) return singleIconCache.get(key)!

  const libDef = LIBRARIES.find((l) => l.id === lib)
  if (!libDef) { singleIconCache.set(key, null); return null }

  try {
    const mod = await libDef.loader()
    const Component = (mod as Record<string, unknown>)[iconName]
    const result = isComponent(Component) ? Component : null
    singleIconCache.set(key, result)
    return result
  } catch {
    singleIconCache.set(key, null)
    return null
  }
}

/* ================================================================== */
/*  IconPicker                                                        */
/* ================================================================== */

export function IconPicker({ meta, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [icons, setIcons] = useState<IconEntry[]>(() => cachedIcons ?? [])
  const [loadingAsync, setLoadingAsync] = useState(false)
  const [activeLibs, setActiveLibs] = useState<Set<LibId> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const loadStarted = useRef(false)

  const loading = icons.length === 0 && (loadingAsync || loadStarted.current)

  // Load icons when dialog opens (only if not already cached)
  useEffect(() => {
    if (!open || icons.length > 0 || loadStarted.current) return
    loadStarted.current = true
    setLoadingAsync(true)
    loadAllIcons().then((result) => {
      setIcons(result)
      setLoadingAsync(false)
    })
  }, [open, icons.length])

  // Auto-focus search
  useEffect(() => {
    if (open && !loading) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, loading])

  const libCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const lib of LIBRARIES) counts[lib.id] = 0
    for (const icon of icons) counts[icon.lib] = (counts[icon.lib] || 0) + 1
    return counts
  }, [icons])

  const filtered = useMemo(() => {
    let result = icons
    if (activeLibs) result = result.filter((i) => activeLibs.has(i.lib))
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q))
    }
    return result
  }, [icons, search, activeLibs])

  const totalPages = Math.ceil(filtered.length / ICONS_PER_PAGE)
  const visible = filtered.slice(page * ICONS_PER_PAGE, (page + 1) * ICONS_PER_PAGE)

  // Reset page via scroll effect (non-setState)
  const scrollKeyRef = useRef({ search, activeLibs })
  useEffect(() => {
    if (search !== scrollKeyRef.current.search || activeLibs !== scrollKeyRef.current.activeLibs) {
      scrollKeyRef.current = { search, activeLibs }
      gridRef.current?.scrollTo(0, 0)
    }
  })

  const toggleLib = useCallback((lib: LibId) => {
    setActiveLibs((prev) => {
      if (!prev) return new Set([lib])
      const next = new Set(prev)
      if (next.has(lib)) { next.delete(lib); return next.size === 0 ? null : next }
      next.add(lib)
      return next
    })
    setPage(0)
  }, [])

  const handleSelect = useCallback(
    (entry: IconEntry) => {
      const container = document.createElement("div")
      const root = createRoot(container)
      flushSync(() => {
        root.render(createElement(entry.Icon, { size: 24 }))
      })
      const svg = container.querySelector("svg")
      if (svg) {
        svg.setAttribute("data-library", entry.lib)
        svg.setAttribute("data-icon", entry.name)
        onChange(svg.outerHTML, { library: entry.lib, name: entry.name })
      }
      root.unmount()
      setOpen(false)
      setSearch("")
    },
    [onChange],
  )

  /* ---------- preview (button outside dialog) ---------------------- */

  const metaKey = meta ? `${meta.library}:${meta.name}` : null

  // Sync: check global cache
  const syncPreview = useMemo(() => {
    if (!meta) return null
    if (!cachedIcons) return null
    let lib = meta.library
    let name = meta.name
    const legacy = LEGACY_LIB_MAP[lib]
    if (legacy) { lib = legacy.lib; name = name.startsWith(legacy.prefix) ? name : `${legacy.prefix}${name}` }
    const found = cachedIcons.find((i) => i.lib === lib && i.name === name)
    return found ? found.Icon : null
  }, [meta])

  // Async: resolve on cache miss
  const [asyncPreview, setAsyncPreview] = useState<{ key: string; Icon: IconType } | null>(null)

  useEffect(() => {
    if (!meta || syncPreview) return
    let cancelled = false
    resolveIcon(meta.library, meta.name).then((r) => {
      if (!cancelled && r) setAsyncPreview({ key: `${meta.library}:${meta.name}`, Icon: r })
    })
    return () => { cancelled = true }
  }, [meta, syncPreview])

  const PreviewIcon = syncPreview ?? (asyncPreview?.key === metaKey ? asyncPreview.Icon : null)

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Ícono SVG</label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="h-12 w-12 p-0"
        >
          {PreviewIcon ? <PreviewIcon size={24} /> : <Search className="size-4 text-muted-foreground" />}
        </Button>
        {meta && (
          <>
            <span className="text-xs text-muted-foreground">
              {meta.library}/{meta.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null, null)}
              className="h-7 w-7 p-0"
            >
              <X className="size-3.5" />
            </Button>
          </>
        )}
        {!meta && (
          <span className="text-xs text-muted-foreground">Sin ícono seleccionado</span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl h-[75vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar ícono</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {icons.length.toLocaleString()} íconos de {LIBRARIES.length} librerías
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando librerías de íconos…</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                  placeholder="Buscar en todas las librerías…"
                  className="pl-9"
                />
              </div>

              {/* Library filter chips */}
              <div className="flex flex-wrap gap-1.5">
                {LIBRARIES.map((lib) => {
                  const active = !activeLibs || activeLibs.has(lib.id)
                  return (
                    <button
                      key={lib.id}
                      onClick={() => toggleLib(lib.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        active
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={`size-2 rounded-full ${LIB_COLORS[lib.id]}`} />
                      {lib.label}
                      <span className="text-muted-foreground">
                        {(libCounts[lib.id] || 0).toLocaleString()}
                      </span>
                    </button>
                  )
                })}
                {activeLibs && (
                  <button
                    onClick={() => setActiveLibs(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-3" /> Limpiar
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {filtered.length.toLocaleString()} resultado{filtered.length !== 1 ? "s" : ""}
                {totalPages > 1 && ` — página ${page + 1} de ${totalPages}`}
              </p>

              {/* Grid */}
              <div ref={gridRef} className="flex-1 overflow-auto min-h-56">
                <div className="grid grid-cols-8 sm:grid-cols-10  gap-1">
                  {visible.map((entry) => (
                    <button
                      key={`${entry.lib}:${entry.name}`}
                      type="button"
                      onClick={() => handleSelect(entry)}
                      title={`${entry.name} (${entry.lib})`}
                      className={`group relative flex items-center justify-center rounded-md p-2 transition-colors ${
                        meta?.name === entry.name && meta?.library === entry.lib
                          ? "bg-primary/10 ring-1 ring-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <entry.Icon size={20} />
                      <span
                        className={`absolute top-0.5 right-0.5 size-2 rounded-full ${LIB_COLORS[entry.lib] ?? "bg-gray-400"} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================================================== */
/*  CategoryIcon – renders a saved icon from meta via react-icons     */
/*  Used only in dashboard (admin) for previewing selected icons      */
/* ================================================================== */

export function CategoryIcon({
  meta,
  size = 20,
  className,
}: {
  meta: { library: string; name: string } | null
  size?: number
  className?: string
}) {
  const metaKey = meta ? `${meta.library}:${meta.name}` : null

  const cachedIcon = useMemo(() => {
    if (!meta) return null
    if (!cachedIcons) return null
    let lib = meta.library
    let name = meta.name
    const legacy = LEGACY_LIB_MAP[lib]
    if (legacy) { lib = legacy.lib; name = name.startsWith(legacy.prefix) ? name : `${legacy.prefix}${name}` }
    return cachedIcons.find((i) => i.lib === lib && i.name === name)?.Icon ?? null
  }, [meta])

  const [asyncIcon, setAsyncIcon] = useState<{ key: string; Icon: IconType } | null>(null)

  useEffect(() => {
    if (!meta || cachedIcon) return
    let cancelled = false
    resolveIcon(meta.library, meta.name).then((r) => {
      if (!cancelled && r) setAsyncIcon({ key: `${meta.library}:${meta.name}`, Icon: r })
    })
    return () => { cancelled = true }
  }, [meta, cachedIcon])

  const Icon = cachedIcon ?? (asyncIcon?.key === metaKey ? asyncIcon.Icon : null)
  if (!Icon) return null
  return <Icon size={size} className={className} />
}
