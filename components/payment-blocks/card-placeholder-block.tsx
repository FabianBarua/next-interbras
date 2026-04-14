"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PaymentBlockProps } from "@/lib/payments/types"
import { simulateCardPayment } from "@/lib/actions/simulate-card-payment"

export function CardPlaceholderBlock({ data, orderId }: PaymentBlockProps) {
  const router = useRouter()
  const message = data.message as string
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    const res = await simulateCardPayment(orderId)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    setPaid(true)
    setTimeout(() => router.push(`/checkout/confirmacion?orderId=${orderId}`), 1500)
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">¡Pago registrado!</h2>
        <p className="text-sm text-muted-foreground">Redirigiendo a la confirmación…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-950/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
      </div>

      {/* Fake card form */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
          </svg>
          Datos de la tarjeta
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Número de tarjeta</label>
            <input
              defaultValue="4111 1111 1111 1111"
              disabled
              className="h-10 w-full rounded-md border bg-muted/40 px-3 text-sm font-mono opacity-70 cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Vencimiento</label>
              <input
                defaultValue="12/29"
                disabled
                className="h-10 w-full rounded-md border bg-muted/40 px-3 text-sm font-mono opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">CVV</label>
              <input
                defaultValue="123"
                disabled
                className="h-10 w-full rounded-md border bg-muted/40 px-3 text-sm font-mono opacity-70 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Titular</label>
            <input
              defaultValue="NOMBRE APELLIDO"
              disabled
              className="h-10 w-full rounded-md border bg-muted/40 px-3 text-sm font-mono opacity-70 cursor-not-allowed"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic">
          Formulario de demostración — el cobro real se realiza al retirar el pedido.
        </p>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <button
        onClick={handlePay}
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
