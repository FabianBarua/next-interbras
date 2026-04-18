"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  searchProductsForPickerAction,
  getProductLabelAction,
} from "@/lib/actions/admin/products"

export type ProductPickerItem = { id: string; slug: string; name: string }

/**
 * Searchable product picker (debounced server search).
 *
 * Pass `value` (productId | null) and `onChange`. If `initialItem` is provided,
 * it is shown as the selected label without an extra fetch.
 *
 * Use `clearable` to allow unset (returns null on clear).
 */
export function ProductPicker({
  value,
  onChange,
  initialItem,
  placeholder = "Buscar producto…",
  clearable = false,
  disabled = false,
  className,
  buttonClassName,
}: {
  value: string | null
  onChange: (id: string | null, item: ProductPickerItem | null) => void
  initialItem?: ProductPickerItem | null
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  className?: string
  buttonClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<ProductPickerItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<ProductPickerItem | null>(initialItem ?? null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate label if we have a value but no initialItem
  React.useEffect(() => {
    if (value && !selected) {
      getProductLabelAction(value).then((p) => {
        if (p) setSelected(p)
      })
    }
    if (!value && selected) setSelected(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Debounced search
  React.useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchProductsForPickerAction(query)
      setResults(res.items)
      setLoading(false)
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open])

  const handlePick = (item: ProductPickerItem) => {
    setSelected(item)
    onChange(item.id, item)
    setOpen(false)
    setQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(null)
    onChange(null, null)
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "h-9 justify-between gap-2 font-normal",
              !selected && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar por nombre o slug…"
            />
            <CommandList>
              {loading && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Buscando…
                </div>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <CommandEmpty>Sin resultados.</CommandEmpty>
              )}
              {!loading && !query.trim() && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Escribí al menos 1 carácter.
                </div>
              )}
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => handlePick(p)}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{p.name}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {p.slug}
                        </div>
                      </div>
                      {value === p.id && <Check className="size-3.5 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {clearable && selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="size-9"
          title="Quitar filtro"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
