"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "@/i18n/link"
import { completeProfileAction } from "@/lib/actions/checkout-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary, useLocalePath } from "@/i18n/context"
import { Phone, FileText, Globe, Loader2 } from "lucide-react"
import { nationalities } from "@/lib/data/nationalities"

type State = { error?: string; success?: boolean }

function profileAction(_prev: State, formData: FormData) {
  return completeProfileAction(formData)
}

export default function CompleteProfilePage() {
  const [state, action, pending] = useActionState<State, FormData>(profileAction, {})
  const router = useRouter()
  const { dict, locale } = useDictionary()
  const lp = useLocalePath()

  useEffect(() => {
    if (state?.success) {
      router.push(lp("/"))
    }
  }, [state, router, lp])

  const t = dict.auth

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg ring-1 ring-border/50">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            {t.completeProfileTitle}
          </CardTitle>
          <CardDescription className="text-center">
            {t.completeProfileDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">{t.documentType}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="documentType"
                  name="documentType"
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="CI">CI</option>
                  <option value="CPF">CPF</option>
                  <option value="RG">RG</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <Label htmlFor="documentNumber">{t.documentNumber}</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  type="text"
                  placeholder={t.documentNumberPlaceholder}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">{t.nationality}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="nationality"
                  name="nationality"
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t.selectNationality}
                  </option>
                  {nationalities.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n[locale as "es" | "pt"] ?? n.es}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? t.saving : t.save}
            </Button>
          </form>

          <div className="mt-3 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {t.skipForNow}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
