"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import type { PaymentBlockProps } from "@/lib/payments/types"
import { saveReceiptAction } from "@/lib/actions/save-receipt"

export function TransferBlock({ data, orderId }: PaymentBlockProps) {
  const bankName = data.bankName as string
  const accountNumber = data.accountNumber as string
  const accountType = data.accountType as string
  const holder = data.holder as string
  const message = data.message as string

  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)

    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/receipt", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Error al subir el archivo.")
      }
      const { url } = await res.json() as { url: string }
      const saved = await saveReceiptAction(orderId, url)
      if (saved?.error) throw new Error(saved.error)
      setUploaded(true)
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold">¡Comprobante enviado!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Procesaremos su pedido al verificar el pago. Le notificaremos por email.
            </p>
          </div>
        </div>
        <Link
          href="/cuenta/pedidos"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver mis pedidos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Instruction card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-950/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
      </div>

      {/* Bank details */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" />
          </svg>
          Datos bancarios
        </h3>
        <div className="space-y-2 text-sm">
          {bankName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Banco</span>
              <span className="font-medium">{bankName}</span>
            </div>
          )}
          {accountType && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de cuenta</span>
              <span className="font-medium">{accountType}</span>
            </div>
          )}
          {holder && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Titular</span>
              <span className="font-medium">{holder}</span>
            </div>
          )}
          {accountNumber && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Número de cuenta</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-primary">{accountNumber}</span>
                <button
                  onClick={handleCopy}
                  className="rounded-md border p-1 text-xs hover:bg-muted transition-colors"
                  title="Copiar"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt upload */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Subir comprobante
        </h3>
        <p className="text-xs text-muted-foreground">
          Adjunte la foto o captura de pantalla de la transferencia realizada.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/80 cursor-pointer"
        />
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Enviando...
            </>
          ) : (
            "Enviar comprobante"
          )}
        </button>
      </div>
    </div>
  )
}
