"use client"

import { Check, Package, Clock, Truck, Home, CreditCard, CheckCircle, XCircle, RotateCcw, Timer, Building, Circle } from "lucide-react"
import { useState, useEffect, type ElementType } from "react"
import { useDictionary } from "@/i18n/context"

const ICON_MAP: Record<string, ElementType> = {
  Clock, Package, Truck, Home, CreditCard, CheckCircle, XCircle, RotateCcw, Timer, Building, Circle, Check,
}

export interface TrackerStep {
  slug: string
  label: string
  icon: string
}

interface TrackerProps {
  steps: TrackerStep[]
  currentStatus: string
  dateStr?: string
}

export function OrderTracker({ steps, currentStatus, dateStr }: TrackerProps) {
  const { dict } = useDictionary()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const activeIdx = steps.findIndex((s) => s.slug === currentStatus)

  // Terminal status not in flow (cancelled, refunded, etc.)
  if (activeIdx === -1) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>
        <div>
          <p className="font-bold text-sm">{dict.orderTracker.cancelled}</p>
          <p className="text-xs opacity-80 mt-0.5">{dict.orderTracker.cancelledDetail}</p>
        </div>
      </div>
    )
  }

  const isLast = activeIdx === steps.length - 1
  const pct = steps.length <= 1 ? 100 : (activeIdx / (steps.length - 1)) * 100
  const visualPct = mounted ? pct : 0
  const widthFraction = steps.length > 1 ? `${steps.length - 1}` : "1"

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
          {steps.map((step, idx) => {
            const done = idx < activeIdx
            const active = idx === activeIdx
            const Icon = ICON_MAP[step.icon] ?? Circle

            return (
              <div key={step.slug} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
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
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current status detail */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          {(() => { const I = ICON_MAP[steps[activeIdx].icon] ?? Circle; return <I className="h-4 w-4" /> })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{steps[activeIdx].label}</p>
            {!isLast && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {dict.orderTracker.active}
              </span>
            )}
          </div>
          {dateStr && (
            <p className="text-[11px] text-muted-foreground mt-1.5">{dict.orderTracker.lastUpdate}: {dateStr}</p>
          )}
        </div>
      </div>
    </div>
  )
}
