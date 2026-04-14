"use client"

import { useState } from "react"
import { registerRefund } from "@/lib/actions/orders"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Props {
  orderId: string
  orderStatus: string
}

export function OrderActions({ orderId, orderStatus }: Props) {
  const [showRefund, setShowRefund] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const canRefund = ["confirmed", "shipped", "delivered"].includes(
    orderStatus,
  )

  async function handleRefund() {
    setLoading(true)
    setMessage(null)
    const result = await registerRefund(orderId, reason)
    setLoading(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({
        type: "success",
        text: "Reembolso registrado exitosamente",
      })
      setShowRefund(false)
      setReason("")
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold">Acciones</h2>

      <div className="flex flex-wrap gap-2">
        {canRefund && !showRefund && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRefund(true)}
          >
            Registrar reembolso
          </Button>
        )}
      </div>

      {!canRefund && (
        <p className="text-sm text-muted-foreground">
          Ninguna acción disponible para este estado.
        </p>
      )}

      {showRefund && (
        <div className="mt-4 rounded-md border p-4">
          <p className="mb-1 text-sm font-medium">
            Registrar reembolso manual
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Esto solo registra el reembolso en el sistema. Realice el reembolso
            manualmente en el gateway.
          </p>
          <div className="mb-3 space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo del reembolso..."
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRefund}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Confirmar reembolso"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRefund(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === "error" ? "text-destructive" : "text-primary"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
