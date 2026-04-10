"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  updateAffiliate,
  updateAffiliateStatus,
  deleteAffiliate,
} from "@/lib/actions/admin/affiliates"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ─── Status Actions ─────────────────────────────────────────────

export function AffiliateStatusActions({
  affiliateId,
  currentStatus,
}: {
  affiliateId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleStatus(newStatus: "approved" | "rejected") {
    startTransition(async () => {
      const res = await updateAffiliateStatus(affiliateId, newStatus)
      if (res.success) router.refresh()
      else alert(res.error)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "pending" && (
        <>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleStatus("approved")}
          >
            Aprobar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatus("rejected")}
          >
            Rechazar
          </Button>
        </>
      )}
      {currentStatus === "approved" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatus("rejected")}
        >
          Desactivar
        </Button>
      )}
      {currentStatus === "rejected" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => handleStatus("approved")}
        >
          Reactivar
        </Button>
      )}
    </div>
  )
}

// ─── Edit Form ─────────────────────────────────────────────────

export function AffiliateEditForm({
  affiliateId,
  currentRate,
  currentRefCode,
  currentPixKey,
  currentPixType,
}: {
  affiliateId: string
  currentRate: number
  currentRefCode: string
  currentPixKey: string | null
  currentPixType: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const res = await updateAffiliate(affiliateId, formData)
      if (res.success) {
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert(res.error)
      }
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar configuración
        </Button>
        {saved && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Guardado
          </span>
        )}
      </div>
    )
  }

  return (
    <form
      action={handleSave}
      className="w-full space-y-3 rounded-md border p-4"
    >
      <h3 className="text-sm font-semibold">Editar configuración</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Código de referencia
          </label>
          <input
            name="refCode"
            type="text"
            defaultValue={currentRefCode}
            pattern="[A-Za-z0-9]{3,20}"
            title="3–20 caracteres alfanuméricos (A-Z, 0-9)"
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-sm uppercase shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Tasa de comisión (%)
          </label>
          <input
            name="commissionRate"
            type="number"
            min={0}
            max={100}
            defaultValue={currentRate}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Tipo de clave PIX
          </label>
          <select
            name="pixType"
            defaultValue={currentPixType ?? ""}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar</option>
            <option value="cpf">CPF</option>
            <option value="email">Email</option>
            <option value="phone">Teléfono</option>
            <option value="random">Clave aleatoria</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Clave PIX
        </label>
        <input
          name="pixKey"
          type="text"
          defaultValue={currentPixKey ?? ""}
          placeholder="Clave PIX del afiliado"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ─── Delete Button ─────────────────────────────────────────────

export function AffiliateDeleteButton({
  affiliateId,
  affiliateName,
}: {
  affiliateId: string
  affiliateName: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteAffiliate(affiliateId)
      if (res.success) router.replace("/dashboard/affiliates")
      else alert(res.error)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? "Eliminando..." : "Eliminar afiliado"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar afiliado?</AlertDialogTitle>
          <AlertDialogDescription>
            Está a punto de eliminar{" "}
            <strong>{affiliateName ?? "este afiliado"}</strong>. Afiliados con
            comisiones pagadas no pueden eliminarse. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
