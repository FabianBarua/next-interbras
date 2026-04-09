"use client"
import { useLocaleStore } from "@/store/locale-store"

export function LanguageSwitcher() {
  const { locale, toggle } = useLocaleStore()

  return (
    <button 
      onClick={toggle}
      className="flex items-center justify-center h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
      title="Cambiar idioma"
    >
      {locale.toUpperCase()}
    </button>
  )
}
