"use client"

import { useActionState } from "react"
import {
  saveSmtpConfig,
  testSmtpConnection,
} from "@/lib/actions/admin/smtp-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

type SmtpConfig = {
  host: string
  port: string
  user: string
  pass: string
  from_email: string
  from_name: string
  secure: string
  configured: boolean
}

type State = { error?: string; success?: boolean } | null

export function SmtpForm({
  config,
  adminEmail,
}: {
  config: SmtpConfig
  adminEmail: string
}) {
  const [testResult, setTestResult] = useState<{
    success?: boolean
    error?: string
  } | null>(null)
  const [testing, setTesting] = useState(false)

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      return saveSmtpConfig(formData)
    },
    null,
  )

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testSmtpConnection()
      setTestResult(result)
    } catch {
      setTestResult({ error: "Error al probar la conexión" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Servidor SMTP</h2>
        {config.configured ? (
          <Badge>Configurado ✅</Badge>
        ) : (
          <Badge variant="outline">No configurado</Badge>
        )}
      </div>

      <form action={formAction} className="max-w-lg space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              name="host"
              defaultValue={config.host}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Puerto</Label>
            <Input
              id="port"
              name="port"
              defaultValue={config.port}
              placeholder="587"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user">Usuario</Label>
            <Input
              id="user"
              name="user"
              defaultValue={config.user}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Contraseña</Label>
            <Input
              id="pass"
              name="pass"
              type="password"
              defaultValue={config.pass}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from_email">Email de envío</Label>
            <Input
              id="from_email"
              name="from_email"
              defaultValue={config.from_email}
              placeholder="noreply@tusitio.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">Nombre del remitente</Label>
            <Input
              id="from_name"
              name="from_name"
              defaultValue={config.from_name}
              placeholder="Nombre de tu tienda"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="secure"
            name="secure"
            defaultChecked={config.secure === "true"}
          />
          <Label htmlFor="secure">Conexión segura (SSL/TLS)</Label>
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-primary">
            ¡Configuración guardada con éxito!
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar configuración"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testing}
            onClick={handleTest}
          >
            {testing ? "Probando..." : "Enviar email de prueba"}
          </Button>
        </div>

        {testResult?.success && (
          <p className="text-sm text-primary">
            ¡Email de prueba enviado a {adminEmail}!
          </p>
        )}
        {testResult?.error && (
          <p className="text-sm text-destructive">
            Falla en la prueba: {testResult.error}
          </p>
        )}
      </form>
    </div>
  )
}
