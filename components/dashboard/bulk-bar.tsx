"use client"

import { useState, type ReactNode } from "react"
import { Loader2, Trash2, ToggleRight, ToggleLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BulkAction {
  /** Unique key for the action */
  key: string
  /** Button label */
  label: string
  /** Button variant (defaults to "outline") */
  variant?: "default" | "outline" | "destructive" | "ghost"
  /** Icon shown before the label */
  icon?: ReactNode
  /** Confirmation dialog title — if omitted, executes immediately */
  confirmTitle?: string
  /** Confirmation dialog description */
  confirmDescription?: string
  /** Callback executed when the action is confirmed (or immediately if no confirm) */
  onExecute: (ids: string[]) => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Presets — commonly used action configs                             */
/* ------------------------------------------------------------------ */

export const bulkDelete = (
  onExecute: (ids: string[]) => Promise<void>,
  opts?: { entityName?: string },
): BulkAction => {
  const name = opts?.entityName ?? "elemento(s)"
  return {
    key: "delete",
    label: "Eliminar",
    variant: "destructive",
    icon: <Trash2 className="size-3.5" />,
    confirmTitle: `Eliminar {count} ${name}`,
    confirmDescription: "Esta acción no se puede deshacer.",
    onExecute,
  }
}

export const bulkActivate = (
  onExecute: (ids: string[]) => Promise<void>,
): BulkAction => ({
  key: "activate",
  label: "Activar",
  variant: "outline",
  icon: <ToggleRight className="size-3.5" />,
  confirmTitle: "Activar {count} elemento(s)",
  confirmDescription: "Se cambiará el estado de los elementos seleccionados.",
  onExecute,
})

export const bulkDeactivate = (
  onExecute: (ids: string[]) => Promise<void>,
): BulkAction => ({
  key: "deactivate",
  label: "Desactivar",
  variant: "outline",
  icon: <ToggleLeft className="size-3.5" />,
  confirmTitle: "Desactivar {count} elemento(s)",
  confirmDescription: "Se cambiará el estado de los elementos seleccionados.",
  onExecute,
})

/* ------------------------------------------------------------------ */
/*  Component — inline bulk actions (sits inside toolbar flex row)     */
/* ------------------------------------------------------------------ */

interface BulkBarProps {
  selected: Set<string>
  actions: BulkAction[]
  onClear: () => void
}

export function BulkBar({ selected, actions, onClear }: BulkBarProps) {
  const [pending, setPending] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<BulkAction | null>(null)
  const count = selected.size

  if (count === 0) return null

  const execute = async (action: BulkAction) => {
    setPending(action.key)
    try {
      await action.onExecute(Array.from(selected))
      onClear()
    } finally {
      setPending(null)
      setConfirm(null)
    }
  }

  const handleClick = (action: BulkAction) => {
    if (action.confirmTitle) {
      setConfirm(action)
    } else {
      execute(action)
    }
  }

  const fmtCount = (text: string) => text.replace("{count}", String(count))

  return (
    <>
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 items-center rounded-md bg-primary px-2 text-[11px] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>

        {actions.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant={action.variant ?? "outline"}
            disabled={!!pending}
            onClick={() => handleClick(action)}
            className="h-8 gap-1.5 text-xs"
          >
            {pending === action.key ? <Loader2 className="size-3.5 animate-spin" /> : action.icon}
            {action.label}
          </Button>
        ))}

        <button
          onClick={onClear}
          disabled={!!pending}
          className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Deseleccionar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!confirm} onOpenChange={(v) => !v && !pending && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm ? fmtCount(confirm.confirmTitle!) : ""}</DialogTitle>
            <DialogDescription>{confirm ? fmtCount(confirm.confirmDescription ?? "") : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={!!pending}>
              Cancelar
            </Button>
            <Button
              variant={confirm?.variant === "destructive" ? "destructive" : "default"}
              onClick={() => confirm && execute(confirm)}
              disabled={!!pending}
            >
              {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
