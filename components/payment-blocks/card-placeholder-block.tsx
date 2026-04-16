"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PaymentBlockProps } from "@/lib/payments/types"

export function CardPlaceholderBlock({ data, orderId }: PaymentBlockProps) {
  const router = useRouter()
  const message = data.message as string

  // Order already created — in-store card payment is handled manually by staff.
  // Auto-redirect to confirmation after a brief delay.
  useEffect(() => {
    const t = setTimeout(() => router.push(`/checkout/confirmacion?orderId=${orderId}`), 2000)
    return () => clearTimeout(t)
  }, [router, orderId])

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-lg font-bold">¡Pedido registrado!</h2>
      <p className="text-sm text-muted-foreground">
        {message || "El pago con tarjeta se realizará al momento de retirar el pedido en la tienda."}
      </p>
      <p className="text-xs text-muted-foreground">Redirigiendo a la confirmación…</p>
    </div>
  )
}
