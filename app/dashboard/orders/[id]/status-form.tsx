"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateOrderStatusAction } from "@/lib/actions/admin/orders"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface StatusOption {
  slug: string
  label: string
  color: string
}

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentTrackingCode,
  statuses,
}: {
  orderId: string
  currentStatus: string
  currentTrackingCode: string
  statuses: StatusOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [trackingCode, setTrackingCode] = useState(currentTrackingCode)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const currentInfo = statuses.find((s) => s.slug === currentStatus)

  const handleSubmit = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, {
        status,
        trackingCode: trackingCode || undefined,
      })
      if ("error" in res) {
        setError(res.error ?? null)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <Card className="border-t-2 border-t-primary">
      <CardHeader>
        <CardTitle>Actualizar estado</CardTitle>
        {currentInfo && (
          <CardDescription className="flex items-center gap-2">
            Estado actual:
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: currentInfo.color,
                color: currentInfo.color,
                backgroundColor: `${currentInfo.color}15`,
              }}
            >
              {currentInfo.label}
            </Badge>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Codigo de rastreo</Label>
          <Input
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Ej: PY123456789"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription className="text-green-600 dark:text-green-400">
              Estado actualizado correctamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
