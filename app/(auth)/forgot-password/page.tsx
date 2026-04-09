"use client"

import { useActionState } from "react"
import Link from "@/i18n/link"
import { forgotPassword } from "@/lib/auth/actions/forgot-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/i18n/context"

type State = { error?: string; success?: boolean }

function forgotAction(_prev: State, formData: FormData) {
  return forgotPassword(formData)
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<State, FormData>(forgotAction, {})
  const { dict } = useDictionary()

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-xl font-bold">{dict.auth.forgotTitle}</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {dict.auth.forgotSubtitle}
      </p>

      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary">
            {dict.auth.forgotSuccess}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{dict.auth.emailLabel}</Label>
          <Input id="email" name="email" type="email" placeholder={dict.auth.emailPlaceholder} required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? dict.auth.sending : dict.auth.send}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          {dict.auth.backToLogin}
        </Link>
      </p>
    </div>
  )
}
