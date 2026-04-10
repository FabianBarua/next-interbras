"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export function LogMetaViewer({ meta }: { meta: unknown }) {
  const [open, setOpen] = useState(false)
  if (!meta) return null

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {open ? "Ocultar" : "Ver datos"}
      </Button>
      {open && (
        <pre className="mt-1 max-h-48 overflow-auto rounded border bg-muted/50 p-2 text-xs leading-relaxed">
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </div>
  )
}
