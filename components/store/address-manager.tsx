"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Address } from "@/types/user"
import type { Country } from "@/types/country"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/profile"
import { PlusIcon, PencilSimpleIcon, TrashIcon, StarIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { getStatesForCountry } from "@/data/country-states"

interface Dict {
  title: string
  newAddress: string
  primary: string
  edit: string
  remove: string
  save: string
  saving: string
  setDefault: string
  cancel: string
  address: string
  city: string
  state: string
  selectState: string
  selectCountry: string
  zipCode: string
  label: string
  makeDefault: string
}

interface Props {
  addresses: Address[]
  countries: Country[]
  locale: string
  dict: Dict
}

const EMPTY = {
  name: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  countryCode: "PY",
}

export function AddressManager({ addresses, countries, locale, dict }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const states = getStatesForCountry(form.countryCode)

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setIsDefault(addresses.length === 0)
    setError(null)
    setOpen(true)
  }

  function openEdit(addr: Address) {
    setEditing(addr)
    setForm({
      name: addr.name,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      countryCode: addr.countryCode,
    })
    setIsDefault(addr.isDefault)
    setError(null)
    setOpen(true)
  }

  function set(field: keyof typeof EMPTY, value: string) {
    setForm(f => {
      const next = { ...f, [field]: value }
      // Reset state when country changes
      if (field === "countryCode" && value !== f.countryCode) {
        next.state = ""
      }
      return next
    })
  }

  function handleSave() {
    startTransition(async () => {
      setError(null)
      const data = {
        label: form.name || undefined,
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode || undefined,
        countryCode: form.countryCode,
        isDefault,
      }
      const result = editing
        ? await updateAddressAction(editing.id, data)
        : await createAddressAction(data)
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id)
      router.refresh()
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddressAction(id)
      router.refresh()
    })
  }

  // Find country name for display
  function countryName(code: string) {
    const c = countries.find(c => c.code === code)
    if (!c) return code
    return `${c.flag} ${c.name[locale] ?? c.name.es ?? code}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{dict.title}</h1>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <PlusIcon className="size-4" />
          {dict.newAddress}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div
            key={addr.id}
            className={cn(
              "p-5 rounded-xl border bg-card relative transition-all",
              addr.isDefault ? "border-primary/50 bg-primary/5" : "border-border"
            )}
          >
            {addr.isDefault && (
              <Badge variant="default" className="absolute top-3 right-3 text-[10px]">
                {dict.primary}
              </Badge>
            )}

            <p className="font-medium text-sm">{addr.name || addr.street}</p>

            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {addr.name && <p>{addr.street}</p>}
              <p>{addr.city}, {addr.state}</p>
              <p>{countryName(addr.countryCode)}{addr.zipCode ? ` - ${addr.zipCode}` : ""}</p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-primary"
                onClick={() => openEdit(addr)}
                disabled={isPending}
              >
                <PencilSimpleIcon className="size-3.5" />
                {dict.edit}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-destructive"
                onClick={() => handleDelete(addr.id)}
                disabled={isPending}
              >
                <TrashIcon className="size-3.5" />
                {dict.remove}
              </Button>
              {!addr.isDefault && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-muted-foreground"
                  onClick={() => handleSetDefault(addr.id)}
                  disabled={isPending}
                >
                  <StarIcon className="size-3.5" />
                  {dict.setDefault}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {locale === "pt" ? "Nenhum endereço cadastrado." : "No tienes direcciones registradas."}
        </div>
      )}

      {/* ── Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? dict.edit : dict.newAddress}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Label */}
            <FormField label={dict.label}>
              <Input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder={locale === "pt" ? "Ex: Casa, Escritório" : "Ej: Casa, Oficina"}
              />
            </FormField>

            {/* Country */}
            <FormField label={dict.selectCountry}>
              <select
                value={form.countryCode}
                onChange={e => set("countryCode", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name[locale] ?? c.name.es ?? c.code}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Street */}
            <FormField label={dict.address}>
              <Input
                value={form.street}
                onChange={e => set("street", e.target.value)}
                placeholder="Av. Eusebio Ayala 1234"
                required
              />
            </FormField>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label={dict.city}>
                <Input
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  required
                />
              </FormField>
              <FormField label={dict.state}>
                {states.length > 0 ? (
                  <select
                    value={form.state}
                    onChange={e => set("state", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{dict.selectState}</option>
                    {states.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={form.state}
                    onChange={e => set("state", e.target.value)}
                    required
                  />
                )}
              </FormField>
            </div>

            {/* Zip */}
            <FormField label={dict.zipCode}>
              <Input
                value={form.zipCode}
                onChange={e => set("zipCode", e.target.value)}
              />
            </FormField>

            {/* Default checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="addr-default"
                checked={isDefault}
                onCheckedChange={v => setIsDefault(!!v)}
              />
              <label htmlFor="addr-default" className="text-sm cursor-pointer select-none">
                {dict.makeDefault}
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {dict.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? dict.saving : dict.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
