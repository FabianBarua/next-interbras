"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { icons as lucideIcons } from "lucide-react"
import * as PhosphorIcons from "@phosphor-icons/react"

type Library = "lucide" | "phosphor"

interface IconPickerProps {
  value: string | null
  meta: { library: string; name: string } | null
  onChange: (svg: string | null, meta: { library: string; name: string } | null) => void
}

const ICONS_PER_PAGE = 120

// Build phosphor icon map once
const phosphorIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {}
for (const [key, val] of Object.entries(PhosphorIcons)) {
  if (typeof val === "function" && /^[A-Z]/.test(key) && key !== "IconContext" && key !== "IconBase") {
    phosphorIconMap[key] = val as React.ComponentType<{ size?: number; className?: string }>
  }
}
const phosphorNames = Object.keys(phosphorIconMap).sort()
const lucideNames = Object.keys(lucideIcons).sort()

export function IconPicker({ value, meta, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Library>("lucide")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const names = tab === "lucide" ? lucideNames : phosphorNames
    if (!search) return names
    const q = search.toLowerCase()
    return names.filter((n) => n.toLowerCase().includes(q))
  }, [tab, search])

  const totalPages = Math.ceil(filtered.length / ICONS_PER_PAGE)
  const visible = filtered.slice(page * ICONS_PER_PAGE, (page + 1) * ICONS_PER_PAGE)

  useEffect(() => {
    setPage(0)
    gridRef.current?.scrollTo(0, 0)
  }, [search, tab])

  const renderIcon = useCallback(
    (name: string, size = 20) => {
      if (tab === "lucide") {
        const LucideIcon = lucideIcons[name as keyof typeof lucideIcons]
        return LucideIcon ? <LucideIcon size={size} /> : null
      }
      const PhIcon = phosphorIconMap[name]
      return PhIcon ? <PhIcon size={size} /> : null
    },
    [tab],
  )

  const handleSelect = useCallback(
    (name: string) => {
      // Render SVG string
      const el = document.createElement("div")
      if (tab === "lucide") {
        const iconData = lucideIcons[name as keyof typeof lucideIcons]
        if (!iconData) return
        // Use a temporary render to get SVG
        const svgNs = "http://www.w3.org/2000/svg"
        const svg = document.createElementNS(svgNs, "svg")
        svg.setAttribute("xmlns", svgNs)
        svg.setAttribute("width", "24")
        svg.setAttribute("height", "24")
        svg.setAttribute("viewBox", "0 0 24 24")
        svg.setAttribute("fill", "none")
        svg.setAttribute("stroke", "currentColor")
        svg.setAttribute("stroke-width", "2")
        svg.setAttribute("stroke-linecap", "round")
        svg.setAttribute("stroke-linejoin", "round")
        svg.setAttribute("data-library", "lucide")
        svg.setAttribute("data-icon", name)
        // lucideIcons[name] is [tag, attrs] pairs
        for (const [tag, attrs] of (iconData as any)) {
          const child = document.createElementNS(svgNs, tag)
          for (const [k, v] of Object.entries(attrs as Record<string, string>)) {
            child.setAttribute(k, v)
          }
          svg.appendChild(child)
        }
        onChange(svg.outerHTML, { library: "lucide", name })
      } else {
        // For Phosphor, render to a temp container
        onChange(null, { library: "phosphor", name })
        // We'll capture from DOM
        const PhIcon = phosphorIconMap[name]
        if (!PhIcon) return
        // Use a simpler approach: store meta and render dynamically
        onChange(`<svg data-library="phosphor" data-icon="${name}"></svg>`, { library: "phosphor", name })
      }
      setOpen(false)
      setSearch("")
    },
    [tab, onChange],
  )

  const previewIcon = useMemo(() => {
    if (!meta) return null
    if (meta.library === "lucide") {
      const LucideIcon = lucideIcons[meta.name as keyof typeof lucideIcons]
      return LucideIcon ? <LucideIcon size={24} /> : null
    }
    const PhIcon = phosphorIconMap[meta.name]
    return PhIcon ? <PhIcon size={24} /> : null
  }, [meta])

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
          {previewIcon ?? <Search className="size-4 text-muted-foreground" />}
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
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar ícono</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-b pb-2">
            {(["lucide", "phosphor"] as const).map((lib) => (
              <button
                key={lib}
                onClick={() => setTab(lib)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tab === lib
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {lib === "lucide" ? `Lucide (${lucideNames.length})` : `Phosphor (${phosphorNames.length})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícono..."
              className="pl-9"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} ícono{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` — página ${page + 1} de ${totalPages}`}
          </p>

          {/* Grid */}
          <div ref={gridRef} className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
              {visible.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  title={name}
                  className={`flex items-center justify-center rounded-md p-2 transition-colors hover:bg-primary/10 ${
                    meta?.name === name && meta?.library === tab
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {renderIcon(name)}
                </button>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Render a saved icon from meta (for display in tables/pages) */
export function CategoryIcon({
  meta,
  size = 20,
  className,
}: {
  meta: { library: string; name: string } | null
  size?: number
  className?: string
}) {
  if (!meta) return null
  if (meta.library === "lucide") {
    const LucideIcon = lucideIcons[meta.name as keyof typeof lucideIcons]
    return LucideIcon ? <LucideIcon size={size} className={className} /> : null
  }
  const PhIcon = phosphorIconMap[meta.name]
  return PhIcon ? <PhIcon size={size} className={className} /> : null
}
