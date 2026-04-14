"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createOrderAction } from "@/lib/actions/checkout"
import { createAddressAction } from "@/lib/actions/profile"
import {
  Loader2,
  ArrowLeft,
  Truck,
  Store,
  MapPin,
  Pencil,
  Banknote,
  CreditCard,
  Building2,
  QrCode,
} from "lucide-react"
import type { UserProfile } from "@/types/user"
import type { CheckoutSession } from "@/lib/actions/checkout-session"
import type { PaymentOption } from "@/services/countries"

// ── Helpers ─────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Banknote> = {
  "manual-cash": Banknote,
  "manual-transfer": Building2,
  "manual-card": CreditCard,
  "pyxpay-pix": QrCode,
  "commpix-pix": QrCode,
  "pyxpay-card": CreditCard,
}

function getPaymentMethodFromType(type: string): "cash" | "card" | "transfer" | "pix" {
  if (type.includes("cash")) return "cash"
  if (type.includes("transfer")) return "transfer"
  if (type.includes("pix")) return "pix"
  return "card"
}

function getPaymentLabel(type: string, d: Record<string, string>): string {
  if (type.includes("cash")) return d.paymentCash
  if (type.includes("transfer")) return d.paymentTransfer
  if (type.includes("pix")) return d.paymentPix
  if (type === "manual-card") return d.paymentCard
  return d.paymentCreditCard
}

// ── Props ───────────────────────────────────────────────────────────

interface Props {
  user: UserProfile
  session: CheckoutSession
  paymentOptions: PaymentOption[]
}

// ── Component ───────────────────────────────────────────────────────

export function PagoFlow({ user, session, paymentOptions }: Props) {
  const { dict, locale } = useDictionary()
  const router = useRouter()
  const { cart, clear: clearCart } = useCartStore()

  const [selectedGateway, setSelectedGateway] = useState("")
  const [cpf, setCpf] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const selectedPayment = paymentOptions.find((o) => o.slug === selectedGateway)
  const isPix = selectedPayment?.gatewayType.includes("pix")
  const needsCpf = isPix && !cpf.match(/^\d{6,14}$/)

  // Deduplicate payment types
  const uniquePaymentTypes = new Map<string, PaymentOption>()
  for (const opt of paymentOptions) {
    if (!uniquePaymentTypes.has(opt.gatewayType)) uniquePaymentTypes.set(opt.gatewayType, opt)
  }

  const canSubmit = selectedGateway && !needsCpf && cart.items.length > 0

  // ── Submit ──────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit || !selectedPayment) return
    setSubmitting(true)
    setError("")

    // Resolve address
    const address = session.newAddress
      ? {
          street: session.newAddress.street,
          city: session.newAddress.city,
          state: session.newAddress.state,
          zipCode: session.newAddress.zipCode,
          countryCode: session.newAddress.countryCode,
        }
      : session.addressId
        ? (() => {
            const saved = user.addresses.find((a) => a.id === session.addressId)
            return saved
              ? { street: saved.street, city: saved.city, state: saved.state, zipCode: saved.zipCode || undefined, countryCode: saved.countryCode }
              : { street: "Retiro en sucursal", city: "N/A", state: "N/A", countryCode: session.countryCode }
          })()
        : { street: "Retiro en sucursal", city: "N/A", state: "N/A", countryCode: session.countryCode }

    // Save address if flag set
    if (session.saveNewAddress && session.newAddress) {
      createAddressAction({
        street: session.newAddress.street,
        city: session.newAddress.city,
        state: session.newAddress.state,
        zipCode: session.newAddress.zipCode,
        countryCode: session.newAddress.countryCode,
        isDefault: false,
      }).catch(() => {})
    }

    const result = await createOrderAction({
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone ?? undefined,
      customerDocument: user.documentNumber
        ? `${user.documentType}: ${user.documentNumber}`
        : undefined,
      shippingAddress: address,
      shippingMethod: session.shippingMethodSlug,
      paymentMethod: getPaymentMethodFromType(selectedPayment.gatewayType),
      items: cart.items.map((item) => ({
        variantId: item.variant?.id ?? item.variantId,
        quantity: item.quantity,
      })),
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (result.orderId) {
      clearCart()
      router.push(`/checkout/payment/${result.orderId}`)
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  const shippingLabel = session.requiresAddress
    ? (locale === "pt" ? "Envio a domicílio" : "Envío a domicilio")
    : (locale === "pt" ? "Retirada na loja" : "Retiro en sucursal")

  const shippingCostLabel = session.shippingCost === 0
    ? (locale === "pt" ? "Grátis" : "Gratis")
    : `US$ ${session.shippingCost.toLocaleString()}`

  // Resolve address display
  const addressDisplay = session.newAddress
    ? `${session.newAddress.street}, ${session.newAddress.city}, ${session.newAddress.state}`
    : session.addressId
      ? (() => {
          const a = user.addresses.find((a) => a.id === session.addressId)
          return a ? `${a.street}, ${a.city}, ${a.state}` : null
        })()
      : null

  return (
    <div className="mx-auto max-w-xl">
      {/* Back link */}
      <Link
        href="/checkout/envio"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.checkout.backToShipping}
      </Link>

      <h1 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepPayment}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* ─── Shipping Summary ───────────────────────────────── */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {dict.checkout.shippingSummary}
            </p>
            <Link
              href="/checkout/envio"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Pencil className="h-3 w-3" />
              {dict.checkout.changeShipping}
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session.requiresAddress
              ? <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
              : <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
            }
            <div className="flex-1 min-w-0">
              <p className="font-medium">{shippingLabel}</p>
              {addressDisplay && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {addressDisplay}
                </p>
              )}
            </div>
            <span className="text-sm font-semibold tabular-nums">{shippingCostLabel}</span>
          </div>
        </div>

        {/* ─── Payment Methods ───────────────────────────────── */}
        {paymentOptions.length > 0 ? (
          <Section label={dict.checkout.paymentMethod}>
            <div className="space-y-3">
              {Array.from(uniquePaymentTypes.values()).map((opt) => {
                const Icon = ICON_MAP[opt.gatewayType] ?? CreditCard
                const label = getPaymentLabel(opt.gatewayType, dict.checkout)
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    onClick={() => setSelectedGateway(opt.slug)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                      selectedGateway === opt.slug
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      selectedGateway === opt.slug ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{opt.displayName}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* CPF for PIX */}
            {isPix && (
              <div className="mt-4 space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dict.checkout.pixCpfLabel}
                </Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                  placeholder="000.000.000-00"
                  className="h-10"
                  maxLength={14}
                />
              </div>
            )}
          </Section>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {locale === "pt"
              ? "Nenhum método de pagamento disponível."
              : "No hay métodos de pago disponibles."}
          </div>
        )}

        {/* ─── Submit ──────────────────────────────────────────── */}
        <div className="pt-2">
          <Button
            type="button"
            className="h-11 w-full text-base"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? dict.checkout.placingOrder : dict.checkout.placeOrder}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">{dict.checkout.termsNotice}</p>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
