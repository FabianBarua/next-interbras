"use client"

import { useState } from "react"
import type { Product } from "@/types/product"
import { useDictionary } from "@/i18n/context"
import { cn } from "@/lib/utils"

export function ProductTabs({ product }: { product: Product }) {
  const { dict, locale } = useDictionary()

  const description = product.description?.[locale] || product.description?.es
  const specs = product.specs?.[locale] || product.specs?.es
  const included = product.included?.[locale] || product.included?.es

  const tabs = [
    { key: "description", label: dict.products.tabDescription, content: description },
    { key: "specs", label: dict.products.tabSpecs, content: specs },
    { key: "included", label: dict.products.tabIncluded, content: included },
  ].filter(t => t.content)

  const [active, setActive] = useState(tabs[0]?.key)

  if (tabs.length === 0) return null

  const current = tabs.find(t => t.key === active) || tabs[0]

  return (
    <div className="mt-10">
      {/* Tab bar */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "px-5 py-3 text-sm font-medium transition-colors relative",
              active === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {current.key === "specs" && Array.isArray(current.content) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-0">
            {(current.content as Array<{ label: string; value: string }>).map((spec, i) => (
              <div key={i} className="flex py-2.5 border-b border-dashed">
                <span className="w-2/5 text-sm text-muted-foreground">{spec.label}</span>
                <span className="w-3/5 text-sm font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            {typeof current.content === "string" ? (
              <p>{current.content}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
