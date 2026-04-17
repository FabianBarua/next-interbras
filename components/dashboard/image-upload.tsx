"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
  label?: string
}

export function ImageUpload({ value, onChange, max = 10, label = "Imágenes" }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (value.length + files.length > max) {
      setError(`Máximo ${max} imágenes.`)
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) fd.append("files", f)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al subir.")
        return
      }
      onChange([...value, ...data.urls])
    } catch {
      setError("Error de red al subir archivos.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }, [value, onChange, max])

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const arr = [...value]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    onChange(arr)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative w-20 h-20 rounded-lg border overflow-hidden bg-muted/30">
            <Image src={url} alt="" fill className="object-contain p-1" unoptimized />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i > 0 && (
                <button type="button" onClick={() => move(i, i - 1)} className="text-white text-xs p-1 hover:bg-white/20 rounded">←</button>
              )}
              <button type="button" onClick={() => remove(i)} className="text-red-400 text-xs p-1 hover:bg-white/20 rounded font-bold">✕</button>
              {i < value.length - 1 && (
                <button type="button" onClick={() => move(i, i + 1)} className="text-white text-xs p-1 hover:bg-white/20 rounded">→</button>
              )}
            </div>
            {i === 0 && (
              <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-primary text-primary-foreground px-1 rounded">MAIN</span>
            )}
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {uploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <span className="text-[10px] mt-1">Subir</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
