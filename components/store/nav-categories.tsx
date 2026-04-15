"use client"

import Link from "@/i18n/link"
import Image from "next/image"
import { InterbrasLogo } from "./interbras-logo"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type { Category } from "@/types/category"
import { useDictionary } from "@/i18n/context"

// Map category slugs to lucide-style SVG icons
const categoryIcons: Record<string, React.ReactNode> = {
  tvs: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="18" y2="21"/></svg>,
  scooters: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V7a1 1 0 0 0-1-1h-3l-2 4h-4"/><path d="m6 15 2-8h4"/></svg>,
  aires: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7a5 5 0 0 0-10 0"/><path d="M2 12h20"/><path d="M6 12v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/><path d="M9 20v2"/><path d="M15 20v2"/></svg>,
  hoverboards: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="6" x="2" y="9" rx="3"/><circle cx="6" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>,
  airfryer: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1h8V6a4 4 0 0 0-4-4z"/><rect width="14" height="12" x="5" y="8" rx="2"/><path d="M12 12v4"/></svg>,
  mixteras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="4" x="4" y="10" rx="1"/><path d="M4 14h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z"/><line x1="8" x2="16" y1="10" y2="10"/></svg>,
  cocinas: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18"/><rect width="18" height="14" x="3" y="7" rx="2"/><circle cx="9" cy="14" r="2"/><circle cx="15" cy="14" r="2"/></svg>,
  hervidoras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M6 8h11v9a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z"/><line x1="6" x2="17" y1="5" y2="5"/></svg>,
  cafeteras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" x2="14" y1="2" y2="2"/><line x1="8" x2="8" y1="2" y2="5"/><line x1="12" x2="12" y1="2" y2="5"/></svg>,
  planchas: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L3 13h18l-3-7H6z"/><path d="M6 18h12"/><line x1="9" x2="9" y1="13" y2="18"/></svg>,
  licuadoras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M10 21V10"/><path d="M14 21V10"/><path d="M7 3h10l-1 7H8L7 3z"/></svg>,
  beauty: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h10"/><rect width="6" height="10" x="9" y="11" rx="3"/><path d="M12 11V3"/><path d="M9 7h6"/></svg>,
  batidoras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v6"/><circle cx="12" cy="12" r="3"/><path d="M8 21h8"/><path d="M10 18h4v3h-4z"/><path d="M12 15v3"/></svg>,
  arroceras: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="10" rx="8" ry="4"/><path d="M4 10v4c0 2.2 3.6 4 8 4s8-1.8 8-4v-4"/><path d="M9 6V4"/><path d="M15 6V4"/></svg>,
  bebederos: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V3"/><path d="M3 3h12"/><path d="M7 11v6a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4v-2"/></svg>,
  triciclos: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><circle cx="12" cy="6" r="3"/><path d="M12 9v6"/><path d="M5 15l7-6 7 6"/></svg>,
  accesorios: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
}

const defaultIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>

export function NavCategories({ categories }: { categories: Category[] }) {
  const { dict, locale } = useDictionary()

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground h-9 px-3">
            {dict.nav.products}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-135 grid-cols-3 gap-1 p-3 lg:w-160">
              {/* Featured card */}
              <Link
                href="/productos"
                className="col-span-1 row-span-3 flex flex-col justify-end rounded-lg bg-linear-to-b from-primary/10 to-primary/5 p-4 no-underline hover:from-primary/20 hover:to-primary/10 transition-colors"
              >
                <InterbrasLogo className="h-3 sm:h-3 w-auto text-brand-700 dark:text-brand-400 mb-3 mr-auto" />
                <div className="text-sm font-semibold leading-tight">
                  {dict.nav.allProducts}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                  {dict.nav.allProductsDesc}
                </p>
              </Link>

              {/* Category links */}
              {categories.map((cat) => (
                <NavigationMenuLink key={cat.id} asChild>
                  <Link
                    href={`/productos/${cat.slug}`}
                    className="flex items-center gap-3 rounded-md p-2.5 text-sm transition-colors hover:bg-muted group/cat"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground group-hover/cat:text-primary group-hover/cat:border-primary/30 transition-colors">
                      {categoryIcons[cat.slug] || defaultIcon}
                    </span>
                    <span className="font-medium leading-none">{cat.name[locale] || cat.name.es}</span>
                  </Link>
                </NavigationMenuLink>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/downloads" className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-semibold tracking-wide text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
              {dict.nav.downloads}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/soporte" className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-semibold tracking-wide text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
              {dict.nav.support}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>


      </NavigationMenuList>
    </NavigationMenu>
  )
}
