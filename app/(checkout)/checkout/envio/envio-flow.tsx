"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { setCheckoutSession } from "@/lib/actions/checkout-session"
import {
  Loader2,
  ArrowLeft,
  Truck,
  Store,
  MapPin,
  Clock,
  Phone as PhoneIcon,
  ExternalLink,
} from "lucide-react"
import type { UserProfile } from "@/types/user"
import type { Country } from "@/types/country"
import type { ShippingMethod } from "@/types/shipping-method"
import { getStatesForCountry } from "@/data/country-states"

// ── Props ───────────────────────────────────────────────────────────

interface Props {
  user: UserProfile
  countries: Country[]
  methodsByCountry: Record<string, ShippingMethod[]>
}

// ── Component ───────────────────────────────────────────────────────

export function EnvioFlow({ user, countries, methodsByCountry }: Props) {
  const { dict, locale } = useDictionary()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Shipping state
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [error, setError] = useState("")

  const methods = selectedCountry ? (methodsByCountry[selectedCountry] ?? []) : []
  const currentMethod = methods.find((m) => m.id === selectedMethod)

  const deliveryMethods = methods.filter((m) => m.requiresAddress)
  const pickupMethods = methods.filter((m) => !m.requiresAddress)

  const states = selectedCountry ? getStatesForCountry(selectedCountry) : []
  const filteredAddresses = user.addresses.filter((a) => a.countryCode === selectedCountry)

  // ── Effects ─────────────────────────────────────────────────────

  // Reset when country changes
  useEffect(() => {
    setSelectedMethod("")
    setSelectedAddressId("")
    setShowNewAddress(false)
  }, [selectedCountry])

  // Reset address when method changes
  useEffect(() => {
    setSelectedAddressId("")
    setShowNewAddress(false)
  }, [selectedMethod])

  // Pre-select default address for selected country
  useEffect(() => {
    if (currentMethod?.requiresAddress && filteredAddresses.length > 0 && !showNewAddress) {
      const def = filteredAddresses.find((a) => a.isDefault) ?? filteredAddresses[0]
      if (def) setSelectedAddressId(def.id)
    }
  }, [currentMethod, filteredAddresses.length, showNewAddress])

  // ── Validation ──────────────────────────────────────────────────

  const addressOk = currentMethod
    ? !currentMethod.requiresAddress || selectedAddressId || showNewAddress
    : false
  const canContinue = selectedCountry && selectedMethod && addressOk

  // ── Continue to payment ─────────────────────────────────────────

  async function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canContinue || !currentMethod) return
    setError("")

    let newAddress: { street: string; city: string; state: string; zipCode?: string; countryCode: string } | undefined
    if (showNewAddress && currentMethod.requiresAddress) {
      const fd = new FormData(e.currentTarget)
      newAddress = {
        street: fd.get("street") as string,
        city: fd.get("city") as string,
        state: fd.get("state") as string,
        zipCode: (fd.get("zipCode") as string) || undefined,
        countryCode: selectedCountry,
      }
    }

    startTransition(async () => {
      try {
        await setCheckoutSession({
          countryCode: selectedCountry,
          shippingMethodId: currentMethod.id,
          shippingMethodSlug: currentMethod.slug,
          requiresAddress: currentMethod.requiresAddress,
          shippingCost: currentMethod.price,
          addressId: !showNewAddress ? selectedAddressId || undefined : undefined,
          newAddress: newAddress ?? undefined,
          saveNewAddress: saveAddress && !!newAddress,
        })
        router.push("/checkout/pago")
      } catch {
        setError(locale === "pt" ? "Erro ao salvar. Tente novamente." : "Error al guardar. Intenta de nuevo.")
      }
    })
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl">
      {/* Back link */}
      <Link
        href="/checkout"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.checkout.backToData}
      </Link>

      <h1 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepShipping}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleContinue} className="space-y-8">
        {/* ─── Country ─────────────────────────────────────────── */}
        <Section label={dict.checkout.selectCountry}>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCountry(c.code)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  selectedCountry === c.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <span className="text-base">{c.flag}</span>
                {c.name[locale] ?? c.name.es ?? c.code}
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Shipping Method ─────────────────────────────────── */}
        {selectedCountry && methods.length > 0 && (
          <Section label={dict.checkout.selectMethod}>
            <div className="space-y-3">
              {deliveryMethods.map((m) => (
                <MethodCard key={m.id} method={m} selected={selectedMethod === m.id} onSelect={() => setSelectedMethod(m.id)} locale={locale} icon="truck" />
              ))}
              {deliveryMethods.length > 0 && pickupMethods.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{dict.checkout.orPickup}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              {pickupMethods.map((m) => (
                <MethodCard key={m.id} method={m} selected={selectedMethod === m.id} onSelect={() => setSelectedMethod(m.id)} locale={locale} icon="store" />
              ))}
            </div>
          </Section>
        )}

        {selectedCountry && methods.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {locale === "pt" ? "Nenhum método de envio disponível para este país." : "No hay métodos de envío disponibles para este país."}
          </div>
        )}

        {/* ─── Address ─────────────────────────────────────────── */}
        {currentMethod?.requiresAddress && (
          <Section label={dict.checkout.shippingAddress}>
            <div className="space-y-3">
              {filteredAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setSelectedAddressId(a.id); setShowNewAddress(false) }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                    selectedAddressId === a.id && !showNewAddress
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    {a.name && <p className="font-medium">{a.name}</p>}
                    <p>{a.street}</p>
                    <p className="text-muted-foreground">{a.city}, {a.state}{a.zipCode ? ` - ${a.zipCode}` : ""}</p>
                  </div>
                </button>
              ))}

              {/* New address toggle */}
              <button
                type="button"
                onClick={() => { setShowNewAddress(!showNewAddress); setSelectedAddressId("") }}
                className={cn(
                  "w-full rounded-xl border-2 border-dashed p-3 text-center text-sm transition-all",
                  showNewAddress
                    ? "border-primary bg-primary/5 font-medium text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground",
                )}
              >
                + {dict.checkout.newAddress}
              </button>

              {/* New address form */}
              {showNewAddress && (
                <div className="grid gap-3 rounded-xl border p-4">
                  <FieldRow label={dict.checkout.address}>
                    <Input name="street" required placeholder="Av. Eusebio Ayala 1234" className="h-10" />
                  </FieldRow>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FieldRow label={dict.checkout.city}>
                      <Input name="city" required className="h-10" />
                    </FieldRow>
                    <FieldRow label={dict.checkout.state}>
                      {states.length > 0 ? (
                        <select name="state" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="">{dict.checkout.selectState}</option>
                          {states.map((s) => (
                            <option key={s.code} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <Input name="state" required className="h-10" />
                      )}
                    </FieldRow>
                  </div>
                  <FieldRow label="Código Postal">
                    <Input name="zipCode" className="h-10" />
                  </FieldRow>

                  {/* Save checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-address"
                      checked={saveAddress}
                      onCheckedChange={(v) => setSaveAddress(!!v)}
                    />
                    <label htmlFor="save-address" className="text-sm text-muted-foreground cursor-pointer">
                      {locale === "pt" ? "Salvar endereço" : "Guardar dirección"}
                    </label>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ─── Pickup info ─────────────────────────────────────── */}
        {currentMethod && !currentMethod.requiresAddress && currentMethod.pickupConfig && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
            {currentMethod.pickupConfig.address && (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{currentMethod.pickupConfig.address}</p>
            )}
            {currentMethod.pickupConfig.hours && (
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{currentMethod.pickupConfig.hours}</p>
            )}
            {currentMethod.pickupConfig.phone && (
              <p className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-muted-foreground" />{currentMethod.pickupConfig.phone}</p>
            )}
            {currentMethod.pickupConfig.mapsUrl && (
              <a href={currentMethod.pickupConfig.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Google Maps
              </a>
            )}
          </div>
        )}

        {/* ─── Continue ────────────────────────────────────────── */}
        <div className="pt-2">
          <Button type="submit" className="h-11 w-full text-base" disabled={!canContinue || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dict.checkout.continueToPayment}
          </Button>
        </div>
      </form>
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

function MethodCard({
  method,
  selected,
  onSelect,
  locale,
  icon,
}: {
  method: ShippingMethod
  selected: boolean
  onSelect: () => void
  locale: string
  icon: "truck" | "store"
}) {
  const name = method.name[locale] ?? method.name.es ?? method.slug
  const desc = method.description?.[locale] ?? method.description?.es
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}>
        {icon === "truck" ? <Truck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{name}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <span className="text-sm font-semibold tabular-nums">
        {method.price === 0
          ? locale === "pt" ? "Grátis" : "Gratis"
          : `US$ ${method.price.toLocaleString()}`}
      </span>
    </button>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
