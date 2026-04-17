"use client"

import { useState } from "react"
import { addOrderNote } from "@/lib/actions/orders"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Notas internas
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {notes.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguna nota.</p>
        ) : (
          <ScrollArea className={notes.length > 3 ? "max-h-[300px]" : ""}>
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
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
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Agregar nota interna..."
          rows={2}
        />
        <Button
          onClick={handleAdd}
          disabled={loading || !content.trim()}
          className="w-full"
          size="sm"
        >
          {loading ? "Guardando..." : "Agregar nota"}
        </Button>
      </CardFooter>
    </Card>
  )
}
