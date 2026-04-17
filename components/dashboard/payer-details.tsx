"use client"

interface PayerDetail {
  transactionEndToEndId: string | null
  payerName: string | null
  payerDocument: string | null
  payerBankName: string | null
  payerBankNumber: string | null
}

export function PayerDetails({ details }: { details: PayerDetail }) {
  const rows = [
    { label: "ID E2E (comprobante PIX)", value: details.transactionEndToEndId, mono: true },
    { label: "Nombre del pagador", value: details.payerName },
    { label: "Documento", value: details.payerDocument, mono: true },
    { label: "Banco", value: details.payerBankName },
    { label: "Cod. banco", value: details.payerBankNumber, mono: true },
  ]

  const hasAny = rows.some((r) => r.value)
  if (!hasAny) return null

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Datos del pagador (webhook)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {rows.map(
          (r) =>
            r.value && (
              <div key={r.label}>
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className={`font-medium break-all ${r.mono ? "font-mono text-xs" : ""}`}>
                  {r.value}
                </p>
              </div>
            ),
        )}
      </div>
    </div>
  )
}
