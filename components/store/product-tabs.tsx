"use client"

import type { Product } from "@/types/product"
import { useDictionary } from "@/i18n/context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

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

  if (tabs.length === 0) return null

  return (
    <div className="mt-10">
      <Tabs defaultValue={tabs[0].key}>
        <TabsList variant="line">
          {tabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Separator />

        {tabs.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="py-6 min-h-[180px]">
            {tab.key === "specs" && Array.isArray(tab.content) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-0">
                {(tab.content as Array<{ label: string; value: string }>).map((spec, i) => (
                  <div key={i} className="flex py-2.5 border-b border-dashed">
                    <span className="w-2/5 text-sm text-muted-foreground">{spec.label}</span>
                    <span className="w-3/5 text-sm font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-none text-sm text-muted-foreground leading-relaxed space-y-3">
                {typeof tab.content === "string"
                  ? tab.content.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
                  : null}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
