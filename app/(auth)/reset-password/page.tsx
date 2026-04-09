"use client"

import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "@/i18n/link"
import { resetPassword } from "@/lib/auth/actions/reset-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/i18n/context"

type State = { error?: string; success?: boolean }

function resetAction(_prev: State, formData: FormData) {
  return resetPassword(formData)
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, action, pending] = useActionState<State, FormData>(resetAction, {})
  const { dict } = useDictionary()

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-6 text-center text-xl font-bold">{dict.auth.resetTitle}</h1>

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary">
            {dict.auth.resetSuccess}{" "}
            <Link href="/login" className="font-medium underline">{dict.auth.resetLogin}</Link>
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">{dict.auth.password}</Label>
          <Input id="password" name="password" type="password" placeholder={dict.auth.newPasswordPlaceholder} required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? dict.auth.resetting : dict.auth.resetButton}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
