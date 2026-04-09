"use client"

import { useRef, useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/i18n/context"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchInput({ value, onChange, className }: SearchInputProps) {
  const { dict } = useDictionary()
  const inputRef = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState(value)

  // Sync external value changes (e.g. from URL navigation)
  useEffect(() => {
    setLocal(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocal(v)
    onChange(v)
  }

  const handleClear = () => {
    setLocal("")
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={dict.search.placeholder}
        className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        autoComplete="off"
        spellCheck={false}
      />
      {local && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Clear</span>
        </button>
      )}
    </div>
  )
}
