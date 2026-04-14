"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import type { PaymentBlockProps } from "@/lib/payments/types"

export function PixBlock({ data, orderId }: PaymentBlockProps) {
  const router = useRouter()
  const pixCode = data.pixCopiaECola as string
  const rawExpires = data.expiresAt as string | null
  const expiresAt = rawExpires ? normalizeDate(rawExpires) : null
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<"waiting" | "paid" | "failed" | "expired">("waiting")
  const [timeLeft, setTimeLeft] = useState("")

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft("00:00")
        setStatus("expired")
        return
      }
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

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
        // ignore parse errors
      }
    }

    evtSource.onerror = () => {
      if (evtSource.readyState === EventSource.CLOSED) {
        evtSource.close()
      }
    }

    return () => evtSource.close()
  }, [orderId, status, router])

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [pixCode])

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

  if (status === "expired") {
    return (
      <div className="rounded-lg border p-6 text-center">
        <h3 className="text-lg font-semibold">PIX expirado</h3>
        <p className="mt-1 text-sm text-muted-foreground">El tiempo para el pago expiró.</p>
        <Button className="mt-4" asChild>
          <a href={`/checkout/payment/${orderId}`}>Intentar de nuevo</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 text-center">
        <h3 className="mb-1 text-lg font-semibold">Pague con PIX</h3>
        {timeLeft && (
          <p className="mb-4 text-sm text-muted-foreground">
            Expira en <span className="font-mono font-medium">{timeLeft}</span>
          </p>
        )}

        {/* QR Code */}
        <div className="mx-auto mb-4 flex justify-center">
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG value={pixCode} size={200} />
          </div>
        </div>

        {/* PIX Copia e Cola */}
        <div className="mx-auto max-w-md">
          <p className="mb-2 text-sm font-medium">Código PIX Copia e Cola:</p>
          <div className="rounded-md border bg-muted/50 p-3 text-xs break-all font-mono">
            {pixCode}
          </div>
          <Button className="mt-3 w-full" onClick={copyCode}>
            {copied ? "¡Copiado!" : "Copiar código PIX"}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">Cómo pagar:</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Abra la app de su banco</li>
          <li>Elija pagar con PIX &quot;Copia e Cola&quot;</li>
          <li>Pegue el código copiado arriba</li>
          <li>Confirme el pago</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          El pago se confirmará automáticamente en unos segundos.
        </p>
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

/** Normalize date strings — handles "dd/MM/yyyy HH:mm:ss" or ISO */
function normalizeDate(raw: string): string {
  if (raw.includes("T") || raw.includes("-")) return raw
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}T${match[4]}`
  return raw
}
