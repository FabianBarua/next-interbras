"use client"

interface Props {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function PageHeader({ label, children, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        {children && <div className="text-sm text-muted-foreground mt-1">{children}</div>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  )
}
