"use client"
import { useEffect, useState } from "react"
import { SessionProvider } from "next-auth/react"

export function StoreProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <SessionProvider>
      <div style={{ opacity: isMounted ? 1 : 0, transition: "opacity 0.2s" }}>{children}</div>
    </SessionProvider>
  )
}
