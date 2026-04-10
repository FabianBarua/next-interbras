"use client"

import { useState } from "react"
import { saveSiteDomains } from "@/lib/actions/admin/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Globe, X, Plus } from "lucide-react"

interface Props {
  initialDomains: string[]
}

export function SiteDomainsSettings({ initialDomains }: Props) {
  const [domains, setDomains] = useState<string[]>(initialDomains)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function addDomain() {
    const d = input.trim().toLowerCase()
    if (!d) return
    if (domains.includes(d)) {
      setError(`"${d}" ya está en la lista`)
      return
    }
    setDomains((prev) => [...prev, d])
    setInput("")
    setError("")
    setSuccess("")
  }

  function removeDomain(domain: string) {
    setDomains((prev) => prev.filter((dd) => dd !== domain))
    setError("")
    setSuccess("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addDomain()
    }
  }

  async function handleSave() {
    setError("")
    setSuccess("")
    setSaving(true)
    const res = await saveSiteDomains(domains)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess("Dominios guardados correctamente.")
      setTimeout(() => setSuccess(""), 3000)
    }
    setSaving(false)
  }

  const hasChanges = JSON.stringify(domains) !== JSON.stringify(initialDomains)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4" />
          Dominios
        </CardTitle>
        <CardDescription>
          Dominios que apuntan a este backend. Se usan para perfiles de pago por
          dominio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Agregar dominio</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ejemplo.com"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDomain}
              disabled={!input.trim()}
            >
              <Plus className="mr-1 size-3.5" />
              Agregar
            </Button>
          </div>
        </div>

        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeDomain(d)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {domains.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ningún dominio registrado.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}

        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          size="sm"
        >
          {saving ? "Guardando..." : "Guardar dominios"}
        </Button>
      </CardContent>
    </Card>
  )
}
