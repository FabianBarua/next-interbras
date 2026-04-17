"use client"

import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { CURRENCIES } from "@/lib/pdf/constants"
import type { CurrencyCode, Viewport } from "@/lib/pdf/types"
import type { Locale } from "@/i18n/config"
import {
  Download,
  ArrowClockwise,
  Desktop,
  DeviceMobile,
  Eye,
  PencilSimple,
  SlidersHorizontal,
} from "@phosphor-icons/react"

interface Props {
  viewport: Viewport
  onViewportChange: (v: Viewport) => void
  mode: "edit" | "preview"
  onModeChange: (m: "edit" | "preview") => void
  onExportClick: () => void
  onManageClick: () => void
  siteName: string
}

export function CatalogToolbar({
  viewport,
  onViewportChange,
  mode,
  onModeChange,
  onExportClick,
  onManageClick,
  siteName,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog

  const showPrices = useCatalogStore((s) => s.showPrices)
  const currency = useCatalogStore((s) => s.currency)
  const language = useCatalogStore((s) => s.language)
  const setShowPrices = useCatalogStore((s) => s.setShowPrices)
  const setCurrency = useCatalogStore((s) => s.setCurrency)
  const setLanguage = useCatalogStore((s) => s.setLanguage)
  const resetAll = useCatalogStore((s) => s.resetAll)

  function handleReset() {
    if (typeof window !== "undefined" && !window.confirm(t.resetAllConfirm)) return
    resetAll()
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        {/* Title */}
        <div className="mr-2 min-w-0">
          <h1 className="text-base font-bold tracking-tight">{siteName} · PDF</h1>
          <p className="text-[11px] text-muted-foreground">{t.subtitle}</p>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden h-8 md:block" />

        {/* Mode switch */}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && onModeChange(v as "edit" | "preview")}
          size="sm"
        >
          <ToggleGroupItem value="edit" className="gap-1.5">
            <PencilSimple className="h-3.5 w-3.5" />
            {t.modeEdit}
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {t.modePreview}
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Viewport switch */}
        <ToggleGroup
          type="single"
          value={viewport}
          onValueChange={(v) => v && onViewportChange(v as Viewport)}
          size="sm"
        >
          <ToggleGroupItem value="desktop" aria-label={t.viewportDesktop}>
            <Desktop className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label={t.viewportMobile}>
            <DeviceMobile className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Manage sections */}
        <Button
          variant="outline"
          size="sm"
          onClick={onManageClick}
          className="gap-1.5 border-brand-500/30 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t.manageSections}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Show prices */}
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5">
            <Switch
              id="show-prices"
              checked={showPrices}
              onCheckedChange={setShowPrices}
            />
            <Label htmlFor="show-prices" className="cursor-pointer text-sm">
              {showPrices ? t.showPrices : t.hidePrices}
            </Label>
          </div>

          {/* Currency */}
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
            <SelectTrigger size="sm" className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Language */}
          <Select value={language} onValueChange={(v) => setLanguage(v as Locale)}>
            <SelectTrigger size="sm" className="min-w-25">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset */}
          <Button variant="ghost" size="sm" onClick={handleReset} title={t.resetAll}>
            <ArrowClockwise className="h-3.5 w-3.5" />
          </Button>

          {/* Export */}
          <Button
            size="sm"
            onClick={onExportClick}
            className="bg-brand-500 text-white shadow-sm hover:bg-brand-600"
          >
            <Download className="h-4 w-4" />
            {t.exportPdf}
          </Button>
        </div>
      </div>
    </div>
  )
}
