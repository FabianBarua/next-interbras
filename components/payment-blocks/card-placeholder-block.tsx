"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { PaymentBlockProps } from "@/lib/payments/types"
import { simulateCardPayment } from "@/lib/actions/simulate-card-payment"

export function CardPlaceholderBlock({ data, orderId }: PaymentBlockProps) {
  const router = useRouter()
  const message = data.message as string
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const res = await simulateCardPayment(orderId)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    setConfirmed(true)
    setTimeout(() => router.push(`/checkout/confirmacion?orderId=${orderId}`), 1500)
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">¡Pedido registrado!</h2>
        <p className="text-sm text-muted-foreground">Redirigiendo a la confirmación…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
            <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold">Pago con tarjeta en tienda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido <span className="font-mono font-semibold text-foreground">#{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-950/20">
        <div className="flex gap-3">
          <div className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {message || "El pago con tarjeta se realizará al momento de retirar el pedido en la tienda."}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Procesando…
          </>
        ) : (
          "Confirmar pedido"
        )}
      </button>
    </div>
  )
}
