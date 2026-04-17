"use client"

import { useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fileToScaledDataUrl } from "@/lib/pdf/helpers"
import { cn } from "@/lib/utils"

interface Props {
  value: string | null
  onChange: (dataUrl: string | null) => void
  /** Max side in px (default 1200). */
  maxSide?: number
  className?: string
  uploadLabel: string
  removeLabel?: string
  /** Aspect ratio class (e.g. "aspect-[16/9]", "aspect-square"). */
  aspectClassName?: string
}

/**
 * Small uploader that reads a single file into a downscaled data URL.
 * No server upload — everything is client-side to keep user's config local.
 */
export function ImageUploadField({
  value,
  onChange,
  maxSide = 1200,
  className,
  uploadLabel,
  removeLabel,
  aspectClassName = "aspect-[16/9]",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const dataUrl = await fileToScaledDataUrl(file, maxSide)
    onChange(dataUrl)
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-muted", aspectClassName)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/40 group-hover:flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1 h-3.5 w-3.5" />
              {uploadLabel}
            </Button>
            {removeLabel && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {removeLabel}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
            aspectClassName,
          )}
        >
          <Upload className="h-6 w-6" />
          <span>{uploadLabel}</span>
        </button>
      )}
    </div>
  )
}
