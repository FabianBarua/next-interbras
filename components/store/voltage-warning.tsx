"use client"

import { useState } from "react"
import type { Product, Variant } from "@/types/product"
import { isVoltageMismatch, LOCALE_VOLTAGE, LOCALE_COUNTRY } from "@/data/voltage-rules"
import { useDictionary } from "@/i18n/context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LightningIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react"
import type { Locale } from "@/i18n/config"

interface VoltageWarningProps {
  product: Product
  variant: Variant
  onSwitchVariant?: (variantId: string) => void
}

function findCompatibleVariant(
  product: Product,
  current: Variant,
  locale: Locale,
): Variant | undefined {
  const targetVoltage = LOCALE_VOLTAGE[locale]
  if (!targetVoltage) return undefined

  const otherKeys = Object.keys(current.attributes).filter((k) => k !== "voltage")

  return product.variants.find((v) => {
    if (v.id === current.id) return false
    if (v.attributes.voltage !== targetVoltage) return false
    return otherKeys.every((k) => v.attributes[k] === current.attributes[k])
  })
}

export function VoltageWarning({
  product,
  variant,
  onSwitchVariant,
}: VoltageWarningProps) {
  const { dict, locale } = useDictionary()
  const [open, setOpen] = useState(false)

  const voltage = variant.attributes?.voltage as string | undefined
  if (!voltage || !isVoltageMismatch(voltage, locale)) return null

  const nativeVoltage = LOCALE_VOLTAGE[locale]
  const country = LOCALE_COUNTRY[locale]
  const countryName = country[locale]
  const compatible = findCompatibleVariant(product, variant, locale)

  const t = dict.products.voltageWarning

  return (
    <>
      {/* Floating pill at bottom of gallery */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/40 shadow-lg shadow-amber-500/5 px-3.5 py-2 text-[13px] transition-all hover:shadow-amber-500/15 hover:border-amber-300 dark:hover:border-amber-700 group cursor-pointer"
      >
        <span className="flex items-center justify-center size-6 rounded-full bg-amber-100 dark:bg-amber-900/60 shrink-0">
          <LightningIcon className="size-3.5 text-amber-600 dark:text-amber-400" weight="fill" />
        </span>
        <span className="flex-1 text-left text-muted-foreground leading-tight">
          <span className="font-medium text-foreground">{voltage}</span>
          {" · "}
          {t.banner.replace("{voltage}", voltage).replace("{country}", countryName)}
        </span>
        <span className="text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {t.learnMore}
        </span>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <span className="flex items-center justify-center size-8 rounded-full bg-amber-100 dark:bg-amber-900/60">
                <LightningIcon className="size-4 text-amber-600 dark:text-amber-400" weight="fill" />
              </span>
              {t.dialogTitle}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {t.dialogDesc
                .replace("{voltage}", voltage)
                .replace("{nativeVoltage}", nativeVoltage)
                .replace("{country}", countryName)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.explanation
                .replace("{voltage}", voltage)
                .replace("{nativeVoltage}", nativeVoltage)
                .replace("{country}", countryName)}
            </p>

            {compatible && onSwitchVariant && (
              <Button
                className="w-full"
                onClick={() => {
                  onSwitchVariant(compatible.id)
                  setOpen(false)
                }}
              >
                <ArrowsClockwiseIcon className="size-4" />
                {t.switchVariant.replace("{voltage}", nativeVoltage)}
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {t.understood}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
