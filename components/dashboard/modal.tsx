"use client"

import { useEffect, useRef } from "react"

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}

export function Modal({ open, onClose, title, children, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={`relative z-10 bg-background rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto ${
          wide ? "w-full max-w-3xl" : "w-full max-w-lg"
        } mx-4`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
