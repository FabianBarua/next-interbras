"use client"

import { useEffect } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

/** Re-fetches the session whenever the route changes (e.g. after login redirect). */
function SessionSync() {
  const pathname = usePathname()
  const { update } = useSession()

  useEffect(() => {
    update()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  )
}
