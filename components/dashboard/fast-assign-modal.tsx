"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  Loader2,
  Unlink,
  Zap,
} from "lucide-react"
import {
  searchAvailableVariantsAction,
  bulkLinkVariantsAction,
} from "@/lib/actions/admin/external-codes"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FastAssignItem {
  id: string
  system: string
  code: string
  externalName: string | null
  currentVariantId: string | null
  currentVariantSku: string | null
}

interface VariantOption {
  id: string
  sku: string
  productName: string
  options: Record<string, string>
}

interface Assignment {
  variantId: string
  sku: string
  productName: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FastAssignModal({
  open,
  onClose,
  items,
  onComplete,
}: {
  open: boolean
  onClose: () => void
  items: FastAssignItem[]
  onComplete: () => void
}) {
  const total = items.length
  const [step, setStep] = useState(0)
  const [assignments, setAssignments] = useState<
    Map<string, Assignment | null>
  >(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<VariantOption[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<
    { ecId: string; ok: boolean; error?: string }[] | null
  >(null)

  const [hlIdx, setHlIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isSummary = step === total
  const currentItem = !isSummary ? items[step] : null

  /* ---------- focus input on every step change ---------- */
  useEffect(() => {
    if (!isSummary) {
      // use rAF so the DOM has re-rendered before we focus
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
      return () => cancelAnimationFrame(id)
    }
  }, [step, isSummary])

  /* ---------- search debounce ---------- */
  useEffect(() => {
    if (isSummary || !searchTerm.trim()) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchAvailableVariantsAction(searchTerm.trim())
        if (!ctrl.signal.aborted) setResults(r)
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [searchTerm, isSummary])

  /* ---------- reset search on step change ---------- */
  useEffect(() => {
    setSearchTerm("")
    setResults([])
    setHlIdx(-1)
  }, [step])

  /* ---------- reset all when modal opens ---------- */
  useEffect(() => {
    if (open) {
      setStep(0)
      setAssignments(new Map())
      setSearchTerm("")
      setResults([])
      setSubmitResult(null)
    }
  }, [open])

  /* ---------- helpers ---------- */
  const assign = (v: VariantOption) => {
    if (!currentItem) return
    setAssignments((prev) => {
      const m = new Map(prev)
      m.set(currentItem.id, {
        variantId: v.id,
        sku: v.sku,
        productName: v.productName,
      })
      return m
    })
  }

  /** assign + immediately go next */
  const assignAndAdvance = (v: VariantOption) => {
    assign(v)
    // setStep in the same tick so React batches both updates
    setStep((s) => Math.min(s + 1, total))
  }

  const markUnlink = () => {
    if (!currentItem) return
    setAssignments((prev) => {
      const m = new Map(prev)
      m.set(currentItem.id, null)
      return m
    })
  }

  const clearCurrent = () => {
    if (!currentItem) return
    setAssignments((prev) => {
      const m = new Map(prev)
      m.delete(currentItem.id)
      return m
    })
  }

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, total)), [total])
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), [])

  const currentAssignment = currentItem
    ? assignments.get(currentItem.id)
    : undefined

  /* ---------- stats ---------- */
  const assignedCount = Array.from(assignments.values()).filter(
    (a) => a !== undefined && a !== null,
  ).length
  const unlinkCount = Array.from(assignments.values()).filter(
    (a) => a === null,
  ).length
  const changesCount = assignedCount + unlinkCount

