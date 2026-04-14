"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { PaymentBlockProps } from "@/lib/payments/types"

export function CardBlock({ data, orderId }: PaymentBlockProps) {
  const router = useRouter()
  const rawUrl = data.checkoutUrl as string
  // Only allow HTTPS URLs to prevent javascript: or other protocol attacks
  const checkoutUrl = rawUrl?.startsWith("https://") ? rawUrl : null
  const [status, setStatus] = useState<"waiting" | "paid" | "failed">("waiting")

  // SSE — realtime payment notification
  useEffect(() => {
    if (status !== "waiting") return

    const evtSource = new EventSource(`/api/orders/${orderId}/events`)

    evtSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { status: string }
        if (msg.status === "paid") {
          setStatus("paid")
          evtSource.close()
          setTimeout(() => {
            router.push(`/checkout/confirmacion?orderId=${orderId}`)
          }, 1500)
        } else if (msg.status === "failed") {
          setStatus("failed")
          evtSource.close()
        }
      } catch {
        // ignore
      }
    }

    evtSource.onerror = () => {
      if (evtSource.readyState === EventSource.CLOSED) {
        evtSource.close()
      }
    }

    return () => evtSource.close()
  }, [orderId, status, router])

  if (status === "paid") {
    return (
      <div className="rounded-lg border border-primary bg-primary/5 p-6 text-center">
        <div className="mb-2 text-3xl">✓</div>
        <h3 className="text-lg font-semibold text-primary">¡Pago confirmado!</h3>
        <p className="mt-1 text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/5 p-6 text-center">
        <h3 className="text-lg font-semibold text-destructive">Pago no aprobado</h3>
        <p className="mt-1 text-sm text-muted-foreground">Intente de nuevo o elija otro método.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 text-center">
        <h3 className="mb-1 text-lg font-semibold">Pague con Tarjeta</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Será redirigido al entorno seguro de pago.
        </p>
        <Button className="w-full" asChild disabled={!checkoutUrl}>
          <a href={checkoutUrl ?? "#"} target="_blank" rel="noopener noreferrer">
            Pagar con tarjeta
          </a>
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">Cómo funciona:</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Haga clic en el botón de arriba</li>
          <li>Complete los datos de la tarjeta en el entorno seguro</li>
          <li>Confirme el pago</li>
          <li>Vuelva a esta página — la confirmación aparecerá automáticamente</li>
        </ol>
      </div>

      {/* Waiting indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="text-sm text-muted-foreground">Esperando pago...</span>
      </div>
    </div>
  )
}
