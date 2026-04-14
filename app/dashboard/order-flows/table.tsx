"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { OrderFlow } from "@/types/order-flow"
import { updateOrderFlowAction } from "@/lib/actions/admin/order-flows"
import { Pencil } from "lucide-react"

export function OrderFlowsTable({ items }: { items: OrderFlow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggleActive = (item: OrderFlow) => {
    startTransition(async () => {
      await updateOrderFlowAction(item.id, { active: !item.active })
      router.refresh()
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">Nombre (ES)</th>
            <th className="text-left px-4 py-3 font-medium">Envío</th>
            <th className="text-left px-4 py-3 font-medium">Gateway</th>
            <th className="text-center px-4 py-3 font-medium">Pasos</th>
            <th className="text-center px-4 py-3 font-medium">Default</th>
            <th className="text-center px-4 py-3 font-medium">Activo</th>
            <th className="text-right px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3">{item.name.es ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {item.shippingMethodId ? item.shippingMethodId.slice(0, 8) + "…" : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{item.gatewayType ?? "—"}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {item.steps.length}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {item.isDefault ? (
                  <span className="text-xs font-medium text-blue-600">Sí</span>
                ) : (
                  <span className="text-xs text-muted-foreground">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleToggleActive(item)}
                  disabled={isPending}
                  className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                    item.active ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      item.active ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/order-flows/${item.id}`}
                  title="Editar"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No hay flujos de pedido configurados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
