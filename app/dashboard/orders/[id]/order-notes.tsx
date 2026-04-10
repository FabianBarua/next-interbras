"use client"

import { useState } from "react"
import { addOrderNote } from "@/lib/actions/orders"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Note {
  id: string
  content: string
  createdAt: Date
  createdBy: string | null
}

interface Props {
  orderId: string
  notes: Note[]
}

export function OrderNotes({ orderId, notes }: Props) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!content.trim()) return
    setLoading(true)
    await addOrderNote(orderId, content)
    setContent("")
    setLoading(false)
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold">Notas internas</h2>

      <div className="mb-4 flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Agregar nota interna..."
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={loading || !content.trim()}
          className="self-end"
        >
          {loading ? "..." : "Agregar"}
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguna nota.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-md border p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.createdAt.toLocaleDateString("es-PY", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
