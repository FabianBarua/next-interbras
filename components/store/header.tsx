import Link from "@/i18n/link"
import { MobileMenu } from "./mobile-menu"
import { LanguageSwitcher } from "./language-switcher"
import { NavCategories } from "./nav-categories"
import { getCategories } from "@/services/categories"
import { CartPreview } from "./cart-preview"
import { AccountMenu } from "./account-menu"
import { InterbrasLogo } from "./interbras-logo"
import { SearchDialog, SearchTrigger } from "./search-dialog"

export async function Header({ ecommerceEnabled = false }: { ecommerceEnabled?: boolean }) {
  const categories = await getCategories()

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Animated gradient accent strip */}
      <div className="h-0.5 bg-size-[200%_100%] bg-linear-to-r from-brand-300 via-brand-500 to-brand-300 animate-[header-shimmer_4s_ease-in-out_infinite]" />

      {/* Glass body */}
      <div className="relative bg-background/75 backdrop-blur-2xl">
        {/* Faint brand tint wash */}
        <div className="absolute inset-0 bg-linear-to-r from-brand-500/3 via-transparent to-brand-500/3 dark:from-brand-400/4 dark:to-brand-400/4 pointer-events-none" />

        <div className="container relative flex h-14 items-center gap-3">
          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <MobileMenu categories={categories} />
          </div>

          {/* Logo with hover glow */}
          <Link href="/" className="group relative flex shrink-0 items-center py-2">
            <span className="absolute -inset-3 rounded-xl bg-brand-500/0 group-hover:bg-brand-500/8 dark:group-hover:bg-brand-400/10 transition-all duration-500 blur-sm" />
            <InterbrasLogo className="relative h-3.5 w-auto text-brand-700 dark:text-brand-400 group-hover:text-brand-500 dark:group-hover:text-brand-300 transition-colors duration-300" />
          </Link>

          {/* Vertical separator */}
          <div className="hidden md:block w-px h-5 bg-border/60 mx-1" />

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex flex-1 items-center justify-center">
            <NavCategories categories={categories} />
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            <SearchTrigger />
            <div className="hidden sm:flex">
              <LanguageSwitcher />
            </div>
            <div className="hidden sm:block w-px h-5 bg-border/40 mx-1" />
            {ecommerceEnabled && <CartPreview />}
            <AccountMenu />
          </div>
        </div>

        {/* Bottom gradient border */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Soft shadow cast beneath header */}
      <div className="absolute inset-x-0 top-full h-8 bg-linear-to-b from-black/3 dark:from-black/12 to-transparent pointer-events-none" />

      <SearchDialog />
    </header>
  )
}
