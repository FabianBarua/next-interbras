"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerRefund, confirmPaymentManually, cancelOrderAdmin } from "@/lib/actions/orders"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Props {
  orderId: string
  orderStatus: string
  paymentStatus: string | null
  paymentMethod: string
}

export function OrderActions({ orderId, orderStatus, paymentStatus, paymentMethod }: Props) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<"refund" | "cancel" | null>(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const canRefund = ["confirmed", "shipped", "delivered"].includes(orderStatus)
  const canCancel = !["cancelled", "refunded", "delivered"].includes(orderStatus)
  const canConfirmPayment =
    paymentStatus === "pending" || paymentStatus === "failed" || paymentStatus === "processing"

  const noActions = !canRefund && !canCancel && !canConfirmPayment

  async function handleRefund() {
    setLoading(true)
    setMessage(null)
    const result = await registerRefund(orderId, reason)
    setLoading(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Reembolso registrado exitosamente" })
      setActiveAction(null)
      setReason("")
      router.refresh()
    }
  }

  async function handleCancel() {
    setLoading(true)
    setMessage(null)
    const result = await cancelOrderAdmin(orderId, reason)
    setLoading(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Pedido cancelado exitosamente" })
      setActiveAction(null)
      setReason("")
      router.refresh()
    }
  }

  async function handleConfirmPayment() {
    setLoading(true)
    setMessage(null)
    const result = await confirmPaymentManually(orderId)
    setLoading(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Pago confirmado exitosamente" })
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {noActions && (
          <p className="text-sm text-muted-foreground">
            Ninguna accion disponible para este estado.
          </p>
        )}

        {canConfirmPayment && (
          <Button size="sm" className="w-full" onClick={handleConfirmPayment} disabled={loading}>
            {loading ? "Procesando..." : "Confirmar pago manualmente"}
          </Button>
        )}

        {canRefund && activeAction !== "refund" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { setActiveAction("refund"); setMessage(null) }}
          >
            Registrar reembolso
          </Button>
        )}

        {canCancel && activeAction !== "cancel" && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => { setActiveAction("cancel"); setMessage(null) }}
          >
            Cancelar pedido
          </Button>
        )}

        {/* Refund confirmation */}
        {activeAction === "refund" && (
          <Alert>
            <AlertDescription>
              <p className="mb-1 text-sm font-medium">Registrar reembolso manual</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Esto solo registra el reembolso en el sistema. Realice el reembolso manualmente en el gateway.
              </p>
              <div className="mb-3 space-y-2">
                <Label htmlFor="refund-reason">Motivo</Label>
                <Textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo del reembolso..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleRefund} disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar reembolso"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setActiveAction(null); setReason("") }}>
                  Cancelar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Cancel confirmation */}
        {activeAction === "cancel" && (
          <Alert variant="destructive">
            <AlertDescription>
              <p className="mb-1 text-sm font-medium">Cancelar pedido</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Esto cancelara el pedido y notificara al cliente por email. Los pagos pendientes se marcaran como fallidos.
              </p>
              <div className="mb-3 space-y-2">
                <Label htmlFor="cancel-reason">Motivo</Label>
                <Textarea
                  id="cancel-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo de la cancelacion..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleCancel} disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar cancelacion"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setActiveAction(null); setReason("") }}>
                  Volver
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription className={message.type === "success" ? "text-green-600 dark:text-green-400" : ""}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
