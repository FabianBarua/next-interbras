"use client"

import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, FileText, Globe, ArrowRight } from "lucide-react"
import type { UserProfile } from "@/types/user"

interface Props {
  user: UserProfile
}

export function ProfileCard({ user }: Props) {
  const { dict, locale } = useDictionary()

  const continueLabel = locale === "pt" ? "Continuar para Envio" : "Continuar a Envío"

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepData}</h1>

      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="space-y-3">
          <InfoRow icon={User} label={user.name} />
          <InfoRow icon={Mail} label={user.email} />
          {user.phone && <InfoRow icon={Phone} label={user.phone} />}
          {user.documentType && user.documentNumber && (
            <InfoRow icon={FileText} label={`${user.documentType}: ${user.documentNumber}`} />
          )}
          {user.nationality && <InfoRow icon={Globe} label={user.nationality} />}
        </div>

        {/* Addresses preview */}
        {user.addresses.length > 0 && (
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

      <Button asChild className="mt-6 h-11 w-full text-base">
        <Link href="/checkout/envio">
          {continueLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function InfoRow({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </div>
  )
}
