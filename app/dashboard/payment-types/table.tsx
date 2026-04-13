"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { PaymentType } from "@/types/payment-type"
import {
  createPaymentTypeAction,
  updatePaymentTypeAction,
  deletePaymentTypeAction,
} from "@/lib/actions/admin/payment-types"
import { Pencil, Trash2 } from "lucide-react"

export function PaymentTypesTable({ items }: { items: PaymentType[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleActive = (item: PaymentType) => {
    startTransition(async () => {
      await updatePaymentTypeAction(item.id, { active: !item.active })
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este tipo de pago?")) return
    startTransition(async () => {
      await deletePaymentTypeAction(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Nombre (ES)</th>
              <th className="text-left px-4 py-3 font-medium">Nombre (PT)</th>
              <th className="text-left px-4 py-3 font-medium">Icono</th>
              <th className="text-center px-4 py-3 font-medium">Activo</th>
              <th className="text-center px-4 py-3 font-medium">Orden</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              editing === item.id ? (
                <EditRow
                  key={item.id}
                  item={item}
                  onCancel={() => setEditing(null)}
                  onSave={() => { setEditing(null); router.refresh() }}
                  setError={setError}
                />
              ) : (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{item.slug}</td>
                  <td className="px-4 py-3">{item.name.es ?? "—"}</td>
                  <td className="px-4 py-3">{item.name.pt ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{item.icon}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={isPending}
                      className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                        item.active ? "bg-green-500" : "bg-muted"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        item.active ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">{item.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(item.id)}
                        title="Editar"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        title="Eliminar"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {creating && (
              <CreateRow
                onCancel={() => setCreating(false)}
                onSave={() => { setCreating(false); router.refresh() }}
                setError={setError}
              />
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center px-4 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90"
        >
          + Nuevo tipo de pago
        </button>
      )}
    </div>
  )
}

function EditRow({
  item,
  onCancel,
  onSave,
  setError,
}: {
  item: PaymentType
  onCancel: () => void
  onSave: () => void
  setError: (e: string | null) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [nameEs, setNameEs] = useState(item.name.es ?? "")
  const [namePt, setNamePt] = useState(item.name.pt ?? "")
  const [descEs, setDescEs] = useState(item.description?.es ?? "")
  const [descPt, setDescPt] = useState(item.description?.pt ?? "")
  const [icon, setIcon] = useState(item.icon)
  const [sortOrder, setSortOrder] = useState(item.sortOrder)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updatePaymentTypeAction(item.id, {
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        icon,
        sortOrder,
      })
      if ("error" in res) setError(res.error ?? null)
      else onSave()
    })
  }

  return (
    <tr className="border-b bg-primary/5">
      <td className="px-4 py-2 font-mono text-xs">{item.slug}</td>
      <td className="px-4 py-2"><input value={nameEs} onChange={e => setNameEs(e.target.value)} className="w-full h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2"><input value={namePt} onChange={e => setNamePt(e.target.value)} className="w-full h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2"><input value={icon} onChange={e => setIcon(e.target.value)} className="w-20 h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2 text-center">—</td>
      <td className="px-4 py-2 text-center"><input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-14 h-8 rounded border px-2 text-sm text-center" /></td>
      <td className="px-4 py-2 text-right space-x-2">
        <button onClick={handleSave} disabled={isPending} className="text-xs text-primary hover:underline">{isPending ? "..." : "Guardar"}</button>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
      </td>
    </tr>
  )
}

function CreateRow({
  onCancel,
  onSave,
  setError,
}: {
  onCancel: () => void
  onSave: () => void
  setError: (e: string | null) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [slug, setSlug] = useState("")
  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [icon, setIcon] = useState("cash")
  const [sortOrder, setSortOrder] = useState(0)

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await createPaymentTypeAction({
        slug,
        name: { es: nameEs, pt: namePt },
        icon,
        sortOrder,
      })
      if ("error" in res) setError(res.error ?? null)
      else onSave()
    })
  }

  return (
    <tr className="border-b bg-green-500/5">
      <td className="px-4 py-2"><input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug" className="w-full h-8 rounded border px-2 text-sm font-mono" /></td>
      <td className="px-4 py-2"><input value={nameEs} onChange={e => setNameEs(e.target.value)} placeholder="Nombre ES" className="w-full h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2"><input value={namePt} onChange={e => setNamePt(e.target.value)} placeholder="Nome PT" className="w-full h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2"><input value={icon} onChange={e => setIcon(e.target.value)} className="w-20 h-8 rounded border px-2 text-sm" /></td>
      <td className="px-4 py-2 text-center">—</td>
      <td className="px-4 py-2 text-center"><input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-14 h-8 rounded border px-2 text-sm text-center" /></td>
      <td className="px-4 py-2 text-right space-x-2">
        <button onClick={handleSave} disabled={isPending} className="text-xs text-primary hover:underline">{isPending ? "..." : "Crear"}</button>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
      </td>
    </tr>
  )
}
