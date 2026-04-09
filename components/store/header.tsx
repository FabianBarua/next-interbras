import Link from "@/i18n/link"
import Image from "next/image"
import { MobileMenu } from "./mobile-menu"
import { LanguageSwitcher } from "./language-switcher"
import { NavCategories } from "./nav-categories"
import { CartPreview } from "./cart-preview"
import { AccountMenu } from "./account-menu"

export async function Header() {
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

        {/* Right Nav: Switch → Cart → Account */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <CartPreview />

          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
