"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart-store"
import { useLocaleStore } from "@/store/locale-store"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Envío Estándar", desc: "5-7 días hábiles", price: 8.5 },
  { id: "express", label: "Envío Express", desc: "1-2 días hábiles", price: 15 },
  { id: "pickup", label: "Retiro en Sucursal", desc: "Disponible en 24h", price: 0 },
]

const PAYMENT_METHODS = [
  { id: "card", label: "Tarjeta de Crédito / Débito", icon: "card" },
  { id: "transfer", label: "Transferencia Bancaria", icon: "bank" },
  { id: "cash", label: "Pago en Efectivo (sucursal)", icon: "cash" },
]

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clear } = useCartStore()
  const { locale } = useLocaleStore()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [shipping, setShipping] = useState("standard")
  const [payment, setPayment] = useState("card")
  const [processing, setProcessing] = useState(false)

  const [form, setForm] = useState({
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@example.com",
    telefono: "+595 981 123456",
    documento: "1234567",
    direccion: "Av. Mariscal López 1234",
    ciudad: "Asunción",
    departamento: "Central",
  })

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  if (!mounted) return null

  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.variant?.externalCode?.priceUsd || 0) * item.quantity,
    0
  )
  const shippingCost = SHIPPING_OPTIONS.find((s) => s.id === shipping)?.price || 0
  const total = subtotal + shippingCost

  const steps = [
    { num: 1, label: "Datos" },
    { num: 2, label: "Envío" },
    { num: 3, label: "Pago" },
  ]

  const handleConfirm = () => {
    setProcessing(true)
    setTimeout(() => {
      clear()
      router.push("/checkout/confirmacion")
    }, 1800)
  }

  if (cart.items.length === 0 && !processing) {
    return (
      <div className="container max-w-5xl px-4 py-8">
        <Breadcrumbs items={[{ label: "Mi Carrito", href: "/carrito" }, { label: "Checkout" }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-card mt-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground text-sm mb-6">Agrega productos antes de continuar.</p>
          <Link href="/productos" className="inline-flex h-11 items-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Ver Productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/20 min-h-screen">
      <div className="container max-w-5xl px-4 py-8">
        <Breadcrumbs items={[{ label: "Mi Carrito", href: "/carrito" }, { label: "Checkout" }]} />

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-6 mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Main */}
          <div className="space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-0 mb-4">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1 last:flex-initial">
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    className="flex flex-col items-center gap-1.5 relative z-10"
                    disabled={s.num > step}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      s.num < step
                        ? "bg-primary text-primary-foreground"
                        : s.num === step
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted border-2 text-muted-foreground"
                    }`}>
                      {s.num < step ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      ) : s.num}
                    </div>
                    <span className={`text-xs font-medium ${s.num <= step ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 -mt-4.5 rounded-full transition-colors ${
                      s.num < step ? "bg-primary" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Datos */}
            {step === 1 && (
              <div className="p-6 md:p-8 border bg-card rounded-2xl shadow-sm animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Datos Personales
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
                    <Field label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
                  </div>
                  <Field label="Correo electrónico" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
                    <Field label="Documento (CI / RUC)" value={form.documento} onChange={(v) => setForm({ ...form, documento: v })} />
                  </div>

                  <Separator className="my-2" />

                  <h3 className="text-sm font-semibold pt-2">Dirección de Envío</h3>
                  <Field label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} />
                    <Field label="Departamento" value={form.departamento} onChange={(v) => setForm({ ...form, departamento: v })} />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full sm:w-auto inline-flex h-11 items-center justify-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Continuar a Envío
                </button>
              </div>
            )}

            {/* Step 2: Envío */}
            {step === 2 && (
              <div className="p-6 md:p-8 border bg-card rounded-2xl shadow-sm animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
                  Opciones de Envío
                </h2>

                <div className="space-y-3">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        shipping === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={shipping === opt.id}
                        onChange={() => setShipping(opt.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        shipping === opt.id ? "border-primary" : "border-muted-foreground/30"
                      }`}>
                        {shipping === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <span className="text-sm font-bold">
                        {opt.price === 0 ? "Gratis" : `US$ ${fmt(opt.price)}`}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p><strong>Dirección:</strong> {form.direccion}, {form.ciudad}, {form.departamento}</p>
                  <button onClick={() => setStep(1)} className="text-primary hover:underline mt-1">Cambiar dirección</button>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex h-11 items-center justify-center px-6 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex h-11 items-center justify-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Continuar a Pago
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pago */}
            {step === 3 && (
              <div className="p-6 md:p-8 border bg-card rounded-2xl shadow-sm animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Método de Pago
                </h2>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        payment === pm.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={payment === pm.id}
                        onChange={() => setPayment(pm.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        payment === pm.id ? "border-primary" : "border-muted-foreground/30"
                      }`}>
                        {payment === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex items-center gap-3">
                        {pm.icon === "card" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                        )}
                        {pm.icon === "bank" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                        )}
                        {pm.icon === "cash" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                        )}
                        <span className="text-sm font-semibold">{pm.label}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Mock card form */}
                {payment === "card" && (
                  <div className="mt-5 space-y-4 p-4 rounded-xl border bg-muted/30">
                    <Field label="Número de Tarjeta" value="4111 1111 1111 1111" onChange={() => {}} placeholder="0000 0000 0000 0000" />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Vencimiento" value="12/28" onChange={() => {}} placeholder="MM/AA" />
                      <Field label="CVV" value="123" onChange={() => {}} placeholder="123" />
                    </div>
                    <Field label="Nombre en la Tarjeta" value="JUAN PEREZ" onChange={() => {}} />
                  </div>
                )}

                {payment === "transfer" && (
                  <div className="mt-5 p-4 rounded-xl border bg-muted/30 text-sm space-y-2">
                    <p className="font-semibold">Datos para Transferencia:</p>
                    <p className="text-muted-foreground">Banco: Banco Continental</p>
                    <p className="text-muted-foreground">Cuenta: 0123-456789-001</p>
                    <p className="text-muted-foreground">Titular: Interbras Paraguay S.A.</p>
                    <p className="text-xs text-muted-foreground mt-2">Envía el comprobante a pagos@interbras.com.py</p>
                  </div>
                )}

                {payment === "cash" && (
                  <div className="mt-5 p-4 rounded-xl border bg-muted/30 text-sm space-y-1">
                    <p className="font-semibold">Pago en Sucursal</p>
                    <p className="text-muted-foreground">Tendrás 48 horas para realizar el pago en cualquiera de nuestras sucursales.</p>
                  </div>
                )}

                <Separator className="my-5" />

                {/* Order summary mini */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>US$ {fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío ({SHIPPING_OPTIONS.find(s => s.id === shipping)?.label})</span>
                    <span>{shippingCost === 0 ? "Gratis" : `US$ ${fmt(shippingCost)}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">US$ {fmt(total)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex h-11 items-center justify-center px-6 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="flex-1 inline-flex h-12 items-center justify-center px-8 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-lg shadow-primary/20"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Procesando...
                      </span>
                    ) : (
                      `Confirmar Pedido — US$ ${fmt(total)}`
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center mt-4">
                  Al confirmar, aceptas los Términos y Condiciones y la Política de Privacidad.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-bold text-base tracking-tight">
                Resumen ({cart.totalItems} {cart.totalItems === 1 ? "producto" : "productos"})
              </h2>

              <div className="max-h-60 overflow-y-auto space-y-3">
                {cart.items.map((item) => {
                  const img = item.product.images.find((i) => i.isMain) || item.product.images[0]
                  const name = item.product.name[locale] || item.product.name.es || "Producto"
                  const priceUsd = item.variant?.externalCode?.priceUsd || 0

                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-muted/30 rounded-md overflow-hidden shrink-0 border">
                        {img && <Image src={img.url} alt={name} fill className="object-contain p-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × US$ {fmt(priceUsd)}
                        </p>
                      </div>
                      <span className="text-xs font-bold shrink-0">
                        US$ {fmt(priceUsd * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>US$ {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{step < 2 ? "A calcular" : shippingCost === 0 ? "Gratis" : `US$ ${fmt(shippingCost)}`}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-lg font-black text-primary">US$ {fmt(total)}</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Compra segura
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 transition-shadow"
      />
    </div>
  )
}
