"use client"

interface ToolbarProps {
  selected: number
  children?: React.ReactNode
  bulkActions?: { label: string; value: string; destructive?: boolean }[]
  onBulkAction?: (action: string) => void
}

export function Toolbar({ selected, children, bulkActions, onBulkAction }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
      {selected > 0 && bulkActions && onBulkAction && (
        <>
          <div className="h-6 w-px bg-border mx-1" />
          <span className="text-sm text-muted-foreground font-medium">{selected} sel.</span>
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { onBulkAction(e.target.value); e.target.value = "" } }}
            className="h-9 rounded-lg border px-2 text-sm bg-background"
          >
            <option value="" disabled>Acción masiva…</option>
            {bulkActions.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

export function ToolbarButton({ onClick, variant = "primary", children, disabled }: {
  onClick: () => void
  variant?: "primary" | "secondary" | "ghost"
  children: React.ReactNode
  disabled?: boolean
}) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : variant === "secondary"
      ? "border bg-background hover:bg-muted"
      : "hover:bg-muted text-muted-foreground hover:text-foreground"
  return (
    <button onClick={onClick} disabled={disabled} className={`h-9 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  )
}
