"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { updateTemplate } from "@/lib/actions/admin/email-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Check } from "lucide-react"
import Link from "@/i18n/link"

export function TemplateEditor({
  slug,
  subject: initialSubject,
  bodyHtml: initialHtml,
  variables,
  active,
}: {
  slug: string
  subject: string
  bodyHtml: string
  variables: string[]
  active: boolean
}) {
  const [subject, setSubject] = useState(initialSubject)
  const [html, setHtml] = useState(initialHtml)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
  } | null>(null)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const updatePreview = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
  }, [html])

  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  async function handleSave() {
    setSaving(true)
    setResult(null)
    try {
      const res = await updateTemplate(slug, { subject, bodyHtml: html })
      setResult(res)
    } catch {
      setResult({ error: "Error al guardar" })
    } finally {
      setSaving(false)
    }
  }

  function copyVariable(v: string) {
    navigator.clipboard.writeText(`{{${v}}}`)
    setCopiedVar(v)
    setTimeout(() => setCopiedVar(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/emails/templates">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">
          Editar template:{" "}
          <span className="font-mono text-primary">{slug}</span>
        </h2>
        <Badge variant={active ? "default" : "outline"}>
          {active ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Asunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Variables disponibles</Label>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => copyVariable(v)}
              className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-xs transition-colors hover:bg-accent"
            >
              {"{{" + v + "}}"}
              {copiedVar === v ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>HTML</Label>
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="min-h-[500px] font-mono text-xs"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="overflow-hidden rounded-md border bg-white">
            <iframe
              ref={iframeRef}
              title="Preview"
              className="h-[500px] w-full"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-sm text-primary">¡Template guardado con éxito!</p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar template"}
        </Button>
      </div>
    </div>
  )
}
