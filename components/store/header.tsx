import Link from "next/link"
import Image from "next/image"
import { MobileMenu } from "./mobile-menu"
import { LanguageSwitcher } from "./language-switcher"
import { NavCategories } from "./nav-categories"
import { CartPreview } from "./cart-preview"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/60 shadow-sm transition-all">
      <div className="container flex h-16 sm:h-20 items-center justify-between">
        {/* Mobile menu on the left (on mobile) */}
        <div className="flex items-center md:hidden">
          <MobileMenu />
        </div>

        {/* Logo */}
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Interbras Logo" width={140} height={40} className="object-contain invert dark:invert-0" priority />
          </Link>
        </div>

        {/* Desktop Nav with mega-menu */}
        <div className="hidden md:flex items-center">
          <NavCategories />
        </div>

        {/* Right Nav (User, Cart, Language) */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <Link href="/cuenta" className="hover:text-primary transition-colors p-2 rounded-full hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="sr-only">Cuenta</span>
          </Link>

          <CartPreview />
        </div>
      </div>
    </header>
  )
}
