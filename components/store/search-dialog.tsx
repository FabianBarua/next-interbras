"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useDictionary } from "@/i18n/context"
import { useLocalePath } from "@/i18n/context"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

interface SearchResult {
  id: string
  name: string
  slug: string
  categorySlug: string
  image: string | null
  price: number | null
  sku: string
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { dict } = useDictionary()
  const localePath = useLocalePath()

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch search results with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      setQuery("")
      router.push(localePath(`/productos/${result.categorySlug}/${result.slug}`))
    },
    [router, localePath],
  )

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const cat = r.categorySlug || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={dict.search.globalPlaceholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{dict.search.noResults}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{dict.search.noResultsDesc}</p>
            </div>
          )}
        </CommandEmpty>

        {Object.entries(grouped).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.sku}`}
                onSelect={() => handleSelect(item)}
                className="flex items-center gap-3 cursor-pointer"
              >
                {item.image ? (
                  <div className="h-10 w-10 rounded-md bg-muted/30 overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                {item.price != null && (
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    ${item.price}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

/** Trigger button for the search dialog (used in header) */
export function SearchTrigger() {
  const { dict } = useDictionary()

  const handleClick = () => {
    // Dispatch the keyboard event that the SearchDialog listens for
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    )
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label={dict.search.searchProducts}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </button>
  )
}
