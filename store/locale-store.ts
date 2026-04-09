import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '../types/common'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggle: () => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
      toggle: () => set((state) => ({ locale: state.locale === 'es' ? 'pt' : 'es' }))
    }),
    { name: 'interbras-locale' }
  )
)
