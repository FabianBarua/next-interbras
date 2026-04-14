"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPayment } from "@/lib/actions/create-payment"

interface Props {
  orderId: string
  gatewaySlug: string
}

/**
 * Auto-creates a manual payment on mount then refreshes the page to show the block.
 * Used for manual gateways (cash, transfer, card) that don't need user input pre-creation.
 */
export function AutoPaymentCreator({ orderId, gatewaySlug }: Props) {
  const router = useRouter()

  useEffect(() => {
    createPayment(orderId, gatewaySlug, { name: "", email: "", cpf: "" }).then((res) => {
      if (!res.error) router.refresh()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-muted-foreground">Preparando su pedido…</p>
    </div>
  )
}
