"use client"

import Link from "@/i18n/link"
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
import { CategoryIcon } from "./category-icon"

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
                      <CategoryIcon svgIcon={cat.svgIcon} size={18} />
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
