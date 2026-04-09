"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "@/i18n/link"
import { register } from "@/lib/auth/actions/register"
import { googleSignIn } from "@/lib/auth/actions/google-sign-in"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useDictionary, useLocalePath } from "@/i18n/context"

type State = { error?: string; loginHint?: boolean; success?: boolean; redirect?: string }

function registerAction(_prev: State, formData: FormData) {
  return register(formData)
}

export default function RegisterPage() {
  const [state, action, pending] = useActionState<State, FormData>(registerAction, {})
  const router = useRouter()
  const { dict } = useDictionary()
  const lp = useLocalePath()

  useEffect(() => {
    if (state?.success && state?.redirect) {
      router.push(lp(state.redirect))
    }
  }, [state, router, lp])

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-6 text-center text-xl font-bold">{dict.auth.register}</h1>

      <form action={googleSignIn}>
        <Button type="submit" variant="outline" className="w-full">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {dict.auth.googleContinue}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{dict.common.or}</span>
        <Separator className="flex-1" />
      </div>

      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-destructive">
            {state.error}{" "}
            {state.loginHint && (
              <Link href="/login" className="font-medium underline">{dict.auth.login}</Link>
            )}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-primary">
            {dict.auth.accountCreated}{" "}
            <Link href="/login" className="font-medium underline">{dict.auth.login}</Link>
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">{dict.auth.name}</Label>
          <Input id="name" name="name" type="text" placeholder={dict.auth.namePlaceholder} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{dict.auth.emailLabel}</Label>
          <Input id="email" name="email" type="email" placeholder={dict.auth.emailPlaceholder} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{dict.auth.password}</Label>
          <Input id="password" name="password" type="password" placeholder={dict.auth.minChars} required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? dict.auth.creating : dict.auth.register}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {dict.auth.hasAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">{dict.auth.login}</Link>
      </p>
    </div>
  )
}
