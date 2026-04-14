"use client"

import { usePathname } from "next/navigation"
import { CartSummary } from "./cart-summary"
import { MobileCartSummary } from "./mobile-cart-summary"

export default function CheckoutShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Post-order pages: no summary shell
  const isPostOrder = pathname.includes("/payment/") || pathname.includes("/confirmacion")
  if (isPostOrder) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Mobile cart summary (collapsible) */}
      <div className="lg:hidden">
        <MobileCartSummary />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">{children}</div>

      {/* Desktop cart summary sidebar */}
      <aside className="hidden w-[340px] shrink-0 lg:block">
        <div className="sticky top-24">
          <CartSummary />
        </div>
      </aside>
    </div>
  )
}
