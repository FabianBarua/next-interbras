"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPayment } from "@/lib/actions/create-payment"

interface Props {
  orderId: string
  gateways: { name: string; displayName: string; type: string }[]
}

const PIX_TYPES = ["pyxpay-pix", "commpix-pix"]

export function GatewaySelector({ orderId, gateways }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cpf, setCpf] = useState("")
  const [cpfError, setCpfError] = useState<string | null>(null)

  // Detect if any active gateway requires CPF (PIX gateways)
  const requiresCpf = gateways.some((gw) => PIX_TYPES.includes(gw.type))

  async function handleSelect(gw: { name: string; type: string }) {
    // Validate CPF only for PIX gateways
    if (PIX_TYPES.includes(gw.type)) {
      const clean = cpf.replace(/\D/g, "")
      if (clean.length < 6 || clean.length > 14) {
        setCpfError("Ingrese un documento válido (CPF, RG, CI — 6 a 14 dígitos).")
        return
      }
      setCpfError(null)
    }

    setLoading(gw.name)
    setError(null)

    try {
      const result = await createPayment(orderId, gw.name, {
        name: "",
        email: "",
        cpf: cpf.replace(/\D/g, ""),
      })

      if (result.error) {
        setError(result.error)
        setLoading(null)
        return
      }

      // Reload to show the payment block
      router.refresh()
      setLoading(null)
    } catch {
      setError("Error al procesar el pago. Intente de nuevo.")
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* CPF input — only shown when PIX gateways are present */}
      {requiresCpf && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <label className="block text-sm font-medium">
            Documento (CPF / RG / CI)
          </label>
          <p className="text-xs text-muted-foreground">
            Requerido para generar el código PIX.
          </p>
          <input
            type="text"
            value={cpf}
            onChange={(e) => { setCpf(e.target.value); setCpfError(null) }}
            placeholder="000.000.000-00"
            maxLength={20}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
        </div>
      )}

      {/* Gateway list */}
      {gateways.map((gw) => (
        <button
          key={gw.name}
          onClick={() => handleSelect(gw)}
          disabled={loading !== null}
          className="w-full rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{gw.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {gw.type.includes("pix") ? "Pago instantáneo vía PIX"
                  : gw.type.includes("card") ? "Crédito o débito"
                  : gw.type.includes("cash") ? "Efectivo al retirar"
                  : gw.type.includes("transfer") ? "Transferencia bancaria"
                  : ""}
              </p>
            </div>
            {loading === gw.name ? (
              <svg className="animate-spin h-5 w-5 text-primary shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </div>
        </button>
      ))}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
