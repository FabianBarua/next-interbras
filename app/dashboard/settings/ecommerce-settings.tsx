"use client"

import { useState } from "react"
import { toggleEcommerce } from "@/lib/actions/admin/settings"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

interface Props {
  initialEnabled: boolean
}

export function EcommerceSettings({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleToggle(checked: boolean) {
    setError("")
    setSuccess("")
    setSaving(true)
    const res = await toggleEcommerce(checked)
    if (res.error) {
      setError(res.error)
    } else {
      setEnabled(checked)
      setSuccess(checked ? "E-commerce activado." : "E-commerce desactivado.")
      setTimeout(() => setSuccess(""), 3000)
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="size-4" />
          E-commerce
        </CardTitle>
        <CardDescription>
          Activa o desactiva las funciones de tienda: carrito, precios, checkout y
          pedidos. Mientras esté desactivado, el sitio funciona como catálogo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
            id="ecommerce-toggle"
          />
          <Label htmlFor="ecommerce-toggle" className="text-sm">
            {enabled ? "Activado" : "Desactivado"}
          </Label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}
      </CardContent>
    </Card>
  )
}
