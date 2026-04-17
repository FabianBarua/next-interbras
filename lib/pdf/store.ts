"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Locale } from "@/i18n/config"
import type {
  CatalogSettings,
  CurrencyCode,
  CustomSection,
  EntryOverride,
  ManualProduct,
} from "./types"
import { STORAGE_KEY } from "./constants"
import { shortId } from "./helpers"

const DEFAULT_SETTINGS: CatalogSettings = {
  showPrices: true,
  currency: "GS",
  language: "es",
  coverImageDataUrl: null,
  coverTitle: "",
  coverSubtitle: "",
  categoryOrder: [],
  hiddenCategoryIds: [],
  entryOverrides: {},
  customSections: [],
  manualProducts: [],
}

interface CatalogStore extends CatalogSettings {
  _hydrated: boolean

  // Global settings
  setShowPrices: (v: boolean) => void
  setCurrency: (c: CurrencyCode) => void
  setLanguage: (l: Locale) => void

  // Cover
  setCover: (dataUrl: string | null) => void
  setCoverTitle: (t: string) => void
  setCoverSubtitle: (t: string) => void

  // Category order & visibility
  reorderCategories: (nextOrder: string[]) => void
  toggleCategoryHidden: (categoryId: string) => void
  ensureCategoryOrder: (allCategoryIds: string[]) => void

  // Entry overrides
  toggleEntryHidden: (entryId: string) => void
  updateEntryOverride: (entryId: string, patch: EntryOverride) => void
  resetEntryOverride: (entryId: string) => void

  // Custom sections
  addCustomSection: (input: Omit<CustomSection, "id" | "sortOrder">) => string
  updateCustomSection: (id: string, patch: Partial<Omit<CustomSection, "id">>) => void
  removeCustomSection: (id: string) => void
  reorderCustomSections: (ids: string[]) => void
  toggleEntryInSection: (sectionId: string, entryId: string) => void

  // Manual products
  addManualProduct: (p: Omit<ManualProduct, "id">) => string
  updateManualProduct: (id: string, patch: Partial<Omit<ManualProduct, "id">>) => void
  removeManualProduct: (id: string) => void

  // Bulk
  resetAll: () => void
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      _hydrated: false,

      setShowPrices: (v) => set({ showPrices: v }),
      setCurrency: (c) => set({ currency: c }),
      setLanguage: (l) => set({ language: l }),

      setCover: (dataUrl) => set({ coverImageDataUrl: dataUrl }),
      setCoverTitle: (t) => set({ coverTitle: t }),
      setCoverSubtitle: (t) => set({ coverSubtitle: t }),

      reorderCategories: (nextOrder) => set({ categoryOrder: nextOrder }),

      toggleCategoryHidden: (categoryId) => set((s) => {
        const hidden = new Set(s.hiddenCategoryIds)
        if (hidden.has(categoryId)) hidden.delete(categoryId)
        else hidden.add(categoryId)
        return { hiddenCategoryIds: Array.from(hidden) }
      }),

      ensureCategoryOrder: (allCategoryIds) => set((s) => {
        const known = new Set(s.categoryOrder)
        const appended = allCategoryIds.filter((id) => !known.has(id))
        if (appended.length === 0) {
          // Remove ids that no longer exist server-side
          const serverSet = new Set(allCategoryIds)
          const filtered = s.categoryOrder.filter((id) => serverSet.has(id))
          if (filtered.length === s.categoryOrder.length) return {}
          return { categoryOrder: filtered }
        }
        const serverSet = new Set(allCategoryIds)
        const filtered = s.categoryOrder.filter((id) => serverSet.has(id))
        return { categoryOrder: [...filtered, ...appended] }
      }),

      toggleEntryHidden: (entryId) => set((s) => {
        const prev = s.entryOverrides[entryId] ?? {}
        return {
          entryOverrides: {
            ...s.entryOverrides,
            [entryId]: { ...prev, hidden: !prev.hidden },
          },
        }
      }),

      updateEntryOverride: (entryId, patch) => set((s) => ({
        entryOverrides: {
          ...s.entryOverrides,
          [entryId]: { ...(s.entryOverrides[entryId] ?? {}), ...patch },
        },
      })),

      resetEntryOverride: (entryId) => set((s) => {
        const next = { ...s.entryOverrides }
        delete next[entryId]
        return { entryOverrides: next }
      }),

      addCustomSection: (input) => {
        const id = shortId()
        set((s) => ({
          customSections: [
            ...s.customSections,
            { id, sortOrder: s.customSections.length, ...input },
          ],
        }))
        return id
      },

      updateCustomSection: (id, patch) => set((s) => ({
        customSections: s.customSections.map((sec) =>
          sec.id === id ? { ...sec, ...patch } : sec,
        ),
      })),

      removeCustomSection: (id) => set((s) => ({
        customSections: s.customSections.filter((sec) => sec.id !== id),
        manualProducts: s.manualProducts.filter((p) => p.sectionId !== id),
      })),

      reorderCustomSections: (ids) => set((s) => {
        const map = new Map(s.customSections.map((sec) => [sec.id, sec]))
        const next = ids
          .map((id, i) => {
            const sec = map.get(id)
            return sec ? { ...sec, sortOrder: i } : null
          })
          .filter((x): x is CustomSection => x !== null)
        return { customSections: next }
      }),

      toggleEntryInSection: (sectionId, entryId) => set((s) => ({
        customSections: s.customSections.map((sec) => {
          if (sec.id !== sectionId) return sec
          const has = sec.entryIds.includes(entryId)
          return {
            ...sec,
            entryIds: has
              ? sec.entryIds.filter((id) => id !== entryId)
              : [...sec.entryIds, entryId],
          }
        }),
      })),

      addManualProduct: (p) => {
        const id = shortId()
        set((s) => ({ manualProducts: [...s.manualProducts, { id, ...p }] }))
        return id
      },

      updateManualProduct: (id, patch) => set((s) => ({
        manualProducts: s.manualProducts.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      })),

      removeManualProduct: (id) => set((s) => ({
        manualProducts: s.manualProducts.filter((p) => p.id !== id),
      })),

      resetAll: () => set({ ...DEFAULT_SETTINGS, _hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): CatalogSettings => ({
        showPrices: state.showPrices,
        currency: state.currency,
        language: state.language,
        coverImageDataUrl: state.coverImageDataUrl,
        coverTitle: state.coverTitle,
        coverSubtitle: state.coverSubtitle,
        categoryOrder: state.categoryOrder,
        hiddenCategoryIds: state.hiddenCategoryIds,
        entryOverrides: state.entryOverrides,
        customSections: state.customSections,
        manualProducts: state.manualProducts,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    },
  ),
)
