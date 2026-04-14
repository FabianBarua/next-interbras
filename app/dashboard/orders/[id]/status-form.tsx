"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateOrderStatusAction } from "@/lib/actions/admin/orders"

interface StatusOption {
  slug: string
  label: string
  color: string
}

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentTrackingCode,
  statuses,
}: {
  orderId: string
  currentStatus: string
  currentTrackingCode: string
  statuses: StatusOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [trackingCode, setTrackingCode] = useState(currentTrackingCode)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, {
        status,
        trackingCode: trackingCode || undefined,
      })
      if ("error" in res) {
        setError(res.error ?? null)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="font-medium text-sm">Actualizar estado</h2>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Estado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full flex h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        >
          {statuses.map((s) => (
            <option key={s.slug} value={s.slug}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Código de rastreo</label>
        <input
          type="text"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="Ej: PY123456789"
          className="w-full flex h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full inline-flex h-9 items-center justify-center px-4 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600 dark:text-green-400">Estado actualizado correctamente.</p>}
    </div>
  )
}
