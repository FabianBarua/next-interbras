"use client"

import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "@/i18n/link"
import { resetPassword } from "@/lib/auth/actions/reset-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary } from "@/i18n/context"
import { Lock, Loader2 } from "lucide-react"

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
    <div className="space-y-6">
      <Card className="border-0 shadow-lg ring-1 ring-border/50">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            {dict.auth.resetTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            {state?.error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                {dict.auth.resetSuccess}{" "}
                <Link href="/login" className="font-medium underline">
                  {dict.auth.resetLogin}
                </Link>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{dict.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={dict.auth.newPasswordPlaceholder}
                  className="h-11 pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? dict.auth.resetting : dict.auth.resetButton}
            </Button>
          </form>
        </CardContent>
      </Card>
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
