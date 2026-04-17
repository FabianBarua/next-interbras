"use client"

import { useSyncExternalStore } from "react"
import { useCatalogStore } from "@/lib/pdf/store"

const subscribe = () => () => {}

/**
 * Renders children only after the Zustand persist middleware has hydrated
 * localStorage. Prevents hydration mismatch flicker (server renders defaults,
 * client would re-render with persisted state).
 */
export function HydrationGate({ children, fallback }: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hydrated = useCatalogStore((s) => s._hydrated)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  if (!mounted || !hydrated) return <>{fallback ?? null}</>
  return <>{children}</>
}