  /* ---------- confirm ---------- */
  const handleConfirm = async () => {
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const batch = Array.from(assignments.entries())
        .filter(([, a]) => a !== undefined)
        .map(([ecId, a]) => ({ ecId, variantId: a?.variantId ?? null }))
      if (batch.length > 0) {
        const res = await bulkLinkVariantsAction(batch)
        if ("results" in res && res.results) {
          setSubmitResult(res.results)
          const allOk = res.results.every((r) => r.ok)
          if (allOk) {
            onComplete()
            onClose()
          }
        } else if ("error" in res) {
          setSubmitResult([{ ecId: "", ok: false, error: String(res.error) }])
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- keyboard handler ---------- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitting) return

    // Arrow left/right navigate steps when input is empty
    if (e.key === "ArrowLeft" && !searchTerm) {
      e.preventDefault()
      goBack()
      return
    }
    if (e.key === "ArrowRight" && !searchTerm) {
      e.preventDefault()
      goNext()
      return
    }

    // Escape: clear search first, then let dialog close
    if (e.key === "Escape") {
      if (searchTerm) {
        e.preventDefault()
        e.stopPropagation()
        setSearchTerm("")
        setResults([])
        setHlIdx(-1)
      }
      return
    }

    // Tab = skip to next (no shift = next, shift = back)
    if (e.key === "Tab" && !isSummary) {
      e.preventDefault()
      e.shiftKey ? goBack() : goNext()
      return
    }

    if (!isSummary && results.length > 0) {
      // Arrow up/down to navigate results
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHlIdx((prev) => {
          const next = (prev + 1) % results.length
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" })
          return next
        })
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHlIdx((prev) => {
          const next = prev <= 0 ? results.length - 1 : prev - 1
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" })
          return next
        })
        return
      }
      // Enter on highlighted = select AND advance immediately
      if (e.key === "Enter" && hlIdx >= 0 && hlIdx < results.length) {
        e.preventDefault()
        assignAndAdvance(results[hlIdx])
        return
      }
    }

    // Enter with no results = skip to next
    if (e.key === "Enter" && !isSummary) {
      e.preventDefault()
      goNext()
      return
    }

    // Enter on summary = confirm
    if (e.key === "Enter" && isSummary && changesCount > 0) {
      e.preventDefault()
      handleConfirm()
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col gap-3"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" />
            Fast Assign
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {isSummary ? "Resumen" : `${step + 1} / ${total}`}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isSummary
              ? "Revisá las asignaciones antes de confirmar."
              : "Buscá y seleccioná una variante para este código externo."}
          </DialogDescription>
        </DialogHeader>

        {/* progress */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((isSummary ? total : step) / total) * 100}%` }}
          />
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
          {!isSummary && currentItem && (
            <>
              {/* EC card */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="uppercase text-[10px] shrink-0"
                    >
                      {currentItem.system}
                    </Badge>
                    <span className="font-mono text-sm font-medium truncate">
                      {currentItem.code}
                    </span>
                  </div>
                  {currentItem.externalName && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {currentItem.externalName}
                    </p>
                  )}
                  {currentItem.currentVariantSku && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Vinculada:{" "}
                      <span className="font-mono">
                        {currentItem.currentVariantSku}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* current assignment / unlink status */}
              {currentAssignment && (
                <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-primary/5 text-sm">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span className="font-mono text-xs">
                    {currentAssignment.sku}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    — {currentAssignment.productName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-6"
                    onClick={clearCurrent}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}
              {currentAssignment === null && (
                <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-orange-500/5 text-sm">
                  <Unlink className="size-3.5 text-orange-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Se desvinculará
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-6"
                    onClick={clearCurrent}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}

              {/* search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setHlIdx(-1)
                  }}
                  placeholder="Buscar variante por SKU o producto…"
                  className="h-9 w-full rounded-lg border pl-9 pr-9 text-sm bg-background"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* results */}
              <div ref={listRef} className="max-h-44 overflow-y-auto border rounded-lg divide-y">
                {results.length === 0 && searchTerm && !searching && (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Sin resultados
                  </p>
                )}
                {!searchTerm && !results.length && (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Escribí para buscar variantes disponibles
                  </p>
                )}
                {results.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => assignAndAdvance(v)}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2",
                      currentAssignment?.variantId === v.id && "bg-primary/10",
                      idx === hlIdx && "bg-muted/70",
                    )}
                  >
                    <span className="font-mono text-xs font-medium shrink-0">
                      {v.sku}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {v.productName}
                    </span>
                    {Object.entries(v.options).length > 0 && (
                      <div className="flex gap-1 shrink-0">
                        {Object.entries(v.options).map(([k, val]) => (
                          <Badge
                            key={k}
                            variant="outline"
                            className="text-[10px] px-1.5"
                          >
                            {String(val)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* unlink shortcut */}
              {currentItem.currentVariantSku &&
                currentAssignment !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-orange-500 hover:text-orange-600"
                    onClick={markUnlink}
                  >
                    <Unlink className="size-3 mr-1" /> Desvincular esta
                  </Button>
                )}
            </>
          )}

          {/* ---------- SUMMARY ---------- */}
          {isSummary && (
            <>
              <div className="flex gap-4 text-xs">
                <span className="text-primary font-medium">
                  {assignedCount} asignados
                </span>
                <span className="text-orange-500">
                  {unlinkCount} desvinculados
                </span>
                <span className="text-muted-foreground">
                  {total - changesCount} sin cambios
                </span>
              </div>

              {/* submit errors */}
              {submitResult && submitResult.some((r) => !r.ok) && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                  Algunos errores:{" "}
                  {submitResult
                    .filter((r) => !r.ok)
                    .map((r) => `${r.ecId.slice(0, 8)}… ${r.error}`)
                    .join(", ")}
                </div>
              )}

              <div className="border rounded-lg divide-y max-h-[45vh] overflow-y-auto">
                {items.map((item, i) => {
                  const a = assignments.get(item.id)
                  const err = submitResult?.find(
                    (r) => r.ecId === item.id && !r.ok,
                  )
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-xs",
                        err && "bg-destructive/5",
                      )}
                    >
                      <span className="text-muted-foreground w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <Badge
                        variant="secondary"
                        className="uppercase text-[10px] shrink-0"
                      >
                        {item.system}
                      </Badge>
                      <span className="font-mono shrink-0">{item.code}</span>
                      <span className="text-muted-foreground">→</span>
                      {a === undefined ? (
                        <span className="text-muted-foreground italic">
                          sin cambios
                        </span>
                      ) : a === null ? (
                        <span className="text-orange-500 font-medium">
                          desvincular
                        </span>
                      ) : (
                        <span className="font-mono text-primary">
                          {a.sku}
                        </span>
                      )}
                      {err && (
                        <span className="text-destructive ml-1">
                          ✗ {err.error}
                        </span>
                      )}
                      <button
                        className="ml-auto text-muted-foreground hover:text-foreground text-[11px] underline"
                        onClick={() => setStep(i)}
                      >
                        editar
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ---------- FOOTER ---------- */}
        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={step === 0}
          >
            <ChevronLeft className="size-4 mr-1" /> Atrás
          </Button>

          <div className="flex gap-2">
            {!isSummary && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    goNext()
                  }}
                >
                  Saltar
                </Button>
                <Button
                  size="sm"
                  onClick={goNext}
                  disabled={currentAssignment === undefined}
                >
                  Siguiente <ChevronRight className="size-4 ml-1" />
                </Button>
              </>
            )}
            {isSummary && (
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={submitting || changesCount === 0}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Check className="size-4 mr-1" />
                )}
                Confirmar ({changesCount})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
