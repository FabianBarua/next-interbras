"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { updateAffiliateSettings } from "@/lib/actions/admin/affiliates"
import { Button } from "@/components/ui/button"

export function AffiliateSettingsForm({
  defaultRate,
  cookieDays,
}: {
  defaultRate: number
  cookieDays: number
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [message, setMessage] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setMessage("")
    startTransition(async () => {
      const result = await updateAffiliateSettings({
        defaultCommissionRate:
          parseInt(fd.get("defaultCommissionRate") as string, 10) || 10,
        cookieDays: parseInt(fd.get("cookieDays") as string, 10) || 30,
      })
      if ("error" in result) {
        setMessage(result.error!)
      } else {
        setMessage("Configuración guardada")
        router.refresh()
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-lg border p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Tasa de comisión por defecto (%)
        </label>
        <input
          name="defaultCommissionRate"
          type="number"
          min={0}
          max={100}
          defaultValue={defaultRate}
          className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Tasa aplicada a nuevos afiliados. Se puede personalizar
          individualmente.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Duración del cookie de afiliado (días)
        </label>
        <input
          name="cookieDays"
          type="number"
          min={1}
          max={365}
          defaultValue={cookieDays}
          className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Cuántos días el cookie permanece activo después del click en el enlace
          de referencia.
        </p>
      </div>

      {message && (
        <p
          className={`text-sm ${message.includes("guardada") ? "text-emerald-600" : "text-destructive"}`}
        >
          {message}
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        Guardar configuración
      </Button>
    </form>
  )
}
