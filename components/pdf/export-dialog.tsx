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
import { Download, Check, CircleNotch } from "@phosphor-icons/react"
import type { Dictionary } from "@/i18n/dictionaries/es"

type CatalogDict = Dictionary["catalog"]

interface Props {
  open: boolean
  onClose: () => void
  /** Returns the ordered list of capture targets (already in preview state). */
  getTargets: () => HTMLElement[]
  /** Called before capture starts — use to switch to preview mode + viewport. */
  onBeforeExport: () => Promise<void>
  /** Called after download completes — use to restore edit mode. */
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

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)

  async function handleStart() {
    setBusy(true)
    setProgress({ index: 0, total: 1, stage: "capturing" })

    // Switch to preview mode so edit controls disappear before capture
    await onBeforeExport()

    const targets = getTargets()
    if (targets.length === 0) {
      setBusy(false)
      return
    }

    try {
      await exportPdf({
        targets,
        fileName,
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

        <div className="py-2">
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
