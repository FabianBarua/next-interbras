"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function ConfirmacionPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const orderId = `INT-${Date.now().toString().slice(-8)}`

  return (
    <div className="container max-w-2xl px-4 py-16">
      <div className="flex flex-col items-center text-center rounded-2xl border bg-card p-8 md:p-12 shadow-sm">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          ¡Pedido Confirmado!
        </h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Tu pedido ha sido procesado con éxito. Recibirás un correo de confirmación con los detalles.
        </p>

        {/* Order info */}
        <div className="w-full rounded-xl bg-muted/40 border p-5 space-y-3 text-sm mb-8">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nº de Pedido</span>
            <span className="font-bold font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Confirmado
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium">{new Date().toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email de confirmación</span>
            <span className="font-medium">juan.perez@example.com</span>
          </div>
        </div>

        {/* What's next */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span className="text-xs text-center text-muted-foreground">Recibirás un email con los detalles</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
            <span className="text-xs text-center text-muted-foreground">Preparamos tu envío en 24-48h</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            <span className="text-xs text-center text-muted-foreground">Tracking disponible pronto</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/cuenta/pedidos"
            className="inline-flex h-11 items-center justify-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ver Mis Pedidos
          </Link>
          <Link
            href="/productos"
            className="inline-flex h-11 items-center justify-center px-8 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
