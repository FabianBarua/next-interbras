"use client"

import { useActionState } from "react"
import Link from "@/i18n/link"
import { forgotPassword } from "@/lib/auth/actions/forgot-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary } from "@/i18n/context"
import { Mail, ArrowLeft, Loader2 } from "lucide-react"

type State = { error?: string; success?: boolean }

function forgotAction(_prev: State, formData: FormData) {
  return forgotPassword(formData)
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<State, FormData>(forgotAction, {})
  const { dict } = useDictionary()

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg ring-1 ring-border/50">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            {dict.auth.forgotTitle}
          </CardTitle>
          <CardDescription className="text-center">
            {dict.auth.forgotSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                {dict.auth.forgotSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{dict.auth.emailLabel}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={dict.auth.emailPlaceholder}
                  className="h-11 pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? dict.auth.sending : dict.auth.send}
            </Button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {dict.auth.backToLogin}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
