"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import type { CustomSection } from "@/lib/pdf/types"
import { SECTION_COLORS, SECTION_ICONS } from "@/lib/pdf/constants"
import { cn } from "@/lib/utils"
import * as PhIcons from "@phosphor-icons/react"

type PhIconComponent = ComponentType<{ className?: string; weight?: "regular" | "fill" }>
const phIconMap = PhIcons as unknown as Record<string, PhIconComponent>

interface Props {
  /** Null means "create new". */
  section: CustomSection | null
  open: boolean
  onClose: () => void
}

export function CustomSectionDialog({ section, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <CustomSectionDialogBody
          key={section?.id ?? "new"}
          section={section}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function CustomSectionDialogBody({ section, onClose }: Omit<Props, "open">) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const add = useCatalogStore((s) => s.addCustomSection)
  const update = useCatalogStore((s) => s.updateCustomSection)
  const remove = useCatalogStore((s) => s.removeCustomSection)

  const [name, setName] = useState(section?.name ?? "")
  const [color, setColor] = useState<string>(section?.color ?? SECTION_COLORS[0].key)
  const [icon, setIcon] = useState<string>(section?.icon ?? SECTION_ICONS[0])

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (section) {
      update(section.id, { name: trimmed, color, icon })
    } else {
      add({ name: trimmed, color, icon, entryIds: [] })
    }
    onClose()
  }

  function handleDelete() {
    if (!section) return
    if (typeof window !== "undefined" && !window.confirm(t.deleteSectionConfirm)) return
    remove(section.id)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{section ? t.editSection : t.newSection}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cs-name" className="text-xs">{t.sectionName}</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t.sectionColor}</Label>
            <div className="flex flex-wrap gap-2">
              {SECTION_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                    color === c.key
                      ? "border-foreground shadow-sm"
                      : "border-border hover:border-foreground/40",
                  )}
                  style={{ backgroundColor: c.bg, color: c.fg }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t.sectionIcon}</Label>
            <div className="grid max-h-45 grid-cols-10 gap-1.5 overflow-y-auto rounded-md border border-border/60 p-2">
              {SECTION_ICONS.map((iconName) => {
                const Icon = phIconMap[iconName]
                if (!Icon) return null
                const active = icon === iconName
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {section && (
            <Button variant="destructive" onClick={handleDelete}>{t.delete}</Button>
          )}
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
  )
}
