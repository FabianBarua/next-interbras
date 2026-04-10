import { EmailNav } from "./email-nav"

export default function EmailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Configura el envío de emails, edita templates y revisa el historial.
        </p>
      </div>

      <EmailNav />

      {children}
    </div>
  )
}
