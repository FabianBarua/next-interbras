"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { smallInputCls } from "./primitives"
import type { AttrDef } from "./attribute-pickers"

/**
 * Modal-style assignment of attributes to a variant.
 *
 * Instead of listing every attribute defined in the system upfront, this
 * component shows ONLY the attributes the user has explicitly added. They
 * click "+ Agregar atributo" to open a dropdown of un-assigned attributes
 * and pick one to add. Each assigned row gets a value selector and a
 * remove button.
 *
 * Internally we maintain the "valueIds[]" representation — at most one
 * value per attribute (DB constraint).
 */
export function AttributeAssignment({
  attributeDefs,
  value,
  onChange,
  emptyMessage,
}: {
  attributeDefs: AttrDef[]
  value: string[]
  onChange: (ids: string[]) => void
  emptyMessage?: React.ReactNode
}) {
  if (attributeDefs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay atributos definidos. Crealos en{" "}
        <code className="font-mono">/dashboard/attributes</code>.
      </p>
    )
  }

  // Reverse maps
  const valueToAttr = new Map<string, string>()
  for (const a of attributeDefs) for (const v of a.values) valueToAttr.set(v.id, a.id)

  // attrId -> selected valueId (only the first match, in case data is dirty)
  const selectedByAttr = new Map<string, string>()
  for (const vid of value) {
    const aid = valueToAttr.get(vid)
    if (aid && !selectedByAttr.has(aid)) selectedByAttr.set(aid, vid)
  }

  // Track attrs the user has added but not yet picked a value for.
  // We keep this in component state so removing a row doesn't immediately
  // re-collapse the slot.
  const [explicitAttrs, setExplicitAttrs] = React.useState<string[]>(() =>
    Array.from(selectedByAttr.keys()),
  )
  // Sync if outer value adds a new attribute.
  React.useEffect(() => {
    setExplicitAttrs((prev) => {
      const set = new Set(prev)
      for (const aid of selectedByAttr.keys()) set.add(aid)
      return Array.from(set)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join(",")])

  const assignedAttrIds = explicitAttrs
  const assignedSet = new Set(assignedAttrIds)
  const available = attributeDefs.filter((a) => !assignedSet.has(a.id))

  const writeBack = (next: Map<string, string>) => {
    onChange(Array.from(next.values()).filter(Boolean))
  }

  const addAttr = (attrId: string) => {
    setExplicitAttrs((p) => (p.includes(attrId) ? p : [...p, attrId]))
  }

  const setValue = (attrId: string, valueId: string) => {
    const next = new Map(selectedByAttr)
    if (valueId) next.set(attrId, valueId)
    else next.delete(attrId)
    writeBack(next)
  }

  const removeAttr = (attrId: string) => {
    const next = new Map(selectedByAttr)
    next.delete(attrId)
    setExplicitAttrs((p) => p.filter((id) => id !== attrId))
    writeBack(next)
  }

  return (
    <div className="space-y-2">
      {assignedAttrIds.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          {emptyMessage ?? "Sin atributos asignados. Pulsá «Agregar atributo»."}
        </p>
      )}

      {assignedAttrIds.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {assignedAttrIds.map((attrId) => {
            const attr = attributeDefs.find((a) => a.id === attrId)
            if (!attr) return null
            const sel = selectedByAttr.get(attrId) ?? ""
            return (
              <div
                key={attrId}
                className="flex items-center gap-1.5 rounded-md border bg-muted/20 px-2 py-1.5"
              >
                <label className="w-20 shrink-0 truncate text-[11px] font-medium text-muted-foreground">
                  {attr.name.es ?? attr.slug}
                </label>
                <select
                  value={sel}
                  onChange={(e) => setValue(attrId, e.target.value)}
                  className={`flex-1 ${smallInputCls}`}
                >
                  <option value="">— elegir —</option>
                  {attr.values.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name.es ?? v.slug}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAttr(attrId)}
                  title="Quitar atributo"
                  className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={available.length === 0}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Agregar atributo
            {available.length === 0 && (
              <span className="text-[10px] text-muted-foreground">(todos asignados)</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {available.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => addAttr(a.id)}>
              <span className="flex-1 truncate">{a.name.es ?? a.slug}</span>
              <span className="text-[10px] text-muted-foreground">
                {a.values.length} valor{a.values.length !== 1 ? "es" : ""}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
