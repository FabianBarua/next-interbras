import Link from "@/i18n/link"
import { MobileMenu } from "./mobile-menu"
import { LanguageSwitcher } from "./language-switcher"
import { NavCategories } from "./nav-categories"
import { CartPreview } from "./cart-preview"
import { AccountMenu } from "./account-menu"
import { InterbrasLogo } from "./interbras-logo"
import { SearchDialog, SearchTrigger } from "./search-dialog"

export async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/60 shadow-sm transition-all">
      <div className="container flex h-14 items-center gap-2">
        {/* Mobile: hamburger */}
        <div className="flex md:hidden">
          <MobileMenu />
        </div>

        {/* Logo — fixed width so nav gets remaining space */}
        <Link href="/" className="flex shrink-0 items-center">
          <InterbrasLogo className="h-3.5 w-auto text-brand-700 dark:text-brand-400" />
        </Link>

        {/* Desktop nav — centered, takes available space */}
        <nav className="hidden md:flex flex-1 items-center justify-center">
          <NavCategories />
        </nav>

        {/* Right actions — always visible */}
        <div className="flex items-center gap-0.5 ml-auto">
          <SearchTrigger />
          <div className="hidden sm:flex">
            <LanguageSwitcher />
          </div>
          <CartPreview />
          <AccountMenu />
        </div>
      </div>

      <SearchDialog />
    </header>
  )
}
