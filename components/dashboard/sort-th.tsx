import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

interface Props {
  col: string
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (col: string) => void
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function SortTh({
  col,
  sortBy,
  sortDir,
  onSort,
  children,
  className,
  align = "left",
}: Props) {
  const active = sortBy === col
  const alignCls =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${alignCls} ${className ?? ""}`}
    >
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {children}
        {!active && <ArrowUpDown className="size-3 opacity-40" />}
        {active && sortDir === "asc" && <ArrowUp className="size-3" />}
        {active && sortDir === "desc" && <ArrowDown className="size-3" />}
      </button>
    </th>
  )
}
