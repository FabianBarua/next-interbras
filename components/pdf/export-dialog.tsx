"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useDictionary } from "@/i18n/context"
import { exportPdf, type ExportProgress } from "@/lib/pdf/export"
import { Download, Check, CircleNotch, Desktop, DeviceMobile } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/i18n/dictionaries/es"
import type { Viewport } from "@/lib/pdf/types"

type CatalogDict = Dictionary["catalog"]

interface Props {
  open: boolean
  onClose: () => void
  getTargets: () => HTMLElement[]
  /** Called before capture — receives the chosen format so width can be forced. */
  onBeforeExport: (format: Viewport) => Promise<void>
  onAfterExport: () => void
  fileName: string
}

function formatStage(p: ExportProgress, t: CatalogDict): string {
  const current = Math.min(p.index + 1, p.total)
  switch (p.stage) {
    case "capturing":
      return t.exportCapturing.replace("{current}", String(current)).replace("{total}", String(p.total))
    case "rendering":
      return t.exportRendering.replace("{current}", String(current)).replace("{total}", String(p.total))
    case "saving":
      return t.exportSaving
    case "done":
      return t.exportDone
  }
}

export function ExportDialog({
  open,
  onClose,
  getTargets,
  onBeforeExport,
  onAfterExport,
  fileName,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog

  const [format, setFormat] = useState<Viewport>("desktop")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)

  async function handleStart() {
    setBusy(true)
    setProgress({ index: 0, total: 1, stage: "capturing" })

    await onBeforeExport(format)

    const targets = getTargets()
    if (targets.length === 0) {
      setBusy(false)
      return
    }

    try {
      await exportPdf({
        targets,
        fileName: `${fileName}-${format}`,
        pixelRatio: 2,
        onProgress: (p) => setProgress(p),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
      setProgress(null)
      onAfterExport()
    }
  }

  const pct = progress
    ? progress.stage === "done"
      ? 100
      : progress.stage === "saving"
      ? 98
      : Math.round(
          ((progress.index + (progress.stage === "rendering" ? 0.5 : 0)) /
            Math.max(1, progress.total)) *
            95,
        )
    : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.exportTitle}</DialogTitle>
          <DialogDescription>{t.exportDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format picker */}
          {!busy && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("desktop")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition",
                  format === "desktop"
                    ? "border-brand-500 bg-brand-500/10 text-brand-700"
                    : "border-border bg-card text-muted-foreground hover:border-brand-500/40",
                )}
              >
                <Desktop className="h-6 w-6" />
                <span>{t.exportDesktop}</span>
                <span className="text-[10px] font-normal text-muted-foreground">1050 px · 4 col</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("mobile")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition",
                  format === "mobile"
                    ? "border-brand-500 bg-brand-500/10 text-brand-700"
                    : "border-border bg-card text-muted-foreground hover:border-brand-500/40",
                )}
              >
                <DeviceMobile className="h-6 w-6" />
                <span>{t.exportMobile}</span>
                <span className="text-[10px] font-normal text-muted-foreground">430 px · 2 col</span>
              </button>
            </div>
          )}

          {/* Progress */}
          {busy && progress && (
            <div className="space-y-2">
              <Progress value={pct} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {progress.stage === "done" ? (
                  <Check className="h-3.5 w-3.5 text-brand-600" />
                ) : (
                  <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>{formatStage(progress, t)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button onClick={handleStart} disabled={busy}>
            <Download className="h-4 w-4" />
            {t.exportStart}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
