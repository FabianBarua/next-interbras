"use client"

import { useActionState } from "react"
import Link from "next/link"
import { forgotPassword } from "@/lib/auth/actions/forgot-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type State = { error?: string; success?: boolean }

function forgotAction(_prev: State, formData: FormData) {
  return forgotPassword(formData)
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<State, FormData>(forgotAction, {})

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-xl font-bold">Recuperar senha</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Informe seu email para receber o link de recuperação.
      </p>

      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary">
            Se o email existir, você receberá um link de recuperação.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
