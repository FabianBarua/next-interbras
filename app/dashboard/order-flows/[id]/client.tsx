"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { OrderFlow, OrderStatusRecord } from "@/types/order-flow"
import {
  updateOrderFlowAction,
  deleteOrderFlowAction,
  updateFlowStepsAction,
} from "@/lib/actions/admin/order-flows"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, Trash2, Plus, ChevronUp, ChevronDown, X } from "lucide-react"

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

interface StepDraft {
  statusSlug: string
  autoTransition: boolean
  notifyCustomer: boolean
}

interface Props {
  flow: OrderFlow
  allStatuses: OrderStatusRecord[]
  shippingMethods: { id: string; name: { es?: string; pt?: string }; slug: string }[]
  gatewayTypes: { type: string; displayName: string }[]
}

export function OrderFlowEditForm({ flow, allStatuses, shippingMethods, gatewayTypes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  /* ── Flow fields ──────────────── */
  const [nameEs, setNameEs] = useState(flow.name.es ?? "")
  const [namePt, setNamePt] = useState(flow.name.pt ?? "")
  const [descEs, setDescEs] = useState(flow.description?.es ?? "")
  const [descPt, setDescPt] = useState(flow.description?.pt ?? "")
  const [shippingMethodId, setShippingMethodId] = useState(flow.shippingMethodId ?? "")
  const [gatewayType, setGatewayType] = useState(flow.gatewayType ?? "")
  const [isDefault, setIsDefault] = useState(flow.isDefault)
  const [active, setActive] = useState(flow.active)

  /* ── Steps editor ─────────────── */
  const [steps, setSteps] = useState<StepDraft[]>(
    flow.steps.map((s) => ({
      statusSlug: s.statusSlug,
      autoTransition: s.autoTransition,
      notifyCustomer: s.notifyCustomer,
    })),
  )

  const addStep = () => {
    const usedSlugs = new Set(steps.map((s) => s.statusSlug))
    const available = allStatuses.find((s) => s.active && !usedSlugs.has(s.slug))
    setSteps([
      ...steps,
      { statusSlug: available?.slug ?? "", autoTransition: false, notifyCustomer: false },
    ])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSteps(next)
  }

  const updateStep = (index: number, field: keyof StepDraft, value: string | boolean) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  /* ── Save ───────────────────────── */
  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      // Save flow metadata
      const res = await updateOrderFlowAction(flow.id, {
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        shippingMethodId: shippingMethodId || null,
        gatewayType: gatewayType || null,
        isDefault,
        active,
      })
      if ("error" in res) {
        setError(res.error!)
        return
      }

      // Save steps
      if (steps.length > 0) {
        const stepsRes = await updateFlowStepsAction(flow.id, steps)
        if ("error" in stepsRes) {
          setError(stepsRes.error!)
          return
        }
      }

      router.push("/dashboard/order-flows")
    })
  }

  /* ── Delete ─────────────────────── */
  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteOrderFlowAction(flow.id)
      if ("error" in res) {
        setError(res.error!)
        setDeleteOpen(false)
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

      {/* ── Flow metadata ─────────── */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (ES)</label>
            <input
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre (PT)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
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

      {/* ── Steps editor ─────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pasos del flujo</h2>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-muted/40 transition-colors"
          >
            <Plus className="size-3" /> Agregar paso
          </button>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay pasos definidos. Agregue al menos uno.
          </p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="size-3" />
                  </button>
                </div>

                {/* Step number */}
                <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                  {index + 1}
                </span>

                {/* Status select */}
                <select
                  value={step.statusSlug}
                  onChange={(e) => updateStep(index, "statusSlug", e.target.value)}
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">— Seleccionar estado —</option>
                  {allStatuses
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name.es ?? s.slug}
                      </option>
                    ))}
                </select>

                {/* Auto-transition toggle */}
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={step.autoTransition}
                    onChange={(e) => updateStep(index, "autoTransition", e.target.checked)}
                    className="size-3.5 rounded border-input"
                  />
                  Auto
                </label>

                {/* Notify toggle */}
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={step.notifyCustomer}
                    onChange={(e) => updateStep(index, "notifyCustomer", e.target.checked)}
                    className="size-3.5 rounded border-input"
                  />
                  Notificar
                </label>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ───────────────── */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending || !nameEs || steps.length === 0}>
          {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/order-flows">Cancelar</Link>
        </Button>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="ml-auto"
        >
          <Trash2 className="mr-1.5 size-3.5" /> Eliminar
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar flujo de pedido</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{flow.name.es ?? flow.id}&quot;? Esta acción eliminará
              también todos los pasos del flujo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
