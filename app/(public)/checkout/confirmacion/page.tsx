"use client"

import Link from "@/i18n/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { OrderTracker } from "@/components/store/order-tracker"
import { useDictionary } from "@/i18n/context"

function ConfirmacionContent() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const { dict, locale } = useDictionary()
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const orderId = searchParams.get("orderId") ?? `INT-${Date.now().toString().slice(-8)}`

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
          {dict.confirmation.title}
        </h1>
        <p className="text-muted-foreground max-w-md mb-6">
          {dict.confirmation.message}
        </p>

        {/* Order info */}
        <div className="w-full rounded-xl bg-muted/40 border p-5 space-y-3 text-sm mb-8">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{dict.confirmation.orderNumber}</span>
            <span className="font-bold font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{dict.confirmation.status}</span>
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {dict.confirmation.confirmed}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{dict.confirmation.date}</span>
            <span className="font-medium">{new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "es-PY", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{dict.confirmation.emailLabel}</span>
            <span className="font-medium">{searchParams.get("email") ?? "—"}</span>
          </div>
        </div>

        {/* Tracker Preview */}
        <div className="w-full mb-10 text-left">
           <OrderTracker status="PENDING" dateStr={new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "es-PY", { day: "numeric", month: "short" })} />
        </div>

        {/* What's next / WhatsApp Share */}
        <div className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
            <h3 className="font-bold text-lg md:text-xl">{dict.confirmation.trackTitle}</h3>
          </div>
          <p className="text-sm md:text-base text-green-800/80 dark:text-green-200/80 max-w-md">
            {dict.confirmation.trackDesc}
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${dict.confirmation.whatsappText} http://localhost:3000/tracking/${orderId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-all hover:scale-105 shadow-lg shadow-[#25D366]/20"
          >
            {dict.confirmation.saveWhatsApp}
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/cuenta/pedidos"
            className="inline-flex h-11 items-center justify-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            {dict.confirmation.viewOrders}
          </Link>
          <Link
            href="/productos"
            className="inline-flex h-11 items-center justify-center px-8 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {dict.common.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionContent />
    </Suspense>
  )
}
