"use client"
import { useEffect, useState } from "react"

export function StoreProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // To prevent hydration mismatch due to persisted zustand state, we only 
  // render the actual children once mounted on the client.
  // We can return a placeholder or just wait.
  // With app router, we return children but they might render mismatches if accessing the store directly.
  return <div style={{ opacity: isMounted ? 1 : 0, transition: "opacity 0.2s" }}>{children}</div>
}
