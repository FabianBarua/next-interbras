"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createOrderFlowAction } from "@/lib/actions/admin/order-flows"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

interface Props {
  shippingMethods: { id: string; name: { es?: string; pt?: string }; slug: string }[]
  gatewayTypes: { type: string; displayName: string }[]
}

export function OrderFlowForm({ shippingMethods, gatewayTypes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [descEs, setDescEs] = useState("")
  const [descPt, setDescPt] = useState("")
  const [shippingMethodId, setShippingMethodId] = useState<string>("")
  const [gatewayType, setGatewayType] = useState<string>("")
  const [isDefault, setIsDefault] = useState(false)
  const [active, setActive] = useState(true)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createOrderFlowAction({
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        shippingMethodId: shippingMethodId || null,
        gatewayType: gatewayType || null,
        isDefault,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
      } else {
        router.push("/dashboard/order-flows")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/order-flows"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a flujos
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="Retiro + Efectivo"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              placeholder="Retirada + Dinheiro"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (ES)</label>
            <input
              value={descEs}
              onChange={(e) => setDescEs(e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción (PT)</label>
            <input
              value={descPt}
              onChange={(e) => setDescPt(e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Método de Envío</label>
            <select
              value={shippingMethodId}
              onChange={(e) => setShippingMethodId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Cualquiera —</option>
              {shippingMethods.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name.es ?? sm.slug}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Gateway de Pago</label>
            <select
              value={gatewayType}
              onChange={(e) => setGatewayType(e.target.value)}
              className={inputClass}
            >
              <option value="">— Cualquiera —</option>
              {gatewayTypes.map((gt) => (
                <option key={gt.type} value={gt.type}>
                  {gt.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Flujo por defecto</label>
            <label className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{isDefault ? "Sí" : "No"}</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Activo</label>
            <label className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span className="text-sm">{active ? "Activo" : "Inactivo"}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={isPending || !nameEs}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Crear flujo
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/order-flows">Cancelar</Link>
        </Button>
      </div>
    </div>
  )
}
