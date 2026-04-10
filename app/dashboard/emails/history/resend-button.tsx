"use client"

import { useState } from "react"
import { resendEmail } from "@/lib/actions/admin/email-logs"
import { Button } from "@/components/ui/button"

export function ResendButton({ logId }: { logId: string }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleResend() {
    setSending(true)
    try {
      await resendEmail(logId)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={sending || done}
    >
      {done ? "¡Enviado!" : sending ? "..." : "Reenviar"}
    </Button>
  )
}
