"use client"

import type { OrderStatus } from "@/types/order"
import { Check, Package, Clock, Truck, Home } from "lucide-react"
import { useState, useEffect } from "react"

interface TrackerProps {
  status: OrderStatus
  dateStr?: string
}

const STAGES = [
  { id: "PENDING", label: "Recibido", desc: "Pago en revisión", detail: "Estamos verificando el ingreso de tu pago.", Icon: Clock },
  { id: "PROCESSING", label: "Procesando", desc: "Preparando embalaje", detail: "Control de calidad y empaquetado de tu orden.", Icon: Package },
  { id: "SHIPPED", label: "En Camino", desc: "En poder del courier", detail: "Tu paquete está en ruta hacia tu dirección.", Icon: Truck },
  { id: "DELIVERED", label: "Entregado", desc: "Paquete entregado", detail: "¡Tu pedido fue entregado con éxito!", Icon: Home },
]

export function OrderTracker({ status, dateStr }: TrackerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>
        <div>
          <p className="font-bold text-sm">Orden Cancelada</p>
          <p className="text-xs opacity-80 mt-0.5">Este pedido fue anulado. Si hubo un cargo, será reembolsado.</p>
        </div>
      </div>
    )
  }

  const activeIdx = Math.max(0, STAGES.findIndex((s) => s.id === status))
  const pct = activeIdx === 0 ? 0 : activeIdx === 1 ? 33 : activeIdx === 2 ? 66 : 100
  const visualPct = mounted ? pct : 0

  return (
    <div className="space-y-6">
      {/* Progress bar with nodes */}
      <div className="relative pt-2 pb-6 px-2">
        {/* Track bg */}
        <div className="absolute top-[1.375rem] left-[12%] right-[12%] h-1 rounded-full bg-muted" />
        {/* Track fill */}
        <div
          className="absolute top-[1.375rem] left-[12%] h-1 rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${visualPct * 0.76}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {STAGES.map((stage, idx) => {
            const done = idx < activeIdx
            const active = idx === activeIdx
            const future = idx > activeIdx
            const { Icon } = stage

            return (
              <div key={stage.id} className="flex flex-col items-center w-1/4">
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    done ? "bg-primary border-primary text-primary-foreground" :
                    active ? "bg-background border-primary text-primary ring-2 ring-primary/20" :
                    "bg-muted/60 border-muted text-muted-foreground/40"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
                <span className={`mt-2.5 text-[10px] sm:text-xs font-semibold tracking-wide uppercase ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current status detail — simple & clean */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          {(() => { const I = STAGES[activeIdx].Icon; return <I className="h-4 w-4" /> })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{STAGES[activeIdx].desc}</p>
            {status !== "DELIVERED" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Activo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{STAGES[activeIdx].detail}</p>
          {dateStr && (
            <p className="text-[11px] text-muted-foreground mt-1.5">Última actualización: {dateStr}</p>
          )}
        </div>
      </div>
    </div>
  )
}
