"use client"

import { useState } from "react"
import { updateSiteSettings } from "@/lib/actions/admin/settings"
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
import { Globe } from "lucide-react"

interface Props {
  initialUrl: string
}

export function SiteUrlSettings({ initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSave() {
    setError("")
    setSuccess("")
    setSaving(true)
    const res = await updateSiteSettings({ url })
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess("URL guardada con éxito.")
      setTimeout(() => setSuccess(""), 3000)
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4" />
          URL del Sitio
        </CardTitle>
        <CardDescription>
          Dirección principal del sitio usada en links, emails e integraciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>URL</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://misitio.com"
              className="flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={saving || url === initialUrl}
              size="sm"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}
      </CardContent>
    </Card>
  )
}
