"use client"

import { useActionState, useState, useEffect } from "react"
import { checkoutLoginAction, checkoutRegisterAction, completeProfileAction } from "@/lib/actions/checkout-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/i18n/context"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/types/user"

type ActionState = { error?: string; success?: boolean }

function submitLogin(_prev: ActionState, formData: FormData) {
  return checkoutLoginAction(formData)
}
function submitRegister(_prev: ActionState, formData: FormData) {
  return checkoutRegisterAction(formData)
}
function submitProfile(_prev: ActionState, formData: FormData) {
  return completeProfileAction(formData)
}

interface Props {
  user: UserProfile | null
  missingFields: { name?: boolean; phone?: boolean; documentType?: boolean; documentNumber?: boolean } | null
}

export function StepAccount({ user, missingFields }: Props) {
  const { dict } = useDictionary()
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")

  const [loginState, loginAction, loginPending] = useActionState<ActionState, FormData>(submitLogin, {})
  const [registerState, registerAction, registerPending] = useActionState<ActionState, FormData>(submitRegister, {})
  const [profileState, profileAction, profilePending] = useActionState<ActionState, FormData>(submitProfile, {})

  useEffect(() => {
    if (loginState?.success || registerState?.success || profileState?.success) {
      router.refresh()
    }
  }, [loginState?.success, registerState?.success, profileState?.success, router])

  // Logged in but missing fields → profile completion
  if (user && missingFields) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepData}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{dict.checkout.completeProfile}</p>
        <form action={profileAction} className="space-y-4">
          {profileState?.error && <p className="text-sm text-destructive">{profileState.error}</p>}
          {missingFields.name && (
            <FieldRow label={dict.auth.name}>
              <Input name="name" placeholder={dict.auth.namePlaceholder} className="h-10" required />
            </FieldRow>
          )}
          {missingFields.phone && (
            <FieldRow label={dict.checkout.phone}>
              <Input name="phone" type="tel" placeholder="+595 981 123456" className="h-10" required />
            </FieldRow>
          )}
          {(missingFields.documentType || missingFields.documentNumber) && (
            <div className="grid grid-cols-[130px_1fr] gap-3">
              {missingFields.documentType && (
                <FieldRow label={dict.checkout.document}>
                  <select name="documentType" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="CI">CI</option>
                    <option value="CPF">CPF</option>
                    <option value="RG">RG</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </FieldRow>
              )}
              {missingFields.documentNumber && (
                <FieldRow label="Nº">
                  <Input name="documentNumber" placeholder="1234567" className="h-10" required />
                </FieldRow>
              )}
            </div>
          )}
          <Button type="submit" className="h-10 w-full" disabled={profilePending}>
            {profilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dict.checkout.continueToShipping}
          </Button>
        </form>
      </div>
    )
  }

  // Not logged in → login / register tabs
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">{dict.checkout.stepAccount}</h1>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "login" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {dict.checkout.loginTab}
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "register" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {dict.checkout.registerTab}
        </button>
      </div>

      {/* Login form */}
      {tab === "login" && (
        <form action={loginAction} className="space-y-4">
          {loginState?.error && <p className="text-sm text-destructive">{loginState.error}</p>}
          <FieldRow label={dict.auth.emailLabel}>
            <Input name="email" type="email" placeholder={dict.auth.emailPlaceholder} className="h-10" required />
          </FieldRow>
          <FieldRow label={dict.auth.password}>
            <Input name="password" type="password" placeholder={dict.auth.passwordPlaceholder} className="h-10" required />
          </FieldRow>
          <Button type="submit" className="h-10 w-full" disabled={loginPending}>
            {loginPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loginPending ? dict.auth.loggingIn : dict.auth.login}
          </Button>
        </form>
      )}

      {/* Register form */}
      {tab === "register" && (
        <form action={registerAction} className="space-y-4">
          {registerState?.error && <p className="text-sm text-destructive">{registerState.error}</p>}
          <FieldRow label={dict.auth.name}>
            <Input name="name" placeholder={dict.auth.namePlaceholder} className="h-10" required />
          </FieldRow>
          <FieldRow label={dict.auth.emailLabel}>
            <Input name="email" type="email" placeholder={dict.auth.emailPlaceholder} className="h-10" required />
          </FieldRow>
          <FieldRow label={dict.auth.password}>
            <Input name="password" type="password" placeholder={dict.auth.minChars} className="h-10" required minLength={8} />
          </FieldRow>
          <FieldRow label={dict.checkout.phone}>
            <Input name="phone" type="tel" placeholder="+595 981 123456" className="h-10" required />
          </FieldRow>
          <div className="grid grid-cols-[130px_1fr] gap-3">
            <FieldRow label={dict.checkout.document}>
              <select name="documentType" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                <option value="CI">CI</option>
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
                <option value="OTRO">Otro</option>
              </select>
            </FieldRow>
            <FieldRow label="Nº">
              <Input name="documentNumber" placeholder="1234567" className="h-10" required />
            </FieldRow>
          </div>
          <Button type="submit" className="h-10 w-full" disabled={registerPending}>
            {registerPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {registerPending ? dict.auth.creating : dict.auth.register}
          </Button>
        </form>
      )}
    </div>
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
