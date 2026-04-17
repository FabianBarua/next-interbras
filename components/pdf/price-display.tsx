"use client"

import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/pdf/helpers"
import type { CurrencyCode } from "@/lib/pdf/types"

interface Props {
  value: number | null
  currency: CurrencyCode
  show: boolean
  className?: string
}

export function PriceDisplay({ value, currency, show, className }: Props) {
  if (!show) return null
  const formatted = formatPrice(value, currency)
  if (!formatted) return null
  return (
    <span className={cn("font-semibold tabular-nums text-foreground", className)}>
      {formatted}
    </span>
  )
}
