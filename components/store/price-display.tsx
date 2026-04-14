"use client"
import type { ExternalCode } from "@/types/product"
import { useDictionary } from "@/i18n/context"

export function PriceDisplay({ externalCode, currency = "USD", className = "" }: { externalCode?: ExternalCode; currency?: "USD" | "GS" | "BRL"; className?: string }) {
  const { dict } = useDictionary()
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
  const savings = oldPrice - price
  const savingsPercent = Math.round((savings / oldPrice) * 100)

  const fmt = (n: number) => {
    const digits = currency === "GS" ? 0 : 2
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground line-through">
          {symbol}{fmt(oldPrice)}
        </span>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
          -{savingsPercent}%
        </span>
      </div>
      <span className="font-bold text-2xl text-primary">
        {symbol}{fmt(price)}
      </span>
      <span className="text-xs text-emerald-600 font-medium mt-0.5">
        {dict.products.saveBadge} {symbol}{fmt(savings)}
      </span>
    </div>
  )
}
