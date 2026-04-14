"use client"

import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, FileText, Globe, ArrowRight, Pencil, X, Loader2, Check } from "lucide-react"
import type { UserProfile } from "@/types/user"
import { useState, useActionState, useEffect } from "react"
import { completeProfileAction } from "@/lib/actions/checkout-auth"
import { nationalities } from "@/lib/data/nationalities"
import { useRouter } from "next/navigation"

type ActionState = { error?: string; success?: boolean }

function submitProfile(_prev: ActionState, formData: FormData) {
  return completeProfileAction(formData)
}

interface Props {
  user: UserProfile
}

export function ProfileCard({ user }: Props) {
  const { dict, locale } = useDictionary()
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const continueLabel = locale === "pt" ? "Continuar para Envio" : "Continuar a Envío"
  const editLabel = locale === "pt" ? "Editar" : "Editar"
  const cancelLabel = locale === "pt" ? "Cancelar" : "Cancelar"
  const saveLabel = locale === "pt" ? "Salvar" : "Guardar"

  const [state, formAction, pending] = useActionState<ActionState, FormData>(submitProfile, {})

  useEffect(() => {
    if (state?.success) {
      setEditing(false)
      router.refresh()
    }
  }, [state?.success, router])

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepData}</h1>

      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        {editing ? (
          <form action={formAction} className="space-y-3">
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            {/* Name — editable */}
            <EditRow icon={User} label={locale === "pt" ? "Nome" : "Nombre"}>
              <Input name="name" defaultValue={user.name} className="h-9" required />
            </EditRow>

            {/* Email — read only */}
            <InfoRow icon={Mail} label={user.email} muted />

            {/* Phone — editable */}
            <EditRow icon={Phone} label={locale === "pt" ? "Telefone" : "Teléfono"}>
              <Input name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="+595 981 123456" className="h-9" required />
            </EditRow>

            {/* Document — editable */}
            <div className="flex items-start gap-3">
              <FileText className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 gap-2">
                <select
                  name="documentType"
                  defaultValue={user.documentType ?? "CI"}
                  className="h-9 w-[100px] rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="CI">CI</option>
                  <option value="CPF">CPF</option>
                  <option value="RG">RG</option>
                  <option value="OTRO">{locale === "pt" ? "Outro" : "Otro"}</option>
                </select>
                <Input
                  name="documentNumber"
                  defaultValue={user.documentNumber ?? ""}
                  placeholder="1234567"
                  className="h-9 flex-1"
                  required
                />
              </div>
            </div>

            {/* Nationality — editable */}
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <select
                name="nationality"
                defaultValue={user.nationality ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">{locale === "pt" ? "Selecionar..." : "Seleccionar..."}</option>
                {nationalities.map((n) => (
                  <option key={n.code} value={n.code}>{locale === "pt" ? n.pt : n.es}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="h-9 flex-1" onClick={() => setEditing(false)} disabled={pending}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                {cancelLabel}
              </Button>
              <Button type="submit" className="h-9 flex-1" disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                {saveLabel}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-3">
              <InfoRow icon={User} label={user.name} />
              <InfoRow icon={Mail} label={user.email} muted />
              {user.phone && <InfoRow icon={Phone} label={user.phone} />}
              {user.documentType && user.documentNumber && (
                <InfoRow icon={FileText} label={`${user.documentType}: ${user.documentNumber}`} />
              )}
              {user.nationality && (
                <InfoRow icon={Globe} label={nationalities.find(n => n.code === user.nationality)?.[locale === "pt" ? "pt" : "es"] ?? user.nationality} />
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              {editLabel}
            </button>
          </>
        )}

        {/* Addresses preview */}
        {!editing && user.addresses.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {locale === "pt" ? "Endereços salvos" : "Direcciones guardadas"} ({user.addresses.length})
            </p>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {user.addresses.slice(0, 2).map((a) => (
                <p key={a.id}>
                  {a.name && <span className="font-medium text-foreground">{a.name}: </span>}
                  {a.street}, {a.city}
                  {a.isDefault && (
                    <span className="ml-1.5 text-xs text-primary">★</span>
                  )}
                </p>
              ))}
              {user.addresses.length > 2 && (
                <p className="text-xs">+{user.addresses.length - 2} más</p>
              )}
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <Button asChild className="mt-6 h-11 w-full text-base">
          <Link href="/checkout/envio">
            {continueLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, muted }: { icon: typeof User; label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    </div>
  )
}

function EditRow({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
