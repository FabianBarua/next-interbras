import { getSmtpConfig } from "@/lib/actions/admin/smtp-config"
import { getCurrentUser } from "@/lib/auth/get-session"
import { SmtpForm } from "./smtp-form"

export default async function EmailsConfigPage() {
  const config = await getSmtpConfig()
  const user = await getCurrentUser()

  return <SmtpForm config={config} adminEmail={user?.email ?? ""} />
}
