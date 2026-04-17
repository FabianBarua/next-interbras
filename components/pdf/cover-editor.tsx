"use client"

import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import { ImageUploadField } from "./image-upload-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Cover editor lives on the /pdf edit surface.
 * The rendered PDF cover is produced by <CoverPage/>.
 */
export function CoverEditor() {
  const { dict } = useDictionary()
  const t = dict.catalog
  const cover = useCatalogStore((s) => s.coverImageDataUrl)
  const title = useCatalogStore((s) => s.coverTitle)
  const subtitle = useCatalogStore((s) => s.coverSubtitle)
  const setCover = useCatalogStore((s) => s.setCover)
  const setCoverTitle = useCatalogStore((s) => s.setCoverTitle)
  const setCoverSubtitle = useCatalogStore((s) => s.setCoverSubtitle)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">{t.coverTitle}</h3>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div>
            <Label htmlFor="cover-title" className="mb-1.5 text-xs">
              {t.coverTitleLabel}
            </Label>
            <Input
              id="cover-title"
              value={title}
              onChange={(e) => setCoverTitle(e.target.value)}
              placeholder={t.coverDefault}
            />
          </div>
          <div>
            <Label htmlFor="cover-subtitle" className="mb-1.5 text-xs">
              {t.coverSubtitleLabel}
            </Label>
            <Input
              id="cover-subtitle"
              value={subtitle}
              onChange={(e) => setCoverSubtitle(e.target.value)}
            />
          </div>
        </div>

        <ImageUploadField
          value={cover}
          onChange={setCover}
          uploadLabel={cover ? t.coverChange : t.coverUploadHint}
          removeLabel={t.coverRemove}
          aspectClassName="aspect-[16/9]"
        />
      </div>
    </div>
  )
}
