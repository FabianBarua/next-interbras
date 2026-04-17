"use client"

import { useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DotsSixVertical, Eye, EyeSlash, PencilSimple, Trash } from "@phosphor-icons/react"
import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import type { CatalogCategory } from "@/lib/pdf/types"
import { pickI18n } from "@/lib/pdf/helpers"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onClose: () => void
  categories: CatalogCategory[]
  onEditCustomSection: (sectionId: string) => void
}

/**
 * Centralized "Manage sections" dialog.
 * Lets the user reorder, hide/show and delete catalog sections (category + custom)
 * without cluttering each section header in the builder.
 */
export function ManageSectionsDialog({ open, onClose, categories, onEditCustomSection }: Props) {
  const { dict, locale } = useDictionary()
  const t = dict.catalog

  const categoryOrder = useCatalogStore((s) => s.categoryOrder)
  const hiddenCategoryIds = useCatalogStore((s) => s.hiddenCategoryIds)
  const customSections = useCatalogStore((s) => s.customSections)

  const reorderCategories = useCatalogStore((s) => s.reorderCategories)
  const reorderCustomSections = useCatalogStore((s) => s.reorderCustomSections)
  const toggleCategoryHidden = useCatalogStore((s) => s.toggleCategoryHidden)
  const removeCustomSection = useCatalogStore((s) => s.removeCustomSection)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const hiddenSet = useMemo(() => new Set(hiddenCategoryIds), [hiddenCategoryIds])

  const orderedCategoryIds = useMemo(() => {
    const existing = new Set(categories.map((c) => c.id))
    const ordered = categoryOrder.filter((id) => existing.has(id))
    const missing = categories.map((c) => c.id).filter((id) => !ordered.includes(id))
    return [...ordered, ...missing]
  }, [categories, categoryOrder])

  const customIds = useMemo(
    () => [...customSections].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => s.id),
    [customSections],
  )

  function onDragEndCategory(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = orderedCategoryIds.indexOf(String(active.id))
    const newIdx = orderedCategoryIds.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return
    reorderCategories(arrayMove(orderedCategoryIds, oldIdx, newIdx))
  }

  function onDragEndCustom(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = customIds.indexOf(String(active.id))
    const newIdx = customIds.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return
    reorderCustomSections(arrayMove(customIds, oldIdx, newIdx))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.manageSections}</DialogTitle>
          <DialogDescription>{t.manageSectionsDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-auto pr-1">
          {/* Custom sections */}
          {customSections.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="h-1 w-6 rounded-full bg-brand-500" />
                {t.customSections}
                <span className="ml-auto text-[10px] font-normal">{customSections.length}</span>
              </h3>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCustom}>
                <SortableContext items={customIds} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-1.5">
                    {customIds.map((id) => {
                      const sec = customSections.find((s) => s.id === id)
                      if (!sec) return null
                      return (
                        <ManageRow
                          key={id}
                          id={id}
                          title={sec.name}
                          subtitle={`${sec.entryIds.length} ${t.products}`}
                          hidden={false}
                          actions={
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t.editSection}
                                onClick={() => onEditCustomSection(id)}
                              >
                                <PencilSimple className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title={t.delete}
                                onClick={() => {
                                  if (
                                    typeof window !== "undefined" &&
                                    !window.confirm(t.deleteSectionConfirm)
                                  )
                                    return
                                  removeCustomSection(id)
                                }}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          }
                        />
                      )
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            </section>
          )}

          {/* Categories */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-1 w-6 rounded-full bg-brand-500" />
              {t.allCategories}
              <span className="ml-auto text-[10px] font-normal">
                {orderedCategoryIds.length - hiddenSet.size}/{orderedCategoryIds.length}
              </span>
            </h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCategory}>
              <SortableContext items={orderedCategoryIds} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1.5">
                  {orderedCategoryIds.map((id) => {
                    const cat = categories.find((c) => c.id === id)
                    if (!cat) return null
                    const isHidden = hiddenSet.has(id)
                    return (
                      <ManageRow
                        key={id}
                        id={id}
                        title={pickI18n(cat.name, locale)}
                        subtitle={
                          cat.shortDescription
                            ? pickI18n(cat.shortDescription, locale)
                            : cat.description
                              ? pickI18n(cat.description, locale)
                              : null
                        }
                        svgIcon={cat.svgIcon}
                        hidden={isHidden}
                        actions={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={isHidden ? t.showSection : t.hideSection}
                            onClick={() => toggleCategoryHidden(id)}
                          >
                            {isHidden ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeSlash className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        }
                      />
                    )
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface RowProps {
  id: string
  title: string
  subtitle: string | null
  hidden: boolean
  svgIcon?: string | null
  actions: React.ReactNode
}

function ManageRow({ id, title, subtitle, hidden, svgIcon, actions }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-2 shadow-xs transition",
        isDragging && "z-10 shadow-md ring-2 ring-brand-500/40",
        hidden && "opacity-50",
      )}
    >
      <button
        type="button"
        className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical className="h-4 w-4" />
      </button>

      {svgIcon ? (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 [&_svg]:h-4 [&_svg]:w-4"
          dangerouslySetInnerHTML={{ __html: svgIcon }}
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold text-brand-600">
          {title.charAt(0)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
    </li>
  )
}
