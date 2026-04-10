"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  previewPayout,
  createPayout,
} from "@/lib/actions/admin/affiliates"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AffiliateOption {
  id: string
  refCode: string
  userName: string | null
  userEmail: string
}

interface PreviewAffiliate {
  affiliateId: string
  totalCommission: number
  commissionCount: number
  affiliateName: string | null
  affiliateEmail: string
  refCode: string
  pixKey: string | null
  pixType: string | null
}

interface PreviewResult {
  affiliates: PreviewAffiliate[]
  totalAmount: number
  totalCommissions: number
  affiliatesCount: number
}

export function NewPayoutForm({
  approvedAffiliates,
}: {
  approvedAffiliates: AffiliateOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [dateUntil, setDateUntil] = useState(format(new Date(), "yyyy-MM-dd"))
  const [minAmount, setMinAmount] = useState("0")
  const [selectedMode, setSelectedMode] = useState<"all" | "select">("all")
  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [error, setError] = useState("")

  function toggleAffiliate(id: string) {
    setSelectedAffiliateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function selectAll() {
    setSelectedAffiliateIds(approvedAffiliates.map((a) => a.id))
  }

  function deselectAll() {
    setSelectedAffiliateIds([])
  }

  function getParams() {
    const minCents = Math.round(
      parseFloat(minAmount.replace(",", ".") || "0") * 100,
    )
    return {
      dateUntil: dateUntil || undefined,
      minAmount: minCents,
      affiliateIds:
        selectedMode === "select" ? selectedAffiliateIds : undefined,
    }
  }

  function handlePreview() {
    setError("")
    startTransition(async () => {
      const result = await previewPayout(getParams())
      if ("error" in result) {
        setError(result.error as string)
        setPreview(null)
      } else {
        setPreview(result as PreviewResult)
      }
    })
  }

  function handleCreatePayout() {
    setError("")
    startTransition(async () => {
      const result = await createPayout({ ...getParams(), notes })
      if ("error" in result) {
        setError(result.error as string)
      } else {
        router.push("/dashboard/affiliates/payouts")
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Detalles del pago</h2>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Incluir comisiones hasta (fecha)
          </label>
          <input
            type="date"
            value={dateUntil}
            onChange={(e) => setDateUntil(e.target.value)}
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Solo comisiones aprobadas hasta esta fecha serán incluidas.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Valor mínimo por afiliado (US$)
          </label>
          <input
            type="text"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
            className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Afiliados con valor bajo este mínimo serán excluidos.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Afiliados incluidos
          </label>
          <div className="mb-2 flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={selectedMode === "all"}
                onChange={() => setSelectedMode("all")}
              />
              Todos los afiliados aprobados
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={selectedMode === "select"}
                onChange={() => setSelectedMode("select")}
              />
              Seleccionar afiliados
            </label>
          </div>

          {selectedMode === "select" && (
            <div className="max-h-60 overflow-auto rounded-md border p-3">
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Desmarcar todos
                </button>
              </div>
              {approvedAffiliates.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ningún afiliado aprobado.
                </p>
              ) : (
                <div className="space-y-1">
                  {approvedAffiliates.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 py-0.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAffiliateIds.includes(a.id)}
                        onChange={() => toggleAffiliate(a.id)}
                      />
                      <span>{a.userName ?? a.userEmail}</span>
                      <span className="text-xs text-muted-foreground">
                        ({a.refCode})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Observaciones sobre este pago..."
            className="flex w-full max-w-lg rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Button onClick={handlePreview} disabled={isPending} size="sm">
          Previsualizar pago
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">
            Previsualización del pago
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="text-lg font-bold">
                {formatPrice(preview.totalAmount)}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Afiliados</p>
              <p className="text-lg font-bold">{preview.affiliatesCount}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Comisiones</p>
              <p className="text-lg font-bold">
                {preview.totalCommissions}
              </p>
            </div>
          </div>

          {preview.affiliates.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead className="w-24 text-center">
                      Comisiones
                    </TableHead>
                    <TableHead className="w-28 text-right">Valor</TableHead>
                    <TableHead>PIX</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.affiliates.map((a) => (
                    <TableRow key={a.affiliateId}>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {a.affiliateName ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.affiliateEmail}
                        </p>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-xs">{a.refCode}</code>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {a.commissionCount}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {formatPrice(a.totalCommission)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.pixKey
                          ? `${a.pixType}: ${a.pixKey}`
                          : "Sin PIX"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCreatePayout}
              disabled={isPending || preview.affiliatesCount === 0}
            >
              Generar pago
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPreview(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
