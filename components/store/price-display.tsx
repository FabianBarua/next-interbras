"use client"
import type { ExternalCEC } from "@/types/product"

export function PriceDisplay({ externalCode, currency = "USD", className = "" }: { externalCode?: ExternalCEC; currency?: "USD" | "GS" | "BRL"; className?: string }) {
  if (!externalCode) return null

  const getPriceAndSymbol = () => {
    switch (currency) {
      case "GS":
        return { price: externalCode.priceGs, symbol: "Gs. " }
      case "BRL":
        return { price: externalCode.priceBrl, symbol: "R$ " }
      default:
        return { price: externalCode.priceUsd, symbol: "US$ " }
    }
  }

  const { price, symbol } = getPriceAndSymbol()

  if (!price) return <div className={`font-semibold text-muted-foreground ${className}`}>Consulte precio</div>

  // Mock previous price simulation (e.g., 20% higher)
  const oldPrice = price * 1.2

  const fmt = (n: number) => {
    const digits = currency === "GS" ? 0 : 2
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-muted-foreground line-through">
        {symbol}{fmt(oldPrice)}
      </span>
      <span className="font-bold text-lg text-primary">
        {symbol}{fmt(price)}
      </span>
    </div>
  )
}
