"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminExternalCode } from "@/services/admin/external-codes"
import {
  updateExternalCodeAction,
  deleteExternalCodeAction,
} from "@/lib/actions/admin/external-codes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, Trash2 } from "lucide-react"

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

export function ExternalCodeEditForm({ ec }: { ec: AdminExternalCode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const [system, setSystem] = useState(ec.system)
  const [code, setCode] = useState(ec.code)
  const [externalName, setExternalName] = useState(ec.externalName ?? "")
  const [priceUsd, setPriceUsd] = useState(ec.priceUsd ?? "")
  const [priceGs, setPriceGs] = useState(ec.priceGs ?? "")
  const [priceBrl, setPriceBrl] = useState(ec.priceBrl ?? "")

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateExternalCodeAction(ec.id, {
        system,
        code,
        externalName: externalName || null,
        priceUsd: priceUsd || null,
        priceGs: priceGs || null,
        priceBrl: priceBrl || null,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push("/dashboard/external-codes")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteExternalCodeAction(ec.id)
      router.push("/dashboard/external-codes")
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/external-codes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a códigos externos
      </Link>

      {/* Variant info (read-only) */}
      {ec.variantId ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Variante: </span>
          <Link
            href={`/dashboard/products/${ec.productId}/variants`}
            className="font-mono text-primary hover:underline"
          >
            {ec.variantSku}
          </Link>
          <span className="text-muted-foreground"> · Producto: </span>
          <Link
            href={`/dashboard/products/${ec.productId}`}
            className="hover:underline"
          >
            {ec.productName?.es ?? ec.productSlug}
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-orange-300/50 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400">
          Sin variante vinculada
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Sistema
            </label>
            <input
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Código
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls + " font-mono"}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Nombre externo
          </label>
          <input
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio USD
            </label>
            <input
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="0.00"
              className={inputCls + " font-mono"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio Gs
            </label>
            <input
              value={priceGs}
              onChange={(e) => setPriceGs(e.target.value)}
              placeholder="0"
              className={inputCls + " font-mono"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Precio BRL
            </label>
            <input
              value={priceBrl}
              onChange={(e) => setPriceBrl(e.target.value)}
              placeholder="0.00"
              className={inputCls + " font-mono"}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={isPending || !system || !code}
        >
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/external-codes">Cancelar</Link>
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDialog(true)}
        >
          <Trash2 className="mr-1 size-3.5" />
          Eliminar
        </Button>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar código externo?</DialogTitle>
            <DialogDescription>
              Se eliminará el código &quot;{ec.code}&quot; del sistema{" "}
              {ec.system}. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
