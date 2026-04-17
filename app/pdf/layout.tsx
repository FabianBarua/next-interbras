import "../globals.css"

/**
 * Standalone layout for the PDF catalog builder.
 * We skip the dashboard chrome because this is a full-bleed editor surface.
 */
export default function PdfLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}
