"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Country } from "@/types/country"
import { updateCountryAction } from "@/lib/actions/admin/countries"
import { Pencil } from "lucide-react"

export function CountriesTable({ items }: { items: Country[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggleActive = (item: Country) => {
    startTransition(async () => {
      await updateCountryAction(item.id, { active: !item.active })
      router.refresh()
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">Código</th>
            <th className="text-center px-4 py-3 font-medium">Bandera</th>
            <th className="text-left px-4 py-3 font-medium">Nombre (ES)</th>
            <th className="text-left px-4 py-3 font-medium">Nombre (PT)</th>
            <th className="text-left px-4 py-3 font-medium">Moneda</th>
            <th className="text-center px-4 py-3 font-medium">Activo</th>
            <th className="text-center px-4 py-3 font-medium">Orden</th>
            <th className="text-right px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
              <td className="px-4 py-3 text-center text-lg">{item.flag}</td>
              <td className="px-4 py-3">{item.name.es ?? "—"}</td>
              <td className="px-4 py-3">{item.name.pt ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{item.currency}</td>
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
                <Link
                  href={`/dashboard/countries/${item.id}`}
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
              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                No hay países configurados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
