"use client"
import { useState, useEffect } from "react"
import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"
import { LanguageSwitcherInline } from "./language-switcher"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Category } from "@/types/category"
import { Menu, Search, ChevronDown, Home, ShoppingBag, Download, Headphones, Users, User } from "lucide-react"
import { CategoryIcon } from "./category-icon"

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const { dict, locale } = useDictionary()
  const t = dict.nav

  const close = () => setOpen(false)

  useEffect(() => setMounted(true), [])

  // Render plain button during SSR to avoid Radix ID hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 -ml-2 rounded-md hover:bg-muted">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 -ml-2 rounded-md hover:bg-muted">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="text-left text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Search */}
          <div className="px-3 py-2">
            <button
              onClick={() => {
                close()
                setTimeout(() => {
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                  )
                }, 150)
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              {dict.search.searchProducts}
            </button>
          </div>

          <div className="h-px bg-border mx-3" />

          {/* Navigation */}
          <nav className="px-3 py-2 space-y-0.5">
            <Link href="/" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <Home className="h-4 w-4 text-muted-foreground" />
              {t.home}
            </Link>

            {/* Products with collapsible categories */}
            <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left">{t.products}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-7 border-l pl-3 py-1 space-y-0.5">
                  <Link href="/productos" onClick={close} className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    {t.allProducts || "Ver todos"}
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/productos/${cat.slug}`}
                      onClick={close}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <CategoryIcon svgIcon={cat.svgIcon} size={16} className="shrink-0" />
                      {cat.name[locale] || cat.name.es}
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Link href="/downloads" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <Download className="h-4 w-4 text-muted-foreground" />
              {t.downloads}
            </Link>
            <Link href="/soporte" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <Headphones className="h-4 w-4 text-muted-foreground" />
              {t.support}
            </Link>
            <Link href="/quienes-somos" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t.aboutUs}
            </Link>

          </nav>

          <div className="h-px bg-border mx-3" />

          <div className="px-3 py-2">
            <Link href="/cuenta" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              <User className="h-4 w-4 text-muted-foreground" />
              {t.myAccount}
            </Link>
          </div>
        </div>

        {/* Footer: language switcher */}
        <div className="border-t px-5 py-4">
          <LanguageSwitcherInline />
        </div>
      </SheetContent>
    </Sheet>
  )
}
