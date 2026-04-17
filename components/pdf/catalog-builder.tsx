"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { useCatalogStore } from "@/lib/pdf/store"
import { useDictionary } from "@/i18n/context"
import type {
  CatalogCategory,
  CatalogEntry,
  RenderedItem,
  Viewport,
} from "@/lib/pdf/types"
import { buildRenderedSections } from "@/lib/pdf/selectors"
import { VIEWPORT_WIDTH } from "@/lib/pdf/constants"

import { CatalogToolbar } from "./catalog-toolbar"
import { CatalogFilters, type CatalogFiltersState } from "./catalog-filters"
import { CoverEditor } from "./cover-editor"
import { CoverPage } from "./cover-page"
import { SectionList } from "./section-list"
import { ProductEditDialog } from "./product-edit-dialog"
import { CustomSectionDialog } from "./custom-section-dialog"
import { ManualProductDialog } from "./manual-product-dialog"
import { PickProductsDialog } from "./pick-products-dialog"
import { ExportDialog } from "./export-dialog"
import { ManageSectionsDialog } from "./manage-sections-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Props {
  entries: CatalogEntry[]
  categories: CatalogCategory[]
  siteName: string
}

export function CatalogBuilder({ entries, categories, siteName }: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog

  // ── Persisted state ─────────────────────────────────────────────
  const language = useCatalogStore((s) => s.language)
  const showPrices = useCatalogStore((s) => s.showPrices)
  const currency = useCatalogStore((s) => s.currency)
  const entryOverrides = useCatalogStore((s) => s.entryOverrides)
  const customSections = useCatalogStore((s) => s.customSections)
  const manualProducts = useCatalogStore((s) => s.manualProducts)
  const categoryOrder = useCatalogStore((s) => s.categoryOrder)
  const hiddenCategoryIds = useCatalogStore((s) => s.hiddenCategoryIds)

  const ensureCategoryOrder = useCatalogStore((s) => s.ensureCategoryOrder)
  const toggleEntryHidden = useCatalogStore((s) => s.toggleEntryHidden)
  const resetEntryOverride = useCatalogStore((s) => s.resetEntryOverride)

  // ── Bootstrap category order on first mount ─────────────────────
  useEffect(() => {
    ensureCategoryOrder(categories.map((c) => c.id))
  }, [categories, ensureCategoryOrder])

  // ── Local UI state ──────────────────────────────────────────────
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [filters, setFilters] = useState<CatalogFiltersState>({
    search: "",
    categoryId: null,
    voltage: "all",
  })
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [manualDialog, setManualDialog] = useState<{
    open: boolean
    sectionId: string | null
    productId: string | null
  }>({ open: false, sectionId: null, productId: null })
  const [sectionDialog, setSectionDialog] = useState<{
    open: boolean
    sectionId: string | null
  }>({ open: false, sectionId: null })
  const [pickDialog, setPickDialog] = useState<{
    open: boolean
    sectionId: string | null
  }>({ open: false, sectionId: null })
  const [exportOpen, setExportOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  // ── Derived data ────────────────────────────────────────────────
  const sections = useMemo(
    () =>
      buildRenderedSections({
        entries,
        categories,
        settings: {
          showPrices,
          currency,
          language,
          coverImageDataUrl: null,
          coverTitle: "",
          coverSubtitle: "",
          categoryOrder,
          hiddenCategoryIds,
          entryOverrides,
          customSections,
          manualProducts,
        },
        locale: language,
        filters,
        excludeHidden: mode === "preview",
      }),
    [
      entries,
      categories,
      showPrices,
      currency,
      language,
      categoryOrder,
      hiddenCategoryIds,
      entryOverrides,
      customSections,
      manualProducts,
      filters,
      mode,
    ],
  )

  const hiddenEntryIds = useMemo(
    () =>
      new Set(
        Object.entries(entryOverrides)
          .filter(([, ov]) => ov?.hidden)
          .map(([id]) => id),
      ),
    [entryOverrides],
  )

  const overrideIds = useMemo(
    () => new Set(Object.keys(entryOverrides)),
    [entryOverrides],
  )

  const editingEntry = useMemo(
    () => entries.find((e) => e.id === editingEntryId) ?? null,
    [entries, editingEntryId],
  )

  /** Pick up to 8 entries with images for the cover mini-strip. */
  const sampleProducts = useMemo(
    () =>
      entries
        .filter((e) => e.imageUrl)
        .slice(0, 8)
        .map((e) => ({
          id: e.id,
          name: e.name[language] ?? Object.values(e.name)[0] ?? e.code,
          code: e.code,
          imageUrl: e.imageUrl,
        })),
    [entries, language],
  )

  // ── Refs for PDF export ─────────────────────────────────────────
  const coverRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  const registerSectionRef = (id: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el)
    else sectionRefs.current.delete(id)
  }

  const getExportTargets = (): HTMLElement[] => {
    const out: HTMLElement[] = []
    if (coverRef.current) out.push(coverRef.current)
    for (const sec of sections) {
      const el = sectionRefs.current.get(sec.id)
      if (el) out.push(el)
    }
    return out
  }

  // ── Handlers ────────────────────────────────────────────────────
  const handleEditItem = (item: RenderedItem) => {
    if (item.kind === "entry" && item.entryId) {
      setEditingEntryId(item.entryId)
    } else if (item.kind === "manual" && item.manualId) {
      const mp = manualProducts.find((m) => m.id === item.manualId)
      if (mp) setManualDialog({ open: true, sectionId: mp.sectionId, productId: mp.id })
    }
  }

  const columns = viewport === "mobile" ? 2 : 4
  const editable = mode === "edit"

  const containerWidth = VIEWPORT_WIDTH[viewport]

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <CatalogToolbar
        viewport={viewport}
        onViewportChange={setViewport}
        mode={mode}
        onModeChange={setMode}
        onExportClick={() => setExportOpen(true)}
        onManageClick={() => setManageOpen(true)}
        siteName={siteName}
      />

      <main className="flex-1 overflow-x-auto">
        <div
          className={cn(
            "mx-auto space-y-6 px-4 py-6 transition-[max-width] md:px-6",
          )}
          style={{ maxWidth: `${containerWidth}px` }}
        >
          {editable && (
            <>
              <CatalogFilters
                value={filters}
                onChange={setFilters}
                categories={categories}
              />

              <CoverEditor />
            </>
          )}

          {/* Cover page — always rendered for correct ref/layout, hidden visually in edit mode */}
          <div
            aria-hidden={editable}
            className={cn(editable ? "pointer-events-none h-0 overflow-hidden opacity-0" : undefined)}
          >
            <CoverPage
              ref={coverRef}
              siteName={siteName}
              productCount={entries.length}
              categoryCount={categories.length}
              sampleProducts={sampleProducts}
            />
          </div>

          {/* Custom sections toolbar */}
          {editable && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                {t.customSections}
                {customSections.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({customSections.length})
                  </span>
                )}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSectionDialog({ open: true, sectionId: null })}
              >
                <Plus className="h-4 w-4" />
                {t.newSection}
              </Button>
            </div>
          )}

          {editable && customSections.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {t.manageSectionsHint}
            </p>
          )}

          <SectionList
            sections={sections}
            currency={currency}
            showPrices={showPrices}
            editable={editable}
            columns={columns}
            hiddenEntryIds={hiddenEntryIds}
            overrideIds={overrideIds}
            onToggleEntryHidden={toggleEntryHidden}
            onEditItem={handleEditItem}
            onResetOverride={resetEntryOverride}
            onEditSection={(sectionId) => setSectionDialog({ open: true, sectionId })}
            onAddProductsToSection={(sectionId) =>
              setPickDialog({ open: true, sectionId })
            }
            onRegisterRef={registerSectionRef}
          />

          {/* Manual product quick add (per custom section is inside the section toolbar) */}
          {editable && customSections.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setManualDialog({
                    open: true,
                    sectionId: customSections[0].id,
                    productId: null,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                {t.addManualProduct}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ProductEditDialog
        entry={editingEntry}
        currency={currency}
        onClose={() => setEditingEntryId(null)}
      />

      <CustomSectionDialog
        section={
          sectionDialog.sectionId
            ? customSections.find((s) => s.id === sectionDialog.sectionId) ?? null
            : null
        }
        open={sectionDialog.open}
        onClose={() => setSectionDialog({ open: false, sectionId: null })}
      />

      <ManualProductDialog
        open={manualDialog.open}
        onClose={() =>
          setManualDialog({ open: false, sectionId: null, productId: null })
        }
        sectionId={manualDialog.sectionId}
        product={
          manualDialog.productId
            ? manualProducts.find((m) => m.id === manualDialog.productId) ?? null
            : null
        }
        currency={currency}
      />

      {pickDialog.open && pickDialog.sectionId && (
        <PickProductsDialog
          open={pickDialog.open}
          onClose={() => setPickDialog({ open: false, sectionId: null })}
          sectionId={pickDialog.sectionId}
          entries={entries}
        />
      )}

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        getTargets={getExportTargets}
        onBeforeExport={async () => {
          setMode("preview")
          // Wait for React + layout paint (cover transitions from display:none)
          await new Promise<void>((r) => setTimeout(r, 500))
        }}
        onAfterExport={() => setMode("edit")}
        fileName={`${siteName.toLowerCase().replace(/\s+/g, "-")}-catalog`}
      />

      <ManageSectionsDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        categories={categories}
        onEditCustomSection={(sectionId) => {
          setManageOpen(false)
          setSectionDialog({ open: true, sectionId })
        }}
      />
    </div>
  )
}
