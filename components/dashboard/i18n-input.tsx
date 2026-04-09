"use client"

interface Props {
  label: string
  valueEs: string
  valuePt: string
  onChangeEs: (v: string) => void
  onChangePt: (v: string) => void
  textarea?: boolean
  placeholder?: string
}

export function I18nInput({ label, valueEs, valuePt, onChangeEs, onChangePt, textarea, placeholder }: Props) {
  const Comp = textarea ? "textarea" : "input"
  const cls = "w-full h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
  const taCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow min-h-[80px] resize-y"

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">ES</span>
          <Comp
            value={valueEs}
            onChange={e => onChangeEs(e.target.value)}
            placeholder={placeholder ? `${placeholder} (ES)` : "Español"}
            className={textarea ? taCls : cls}
          />
        </div>
        <div>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">PT</span>
          <Comp
            value={valuePt}
            onChange={e => onChangePt(e.target.value)}
            placeholder={placeholder ? `${placeholder} (PT)` : "Português"}
            className={textarea ? taCls : cls}
          />
        </div>
      </div>
    </div>
  )
}
