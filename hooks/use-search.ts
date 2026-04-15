"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function useSearch(param = "search", delay = 400) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [value, setValue] = useState(searchParams.get(param) ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(param, value)
      else params.delete(param)
      params.delete("page")
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }, delay)
    return () => clearTimeout(debounceRef.current)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return { value, setValue }
}
