"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { bulkCreateAttributeValuesAction } from "@/lib/actions/admin/attributes"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"

interface Props {
  attributeId: string
  attributeName: string
}

export function BulkValueForm({ attributeId, attributeName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")

  const handleSubmit = () => {
    setError(null)
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) { setError("Ingrese al menos un valor."); return }

    const values = lines.map((line, i) => {
      const slug = line.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      return { attributeId, slug, name: { es: line, pt: line }, sortOrder: i }
    })

    startTransition(async () => {
      const res = await bulkCreateAttributeValuesAction(values)
      if ("error" in res) setError(res.error!)
      else router.push(`/dashboard/attributes/${attributeId}`)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/dashboard/attributes/${attributeId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver a {attributeName}
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground">
          Un valor por línea (se usará como nombre ES y PT, slug se genera automáticamente)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"Rojo\nAzul\nVerde\nAmarillo"}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 resize-y min-h-[160px]"
        />
        <p className="text-xs text-muted-foreground">
          {text.split("\n").filter((l) => l.trim()).length} valores detectados
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={isPending || !text.trim()}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Crear valores
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/attributes/${attributeId}`}>Cancelar</Link>
        </Button>
      </div>
    </div>
  )
}
