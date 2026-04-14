"use client"
import type { ExternalCode } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PriceDisplay({ externalCode, currency = "USD", className }: { externalCode?: ExternalCode; currency?: "USD" | "GS" | "BRL"; className?: string }) {
  if (!externalCode) return null

  const getPriceAndSymbol = () => {
    switch (currency) {
      case "GS":
        return { price: externalCode.priceGs, symbol: "Gs." }
      case "BRL":
        return { price: externalCode.priceBrl, symbol: "R$" }
      default:
        return { price: externalCode.priceUsd, symbol: "US$" }
    }
  }

  const { price, symbol } = getPriceAndSymbol()

  if (!price) return <Badge variant="secondary">Consulte precio</Badge>

  const fmt = (n: number) => {
    const digits = currency === "GS" ? 0 : 2
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  return (
    <div className={cn("font-bold tracking-tight text-foreground", className)}>
      {symbol} {fmt(price)}
    </div>
  )
}
