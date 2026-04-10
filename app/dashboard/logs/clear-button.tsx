"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { clearLogs } from "@/lib/actions/admin/event-logs"

export function ClearLogsButton({
  category,
  label,
}: {
  category?: string
  label?: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClear() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setLoading(true)
    await clearLogs(category)
    setConfirming(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      variant={confirming ? "destructive" : "outline"}
      size="sm"
      onClick={handleClear}
      disabled={loading}
    >
      <Trash2 className="mr-1.5 size-3.5" />
      {loading
        ? "Limpiando..."
        : confirming
          ? "¿Confirmar?"
          : label ?? (category ? `Limpiar ${category}` : "Limpiar todos")}
    </Button>
  )
}
